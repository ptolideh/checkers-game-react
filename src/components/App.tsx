import React, { useReducer } from 'react';
import { BoardView } from './BoardView';
import { GameModeSelection } from './GameModeSelection';
import { GameStats } from './GameStats';
import type { Position, GameMode, Piece } from '@/game-logic/types';
import {
  selectAllMovesPerTurn,
  selectMoveTargetsFor,
  selectInteractivityState,
} from '@/game-logic/engine';
import { gameReducer, initialGameState } from '@/game-logic/reducer';
import { GameActions } from '@/game-logic/state.actions';
import { useComputerTurn } from '@/hooks/useComputerTurn';
import { Layout } from './Layout';
import { AI_PLAYER_COLOR, GameModes } from '@/game-logic/rules';

export const App: React.FC = () => {
  const [state, dispatch] = useReducer(gameReducer, initialGameState);

  const movesPerTurn = React.useMemo(() => {
    return selectAllMovesPerTurn(state);
  }, [state.board, state.currentPlayer, state.forcedCaptureKey]);

  const currPlayerPieces = React.useMemo(() => {
    return selectInteractivityState(state);
  }, [state.board, state.currentPlayer, state.forcedCaptureKey]);

  const isLocalPlayerTurn =
    state.mode !== GameModes.PlayerVsComputer || state.currentPlayer !== AI_PLAYER_COLOR;

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
      dispatch(GameActions.selectPiece(position));
    },
    [dispatch],
  );

  const applyMove = React.useCallback(
    (position: Position) => {
      dispatch(GameActions.applyMove(position));
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
      dispatch(GameActions.selectPiece(position));
    },
    [dispatch],
  );

  const handleSquareSelect = React.useCallback(
    (target: Position) => {
      dispatch(GameActions.applyMove(target));
    },
    [dispatch],
  );

  const handleModeSelect = React.useCallback(
    (mode: GameMode) => {
      dispatch(GameActions.setMode(mode));
    },
    [dispatch],
  );

  const handleNewGame = React.useCallback(() => {
    dispatch(GameActions.newGame());
  }, [dispatch]);

  // Game Mode Selection Screen
  if (!state.mode) {
    return (
      <Layout>
        <GameModeSelection onSelectMode={handleModeSelect} />
      </Layout>
    );
  }

  // Game Play Screen
  return (
    <Layout>
      <GameStats
        mode={state.mode}
        currentPlayer={state.currentPlayer}
        stats={state.stats}
        winner={state.winner}
      />
      <BoardView
        board={state.board}
        selectedPiece={state.selectedPiece}
        moveTargets={moveTargetsForSelection}
        currPlayerPieces={currPlayerPieces}
        isLocalPlayerTurn={isLocalPlayerTurn}
        onSquareSelect={handleSquareSelect}
        onPieceSelect={handlePieceSelect}
        winner={state.winner}
      />
      <button
        className="px-6 py-2 mt-4 rounded-2xl border-1 border-slate-400 text-slate-400 bg-transparent text-sm font-semibold  transition-colors duration-300 hover:bg-slate-200 hover:text-slate-900 hover:cursor-pointer"
        onClick={handleNewGame}
      >
        {state.winner ? 'New Game' : 'Restart'}
      </button>
    </Layout>
  );
};
