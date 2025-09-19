import React from 'react';
import type { Color, GameMode, Stats, Winner } from '@/store/game-logic/types';
import { GameModes, PieceColor } from '@/store/game-logic/rules';

interface GameStatsProps {
  mode: GameMode;
  currentPlayer: Color;
  stats: Stats;
  winner: Winner;
}

const formatModeLabel = (mode: GameMode) => {
  return mode === GameModes.PlayerVsPlayer
    ? 'Multiplayer (Player vs Player)'
    : 'Single Player (Player vs Computer)';
};

const formatPlayerName = (color: Color) => {
  return color === PieceColor.light ? 'Red' : 'Black';
};

const formatWinnerMessage = (winner: Winner) => {
  if (winner === null) return null;
  if (winner === 'draw') return 'The game ended in a draw. Great match!';
  return `${formatPlayerName(winner)} wins the game!`;
};

export const GameStats: React.FC<GameStatsProps> = ({ mode, currentPlayer, stats, winner }) => {
  const winnerMessage = formatWinnerMessage(winner);

  return (
    <>
      <span className="mr-3">Mode: {formatModeLabel(mode)}</span>
      {winnerMessage ? (
        <span className="mr-3 font-semibold text-green-700">{winnerMessage}</span>
      ) : (
        <span className="mr-3">Current: {formatPlayerName(currentPlayer)}</span>
      )}
      <span className="mr-2">
        Red — Moves: {stats.light.moves}, Captures: {stats.light.captures}
      </span>
      <span>
        Black — Moves: {stats.dark.moves}, Captures: {stats.dark.captures}
      </span>
    </>
  );
};

GameStats.displayName = 'GameStats';
