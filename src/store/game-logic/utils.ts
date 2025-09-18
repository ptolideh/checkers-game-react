import { forwardMovementOffsets, kingMovementOffsets, BOARD_SIZE } from './rules';
import type { Board, Piece, Position } from './types';

const getPiece = (board: Board, at: Position): Piece | null => {
  return board[at.y][at.x];
};

const get = getPiece;

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

export { getPiece, getOffsetsFor, isMoveInBounds, equals, cloneBoard, positionKey };
