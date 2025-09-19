import type { Position, Board, GameState, Stats, GameMode } from '@/store/game-logic/types';
import { BOARD_SIZE, isStartingSquareFor, PieceColor } from '@/store/game-logic/rules';
import { equals, getPiece, positionKey } from '@/store/game-logic/utils';
import {
  applyCaptureMove,
  applySimpleMove,
  getNextPlayer,
  hasCaptures,
  selectAllMovesPerTurn,
  selectMoveTargetsFor,
  selectInteractivityState,
  isInMoveTargets,
  incrementStatsFor,
  evaluateWinner,
} from '@/store/game-logic/engine';

type GameAction =
  | { type: 'SELECT_PIECE'; payload: Position }
  | { type: 'DESELECT_PIECE'; payload: Position }
  | { type: 'APPLY_MOVE'; payload: Position }
  | { type: 'SET_MODE'; payload: GameMode }
  | { type: 'NEW_GAME' };

const createInitialGameState = (overrides: Partial<GameState> = {}): GameState => {
  const board: Board = Array.from({ length: BOARD_SIZE }, () =>
    Array.from({ length: BOARD_SIZE }, () => null),
  );

  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      const square = { x: col, y: row };
      if (isStartingSquareFor.dark(square)) {
        board[row][col] = {
          x: col,
          y: row,
          color: PieceColor.dark,
          isKing: false,
        };
      }

      if (isStartingSquareFor.light(square)) {
        board[row][col] = {
          x: col,
          y: row,
          color: PieceColor.light,
          isKing: false,
        };
      }
    }
  }

  const defaultStats = {
    [PieceColor.dark]: { moves: 0, captures: 0 },
    [PieceColor.light]: { moves: 0, captures: 0 },
  } as Stats;

  return {
    selectedPiece: null,
    mode: null,
    currentPlayer: PieceColor.dark,
    winner: null,
    forcedCaptureKey: null,
    ...overrides,
    board: overrides.board ?? board,
    stats: overrides.stats ?? defaultStats,
  };
};

const initialGameState: GameState = createInitialGameState();

function gameReducer(state: GameState, action: GameAction): GameState {
  if (state.winner && action.type !== 'NEW_GAME') {
    return state;
  }

  switch (action.type) {
    case 'SELECT_PIECE': {
      const { x, y } = action.payload;
      const matchingPiece = getPiece(state.board, { x, y });
      const activePlayerPieces = selectInteractivityState(state);
      const pieceKey = positionKey.get({ x, y });
      if (matchingPiece && activePlayerPieces.selectable.has(pieceKey)) {
        return {
          ...state,
          selectedPiece: { ...matchingPiece },
        };
      } else {
        return state;
      }
    }

    case 'DESELECT_PIECE': {
      if (state.forcedCaptureKey && state.selectedPiece) {
        const selectedKey = positionKey.get(state.selectedPiece);
        if (selectedKey === state.forcedCaptureKey) {
          return state;
        }
      }
      if (state.selectedPiece && action.payload && equals(state.selectedPiece, action.payload)) {
        return {
          ...state,
          selectedPiece: null,
        };
      }
      return state;
    }

    case 'APPLY_MOVE': {
      if (!state.selectedPiece) return state;
      const moves = selectAllMovesPerTurn(state);
      const mustCapture = hasCaptures(moves);
      const moveTargetsForSelection = selectMoveTargetsFor(state.selectedPiece, moves);
      if (!isInMoveTargets(moveTargetsForSelection, action.payload)) return state;

      if (mustCapture) {
        const res = applyCaptureMove(state.board, moves, state.selectedPiece, action.payload);
        if (!res) return state;

        let nextState = {
          ...state,
          board: res.newBoard,
        };

        const winner = evaluateWinner(nextState);

        if (winner) {
          return {
            ...nextState,
            selectedPiece: null,
            forcedCaptureKey: null,
            currentPlayer: state.currentPlayer,
            stats: incrementStatsFor(state.stats, state.currentPlayer, { moves: 1, captures: 1 }),
            winner,
          };
        }

        const destinationKey = positionKey.get(res.destination);
        const pieceAtDestination = getPiece(res.newBoard, res.destination);
        const subsequentCaptures = selectAllMovesPerTurn(nextState).captures.get(destinationKey);

        if (subsequentCaptures && subsequentCaptures.length > 0 && pieceAtDestination) {
          return {
            ...nextState,
            stats: incrementStatsFor(state.stats, state.currentPlayer, { captures: 1 }),
            selectedPiece: { ...pieceAtDestination },
            forcedCaptureKey: destinationKey,
            currentPlayer: state.currentPlayer,
          };
        } else {
          return {
            ...nextState,
            selectedPiece: null,
            forcedCaptureKey: null,
            currentPlayer: getNextPlayer(state.currentPlayer),
            stats: incrementStatsFor(state.stats, state.currentPlayer, {
              moves: 1,
              captures: 1,
            }),
          };
        }
      }

      const res = applySimpleMove(state.board, moves, state.selectedPiece, action.payload);
      if (!res) return state;
      const nextState = {
        ...state,
        board: res.newBoard,
        selectedPiece: null,
        forcedCaptureKey: null,
        stats: incrementStatsFor(state.stats, state.currentPlayer, { moves: 1 }),
      };

      const winner = evaluateWinner(nextState);
      if (winner) {
        return {
          ...nextState,
          winner,
        };
      }

      return {
        ...nextState,
        currentPlayer: getNextPlayer(state.currentPlayer),
      };
    }

    case 'SET_MODE': {
      return {
        ...state,
        mode: action.payload,
        forcedCaptureKey: null,
      };
    }

    case 'NEW_GAME': {
      return createInitialGameState({ mode: null });
    }

    default:
      return state;
  }
}

export type { GameAction };
export { gameReducer, initialGameState };
