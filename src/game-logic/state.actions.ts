import type { GameMode, Position } from './types';

const GameActionType = {
  SELECT_PIECE: 'SELECT_PIECE',
  DESELECT_PIECE: 'DESELECT_PIECE',
  APPLY_MOVE: 'APPLY_MOVE',
  SET_MODE: 'SET_MODE',
  NEW_GAME: 'NEW_GAME',
} as const;

const selectPiece = (position: Position) => ({
  type: GameActionType.SELECT_PIECE,
  payload: position,
});

const deselectPiece = (position: Position) => ({
  type: GameActionType.DESELECT_PIECE,
  payload: position,
});

const applyMove = (position: Position) => ({
  type: GameActionType.APPLY_MOVE,
  payload: position,
});

const setMode = (mode: GameMode) => ({
  type: GameActionType.SET_MODE,
  payload: mode,
});

const newGame = () => ({
  type: GameActionType.NEW_GAME,
});

const GameActions = {
  selectPiece,
  deselectPiece,
  applyMove,
  setMode,
  newGame,
} as const;

type GameAction = ReturnType<(typeof GameActions)[keyof typeof GameActions]>;

export { GameActionType, GameActions };
export type { GameAction };
