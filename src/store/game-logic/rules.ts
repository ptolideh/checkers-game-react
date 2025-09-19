import type { Position, Color } from './types';

const BOARD_SIZE = 8;

const PieceColor: Record<Color, Color> = {
  light: 'light',
  dark: 'dark',
} as const;

const kingMovementOffsets: ReadonlyArray<Position> = [
  { x: -1, y: +1 },
  { x: +1, y: +1 },
  { x: -1, y: -1 },
  { x: +1, y: -1 },
];

const forwardMovementOffsets: Record<Color, ReadonlyArray<Position>> = {
  light: [
    { x: -1, y: +1 },
    { x: +1, y: +1 },
  ],
  dark: [
    { x: -1, y: -1 },
    { x: +1, y: -1 },
  ],
};

const isDarkSquare = (at: Position) => (at.x + at.y) % 2 === 0;

const isStartingSquareFor = {
  light: (square: Position) => isDarkSquare(square) && square.y < 3,
  dark: (square: Position) => isDarkSquare(square) && square.y > 4,
} as const;

export {
  BOARD_SIZE,
  kingMovementOffsets,
  forwardMovementOffsets,
  PieceColor,
  isStartingSquareFor,
  isDarkSquare,
};
