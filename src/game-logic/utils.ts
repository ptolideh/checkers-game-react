import { forwardMovementOffsets, kingMovementOffsets, BOARD_SIZE, PieceColor } from './rules';
import type { Board, Captures, GameState, MoveSet, Piece, Position, Steps } from './types';

const getPiece = (board: Board, at: Position): Piece | null => {
  return board[at.y][at.x];
};

const getOffsetsFor = (piece: Piece) => {
  return piece.isKing ? kingMovementOffsets : forwardMovementOffsets[piece.color];
};

const isMoveInBounds = (boardSize: number, at: Position) => {
  return at.x >= 0 && at.x < boardSize && at.y >= 0 && at.y < boardSize;
};

const equals = (a: Position, b: Position) => a.x === b.x && a.y === b.y;

const cloneBoard = (board: Board): Board => {
  return board.map((row) => [...row]);
};

const positionKey = {
  separator: ':',
  get: ({ x, y }: Position) => `${x}${positionKey.separator}${y}`,
  parse: (key: string): Position => {
    const [x, y] = key.split(positionKey.separator).map(Number);
    return { x, y };
  },
} as const;

const selectRandom = <T>(items: T[]): T | null => {
  if (items.length === 0) return null;
  const index = Math.floor(Math.random() * items.length);
  return items[index] ?? null;
};

// ----------------- testing utils -----------------
const createEmptyBoard = (): Board =>
  Array.from({ length: BOARD_SIZE }, () => Array.from({ length: BOARD_SIZE }, () => null));

const createBaseState = (): GameState => ({
  selectedPiece: null,
  mode: null,
  currentPlayer: PieceColor.light,
  board: createEmptyBoard(),
  winner: null,
  forcedCaptureKey: null,
  stats: {
    light: { moves: 0, captures: 0 },
    dark: { moves: 0, captures: 0 },
  },
});

const createMoves = (): MoveSet => ({
  steps: new Map<string, Steps>(),
  captures: new Map<string, Captures>(),
});

export {
  getPiece,
  getOffsetsFor,
  isMoveInBounds,
  equals,
  cloneBoard,
  selectRandom,
  positionKey,
  createEmptyBoard,
  createBaseState,
  createMoves,
};
