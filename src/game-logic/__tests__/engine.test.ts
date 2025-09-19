import { describe, expect, it } from 'vitest';
import {
  isValidLandingSpot,
  legalCapturesPerPiece,
  legalStepsPerPiece,
  opponentOf,
  selectAllMovesPerTurn,
  selectInteractivityState,
  selectMoveTargetsFor,
  isInMoveTargets,
  hasCaptures,
  getNextPlayer,
  promoteToKing,
  applySimpleMove,
  applyCaptureMove,
  incrementStatsFor,
  evaluateWinner,
} from '../engine';
import { BOARD_SIZE, PieceColor } from '../rules';
import { createBaseState, createEmptyBoard, createMoves, positionKey } from '../utils';
import type { Piece } from '../types';

describe('opponentOf', () => {
  it('returns dark for light pieces and light for dark pieces', () => {
    expect(opponentOf(PieceColor.light)).toBe(PieceColor.dark);
    expect(opponentOf(PieceColor.dark)).toBe(PieceColor.light);
  });
});

describe('isValidLandingSpot', () => {
  it('True when the position is in bounds and empty and dark', () => {
    const board = createEmptyBoard();
    expect(isValidLandingSpot(board, { x: 0, y: 0 })).toBe(true);
  });

  it('returns false when the position is occupied', () => {
    const board = createEmptyBoard();
    const piece: Piece = { x: 1, y: 1, color: PieceColor.light, isKing: false };
    board[piece.y][piece.x] = piece;

    expect(isValidLandingSpot(board, { x: 1, y: 1 })).toBe(false);
  });

  it('returns false when the position is out of bounds', () => {
    const board = createEmptyBoard();

    expect(isValidLandingSpot(board, { x: -1, y: 0 })).toBe(false);
    expect(isValidLandingSpot(board, { x: BOARD_SIZE, y: BOARD_SIZE })).toBe(false);
  });

  it('returns false when the position is a light square', () => {
    const board = createEmptyBoard();

    expect(isValidLandingSpot(board, { x: 1, y: 0 })).toBe(false);
  });
});

describe('legalCapturesPerPiece', () => {
  it('returns a capture when adjacent piece belongs to the opponent', () => {
    const board = createEmptyBoard();

    const lightPiece: Piece = { x: 2, y: 2, color: 'light', isKing: false };
    const darkPiece: Piece = { x: 3, y: 3, color: 'dark', isKing: false };

    board[lightPiece.y][lightPiece.x] = lightPiece;
    board[darkPiece.y][darkPiece.x] = darkPiece;

    const captures = legalCapturesPerPiece(board, lightPiece);

    expect(captures).toEqual([
      {
        from: { x: 2, y: 2 },
        over: { x: 3, y: 3 },
        to: { x: 4, y: 4 },
      },
    ]);
  });

  it('does not return a capture when the adjacent piece is the same color', () => {
    const board = createEmptyBoard();

    const darkPiece: Piece = { x: 5, y: 5, color: 'dark', isKing: false };
    const blocker: Piece = { x: 4, y: 4, color: 'dark', isKing: false };

    board[darkPiece.y][darkPiece.x] = darkPiece;
    board[blocker.y][blocker.x] = blocker;

    const captures = legalCapturesPerPiece(board, darkPiece);

    expect(captures).toEqual([]);
  });
});

describe('legalStepsPerPiece', () => {
  it('returns empty array when piece is nullish', () => {
    const board = createEmptyBoard();

    // @ts-expect-error testing guard clause for null piece
    expect(legalStepsPerPiece(board, null)).toEqual([]);
  });

  it('returns forward moves for a light piece on an open board', () => {
    const board = createEmptyBoard();
    const piece: Piece = { x: 2, y: 2, color: PieceColor.light, isKing: false };
    board[piece.y][piece.x] = piece;

    expect(legalStepsPerPiece(board, piece)).toEqual([
      {
        from: { x: 2, y: 2 },
        to: { x: 1, y: 3 },
      },
      {
        from: { x: 2, y: 2 },
        to: { x: 3, y: 3 },
      },
    ]);
  });

  it('filters out blocked moves', () => {
    const board = createEmptyBoard();
    const piece: Piece = { x: 0, y: 0, color: PieceColor.light, isKing: false };
    board[piece.y][piece.x] = piece;

    const blocker: Piece = { x: 1, y: 1, color: PieceColor.dark, isKing: false };
    board[blocker.y][blocker.x] = blocker;

    expect(legalStepsPerPiece(board, piece)).toEqual([]);
  });

  it('allows kings to move in all diagonal directions when clear', () => {
    const board = createEmptyBoard();
    const king: Piece = { x: 3, y: 3, color: PieceColor.dark, isKing: true };
    board[king.y][king.x] = king;

    expect(legalStepsPerPiece(board, king)).toEqual([
      {
        from: { x: 3, y: 3 },
        to: { x: 2, y: 4 },
      },
      {
        from: { x: 3, y: 3 },
        to: { x: 4, y: 4 },
      },
      {
        from: { x: 3, y: 3 },
        to: { x: 2, y: 2 },
      },
      {
        from: { x: 3, y: 3 },
        to: { x: 4, y: 2 },
      },
    ]);
  });
});

