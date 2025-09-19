import React, { useReducer } from 'react';
import { BoardView } from '../BoardView';
import type { Position, Board, GameState, Stats, GameMode, Piece } from '@/store/game-logic/types';
import { BOARD_SIZE, isStartingSquareFor, PieceColor, GameModes } from '@/store/game-logic/rules';
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
import { useComputerTurn } from '@/hooks/useComputerTurn';

type Action =
  | { type: 'SELECT_PIECE'; payload: Position }
  | { type: 'DESELECT_PIECE'; payload: Position }
  | { type: 'APPLY_MOVE'; payload: Position }
  | { type: 'SET_MODE'; payload: GameMode }
  | { type: 'NEW_GAME' };

type InitialGameStateOverrides = Partial<Omit<GameState, 'board' | 'stats'>> & {
  board?: Board;
  stats?: Stats;
};

const createInitialGameState = (overrides: InitialGameStateOverrides = {}): GameState => {
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

const initialState: GameState = createInitialGameState();

function reducer(state: GameState, action: Action): GameState {
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

export const App: React.FC = () => {
  const [state, dispatch] = useReducer(reducer, initialState);
  const movesPerTurn = React.useMemo(() => {
    return selectAllMovesPerTurn(state);
  }, [state.board, state.currentPlayer, state.forcedCaptureKey]);

  const currPlayerPieces = React.useMemo(() => {
    return selectInteractivityState(state);
  }, [state.board, state.currentPlayer, state.forcedCaptureKey]);

  const selectTargetsForPiece = React.useCallback(
    (piece: Piece | null) => {
      if (!piece) return null;
      return selectMoveTargetsFor(piece, movesPerTurn);
    },
    [movesPerTurn],
  );

  const moveTargetsForSelection = React.useMemo(() => {
    return selectTargetsForPiece(state.selectedPiece);
  }, [selectTargetsForPiece, state.selectedPiece]);

  const selectPiece = React.useCallback(
    (position: Position) => {
      dispatch({ type: 'SELECT_PIECE', payload: position });
    },
    [dispatch],
  );

  const applyMove = React.useCallback((position: Position) => {
    dispatch({ type: 'APPLY_MOVE', payload: position });
  }, []);

  useComputerTurn({
    state,
    onSelectPiece: selectPiece,
    onApplyMove: applyMove,
  });

  const handlePieceSelect = React.useCallback((position: Position) => {
    dispatch({ type: 'SELECT_PIECE', payload: position });
  }, []);

  const handleSquareSelect = React.useCallback(
    (target: Position) => {
      dispatch({
        type: 'APPLY_MOVE',
        payload: target,
      });
    },
    [dispatch],
  );

  // Game mode selection
  if (!state.mode) {
    return (
      <div className="p-4">
        <h1 className="text-xl font-semibold mb-4">Checkers Game</h1>
        <p className="mb-2">Choose a mode to start:</p>
        <div className="flex gap-2">
          <button
            className="px-3 py-1 rounded border border-black hover:bg-gray-100"
            onClick={() => dispatch({ type: 'SET_MODE', payload: GameModes.PlayerVsPlayer })}
          >
            Two Players (PvP)
          </button>
          <button
            className="px-3 py-1 rounded border border-black hover:bg-gray-100"
            onClick={() => dispatch({ type: 'SET_MODE', payload: GameModes.PlayerVsComputer })}
          >
            Single Player (PvC)
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h1 className="text-xl font-semibold mb-2">Checkers Game</h1>
      <div className="flex items-center gap-4 text-sm mb-4">
        <span className="mr-3">
          Mode:{' '}
          {state.mode === GameModes.PlayerVsPlayer
            ? 'Multiplayer (Player vs Player)'
            : 'Single Player (Player vs Computer)'}
        </span>
        <span className="mr-3">
          Current: {state.currentPlayer === PieceColor.light ? 'Red' : 'Black'}
        </span>
        <span className="mr-2">
          Red — Moves: {state.stats.light.moves}, Captures: {state.stats.light.captures}
        </span>
        <span>
          Black — Moves: {state.stats.dark.moves}, Captures: {state.stats.dark.captures}
        </span>
        <button
          className="ml-auto px-3 py-1 rounded border border-black hover:bg-gray-100"
          onClick={() => dispatch({ type: 'NEW_GAME' })}
        >
          {state.winner ? 'New Game' : 'Restart'}
        </button>
      </div>
      {state.winner && (
        <div className="mb-4 p-3 border border-green-700 bg-green-100 text-green-900 rounded">
          {state.winner === 'draw'
            ? 'The game ended in a draw. Great match!'
            : `${state.winner === PieceColor.light ? 'Red' : 'Black'} wins the game!`}
        </div>
      )}
      <BoardView
        board={state.board}
        selectedPiece={state.selectedPiece}
        moveTargets={moveTargetsForSelection}
        currPlayerPieces={currPlayerPieces}
        onSquareSelect={handleSquareSelect}
        onPieceSelect={handlePieceSelect}
        winner={state.winner}
      />
    </div>
  );
};
