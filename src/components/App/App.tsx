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
          <div key={rowIndex} className="flex border-t-black border-b-black">
            {row.map((square, columnIndex) => (
              <div
                key={columnIndex}
                className={cn(
                  'border border-l-black border-r-black size-8',
                  square.color === 'dark' ? 'bg-orange-900' : 'bg-orange-100',
                )}
              >
                {''}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};
