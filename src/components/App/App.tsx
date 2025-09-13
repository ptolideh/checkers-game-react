import { useState } from 'react';

type Piece = {
  color: 'red' | 'black';
  isKing: boolean;
};

type Square = Piece | null;

export const App: React.FC = () => {
  return (
    <div>
      <h1>App</h1>
    </div>
  );
};
