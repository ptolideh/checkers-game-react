import { useState } from 'react';

type Piece = {
  color: 'red' | 'black';
  isKing: boolean;
};

type Square = Piece | null;

export const App: React.FC = () => {
  const [game, setGame] = useState<Square[][]>(() => {
    return Array.from({ length: 8 }, () => Array.from({ length: 8 }, () => null));
  });
  return (
    <div>
      <h1>Checkers Game</h1>
      <div className="flex flex-col border border-black w-fit">
        {game.map((row, rowIndex) => (
          <div key={rowIndex} className="flex border-t-black border-b-black">
            {row.map((square, columnIndex) => (
              <div key={columnIndex} className="border border-l-black border-r-black size-8">
                {JSON.stringify(square)}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};
