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

export { BOARD_SIZE, kingMovementOffsets, forwardMovementOffsets, PieceColor };
