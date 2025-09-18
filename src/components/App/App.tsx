import { cn } from '@/lib/utils';
import { useReducer } from 'react';
import { CheckersPiece } from '../CheckersPiece';
import { PieceColor } from '@/store/game-logic/types';

const BOARD_SIZE = 8;

enum PieceColor {
  dark = 'darkPiece',
  light = 'lightPiece',
}

enum SquareColor {
  dark = 'darkPiece',
  light = 'lightPiece',
}

type Position = {
  x: number;
  y: number;
};

type Square = Position & {
  color: SquareColor;
};

type Game = (Piece | null)[][];

interface State {
  selectedPiece: Piece | null;
  mode: 'pvp' | 'pvc' | null;
  currentPlayer: PieceColor;
  playerMustCapture: boolean;
  game: Game;
  board: Omit<Square, 'piece'>[][]; //Square[][];
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
  color: PieceColor;
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

const regularMoveOptions: Record<PieceColor, number[][]> = {
  light: [
    [1, 1],
    [1, -1],
  ],
  dark: [
    [-1, 1],
    [-1, -1],
  ],
};

const kingMoveOptions: number[][] = [
  [-1, 1],
  [-1, -1],
  [1, 1],
  [1, -1],
];

const shouldPromoteToKing = (color: PieceColor, targetRow: number) => {
  if (color === PieceColor.light && targetRow === BOARD_SIZE - 1) return true;
  if (color === PieceColor.dark && targetRow === 0) return true;
  return false;
};

//A valid square must be inside the board
const isMoveInBounds = (y: number, x: number): boolean => {
  return y >= 0 && y < BOARD_SIZE && x >= 0 && x < BOARD_SIZE;
};

//A valid move target must be inside the board and empty
const isValidLandingPos = (game: Game, y: number, x: number): boolean => {
  return isMoveInBounds(y, x) && game[y][x] === null;
};

const isAdjacentOpponent = (current: Piece, adjacent: Piece) => {
  return adjacent?.color && current.color !== adjacent.color;
};

const hasCaptures = (game: Game, currentPlayer: PieceColor) =>
  game.some((row) =>
    row.some((piece) => piece && piece.color === currentPlayer && piece.captures.length > 0),
  );

const getNextPlayer = (currentPlayer: PieceColor) => {
  return currentPlayer === PieceColor.light ? PieceColor.dark : PieceColor.light;
};

const getSimpleMovesPerPiece = (game: Game, piece: Piece) => {
  if (!piece) return [];

  const movementOptions = piece.isKing ? kingMoveOptions : regularMoveOptions[piece.color];

  return movementOptions.reduce<Position[]>((acc, option) => {
    const [rowMovement, colMovement] = option;
    const nextY = piece.y + rowMovement;
    const nextX = piece.x + colMovement;

    if (isValidLandingPos(game, nextY, nextX)) {
      acc.push({
        x: nextX,
        y: nextY,
      });
    }

    return acc;
  }, []);
};

const getValidCapturesPerPiece = (game: Game, piece: Piece): Piece['captures'] => {
  if (!piece) return [];

  const movementOptions = piece.isKing ? kingMoveOptions : regularMoveOptions[piece.color];

  return movementOptions.reduce<Piece['captures']>((acc, option) => {
    const [rowMovement, colMovement] = option;
    const nextY = piece.y + rowMovement;
    const nextX = piece.x + colMovement;
    const jumpY = piece.y + rowMovement * 2;
    const jumpX = piece.x + colMovement * 2;

    if (!isMoveInBounds(nextY, nextX)) return acc;
    if (!isMoveInBounds(jumpY, jumpX)) return acc;
    if (!isValidLandingPos(game, jumpY, jumpX)) return acc;
    const adjacentPiece = game[nextY][nextX];

    if (adjacentPiece && isAdjacentOpponent(piece, adjacentPiece)) {
      acc.push({
        capturePos: { x: nextX, y: nextY },
        landingPos: { x: jumpX, y: jumpY },
      });
    }

    return acc;
  }, []);
};

const mapAllMovesForCurrentPlayer = (game: Game, currentPlayer: PieceColor): Game => {
  return game.map((row) => {
    return row.map((piece) => {
      if (!piece || piece.color !== currentPlayer) {
        return piece?.clearAllMoves() ?? null;
      }

      const validCaptures = getValidCapturesPerPiece(game, piece);
      if (validCaptures.length > 0) {
        return piece.clearAllMoves().clone({ captures: validCaptures });
      } else {
        const validMoves = getSimpleMovesPerPiece(game, piece);
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

const getInitialGameAndBoardState = () => {
  const board: Square[][] = Array.from({ length: BOARD_SIZE }, () =>
    Array.from({ length: BOARD_SIZE }, () => ({
      x: 0,
      y: 0,
      color: SquareColor.light,
    })),
  );

  const game: Game = Array.from({ length: board.length }, () =>
    Array.from({ length: board.length }, () => null),
  );

  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      const square = board[row][col];
      square.x = col;
      square.y = row;
      if ((row + col) % 2 !== 0) {
        square.color = SquareColor.dark;
        if (row < 3) {
          game[row][col] = new Piece({ x: col, y: row, color: PieceColor.light });
        }
        if (row > 4) {
          game[row][col] = new Piece({ x: col, y: row, color: PieceColor.dark });
        }
      }
    }
  }
  return { board, game };
};

const initialState: State = {
  selectedPiece: null,
  mode: null,
  currentPlayer: PieceColor.dark,
  playerMustCapture: false,
  ...getInitialGameAndBoardState(),
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SELECT_PIECE': {
      const { x, y } = action.payload;
      // debugger;
      const matchingPiece = state.game[y][x];
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
        const nextState = { ...state, game: [...state.game].map((row) => [...row]) };
        const pieceAfterMove = state.selectedPiece
          .clone({
            x,
            y,
          })
          .clearAllMoves();
        nextState.game[y][x] = pieceAfterMove;
        nextState.game[state.selectedPiece.y][state.selectedPiece.x] = null;
        nextState.selectedPiece = null;
        nextState.currentPlayer = getNextPlayer(state.currentPlayer);
        nextState.game = mapAllMovesForCurrentPlayer(nextState.game, nextState.currentPlayer);
        nextState.playerMustCapture = hasCaptures(nextState.game, nextState.currentPlayer);
        return nextState;
      }

      return state;
    }

    case 'CAPTURE_PIECE': {
      if (state.selectedPiece && state.playerMustCapture) {
        const { capturePos, landingPos } = action.payload;
        // debugger;
        const nextState = { ...state, game: [...state.game].map((row) => [...row]) };
        const pieceAfterMove = state.selectedPiece
          .clone({
            x: landingPos.x,
            y: landingPos.y,
          })
          .clearAllMoves();

        nextState.game[landingPos.y][landingPos.x] = pieceAfterMove;
        nextState.game[state.selectedPiece.y][state.selectedPiece.x] = null;
        nextState.game[capturePos.y][capturePos.x] = null;
        nextState.selectedPiece = null;

        const moreCapturesFound =
          getValidCapturesPerPiece(nextState.game, pieceAfterMove).length > 0;

        const nextPlayer = moreCapturesFound
          ? state.currentPlayer
          : getNextPlayer(state.currentPlayer);
        const nextGameState = mapAllMovesForCurrentPlayer(nextState.game, nextPlayer);
        const playerMustCapture = moreCapturesFound || hasCaptures(nextGameState, nextPlayer);
        return {
          ...nextState,
          game: nextGameState,
          currentPlayer: nextPlayer,
          playerMustCapture,
        };
      }

      return state;
    }

    case 'SET_MODE': {
      return {
        ...state,
        game: mapAllMovesForCurrentPlayer(state.game, state.currentPlayer),
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
        {state.game?.map((row, rowIndex) => (
          <div key={rowIndex} className="flex border-t-black border-b-black items-center">
            {row.map((piece, columnIndex) => (
              <div
                key={columnIndex}
                className={cn(
                  'border border-l-black border-r-black size-10 flex justify-center items-center',
                  state.board[rowIndex][columnIndex].color === SquareColor.dark
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
