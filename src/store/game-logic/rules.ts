import type { Position } from './types';

enum PieceColor {
  dark = 'dark',
  light = 'light',
}

const kingMovementOffsets: ReadonlyArray<Position> = [
  { x: -1, y: +1 },
  { x: +1, y: +1 },
  { x: -1, y: -1 },
  { x: +1, y: -1 },
];

const forwardMovementOffsets: Record<PieceColor, ReadonlyArray<Position>> = {
  light: [
    { x: -1, y: +1 },
    { x: +1, y: +1 },
  ],
  dark: [
    { x: -1, y: -1 },
    { x: +1, y: -1 },
  ],
};

export { PieceColor, kingMovementOffsets, forwardMovementOffsets };
