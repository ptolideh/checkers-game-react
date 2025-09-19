import type { Position, Color, GameMode } from './types';

const BOARD_SIZE = 8;

const PieceColor: Record<Color, Color> = {
  light: 'light',
  dark: 'dark',
} as const;

const GameModes: Record<GameMode, GameMode> = {
  PlayerVsPlayer: 'PlayerVsPlayer',
  PlayerVsComputer: 'PlayerVsComputer',
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

const AI_PLAYER_COLOR = PieceColor.light;

export {
  BOARD_SIZE,
  AI_PLAYER_COLOR,
  kingMovementOffsets,
  forwardMovementOffsets,
  PieceColor,
  GameModes,
  isStartingSquareFor,
  isDarkSquare,
};
