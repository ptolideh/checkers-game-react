import { cn } from '@/lib/utils';
import { useReducer, useState } from 'react';

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
  game: Square[][];
}

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
  game: getInitialGameState(),
};

function reducer(state: State, action) {
  switch (action.type) {
    default:
      return state;
  }
}

export const App: React.FC = () => {
  const [state, dispatch] = useReducer(reducer, initialState);

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
                )}
              >
                {square.piece ? <Piece {...square.piece} /> : ''}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

const Piece: React.FC<Piece> = ({ color, isKing }) => {
  return (
    <div
      className={cn(
        'rounded-full size-6 flex justify-center items-center',
        color === 'black' ? 'bg-black' : 'bg-red-600',
      )}
    >
      {isKing ? (
        <div className="flex items-center justify-center bg-white size-4 rounded-full relative">
          <span className="absolute text-[0.75rem] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
            👑
          </span>
        </div>
      ) : (
        ''
      )}
    </div>
  );
};
