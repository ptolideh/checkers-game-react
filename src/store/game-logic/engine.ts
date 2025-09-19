import { BOARD_SIZE, PieceColor } from './rules';
import type {
  Board,
  Captures,
  Color,
  GameState,
  MoveSet,
  MoveTargetKeys,
  Piece,
  Position,
  Stats,
  Steps,
} from './types';
import { cloneBoard, equals, getOffsetsFor, getPiece, isMoveInBounds, positionKey } from './utils';

const opponentOf = (player: Color) => {
  return player === PieceColor.light ? PieceColor.dark : PieceColor.light;
};

const isValidLandingSpot = (board: Board, at: Position): boolean => {
  return isMoveInBounds(board.length, at) && getPiece(board, at) === null;
};

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

const selectInteractivityState = (
  state: GameState,
): { disabled: Set<string>; selectable: Set<string> } => {
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

  // Otherwise, select all moves
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

const selectMoveTargetsFor = (selected: Piece, legalMoves: MoveSet): MoveTargetKeys => {
  const moveTargets = new Set<string>();
  const selectedKey = positionKey.get(selected);
  const mustCapture = hasCaptures(legalMoves);

  if (mustCapture) {
    for (let capture of legalMoves.captures.get(selectedKey) || []) {
      moveTargets.add(positionKey.get(capture.to));
    }
  } else {
    for (let step of legalMoves.steps.get(selectedKey) || []) {
      moveTargets.add(positionKey.get(step.to));
    }
  }
  return moveTargets;
};

const isInMoveTargets = (moveTargets: MoveTargetKeys | null, target: Position) => {
  return !!moveTargets && moveTargets.has(positionKey.get(target));
};

const hasCaptures = (moves: MoveSet) => {
  return moves.captures.size > 0;
};

const getNextPlayer = (currentPlayer: Color) => {
  return currentPlayer === PieceColor.light ? PieceColor.dark : PieceColor.light;
};

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

export {
  legalStepsPerPiece,
  legalCapturesPerPiece,
  selectAllMovesPerTurn,
  selectInteractivityState,
  selectMoveTargetsFor,
  isInMoveTargets,
  hasCaptures,
  getNextPlayer,
  applySimpleMove,
  applyCaptureMove,
  incrementStatsFor,
};
