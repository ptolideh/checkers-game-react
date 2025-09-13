import { cn } from '@/lib/utils';
import { useReducer, useState } from 'react';

const getKeyFromCoordinates = (x: number, y: number) => `${x}:${y}`;

const calculateValidMoves = (game: Square[][], square: Square) => {
  const validNextMoves = [];
  if (square.piece?.isKing) {
  } else {
    if (square.piece?.color === 'red') {
      const nextMove1 = game[square.y + 1][square.x + 1];
      const nextMove2 = game[square.y + 1][square.x - 1];
      if (nextMove1?.piece === null)
        validNextMoves.push(getKeyFromCoordinates(nextMove1.x, nextMove1.y));

      if (nextMove2?.piece === null)
        validNextMoves.push(getKeyFromCoordinates(nextMove2.x, nextMove2.y));
    } else {
      const nextMove1 = game[square.y - 1][square.x + 1];
      const nextMove2 = game[square.y - 1][square.x - 1];
      if (nextMove1?.piece === null) {
        validNextMoves.push(getKeyFromCoordinates(nextMove1.x, nextMove1.y));
      }
      if (nextMove2?.piece === null) {
        validNextMoves.push(getKeyFromCoordinates(nextMove2.x, nextMove2.y));
      }
    }
  }
  return validNextMoves;
};

const calculateValidJumps = (game: Square[][], square: Square) => {
  const jumps = [];
  if (square.piece?.color === 'red') {
    const adjacentSquare1 = game[square.y + 1]?.[square.x + 1] ?? null;
    const adjacentSquare2 = game[square.y + 1]?.[square.x - 1] ?? null;
    if (adjacentSquare1?.piece?.color === 'black') {
      const jumpSquare = game[square.y + 2]?.[square.x + 2] ?? null;
      if (jumpSquare?.piece === null) jumps.push(getKeyFromCoordinates(jumpSquare.x, jumpSquare.y));
    }
    if (adjacentSquare2?.piece?.color === 'black') {
      const jumpSquare = game[square.y + 2]?.[square.x - 2] ?? null;
      if (jumpSquare?.piece === null) jumps.push(getKeyFromCoordinates(jumpSquare.x, jumpSquare.y));
    }
  } else if (square.piece?.color === 'black') {
    const adjacentSquare1 = game[square.y - 1]?.[square.x + 1] ?? null;
    const adjacentSquare2 = game[square.y - 1]?.[square.x - 1] ?? null;
    if (adjacentSquare1?.piece?.color === 'red') {
      const jumpSquare = game[square.y - 2]?.[square.x + 2] ?? null;
      if (jumpSquare?.piece === null) jumps.push(getKeyFromCoordinates(jumpSquare.x, jumpSquare.y));
    }
    if (adjacentSquare2?.piece?.color === 'red') {
      const jumpSquare = game[square.y - 2]?.[square.x - 2] ?? null;
      if (jumpSquare?.piece === null) jumps.push(getKeyFromCoordinates(jumpSquare.x, jumpSquare.y));
    }
  }
  return jumps;
};

const shouldJump = (game: Square[][]) => {
  let jumps: string[] = [];
  game.forEach((row) => {
    row.forEach((square) => {
      if (calculateValidJumps(game, square).length > 0)
        jumps.push(getKeyFromCoordinates(square.x, square.y));
    });
  });

  return jumps;
};

const isSelected = (square: Square, selectedSquare: Square | null) => {
  return square.x === selectedSquare?.x && square.y === selectedSquare?.y;
};

type Piece = {
  color: 'red' | 'black';
  isKing: boolean;
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
  jumps: string[];
  game: Square[][];
}

type Action =
  | { type: 'SELECT_PIECE'; payload: Square }
  | { type: 'DESELECT_PIECE' }
  | { type: 'MOVE_PIECE'; payload: Square };

const getInitialGameState = () => {
  const game: Square[][] = Array.from({ length: 8 }, () =>
    Array.from({ length: 8 }, () => ({ x: 0, y: 0, color: 'light', piece: null })),
  );
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const square = game[row][col];
      square.x = col;
      square.y = row;
      if ((row + col) % 2 !== 0) {
        square.color = 'dark';
        if (row < 3) {
          square.piece = { color: 'red', isKing: false };
        } else if (row > 4) {
          square.piece = { color: 'black', isKing: false };
        }
      }
    }
  }
  return game;
};

const initialState = {
  selectedSquare: null,
  validMoves: [],
  jumps: [],
  game: getInitialGameState(),
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SELECT_PIECE':
      console.log({ jumps: state.jumps });
      if (state.jumps.length > 0) {
        if (state.jumps.includes(getKeyFromCoordinates(action.payload.x, action.payload.y))) {
          return {
            ...state,
            selectedSquare: { ...action.payload },
          };
        }
        return state;
      } else {
        return {
          ...state,
          validMoves: calculateValidMoves(state.game, action.payload),
          selectedSquare: { ...action.payload },
        };
      }
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
      const jumps = shouldJump(nextState.game);
      nextState.jumps = [...jumps];

      return nextState;
    default:
      return state;
  }
}

export const App: React.FC = () => {
  const [state, dispatch] = useReducer(reducer, initialState);
  console.log(state);

  return (
    <div>
      <h1>Checkers Game</h1>
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
