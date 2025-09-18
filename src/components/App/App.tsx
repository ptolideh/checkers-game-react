import { cn } from '@/lib/utils';
import { useReducer } from 'react';

const regularMoveOptions = {
  red: [
    [1, 1],
    [1, -1],
  ],
  black: [
    [-1, 1],
    [-1, -1],
  ],
};

type Position = {
  x: number;
  y: number;
};

const kingMoveOptions = {
  red: [...regularMoveOptions.red, [-1, 1], [-1, -1]],
  black: [...regularMoveOptions.black, [1, 1], [1, -1]],
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
  return isMoveInBounds(game, y, x) && game[y][x].piece === null && game[y][x].color === 'dark';
};

const isNextOpponent = (current: Square, next: Square) => {
  return next.piece?.color && current.piece?.color !== next.piece?.color;
};

const hasCaptures = (game: Square[][], currentPlayer: 'red' | 'black') =>
  game.some((row) =>
    row.some(
      (square) =>
        square.piece && square.piece.color === currentPlayer && square.piece.captures.length > 0,
    ),
  );

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

//   movementOptions.forEach((option) => {
//     const [rowMovement, colMovement] = option;
//     const nextY = square.y + rowMovement;
//     const nextX = square.x + colMovement;

//     if (isValidLandingPos(game, nextY, nextX)) {
//       moveOptions.push({
//         x: nextX,
//         y: nextY,
//       });
//     }
//   });

//   return moveOptions;
// };

type CaptureOption = {
  capturePos: Position;
  landingPos: Position;
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

const mapAllMovesForCurrentPlayer = (game: Square[][], color: 'red' | 'black') => {
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

type Piece = {
  color: 'red' | 'black';
  isKing: boolean;
  moves: Position[];
  captures: CaptureOption[];
};

type Square = Position & {
  color: 'dark' | 'light';
  piece: Piece | null;
};

interface State {
  selectedSquare: Square | null;
  validMoves: string[];
  mode: 'pvp' | 'pvc' | null;
  currentPlayer: 'red' | 'black';
  mustCapture: boolean;
  game: Square[][];
}

type Action =
  | { type: 'SELECT_PIECE'; payload: Square }
  | { type: 'DESELECT_PIECE' }
  | { type: 'MOVE_PIECE'; payload: Square }
  | { type: 'CAPTURE_PIECE'; payload: Square }
  | { type: 'SET_MODE'; payload: 'pvp' | 'pvc' }
  | { type: 'SET_PLAYER_COLOR'; payload: 'red' | 'black' };

const getInitialGameState = () => {
  const game: Square[][] = Array.from({ length: 8 }, () =>
    Array.from({ length: 8 }, () => ({ x: 0, y: 0, color: 'light', piece: null })),
  );
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const s = game[row][col];
      s.x = col;
      s.y = row;
      if ((row + col) % 2 !== 0) {
        s.color = 'dark';
        if (row < 3) s.piece = { color: 'red', isKing: false, moves: [], captures: [] };
        else if (row > 4) s.piece = { color: 'black', isKing: false, moves: [], captures: [] };
      }
    }
  }
  return game;
};

const initialState: State = {
  selectedSquare: null,
  validMoves: [],
  mode: null,
  currentPlayer: 'black',
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
        validMoves: [],
        selectedSquare: null,
      };

    case 'MOVE_PIECE': {
      if (!state.selectedSquare || state.mustCapture) return state;
      const nextState = { ...state, game: [...state.game].map((row) => [...row]) };
      let currentPlayer = state.currentPlayer;
      if (state.selectedSquare) {
        nextState.game[state.selectedSquare.y][state.selectedSquare.x].piece = null;
        nextState.game[action.payload.y][action.payload.x].piece = Object.assign(
          {},
          state.selectedSquare.piece,
        );
        nextState.selectedSquare = null;
        nextState.validMoves = [];
      }

      currentPlayer = state.currentPlayer === 'red' ? 'black' : 'red';

      nextState.game = mapAllMovesForCurrentPlayer(nextState.game, currentPlayer);

      return {
        ...nextState,
        mustCapture: hasCaptures(nextState.game, currentPlayer),
        currentPlayer,
      };
    }

    case 'CAPTURE_PIECE': {
      if (!state.selectedSquare || !state.mustCapture) return state;
      let currentPlayer = state.currentPlayer;
      const nextState = { ...state, game: [...state.game].map((row) => [...row]) };
      nextState.game[state.selectedSquare.y][state.selectedSquare.x].piece = null;
      nextState.game[action.payload.y][action.payload.x].piece = Object.assign(
        {},
        state.selectedSquare.piece,
      );
      nextState.selectedSquare = null;
      nextState.validMoves = [];

      if (
        getValidCapturesPerPiece(nextState.game, nextState.game[action.payload.y][action.payload.x])
          .length > 0
      ) {
        return {
          ...nextState,
          mustCapture: true,
          game: mapAllMovesForCurrentPlayer(nextState.game, currentPlayer),
        };
      }

      currentPlayer = state.currentPlayer === 'red' ? 'black' : 'red';
      nextState.game = mapAllMovesForCurrentPlayer(nextState.game, currentPlayer);

      return {
        ...nextState,
        mustCapture: hasCaptures(nextState.game, currentPlayer),
        currentPlayer,
      };
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
        <span>Current: {state.currentPlayer === 'red' ? 'Red' : 'Black'}</span>
      </div>
      <div className="flex flex-col border border-black w-fit">
        {state.game.map((row, rowIndex) => (
          <div key={rowIndex} className="flex border-t-black border-b-black items-center">
            {row.map((square, columnIndex) => (
              <div
                key={columnIndex}
                className={cn(
                  'border border-l-black border-r-black size-10 flex justify-center items-center',
                  square.color === 'dark' ? 'bg-orange-900' : 'bg-orange-100',
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
                  } else if (
                    state.mustCapture &&
                    state.selectedSquare?.piece?.captures.some(
                      (capture) =>
                        capture.landingPos.x === square.x && capture.landingPos.y === square.y,
                    )
                  ) {
                    dispatch({
                      type: 'CAPTURE_PIECE',
                      payload: square,
                    });
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
        color === 'black' ? 'bg-black' : 'bg-red-600',
        color === 'black' ? 'border-black' : 'border-red-600',
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
