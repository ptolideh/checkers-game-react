import { BOARD_SIZE, PieceColor, isDarkSquare } from './rules';
import type {
  Board,
  Captures,
  Color,
  GameState,
  InteractiveState,
  MoveSet,
  MoveTargetKeys,
  Piece,
  Position,
  Stats,
  Steps,
  Winner,
} from './types';
import { cloneBoard, equals, getOffsetsFor, getPiece, isMoveInBounds, positionKey } from './utils';

const opponentOf = (player: Color) => {
  return player === PieceColor.light ? PieceColor.dark : PieceColor.light;
};

const isValidLandingSpot = (board: Board, at: Position): boolean => {
  return isMoveInBounds(board.length, at) && getPiece(board, at) === null && isDarkSquare(at);
};

// Steps are moves that don't capture. Think of it as sliding to the nearby empty square
// returns a list of valid steps adjacent to a given piece
const legalStepsPerPiece = (board: Board, piece: Piece): Steps => {
  if (!piece) return [];

  const movementOffsets = getOffsetsFor(piece);
  const steps: Steps = [];

  for (let offset of movementOffsets) {
    const from = {
      x: piece.x,
      y: piece.y,
    };

    const adjacentPosition = {
      x: from.x + offset.x,
      y: from.y + offset.y,
    };

    if (isValidLandingSpot(board, adjacentPosition)) {
      steps.push({
        from,
        to: adjacentPosition,
      });
    }
  }

  return steps;
};

// Captures are moves that require the piece jump over and capture an opponent's piece
// returns a list of valid captures adjacent to a given piece
// each capture has a from, over, and to.
// the from is the piece that is the current piece.
// the over is the piece that is jumped over and captures
// the to is the position that we're landing on next
const legalCapturesPerPiece = (board: Board, piece: Piece): Captures => {
  if (!piece) return [];

  const movementOffsets = getOffsetsFor(piece);
  const captures: Captures = [];

  for (let offset of movementOffsets) {
    const from = {
      x: piece.x,
      y: piece.y,
    };

    const adjacentPosition = {
      x: from.x + offset.x,
      y: from.y + offset.y,
    };

    const landingPosition = {
      x: from.x + offset.x * 2,
      y: from.y + offset.y * 2,
    };

    if (!isMoveInBounds(board.length, adjacentPosition)) continue;
    if (!isMoveInBounds(board.length, landingPosition)) continue;
    if (!isValidLandingSpot(board, landingPosition)) continue;

    if (getPiece(board, adjacentPosition)?.color === opponentOf(piece.color)) {
      captures.push({
        from,
        over: adjacentPosition,
        to: landingPosition,
      });
    }
  }

  return captures;
};

// The goal here is to collect all valid steps and captures for each piece that belongs to the current player
// This reduces over-checking and also helps us provide better UX
const selectAllMovesPerTurn = (state: GameState): MoveSet => {
  const moves = {
    steps: new Map<string, Steps>(),
    captures: new Map<string, Captures>(),
  };
  const { board, currentPlayer } = state;

  for (let row of board) {
    for (let piece of row) {
      if (!piece) continue;
      if (piece.color !== currentPlayer) continue;
      const { x, y } = piece;

      // captures take priority. if there are no captures, then we check for steps
      const validCaptures = legalCapturesPerPiece(board, piece);
      if (validCaptures.length > 0) {
        moves.captures.set(positionKey.get({ x, y }), validCaptures);
      } else {
        const validMoves = legalStepsPerPiece(state.board, piece);
        if (validMoves.length > 0) moves.steps.set(positionKey.get({ x, y }), validMoves);
      }
    }
  }
  return moves;
};

// Uses the result of selectAllMovesPerTurn to determine which pieces for the current player
// can be interacted with and which need to be disabled or dimmed for better UX
// Important to note that this returns a set of key strings instead of actual pieces for better look-up performance
const selectInteractivityState = (state: GameState): InteractiveState => {
  const disabled = new Set<string>();
  const selectable = new Set<string>();
  const moves = selectAllMovesPerTurn(state);
  const mustCapture = hasCaptures(moves);
  const { board, currentPlayer, forcedCaptureKey } = state;

  // If forced capture (multi-hop capture), disable all other moves except forced capture piece
  if (forcedCaptureKey && moves.captures.has(forcedCaptureKey)) {
    for (let row of board) {
      for (let piece of row) {
        if (!piece) continue;
        if (piece.color !== currentPlayer) continue;
        const pieceKey = positionKey.get(piece);
        if (pieceKey !== forcedCaptureKey) {
          disabled.add(pieceKey);
        }
      }
    }

    selectable.add(forcedCaptureKey);
    return {
      disabled,
      selectable,
    };
  }

  // Otherwise, select all valid moves (steps or captures)
  for (let row of board) {
    for (let piece of row) {
      if (!piece) continue;
      const { x, y } = piece;
      const coord = { x, y };
      if (piece.color === currentPlayer) {
        const pieceKey = positionKey.get(coord);
        if (mustCapture && moves.captures.has(pieceKey)) {
          selectable.add(pieceKey);
        } else if (!mustCapture && moves.steps.has(pieceKey)) {
          selectable.add(pieceKey);
        } else {
          disabled.add(pieceKey);
        }
      }
    }
  }

  return {
    disabled,
    selectable,
  };
};

