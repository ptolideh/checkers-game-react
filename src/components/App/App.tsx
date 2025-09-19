import React, { useReducer } from 'react';
import { BoardView } from '../BoardView';
import { GameModeSelection } from '../GameModeSelection';
import { GameStats } from '../GameStats';
import type { Position, GameMode, Piece } from '@/store/game-logic/types';
import {
  selectAllMovesPerTurn,
  selectMoveTargetsFor,
  selectInteractivityState,
} from '@/store/game-logic/engine';
import { gameReducer, initialGameState } from '@/store/game-logic/reducer';
import { useComputerTurn } from '@/hooks/useComputerTurn';

export const App: React.FC = () => {
  const [state, dispatch] = useReducer(gameReducer, initialGameState);

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

  const applyMove = React.useCallback(
    (position: Position) => {
      dispatch({ type: 'APPLY_MOVE', payload: position });
    },
    [dispatch],
  );

  useComputerTurn({
    state,
    onSelectPiece: selectPiece,
    onApplyMove: applyMove,
  });

  const handlePieceSelect = React.useCallback(
    (position: Position) => {
      dispatch({ type: 'SELECT_PIECE', payload: position });
    },
    [dispatch],
  );

  const handleSquareSelect = React.useCallback(
    (target: Position) => {
      dispatch({
        type: 'APPLY_MOVE',
        payload: target,
      });
    },
    [dispatch],
  );

  const handleModeSelect = React.useCallback(
    (mode: GameMode) => {
      dispatch({ type: 'SET_MODE', payload: mode });
    },
    [dispatch],
  );

  // Game mode selection
  if (!state.mode) {
    return (
      <div className="p-4">
        <h1 className="text-xl font-semibold mb-4">Checkers Game</h1>
        <GameModeSelection className="mt-2" onSelectMode={handleModeSelect} />
      </div>
    );
  }

  return (
    <div className="p-4">
      <h1 className="text-xl font-semibold mb-2">Checkers Game</h1>
      <div className="flex items-center gap-4 text-sm mb-4">
        <GameStats
          mode={state.mode}
          currentPlayer={state.currentPlayer}
          stats={state.stats}
          winner={state.winner}
        />
        <button
          className="ml-auto px-3 py-1 rounded border border-black hover:bg-gray-100"
          onClick={() => dispatch({ type: 'NEW_GAME' })}
        >
          {state.winner ? 'New Game' : 'Restart'}
        </button>
      </div>
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
