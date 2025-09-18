import { cn } from '@/lib/utils';
import { get } from 'http';
import { useReducer } from 'react';

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

type CaptureOption = {
  capturePos: Position;
  landingPos: Position;
};

type Piece = {
  color: PieceColor;
  isKing: boolean;
  moves: Position[];
  captures: CaptureOption[];
};

type Square = Position & {
  color: SquareColor;
  piece: Piece | null;
};

interface State {
  selectedSquare: Square | null;
  mode: 'pvp' | 'pvc' | null;
  currentPlayer: PieceColor;
  mustCapture: boolean;
  game: Square[][];
}

type Action =
  | { type: 'SELECT_PIECE'; payload: Square }
  | { type: 'DESELECT_PIECE' }
  | { type: 'MOVE_PIECE'; payload: Square }
  | { type: 'CAPTURE_PIECE'; payload: CaptureOption }
  | { type: 'SET_MODE'; payload: 'pvp' | 'pvc' }
  | { type: 'SET_PLAYER_COLOR'; payload: PieceColor };

const regularMoveOptions: Record<PieceColor, number[][]> = {
  lightPiece: [
    [1, 1],
    [1, -1],
  ],
  darkPiece: [
    [-1, 1],
    [-1, -1],
  ],
};

const kingMoveOptions: Record<PieceColor, number[][]> = {
  lightPiece: [...regularMoveOptions.lightPiece, [-1, 1], [-1, -1]],
  darkPiece: [...regularMoveOptions.darkPiece, [1, 1], [1, -1]],
};

const shouldPromoteToKing = (piece: Piece, targetRow: number) => {
  if (piece.isKing) return false;
  if (piece.color === PieceColor.light && targetRow === 7) return true;
  if (piece.color === PieceColor.dark && targetRow === 0) return true;
  return false;
};

//A valid square must be inside the board
const isMoveInBounds = (game: Square[][], y: number, x: number): boolean => {
  const row = game[y];
  if (!row) return false;
  const target = row[x];
  return Boolean(target);
};

//A valid move target must be inside the board and empty
const isValidLandingPos = (game: Square[][], y: number, x: number): boolean => {
  return (
    isMoveInBounds(game, y, x) && game[y][x].piece === null && game[y][x].color === SquareColor.dark
  );
};

const isNextOpponent = (current: Square, next: Square) => {
  return next.piece?.color && current.piece?.color !== next.piece?.color;
};

const hasCaptures = (game: Square[][], currentPlayer: PieceColor) =>
  game.some((row) =>
    row.some(
      (square) =>
        square.piece && square.piece.color === currentPlayer && square.piece.captures.length > 0,
    ),
  );

const getNextPlayer = (currentPlayer: PieceColor) => {
  return currentPlayer === PieceColor.light ? PieceColor.dark : PieceColor.light;
};

const getSimpleMovesPerPiece = (game: Square[][], square: Square) => {
  const piece = square.piece;
  if (!piece) return [];

  const movementOptions = piece.isKing
    ? kingMoveOptions[piece.color]
    : regularMoveOptions[piece.color];

  return movementOptions.reduce<Position[]>((acc, option) => {
    const [rowMovement, colMovement] = option;
    const nextY = square.y + rowMovement;
    const nextX = square.x + colMovement;

    if (isValidLandingPos(game, nextY, nextX)) {
      acc.push({
        x: nextX,
        y: nextY,
      });
    }

    return acc;
  }, []);
};

const getValidCapturesPerPiece = (game: Square[][], square: Square): CaptureOption[] => {
  const piece = square.piece;
  if (!piece) return [];

  const movementOptions = piece.isKing
    ? kingMoveOptions[piece.color]
    : regularMoveOptions[piece.color];

  return movementOptions.reduce<CaptureOption[]>((acc, option) => {
    const [rowMovement, colMovement] = option;
    const nextY = square.y + rowMovement;
    const nextX = square.x + colMovement;
    const jumpY = square.y + rowMovement * 2;
    const jumpX = square.x + colMovement * 2;

    if (!isMoveInBounds(game, nextY, nextX)) return acc;
    if (!isMoveInBounds(game, jumpY, jumpX)) return acc;
    if (!isValidLandingPos(game, jumpY, jumpX)) return acc;

    const adjacentSquare = game[nextY][nextX];
    if (!isNextOpponent(square, adjacentSquare)) return acc;

    acc.push({
      capturePos: { x: nextX, y: nextY },
      landingPos: { x: jumpX, y: jumpY },
    });

    return acc;
  }, []);
};

const mapAllMovesForCurrentPlayer = (game: Square[][], color: PieceColor) => {
  return game.map((row) => {
    return row.map((square) => {
      if (!square.piece) return square;

      if (square.piece?.color === color) {
        const validCaptures = getValidCapturesPerPiece(game, square);
        if (validCaptures.length > 0) {
          return {
            ...square,
            piece: {
              ...square.piece,
              captures: validCaptures,
              moves: [],
            },
          } as Square;
        }
        const validMoves = getSimpleMovesPerPiece(game, square);
        return {
          ...square,
          piece: {
            ...square.piece,
            moves: validMoves,
            captures: [],
          },
        } as Square;
      }

      return {
        ...square,
        piece: {
          ...square.piece,
          moves: [],
          captures: [],
        },
      };
    });
  });
};

const isSelected = (square: Square, selectedSquare: Square | null) => {
  return square.x === selectedSquare?.x && square.y === selectedSquare?.y;
};

const isSelectablePiece = (square: Square, playerMustCapture: boolean) => {
  if (!square.piece) return false;
  if (playerMustCapture) {
    return square.piece.captures.length > 0;
  } else {
    return square.piece.moves.length > 0;
  }
};

