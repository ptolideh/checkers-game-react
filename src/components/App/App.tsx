import { cn } from '@/lib/utils';
import { useReducer } from 'react';
import { CheckersPiece } from '../CheckersPiece';
import type { Color, Position } from '@/store/game-logic/types';
import { forwardMovementOffsets, kingMovementOffsets, PieceColor } from '@/store/game-logic/rules';

const BOARD_SIZE = 8;

enum SquareColor {
  dark = 'darkPiece',
  light = 'lightPiece',
}

type Square = Position & {
  color: SquareColor;
};

type Board = (Piece | null)[][];

interface State {
  selectedPiece: Piece | null;
  mode: 'pvp' | 'pvc' | null;
  currentPlayer: Color;
  playerMustCapture: boolean;
  board: Board;
  squares: Square[][];
}

type Action =
  | { type: 'SELECT_PIECE'; payload: Position }
  | { type: 'DESELECT_PIECE' }
  | { type: 'MOVE_PIECE'; payload: Position }
  | { type: 'CAPTURE_PIECE'; payload: Piece['captures'][number] }
  | { type: 'SET_MODE'; payload: 'pvp' | 'pvc' };

class Piece {
  x: number;
  y: number;
  color: Color;
  isKing: boolean;
  moves: Position[];
  captures: { capturePos: Position; landingPos: Position }[];

  constructor({
    x = 0,
    y = 0,
    color = PieceColor.light,
    isKing = false,
    moves = [],
    captures = [],
  }: Partial<Piece>) {
    this.x = x;
    this.y = y;
    this.color = color;
    this.isKing = shouldPromoteToKing(color, y);
    this.moves = [...moves];
    this.captures = [...captures];
  }

  clone(overrides: Partial<Piece> = {}): Piece {
    return new Piece({
      x: overrides.x ?? this.x,
      y: overrides.y ?? this.y,
      color: overrides.color ?? this.color,
      isKing: overrides.isKing ?? shouldPromoteToKing(this.color, this.y),
      moves: overrides.moves ?? [...this.moves],
      captures: overrides.captures ?? [...this.captures],
    });
  }

  clearAllMoves() {
    return this.clone({ moves: [], captures: [] });
  }

  shouldPromoteToKing(): boolean {
    if (this.isKing) return true;
    if (
      (this.color === PieceColor.light && this.y === BOARD_SIZE - 1) ||
      (this.color === PieceColor.dark && this.y === 0)
    ) {
      return true;
    }
    return false;
  }
}

//A valid square must be inside the board
const isMoveInBounds = (y: number, x: number): boolean => {
  return y >= 0 && y < BOARD_SIZE && x >= 0 && x < BOARD_SIZE;
};

//A valid move target must be inside the board and empty
const isValidLandingPos = (board: Board, y: number, x: number): boolean => {
  return isMoveInBounds(y, x) && board[y][x] === null;
};

const hasAdjacentOpponent = (current: Piece, adjacent: Piece) => {
  return adjacent?.color && current.color !== adjacent.color;
};

const hasCaptures = (board: Board, currentPlayer: Color) =>
  board.some((row) =>
    row.some((piece) => piece && piece.color === currentPlayer && piece.captures.length > 0),
  );

const getNextPlayer = (currentPlayer: Color) => {
  return currentPlayer === PieceColor.light ? PieceColor.dark : PieceColor.light;
};

const getSimpleMovesForPiece = (board: Board, piece: Piece) => {
  if (!piece) return [];

  const movementOffsets = piece.isKing ? kingMovementOffsets : forwardMovementOffsets[piece.color];

  return movementOffsets.reduce<Position[]>((acc, moveOffset) => {
    const nextY = piece.y + moveOffset.y;
    const nextX = piece.x + moveOffset.x;

    if (isValidLandingPos(board, nextY, nextX)) {
      acc.push({
        x: nextX,
        y: nextY,
      });
    }

    return acc;
  }, []);
};

