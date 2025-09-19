import { describe, expect, it } from 'vitest';
import { GameActions, GameActionType } from '@/game-logic/state.actions';
import { GameModes } from '@/game-logic/rules';

const samplePosition = { x: 2, y: 3 } as const;

describe('GameActions', () => {
  it('selectPiece returns the expected action payload', () => {
    const action = GameActions.selectPiece(samplePosition);

    expect(action).toStrictEqual({
      type: GameActionType.SELECT_PIECE,
      payload: samplePosition,
    });
  });

  it('deselectPiece returns the expected action payload', () => {
    const action = GameActions.deselectPiece(samplePosition);

    expect(action).toStrictEqual({
      type: GameActionType.DESELECT_PIECE,
      payload: samplePosition,
    });
  });

  it('applyMove returns the expected action payload', () => {
    const action = GameActions.applyMove(samplePosition);

    expect(action).toStrictEqual({
      type: GameActionType.APPLY_MOVE,
      payload: samplePosition,
    });
  });

  it('setMode returns the expected action payload', () => {
    const action = GameActions.setMode(GameModes.PlayerVsComputer);

    expect(action).toStrictEqual({
      type: GameActionType.SET_MODE,
      payload: GameModes.PlayerVsComputer,
    });
  });

  it('newGame returns the expected action and no payload', () => {
    const action = GameActions.newGame();

    expect(action).toStrictEqual({ type: GameActionType.NEW_GAME });
  });
});
