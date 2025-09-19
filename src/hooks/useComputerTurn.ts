import React from 'react';
import { pickAiMove } from '@/game-logic/ai-player';
import { AI_PLAYER_COLOR, GameModes } from '@/game-logic/rules';
import type { GameState, Position } from '@/game-logic/types';
import { selectAllMovesPerTurn } from '@/game-logic/engine';

interface UseComputerTurnArgs {
  state: GameState;
  onSelectPiece(position: Position): void;
  onApplyMove(position: Position): void;
}

// Hook for interfacing ai game logic with react render lifecycle & game state
const useComputerTurn = ({ state, onSelectPiece, onApplyMove }: UseComputerTurnArgs) => {
  const aiTurnTimerRef = React.useRef<number | null>(null);

  const clearAiTurnTimer = React.useCallback(() => {
    if (aiTurnTimerRef.current !== null) {
      window.clearTimeout(aiTurnTimerRef.current);
      aiTurnTimerRef.current = null;
    }
  }, []);

  const isComputerTurn =
    state.mode === GameModes.PlayerVsComputer &&
    !state.winner &&
    state.currentPlayer === AI_PLAYER_COLOR;

  // Watch for game state changes, so when it becomes the ai's turn,
  // 1. pick a move randomly
  // 2. Immediately select the piece for that move so it's highlighted
  // 3. Finally induce a 1 second artificial delay before applying the move
  React.useEffect(() => {
    if (!isComputerTurn) {
      clearAiTurnTimer();
      return;
    }

    const movesPerTurn = selectAllMovesPerTurn(state);
    const aiMove = pickAiMove(movesPerTurn, state.forcedCaptureKey);

    if (!aiMove) return;

    onSelectPiece(aiMove.piece);

    aiTurnTimerRef.current = window.setTimeout(() => {
      onApplyMove(aiMove.target);
      aiTurnTimerRef.current = null;
    }, 1000);

    return clearAiTurnTimer;
  }, [clearAiTurnTimer, isComputerTurn, onApplyMove, onSelectPiece, state.forcedCaptureKey]);
};

export { useComputerTurn };