const getInitialGameState = () => {
  const game: Square[][] = Array.from({ length: 8 }, () =>
    Array.from({ length: 8 }, () => ({ x: 0, y: 0, color: SquareColor.light, piece: null })),
  );
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const s = game[row][col];
      s.x = col;
      s.y = row;
      if ((row + col) % 2 !== 0) {
        s.color = SquareColor.dark;
        if (row < 3) s.piece = { color: PieceColor.light, isKing: false, moves: [], captures: [] };
        else if (row > 4)
          s.piece = { color: PieceColor.dark, isKing: false, moves: [], captures: [] };
      }
    }
  }
  return game;
};

const initialState: State = {
  selectedSquare: null,
  mode: null,
  currentPlayer: PieceColor.dark,
  mustCapture: false,
  game: getInitialGameState(),
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SELECT_PIECE': {
      if (!isSelectablePiece(action.payload, state.mustCapture)) return state;

      return {
        ...state,
        selectedSquare: { ...action.payload },
      };
    }
    case 'DESELECT_PIECE':
      return {
        ...state,
        selectedSquare: null,
      };

    case 'MOVE_PIECE': {
      if (!state.selectedSquare || state.mustCapture) return state;
      const nextState = { ...state, game: [...state.game].map((row) => [...row]) };

      nextState.game[state.selectedSquare.y][state.selectedSquare.x].piece = null;
      const movedPiece = Object.assign({}, state.selectedSquare.piece);
      if (shouldPromoteToKing(movedPiece, action.payload.y)) {
        movedPiece.isKing = true;
      }
      nextState.game[action.payload.y][action.payload.x].piece = movedPiece;

      nextState.selectedSquare = null;
      nextState.currentPlayer = getNextPlayer(state.currentPlayer);
      nextState.game = mapAllMovesForCurrentPlayer(nextState.game, nextState.currentPlayer);
      nextState.mustCapture = hasCaptures(nextState.game, nextState.currentPlayer);

      return nextState;
    }

    case 'CAPTURE_PIECE': {
      if (!state.selectedSquare || !state.mustCapture) return state;
      const nextState = { ...state, game: [...state.game].map((row) => [...row]) };
      nextState.game[state.selectedSquare.y][state.selectedSquare.x].piece = null;
      nextState.game[action.payload.capturePos.y][action.payload.capturePos.x].piece = null;
      nextState.game[action.payload.landingPos.y][action.payload.landingPos.x].piece =
        Object.assign({}, state.selectedSquare.piece);
      nextState.selectedSquare = null;

      if (
        getValidCapturesPerPiece(
          nextState.game,
          nextState.game[action.payload.landingPos.y][action.payload.landingPos.x],
        ).length > 0
      ) {
        return {
          ...nextState,
          mustCapture: true,
          game: mapAllMovesForCurrentPlayer(nextState.game, nextState.currentPlayer),
        };
      }

      nextState.currentPlayer = getNextPlayer(state.currentPlayer);
      nextState.game = mapAllMovesForCurrentPlayer(nextState.game, nextState.currentPlayer);
      nextState.mustCapture = hasCaptures(nextState.game, nextState.currentPlayer);

      return nextState;
    }

    case 'SET_MODE':
      return {
        ...state,
        game: mapAllMovesForCurrentPlayer(state.game, state.currentPlayer),
        mode: action.payload,
      };
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
        {state.game.map((row, rowIndex) => (
          <div key={rowIndex} className="flex border-t-black border-b-black items-center">
            {row.map((square, columnIndex) => (
              <div
                key={columnIndex}
                className={cn(
                  'border border-l-black border-r-black size-10 flex justify-center items-center',
                  square.color === SquareColor.dark ? 'bg-orange-900' : 'bg-orange-100',
                  {
                    'bg-green-300':
                      state.selectedSquare?.piece?.moves.some(
                        (move) => move.x === square.x && move.y === square.y,
                      ) ||
                      state.selectedSquare?.piece?.captures.some(
                        (capture) =>
                          capture.landingPos.x === square.x && capture.landingPos.y === square.y,
                      ),
                  },
                  {
                    'opacity-50':
                      square.piece?.color === state.currentPlayer &&
                      !isSelectablePiece(square, state.mustCapture),
                  },
                )}
                onClick={() => {
                  if (isSelected(square, state.selectedSquare)) {
                    dispatch({ type: 'DESELECT_PIECE' });
                  } else if (isSelectablePiece(square, state.mustCapture)) {
                    dispatch({ type: 'SELECT_PIECE', payload: square });
                  } else if (
                    !state.mustCapture &&
                    state.selectedSquare?.piece?.moves.some(
                      (move) => move.x === square.x && move.y === square.y,
                    )
                  ) {
                    dispatch({
                      type: 'MOVE_PIECE',
                      payload: square,
                    });
                  } else if (state.mustCapture) {
                    const captured = state.selectedSquare?.piece?.captures.find(
                      (capture) =>
                        capture.landingPos.x === square.x && capture.landingPos.y === square.y,
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
                {square.piece ? (
                  <Piece {...square.piece} isSelected={isSelected(square, state.selectedSquare)} />
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

const Piece: React.FC<Piece & { isSelected?: boolean }> = ({ color, isKing, isSelected }) => {
  return (
    <div
      className={cn(
        'rounded-full size-6 flex justify-center items-center border-2',
        color === PieceColor.dark ? 'bg-black' : 'bg-red-600',
        color === PieceColor.dark ? 'border-black' : 'border-red-600',
        { 'border-green-300': isSelected },
      )}
    >
      {isKing ? (
        <div className="flex items-center justify-center bg-yellow-400 size-3 rounded-full relative">
          <span className="absolute text-[0.5rem] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
            👑
          </span>
        </div>
      ) : (
        ''
      )}
    </div>
  );
};
