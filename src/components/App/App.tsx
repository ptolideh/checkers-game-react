import { cn } from '@/lib/utils';
import { useReducer } from 'react';

const getKeyFromCoordinates = (x: number, y: number) => `${x}:${y}`;

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
const isValidLocation = (game: Square[][], y: number, x: number): boolean => {
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
  if (!piece) return [] as string[];

  const movementOptions = piece.isKing
    ? kingMoveOptions[piece.color]
    : regularMoveOptions[piece.color];

  const moveOptions: string[] = [];

  movementOptions.forEach((option) => {
    const [rowMovement, colMovement] = option;
    const nextY = square.y + rowMovement;
    const nextX = square.x + colMovement;

    if (isValidLocation(game, nextY, nextX)) {
      moveOptions.push(getKeyFromCoordinates(nextX, nextY));
    }
  });

  return moveOptions;
};

const getValidCapturesPerPiece = (game: Square[][], square: Square) => {
  const piece = square.piece;
  if (!piece) return [] as string[];

  const movementOptions = piece.isKing
    ? kingMoveOptions[piece.color]
    : regularMoveOptions[piece.color];

  const captures: string[] = [];

  movementOptions.forEach((option) => {
    const [rowMovement, colMovement] = option;
    const nextY = square.y + rowMovement;
    const nextX = square.x + colMovement;
    const jumpY = square.y + rowMovement * 2;
    const jumpX = square.x + colMovement * 2;
    if (isMoveInBounds(game, jumpY, jumpX)) {
      const isJumpAvailable = isValidLocation(game, jumpY, jumpX);
      if (isNextOpponent(square, game[nextY][nextX]) && isJumpAvailable) {
        captures.push(getKeyFromCoordinates(nextX, nextY));
      }
    }
  });

  return captures;
};

const mapAllMovesForCurrentPlayer = (game: Square[][], color: 'red' | 'black') => {
  return game.map((row) => {
    return row.map((square) => {
      if (square.piece?.color === color) {
        const validCaptures = getValidCapturesPerPiece(game, square);
        if (validCaptures.length > 0) {
          return {
            ...square,
            piece: {
              ...square.piece,
              captures: validCaptures,
            },
          };
        }
        const validMoves = getSimpleMovesPerPiece(game, square);
        return {
          ...square,
          piece: {
            ...square.piece,
            moves: validMoves,
          },
        };
      }
      return square;
    });
  });
};

// const getCurrentPlayerSquares = (game: Square[][], color: 'red' | 'black') => {
//   return game.flatMap((row) => row.filter((square) => square.piece?.color === color));
// };

const isSelected = (square: Square, selectedSquare: Square | null) => {
  return square.x === selectedSquare?.x && square.y === selectedSquare?.y;
};

type Piece = {
  color: 'red' | 'black';
  isKing: boolean;
  moves: string[];
  captures: string[];
};

type Square = {
  x: number;
  y: number;
  color: 'dark' | 'light';
  piece: Piece | null;
};

interface State {
  selectedSquare: Square | null;
  validMoves: string[];
  mode: 'pvp' | 'pvc' | null;
  currentPlayer: 'red' | 'black' | null;
  mustCapture: boolean;
  game: Square[][];
}

type Action =
  | { type: 'SELECT_PIECE'; payload: Square }
  | { type: 'DESELECT_PIECE' }
  | { type: 'MOVE_PIECE'; payload: Square }
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
  currentPlayer: null,
  mustCapture: false,
  game: getInitialGameState(),
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SELECT_PIECE':
      return {
        ...state,
        // validMoves: getValidMoves(state.game, action.payload),
        selectedSquare: { ...action.payload },
      };
    // if (state.jumps.length > 0) {
    //   if (state.jumps.includes(getKeyFromCoordinates(action.payload.x, action.payload.y))) {
    //     return {
    //       ...state,
    //       selectedSquare: { ...action.payload },
    //     };
    //   }
    //   return state;
    // } else {
    // }
    case 'DESELECT_PIECE':
      return {
        ...state,
        validMoves: [],
        selectedSquare: null,
      };
    case 'MOVE_PIECE':
      const nextState = { ...state, game: [...state.game].map((row) => [...row]) };
      if (state.selectedSquare) {
        nextState.game[state.selectedSquare.y][state.selectedSquare.x].piece = null;
        nextState.game[action.payload.y][action.payload.x].piece = Object.assign(
          {},
          state.selectedSquare.piece,
        );
        nextState.selectedSquare = null;
        nextState.validMoves = [];
      }

      return nextState;
    case 'SET_MODE':
      const currentPlayer = 'black';

      return {
        ...state,
        game: mapAllMovesForCurrentPlayer(state.game, currentPlayer),
        mode: action.payload,
        currentPlayer,
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
                    'bg-green-300': state.validMoves.includes(
                      getKeyFromCoordinates(square.x, square.y),
                    ),
                  },
                )}
                onClick={() => {
                  if (isSelected(square, state.selectedSquare)) {
                    dispatch({ type: 'DESELECT_PIECE' });
                  } else if (square.piece) {
                    dispatch({ type: 'SELECT_PIECE', payload: square });
                  } else if (state.validMoves.includes(getKeyFromCoordinates(square.x, square.y))) {
                    dispatch({
                      type: 'MOVE_PIECE',
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