// Similar to selectInteractivityState, this returns a set of key strings
// The goal here is to find the collection of squares where the current player can move to
// Which speeds up look up and UI render
const selectMoveTargetsFor = (selected: Piece, legalMoves: MoveSet): MoveTargetKeys => {
  const moveTargets = new Set<string>();
  const selectedKey = positionKey.get(selected);
  const mustCapture = hasCaptures(legalMoves);

  // If must capture, only collect valid landing spots after the capture
  if (mustCapture) {
    for (let capture of legalMoves.captures.get(selectedKey) || []) {
      moveTargets.add(positionKey.get(capture.to));
    }
  } else {
    // otherwise, get valid target spots for stepping
    for (let step of legalMoves.steps.get(selectedKey) || []) {
      moveTargets.add(positionKey.get(step.to));
    }
  }
  return moveTargets;
};

// Ties into selectMoveTargetsFor. Returns true if a square is within the evaluated target set
const isInMoveTargets = (moveTargets: MoveTargetKeys | null, target: Position) => {
  return !!moveTargets && moveTargets.has(positionKey.get(target));
};

const hasCaptures = (moves: MoveSet) => {
  return moves.captures.size > 0;
};

const getNextPlayer = (currentPlayer: Color) => {
  return currentPlayer === PieceColor.light ? PieceColor.dark : PieceColor.light;
};

// Returns true if the piece should be promoted to king type
const promoteToKing = (piece: Piece): boolean => {
  if (piece.isKing) return true;
  if (
    (piece.color === PieceColor.light && piece.y === BOARD_SIZE - 1) ||
    (piece.color === PieceColor.dark && piece.y === 0)
  ) {
    return true;
  }
  return false;
};

// Applies a valid step move to the board
// It moves the piece to the target square, handle king status, and returns the new board if successful
const applySimpleMove = (board: Board, moves: MoveSet, selectedPiece: Piece, target: Position) => {
  const selectedKey = positionKey.get({ x: selectedPiece.x, y: selectedPiece.y });
  const step = moves.steps.get(selectedKey)?.find((step) => equals(step.to, target));
  if (!step) return null;

  const newBoard = cloneBoard(board);
  const pieceAfterMove = {
    ...selectedPiece,
    x: step.to.x,
    y: step.to.y,
  };

  const shouldPromote = promoteToKing(pieceAfterMove);
  if (shouldPromote) pieceAfterMove.isKing = true;

  newBoard[step.to.y][step.to.x] = pieceAfterMove;
  newBoard[selectedPiece.y][selectedPiece.x] = null;
  return { newBoard, destination: step.to };
};

// Applies a valid capture move to the board
// It moves the piece to the target square, removes the captured piece, handle king status, and returns the new board if successful
const applyCaptureMove = (board: Board, moves: MoveSet, selectedPiece: Piece, target: Position) => {
  const selectedKey = positionKey.get({ x: selectedPiece.x, y: selectedPiece.y });
  const capture = moves.captures.get(selectedKey)?.find((capture) => equals(capture.to, target));
  if (!capture) return null;

  const newBoard = cloneBoard(board);
  const pieceAfterMove = {
    ...selectedPiece,
    x: capture.to.x,
    y: capture.to.y,
  };

  const shouldPromote = promoteToKing(pieceAfterMove);
  if (shouldPromote) pieceAfterMove.isKing = true;

  newBoard[capture.to.y][capture.to.x] = pieceAfterMove;
  newBoard[selectedPiece.y][selectedPiece.x] = null;
  newBoard[capture.over.y][capture.over.x] = null;
  return { newBoard, captured: capture.over, destination: capture.to };
};

// updates player stats based on a given delta
const incrementStatsFor = (
  stats: Stats,
  color: Color,
  change: Partial<{ moves: number; captures: number }>,
): Stats => {
  const player = stats[color];
  return {
    ...stats,
    [color]: {
      moves: player.moves + (change.moves ?? 0),
      captures: player.captures + (change.captures ?? 0),
    },
  };
};

const evaluateWinner = (state: GameState): Winner => {
  const { board } = state;

  const counts: Record<Color, number> = {
    dark: 0,
    light: 0,
  };

  for (let row of board) {
    for (let piece of row) {
      if (!piece) continue;
      counts[piece.color] += 1;
    }
  }

  const darkHasPieces = counts.dark > 0;
  const lightHasPieces = counts.light > 0;

  if (!darkHasPieces && !lightHasPieces) {
    return 'draw';
  }

  if (!darkHasPieces) {
    return PieceColor.light;
  }

  if (!lightHasPieces) {
    return PieceColor.dark;
  }

  const darkMoves = selectAllMovesPerTurn({ ...state, currentPlayer: PieceColor.dark });
  const lightMoves = selectAllMovesPerTurn({ ...state, currentPlayer: PieceColor.light });
  const darkCanMove = darkMoves.captures.size > 0 || darkMoves.steps.size > 0;
  const lightCanMove = lightMoves.captures.size > 0 || lightMoves.steps.size > 0;

  if (!darkCanMove && !lightCanMove) {
    return 'draw';
  }

  if (!darkCanMove) {
    return PieceColor.light;
  }

  if (!lightCanMove) {
    return PieceColor.dark;
  }

  return null;
};

export {
  opponentOf,
  isValidLandingSpot,
  legalStepsPerPiece,
  legalCapturesPerPiece,
  selectAllMovesPerTurn,
  evaluateWinner,
  selectInteractivityState,
  selectMoveTargetsFor,
  isInMoveTargets,
  hasCaptures,
  getNextPlayer,
  promoteToKing,
  applySimpleMove,
  applyCaptureMove,
  incrementStatsFor,
};