const getValidCapturesForPiece = (board: Board, piece: Piece): Piece['captures'] => {
  if (!piece) return [];

  const movementOffsets = piece.isKing ? kingMovementOffsets : forwardMovementOffsets[piece.color];

  return movementOffsets.reduce<Piece['captures']>((acc, moveOffset) => {
    const nextY = piece.y + moveOffset.y;
    const nextX = piece.x + moveOffset.x;
    const jumpY = piece.y + moveOffset.y * 2;
    const jumpX = piece.x + moveOffset.x * 2;

    if (!isMoveInBounds(nextY, nextX)) return acc;
    if (!isMoveInBounds(jumpY, jumpX)) return acc;
    if (!isValidLandingPos(board, jumpY, jumpX)) return acc;
    const adjacentPiece = board[nextY][nextX];

    if (adjacentPiece && hasAdjacentOpponent(piece, adjacentPiece)) {
      acc.push({
        capturePos: { x: nextX, y: nextY },
        landingPos: { x: jumpX, y: jumpY },
      });
    }

    return acc;
  }, []);
};

const mapAllMovesForActivePlayer = (board: Board, currentPlayer: Color): Board => {
  return board.map((row) => {
    return row.map((piece) => {
      if (!piece || piece.color !== currentPlayer) {
        return piece?.clearAllMoves() ?? null;
      }

      const validCaptures = getValidCapturesForPiece(board, piece);
      if (validCaptures.length > 0) {
        return piece.clearAllMoves().clone({ captures: validCaptures });
      } else {
        const validMoves = getSimpleMovesForPiece(board, piece);
        return piece.clearAllMoves().clone({ moves: validMoves });
      }
    });
  });
};

const isSelected = (currPosition: Piece, selectedPiece: Piece | null) => {
  return currPosition.x === selectedPiece?.x && currPosition.y === selectedPiece?.y;
};

const isSelectablePiece = (piece: Piece | null, playerMustCapture: boolean) => {
  if (!piece) return false;
  if (playerMustCapture) {
    return piece.captures.length > 0;
  } else {
    return piece.moves.length > 0;
  }
};

const getInitialBoardAndSquaresState = () => {
  const squares: Square[][] = Array.from({ length: BOARD_SIZE }, () =>
    Array.from({ length: BOARD_SIZE }, () => ({
      x: 0,
      y: 0,
      color: SquareColor.light,
    })),
  );

  const board: Board = Array.from({ length: squares.length }, () =>
    Array.from({ length: squares.length }, () => null),
  );

  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      const square = squares[row][col];
      square.x = col;
      square.y = row;
      if ((row + col) % 2 !== 0) {
        square.color = SquareColor.dark;
        if (row < 3) {
          board[row][col] = new Piece({ x: col, y: row, color: PieceColor.light });
        }
        if (row > 4) {
          board[row][col] = new Piece({ x: col, y: row, color: PieceColor.dark });
        }
      }
    }
  }
  return { board, squares };
};

const initialState: State = {
  selectedPiece: null,
  mode: null,
  currentPlayer: PieceColor.dark,
  playerMustCapture: false,
  ...getInitialBoardAndSquaresState(),
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SELECT_PIECE': {
      const { x, y } = action.payload;
      // debugger;
      const matchingPiece = state.board[y][x];
      if (matchingPiece && isSelectablePiece(matchingPiece, state.playerMustCapture)) {
        const selectedPiece = matchingPiece.clone();
        return {
          ...state,
          selectedPiece,
        };
      }

      return state;
    }
    case 'DESELECT_PIECE': {
      return {
        ...state,
        selectedPiece: null,
      };
    }

    case 'MOVE_PIECE': {
      const { x, y } = action.payload;
      if (state.selectedPiece && !state.playerMustCapture) {
        const nextState = { ...state, board: [...state.board].map((row) => [...row]) };
        const pieceAfterMove = state.selectedPiece
          .clone({
            x,
            y,
          })
          .clearAllMoves();
        nextState.board[y][x] = pieceAfterMove;
        nextState.board[state.selectedPiece.y][state.selectedPiece.x] = null;
        nextState.selectedPiece = null;
        nextState.currentPlayer = getNextPlayer(state.currentPlayer);
        nextState.board = mapAllMovesForActivePlayer(nextState.board, nextState.currentPlayer);
        nextState.playerMustCapture = hasCaptures(nextState.board, nextState.currentPlayer);
        return nextState;
      }

      return state;
    }

    case 'CAPTURE_PIECE': {
      if (state.selectedPiece && state.playerMustCapture) {
        const { capturePos, landingPos } = action.payload;
        // debugger;
        const nextState = { ...state, board: [...state.board].map((row) => [...row]) };
        const pieceAfterMove = state.selectedPiece
          .clone({
            x: landingPos.x,
            y: landingPos.y,
          })
          .clearAllMoves();

        nextState.board[landingPos.y][landingPos.x] = pieceAfterMove;
        nextState.board[state.selectedPiece.y][state.selectedPiece.x] = null;
        nextState.board[capturePos.y][capturePos.x] = null;
        nextState.selectedPiece = null;

        const moreCapturesFound =
          getValidCapturesForPiece(nextState.board, pieceAfterMove).length > 0;

        const nextPlayer = moreCapturesFound
          ? state.currentPlayer
          : getNextPlayer(state.currentPlayer);
        const nextBoardState = mapAllMovesForActivePlayer(nextState.board, nextPlayer);
        const playerMustCapture = moreCapturesFound || hasCaptures(nextBoardState, nextPlayer);
        return {
          ...nextState,
          board: nextBoardState,
          currentPlayer: nextPlayer,
          playerMustCapture,
        };
      }

      return state;
    }

    case 'SET_MODE': {
      return {
        ...state,
        board: mapAllMovesForActivePlayer(state.board, state.currentPlayer),
        mode: action.payload,
      };
    }

    default:
      return state;
  }
}