describe('selectAllMovesPerTurn', () => {
  it('collects captures for the current player when available', () => {
    const state = createBaseState();
    const currentPlayerPiece: Piece = { x: 2, y: 2, color: PieceColor.light, isKing: false };
    const opponentPiece: Piece = { x: 3, y: 3, color: PieceColor.dark, isKing: false };
    state.board[currentPlayerPiece.y][currentPlayerPiece.x] = currentPlayerPiece;
    state.board[opponentPiece.y][opponentPiece.x] = opponentPiece;

    const moves = selectAllMovesPerTurn(state);
    const attackerKey = positionKey.get(currentPlayerPiece);

    expect(moves.captures.get(attackerKey)).toEqual([
      {
        from: { x: 2, y: 2 },
        over: { x: 3, y: 3 },
        to: { x: 4, y: 4 },
      },
    ]);
    expect(moves.steps.size).toBe(0);
  });

  it('stores step moves when no captures exist', () => {
    const state = createBaseState();
    const currentPlayerPiece: Piece = { x: 2, y: 2, color: PieceColor.light, isKing: false };
    state.board[currentPlayerPiece.y][currentPlayerPiece.x] = currentPlayerPiece;

    const moves = selectAllMovesPerTurn(state);
    const walkerKey = positionKey.get(currentPlayerPiece);

    expect(moves.captures.size).toBe(0);
    expect(moves.steps.get(walkerKey)).toEqual([
      {
        from: { x: 2, y: 2 },
        to: { x: 1, y: 3 },
      },
      {
        from: { x: 2, y: 2 },
        to: { x: 3, y: 3 },
      },
    ]);
  });

  it('ignores pieces that do not belong to the current player', () => {
    const state = createBaseState();
    const opponentPiece: Piece = { x: 5, y: 5, color: PieceColor.dark, isKing: false };
    state.board[opponentPiece.y][opponentPiece.x] = opponentPiece;

    const moves = selectAllMovesPerTurn(state);

    expect(moves.captures.size).toBe(0);
    expect(moves.steps.size).toBe(0);
  });
});

