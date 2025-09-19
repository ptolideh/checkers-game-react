import { describe, expect, it } from 'vitest';
import { pickAiMove } from '@/game-logic/ai-player';
import { positionKey } from '@/game-logic/utils';
import type { Capture, MoveSet, Step } from '@/game-logic/types';

const createMoveSet = (): MoveSet => ({
  steps: new Map(),
  captures: new Map(),
});

describe('pickAiMove', () => {
  it('prioritizes forced captures when the forced key has options', () => {
    const moves = createMoveSet();
    const forcedKey = positionKey.get({ x: 2, y: 2 });
    const forcedCapture: Capture = {
      from: { x: 2, y: 2 },
      over: { x: 3, y: 3 },
      to: { x: 4, y: 4 },
    };
    const otherKey = positionKey.get({ x: 5, y: 5 });
    const otherCapture: Capture = {
      from: { x: 5, y: 5 },
      over: { x: 6, y: 6 },
      to: { x: 7, y: 7 },
    };

    moves.captures.set(forcedKey, [forcedCapture]);
    moves.captures.set(otherKey, [otherCapture]);

    const result = pickAiMove(moves, forcedKey);

    expect(result).toEqual({
      piece: { x: 2, y: 2 },
      target: forcedCapture.to,
    });
  });

  it('falls back to other captures when forced key has none', () => {
    const moves = createMoveSet();
    const forcedKey = positionKey.get({ x: 9, y: 9 });
    const captureKey = positionKey.get({ x: 1, y: 1 });
    const capture: Capture = {
      from: { x: 1, y: 1 },
      over: { x: 2, y: 2 },
      to: { x: 3, y: 3 },
    };

    moves.captures.set(captureKey, [capture]);

    const result = pickAiMove(moves, forcedKey);

    expect(result).toEqual({
      piece: { x: 1, y: 1 },
      target: capture.to,
    });
  });

  it('selects a step move when no captures are available', () => {
    const moves = createMoveSet();
    const pieceKey = positionKey.get({ x: 0, y: 0 });
    const step: Step = {
      from: { x: 0, y: 0 },
      to: { x: 1, y: 1 },
    };

    moves.steps.set(pieceKey, [step]);

    const result = pickAiMove(moves, null);

    expect(result).toEqual({
      piece: { x: 0, y: 0 },
      target: step.to,
    });
  });

  it('returns null when capture options are empty for the selected piece', () => {
    const moves = createMoveSet();
    const captureKey = positionKey.get({ x: 4, y: 4 });
    moves.captures.set(captureKey, []);

    expect(pickAiMove(moves, null)).toBeNull();
  });

  it('returns null when there are no available moves', () => {
    expect(pickAiMove(createMoveSet(), null)).toBeNull();
  });
});
