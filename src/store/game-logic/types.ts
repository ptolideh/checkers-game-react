type Position = {
  x: number;
  y: number;
};

type Color = 'dark' | 'light';

interface Piece {
  x: number;
  y: number;
  color: Color;
  isKing: boolean;
  moves: Position[];
  captures: { capturePos: Position; landingPos: Position }[];
}

type Board = (Piece | null)[][];

export type { Position, Color, Piece, Board };