describe('selectInteractivityState', () => {
  const getKeys = (set: Set<string>) => [...set].sort();

  it('restricts selection to forced capture when forcedCaptureKey is present', () => {
    const state = createBaseState();
    const forced: Piece = { x: 2, y: 2, color: PieceColor.light, isKing: false };
    const other: Piece = { x: 0, y: 0, color: PieceColor.light, isKing: false };
    const opponentPiece: Piece = { x: 3, y: 3, color: PieceColor.dark, isKing: false };
    state.board[forced.y][forced.x] = forced;
    state.board[other.y][other.x] = other;
    state.board[opponentPiece.y][opponentPiece.x] = opponentPiece;

    const forcedKey = positionKey.get(forced);
    state.forcedCaptureKey = forcedKey;

    const interactivity = selectInteractivityState(state);

    expect(getKeys(interactivity.selectable)).toEqual([forcedKey]);
    expect(getKeys(interactivity.disabled)).toEqual([positionKey.get(other)]);
  });

  it('falls back to normal selection when forcedCaptureKey has no more captures', () => {
    const state = createBaseState();
    const stepperPiece: Piece = { x: 2, y: 2, color: PieceColor.light, isKing: false };
    state.board[stepperPiece.y][stepperPiece.x] = stepperPiece;

    const forcedKey = positionKey.get(stepperPiece);
    state.forcedCaptureKey = forcedKey;

    const interactivity = selectInteractivityState(state);

    expect(getKeys(interactivity.selectable)).toEqual([forcedKey]);
    expect(getKeys(interactivity.disabled)).toEqual([]);
  });

  it('enables pieces with captures only when it has valid captures', () => {
    const state = createBaseState();
    const capturingPiece: Piece = { x: 2, y: 2, color: PieceColor.light, isKing: false };
    const stepperPiece: Piece = { x: 5, y: 5, color: PieceColor.light, isKing: false };
    const opponentPiece: Piece = { x: 3, y: 3, color: PieceColor.dark, isKing: false };
    state.board[capturingPiece.y][capturingPiece.x] = capturingPiece;
    state.board[stepperPiece.y][stepperPiece.x] = stepperPiece;
    state.board[opponentPiece.y][opponentPiece.x] = opponentPiece;

    const interactivity = selectInteractivityState(state);

    expect(getKeys(interactivity.selectable)).toEqual([positionKey.get(capturingPiece)]);
    expect(getKeys(interactivity.disabled)).toEqual([positionKey.get(stepperPiece)]);
  });

  it('enables pieces with steps when no captures exist', () => {
    const state = createBaseState();
    const stepperPiece: Piece = { x: 2, y: 2, color: PieceColor.light, isKing: false };
    const blocked: Piece = { x: 1, y: 7, color: PieceColor.light, isKing: false };
    state.board[stepperPiece.y][stepperPiece.x] = stepperPiece;
    state.board[blocked.y][blocked.x] = blocked;

    const interactivity = selectInteractivityState(state);

    expect(getKeys(interactivity.selectable)).toEqual([positionKey.get(stepperPiece)]);
    expect(getKeys(interactivity.disabled)).toEqual([positionKey.get(blocked)]);
  });
});

describe('selectMoveTargetsFor', () => {
  it('returns capture targets when captures are available', () => {
    const capturingPiece: Piece = { x: 2, y: 2, color: PieceColor.light, isKing: false };
    const moves = createMoves();
    const capture = {
      from: { x: 2, y: 2 },
      over: { x: 3, y: 3 },
      to: { x: 4, y: 4 },
    };
    moves.captures.set(positionKey.get(capturingPiece), [capture]);

    const targets = selectMoveTargetsFor(capturingPiece, moves);

    expect([...targets]).toEqual([positionKey.get(capture.to)]);
  });

  it('returns step targets when there are no captures', () => {
    const piece: Piece = { x: 2, y: 2, color: PieceColor.light, isKing: false };
    const moves = createMoves();
    const step = {
      from: { x: 2, y: 2 },
      to: { x: 1, y: 3 },
    };
    moves.steps.set(positionKey.get(piece), [step]);

    const targets = selectMoveTargetsFor(piece, moves);

    expect([...targets]).toEqual([positionKey.get(step.to)]);
  });

  it('returns empty set when no moves exist for the piece', () => {
    const piece: Piece = { x: 2, y: 2, color: PieceColor.light, isKing: false };
    const moves = createMoves();

    const targets = selectMoveTargetsFor(piece, moves);

    expect([...targets]).toEqual([]);
  });
});

describe('isInMoveTargets', () => {
  it('returns true when the target is in the set', () => {
    const target = { x: 4, y: 4 };
    const targets = new Set<string>([positionKey.get(target)]);

    expect(isInMoveTargets(targets, target)).toBe(true);
  });

  it('returns false when the set is null or not in the set', () => {
    expect(isInMoveTargets(null, { x: 0, y: 0 })).toBe(false);
    const targets = new Set<string>([positionKey.get({ x: 1, y: 1 })]);
    expect(isInMoveTargets(targets, { x: 2, y: 2 })).toBe(false);
  });
});

describe('hasCaptures', () => {
  it('returns true when captures map has entries', () => {
    const moves = createMoves();
    moves.captures.set('key', []);
    expect(hasCaptures(moves)).toBe(true);
  });

  it('returns false when captures map is empty', () => {
    const moves = createMoves();
    expect(hasCaptures(moves)).toBe(false);
  });
});

describe('getNextPlayer', () => {
  it('switches from light to dark and vice versa', () => {
    expect(getNextPlayer(PieceColor.light)).toBe(PieceColor.dark);
    expect(getNextPlayer(PieceColor.dark)).toBe(PieceColor.light);
  });
});

