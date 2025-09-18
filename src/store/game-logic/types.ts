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
  captures: { capturePosition: Position; landingPosition: Position }[];
}

type Board = (Piece | null)[][];

export type { Position, Color, Piece, Board };
