import { describe, it, expect } from 'vitest';
import { getPiece, getOffsetsFor, isMoveInBounds, equals, positionKey } from '@/game-logic/utils';
import { forwardMovementOffsets, kingMovementOffsets, BOARD_SIZE } from '@/game-logic/rules';
import type { Board, Piece } from '@/game-logic/types';

describe('getPiece', () => {
  it('returns the piece located at the given coordinates', () => {
    const piece: Piece = { x: 0, y: 1, color: 'dark', isKing: false };
    const board: Board = [
      [null, null],
      [piece, null],
    ];

    expect(getPiece(board, { x: 0, y: 1 })).toBe(piece);
  });

  it('returns null when the target square is empty', () => {
    const board: Board = [
      [null, null],
      [null, null],
    ];

    expect(getPiece(board, { x: 1, y: 0 })).toBeNull();
  });
});

describe('getOffsetsFor', () => {
  it('returns king offsets when the piece is a king', () => {
    const kingPiece: Piece = { x: 2, y: 3, color: 'light', isKing: true };

    expect(getOffsetsFor(kingPiece)).toBe(kingMovementOffsets);
  });

  it('returns light forward offsets for a light piece', () => {
    const lightPiece: Piece = { x: 4, y: 5, color: 'light', isKing: false };

    expect(getOffsetsFor(lightPiece)).toBe(forwardMovementOffsets.light);
  });

  it('returns dark forward offsets for a dark piece', () => {
    const darkPiece: Piece = { x: 1, y: 2, color: 'dark', isKing: false };

    expect(getOffsetsFor(darkPiece)).toBe(forwardMovementOffsets.dark);
  });
});

describe('isMoveInBounds', () => {
  it('True when coordinates stay within the board edges', () => {
    expect(isMoveInBounds(BOARD_SIZE, { x: 0, y: 0 })).toBe(true);
    expect(isMoveInBounds(BOARD_SIZE, { x: BOARD_SIZE - 1, y: BOARD_SIZE - 1 })).toBe(true);
  });

  it('False when x or y are outside the board', () => {
    expect(isMoveInBounds(BOARD_SIZE, { x: -1, y: 3 })).toBe(false);
    expect(isMoveInBounds(BOARD_SIZE, { x: BOARD_SIZE, y: 3 })).toBe(false);
    expect(isMoveInBounds(BOARD_SIZE, { x: 3, y: -1 })).toBe(false);
    expect(isMoveInBounds(BOARD_SIZE, { x: 3, y: BOARD_SIZE })).toBe(false);
  });
});

describe('equals', () => {
  it('True for matching x and y coordinates', () => {
    expect(equals({ x: 3, y: 5 }, { x: 3, y: 5 })).toBe(true);
  });

  it('False when either coordinate differs', () => {
    expect(equals({ x: 3, y: 5 }, { x: 4, y: 5 })).toBe(false);
    expect(equals({ x: 3, y: 5 }, { x: 3, y: 6 })).toBe(false);
  });
});

describe('positionKey', () => {
  it('generates consistent key from coordinate', () => {
    expect(positionKey.get({ x: 6, y: 2 })).toBe('6:2');
  });

  it('parses keys back into coordinates correctly', () => {
    expect(positionKey.parse('4:7')).toEqual({ x: 4, y: 7 });
  });
});