describe('promoteToKing', () => {
  it('True when piece is already a king', () => {
    const piece: Piece = { x: 0, y: 0, color: PieceColor.light, isKing: true };
    expect(promoteToKing(piece)).toBe(true);
  });

  it('promotes light piece on the last row', () => {
    const piece: Piece = { x: 0, y: BOARD_SIZE - 1, color: PieceColor.light, isKing: false };
    expect(promoteToKing(piece)).toBe(true);
  });

  it('promotes dark piece on the first row', () => {
    const piece: Piece = { x: 0, y: 0, color: PieceColor.dark, isKing: false };
    expect(promoteToKing(piece)).toBe(true);
  });

  it('returns false when piece is not in promotion position', () => {
    const lightPiece: Piece = { x: 0, y: 3, color: PieceColor.light, isKing: false };
    const darkPiece: Piece = { x: 0, y: 4, color: PieceColor.dark, isKing: false };

    expect(promoteToKing(lightPiece)).toBe(false);
    expect(promoteToKing(darkPiece)).toBe(false);
  });
});

describe('applySimpleMove', () => {
  it('returns null when no matching step is found', () => {
    const board = createEmptyBoard();
    const piece: Piece = { x: 2, y: 2, color: PieceColor.light, isKing: false };
    board[piece.y][piece.x] = piece;

    const moves = createMoves();
    moves.steps.set(positionKey.get(piece), [
      {
        from: { x: 2, y: 2 },
        to: { x: 1, y: 3 },
      },
    ]);

    const result = applySimpleMove(board, moves, piece, { x: 3, y: 3 });

    expect(result).toBeNull();
  });

  it('moves the piece to the target square', () => {
    const board = createEmptyBoard();
    const piece: Piece = { x: 2, y: 2, color: PieceColor.light, isKing: false };
    board[piece.y][piece.x] = piece;

    const moves = createMoves();
    const destination = { x: 3, y: 3 };
    moves.steps.set(positionKey.get(piece), [
      {
        from: { x: 2, y: 2 },
        to: destination,
      },
    ]);

    const result = applySimpleMove(board, moves, piece, destination);

    expect(result).not.toBeNull();
    expect(result?.destination).toEqual(destination);
    expect(board[piece.y][piece.x]).toBe(piece);
    expect(result?.newBoard[destination.y][destination.x]).toMatchObject({
      x: destination.x,
      y: destination.y,
      color: piece.color,
      isKing: piece.isKing,
    });
    expect(result?.newBoard[piece.y][piece.x]).toBeNull();
  });

  it('promotes the piece to king when reaching promotion row', () => {
    const board = createEmptyBoard();
    const piece: Piece = { x: 1, y: BOARD_SIZE - 2, color: PieceColor.light, isKing: false };
    board[piece.y][piece.x] = piece;

    const moves = createMoves();
    const destination = { x: 0, y: BOARD_SIZE - 1 };
    moves.steps.set(positionKey.get(piece), [
      {
        from: { x: piece.x, y: piece.y },
        to: destination,
      },
    ]);

    const result = applySimpleMove(board, moves, piece, destination);

    expect(result).not.toBeNull();
    expect(result?.newBoard[destination.y][destination.x]?.isKing).toBe(true);
  });
});

describe('applyCaptureMove', () => {
  it('returns null when no capture matches the target', () => {
    const board = createEmptyBoard();
    const piece: Piece = { x: 2, y: 2, color: PieceColor.light, isKing: false };
    board[piece.y][piece.x] = piece;

    const moves = createMoves();
    moves.captures.set(positionKey.get(piece), [
      {
        from: { x: 2, y: 2 },
        over: { x: 3, y: 3 },
        to: { x: 4, y: 4 },
      },
    ]);

    const result = applyCaptureMove(board, moves, piece, { x: 0, y: 0 });

    expect(result).toBeNull();
  });

  it('removes the captured piece and moves attacker to landing square', () => {
    const board = createEmptyBoard();
    const attacker: Piece = { x: 2, y: 2, color: PieceColor.light, isKing: false };
    const opponent: Piece = { x: 3, y: 3, color: PieceColor.dark, isKing: false };
    board[attacker.y][attacker.x] = attacker;
    board[opponent.y][opponent.x] = opponent;

    const moves = createMoves();
    const landing = { x: 4, y: 4 };
    moves.captures.set(positionKey.get(attacker), [
      {
        from: { x: attacker.x, y: attacker.y },
        over: { x: opponent.x, y: opponent.y },
        to: landing,
      },
    ]);

    const result = applyCaptureMove(board, moves, attacker, landing);

    expect(result).not.toBeNull();
    expect(result?.captured).toEqual({ x: opponent.x, y: opponent.y });
    expect(result?.destination).toEqual(landing);
    expect(board[opponent.y][opponent.x]).toBe(opponent);
    expect(result?.newBoard[landing.y][landing.x]).toMatchObject({ x: landing.x, y: landing.y });
    expect(result?.newBoard[opponent.y][opponent.x]).toBeNull();
    expect(result?.newBoard[attacker.y][attacker.x]).toBeNull();
  });

  it('promotes capturing piece to king when landing on promotion row', () => {
    const board = createEmptyBoard();
    const attacker: Piece = { x: 1, y: BOARD_SIZE - 3, color: PieceColor.light, isKing: false };
    const victim: Piece = { x: 0, y: BOARD_SIZE - 2, color: PieceColor.dark, isKing: false };
    board[attacker.y][attacker.x] = attacker;
    board[victim.y][victim.x] = victim;

    const moves = createMoves();
    const landing = { x: 1, y: BOARD_SIZE - 1 };
    moves.captures.set(positionKey.get(attacker), [
      {
        from: { x: attacker.x, y: attacker.y },
        over: { x: victim.x, y: victim.y },
        to: landing,
      },
    ]);

    const result = applyCaptureMove(board, moves, attacker, landing);

    expect(result?.newBoard[landing.y][landing.x]?.isKing).toBe(true);
  });
});

