import { useReducer, useState } from 'react';

type Color = 'red' | 'black';

type Piece = {
  color: Color;
  isKing: boolean;
};

type Square = {
  x: number;
  y: number;
  color: Color;
  piece: Piece | null;
};

interface State {
  game: Square[][];
}

const getInitialGameState = () => {
  const game: Square[][] = Array.from({ length: 8 }, () =>
    Array.from({ length: 8 }, () => ({ x: 0, y: 0, color: 'red', piece: null })),
  );
  for (let x = 0; x < 8; x++) {
    for (let y = 0; y < 8; y++) {
      const square = game[x][y];
      if ((x + y) % 2 !== 0) {
        square.color = 'black';
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
                className="border border-l-black border-r-black size-8"
                style={{ backgroundColor: square.color }}
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