export const App: React.FC = () => {
  const [state, dispatch] = useReducer(reducer, initialState);
  console.log(state);

  // Game mode selection
  if (!state.mode) {
    return (
      <div className="p-4">
        <h1 className="text-xl font-semibold mb-4">Checkers Game</h1>
        <p className="mb-2">Choose a mode to start:</p>
        <div className="flex gap-2">
          <button
            className="px-3 py-1 rounded border border-black hover:bg-gray-100"
            onClick={() => dispatch({ type: 'SET_MODE', payload: 'pvp' })}
          >
            Two Players (PvP)
          </button>
          <button
            className="px-3 py-1 rounded border border-black hover:bg-gray-100"
            onClick={() => dispatch({ type: 'SET_MODE', payload: 'pvc' })}
          >
            Single Player (PvC)
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h1 className="text-xl font-semibold mb-2">Checkers Game</h1>
      <div className="text-sm mb-4">
        <span className="mr-3">
          Mode: {state.mode === 'pvp' ? 'Two Players (PvP)' : 'Single Player (PvC)'}
        </span>
        <span>Current: {state.currentPlayer === PieceColor.light ? 'Red' : 'Black'}</span>
      </div>
      <div className="flex flex-col border border-black w-fit">
        {state.board?.map((row, rowIndex) => (
          <div key={rowIndex} className="flex border-t-black border-b-black items-center">
            {row.map((piece, columnIndex) => (
              <div
                key={columnIndex}
                className={cn(
                  'border border-l-black border-r-black size-10 flex justify-center items-center',
                  state.squares[rowIndex][columnIndex].color === SquareColor.dark
                    ? 'bg-orange-900'
                    : 'bg-orange-100',
                  {
                    'bg-green-300':
                      state.selectedPiece?.moves.some(
                        (move) => move.x === columnIndex && move.y === rowIndex,
                      ) ||
                      state.selectedPiece?.captures.some(
                        (capture) =>
                          capture.landingPos.x === columnIndex && capture.landingPos.y === rowIndex,
                      ),
                  },
                  {
                    'opacity-50':
                      piece?.color === state.currentPlayer &&
                      !isSelectablePiece(piece, state.playerMustCapture),
                  },
                )}
                onClick={() => {
                  if (piece && isSelected(piece, state.selectedPiece)) {
                    dispatch({ type: 'DESELECT_PIECE' });
                  } else if (isSelectablePiece(piece, state.playerMustCapture)) {
                    piece && dispatch({ type: 'SELECT_PIECE', payload: piece });
                  } else if (
                    !state.playerMustCapture &&
                    state.selectedPiece?.moves.some(
                      (move) => move.x === columnIndex && move.y === rowIndex,
                    )
                  ) {
                    dispatch({
                      type: 'MOVE_PIECE',
                      payload: { x: columnIndex, y: rowIndex },
                    });
                  } else if (state.playerMustCapture) {
                    const captured = state.selectedPiece?.captures.find(
                      (capture) =>
                        capture.landingPos.x === columnIndex && capture.landingPos.y === rowIndex,
                    );
                    if (captured) {
                      dispatch({
                        type: 'CAPTURE_PIECE',
                        payload: captured,
                      });
                    }
                  }
                }}
              >
                {piece ? (
                  <CheckersPiece
                    color={piece.color}
                    king={piece.isKing}
                    isSelected={isSelected(piece, state.selectedPiece)}
                  />
                ) : (
                  ''
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};