describe('incrementStatsFor', () => {
  it('increments moves and captures for the specified color', () => {
    const stats = {
      light: { moves: 1, captures: 2 },
      dark: { moves: 3, captures: 4 },
    } as const;

    const updated = incrementStatsFor(stats, PieceColor.light, { moves: 2, captures: 1 });

    expect(updated.light).toEqual({ moves: 3, captures: 3 });
    expect(updated.dark).toEqual(stats.dark);
  });

  it('treats missing fields in change as zero', () => {
    const stats = {
      light: { moves: 1, captures: 2 },
      dark: { moves: 3, captures: 4 },
    } as const;

    const updated = incrementStatsFor(stats, PieceColor.dark, {});

    expect(updated.dark).toEqual({ moves: 3, captures: 4 });
  });
});

describe('evaluateWinner', () => {
  it('returns draw when no pieces remain', () => {
    const state = createBaseState();
    expect(evaluateWinner(state)).toBe('draw');
  });

  it('returns winner when one color has no pieces', () => {
    const state = createBaseState();
    const lightPiece: Piece = { x: 0, y: 0, color: PieceColor.light, isKing: false };
    state.board[lightPiece.y][lightPiece.x] = lightPiece;

    expect(evaluateWinner(state)).toBe(PieceColor.light);

    state.board[lightPiece.y][lightPiece.x] = null;
    const darkPiece: Piece = { x: 1, y: 1, color: PieceColor.dark, isKing: false };
    state.board[darkPiece.y][darkPiece.x] = darkPiece;

    expect(evaluateWinner(state)).toBe(PieceColor.dark);
  });

  it('returns draw when neither color can move', () => {
    const state = createBaseState();
    const lightPiece: Piece = { x: 0, y: BOARD_SIZE - 1, color: PieceColor.light, isKing: false };
    const darkPiece: Piece = { x: 1, y: 0, color: PieceColor.dark, isKing: false };
    state.board[lightPiece.y][lightPiece.x] = lightPiece;
    state.board[darkPiece.y][darkPiece.x] = darkPiece;

    expect(evaluateWinner(state)).toBe('draw');
  });

  it('returns winner when one side has no moves', () => {
    const state = createBaseState();
    const lightPiece: Piece = { x: 0, y: 0, color: PieceColor.light, isKing: true };
    state.board[lightPiece.y][lightPiece.x] = lightPiece;

    expect(evaluateWinner(state)).toBe(PieceColor.light);

    state.currentPlayer = PieceColor.dark;

    expect(evaluateWinner(state)).toBe(PieceColor.light);
  });

  it('returns null when game should continue', () => {
    const state = createBaseState();
    const lightPiece: Piece = { x: 2, y: 2, color: PieceColor.light, isKing: false };
    const darkPiece: Piece = { x: 3, y: 3, color: PieceColor.dark, isKing: false };
    state.board[lightPiece.y][lightPiece.x] = lightPiece;
    state.board[darkPiece.y][darkPiece.x] = darkPiece;

    expect(evaluateWinner(state)).toBeNull();
  });
});
