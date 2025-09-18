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

export { getPiece, getOffsetsFor, isMoveInBounds };
