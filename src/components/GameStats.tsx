import React from 'react';
import type { Color, GameMode, Stats, Winner } from '@/game-logic/types';
import { GameModes, PieceColor } from '@/game-logic/rules';
import { StatCard } from '@/components/StatCard';
import { cn } from '@/lib/utils';

interface GameStatsProps {
  mode: GameMode;
  currentPlayer: Color;
  stats: Stats;
  winner: Winner;
}

const formatModeLabel = (mode: GameMode) => {
  return mode === GameModes.PlayerVsPlayer ? '👥 Two Players' : '🤖 Single Player';
};

const formatPlayerName = (color: Color) => {
  return color === PieceColor.light ? 'Red' : 'Black';
};

const formatWinnerMessage = (winner: Winner) => {
  if (winner === null) return null;
  if (winner === 'draw') return 'The game ended in a draw. Great match!';
  return `${formatPlayerName(winner)} wins the game!`;
};

const GameStats: React.FC<GameStatsProps> = ({ mode, currentPlayer, stats, winner }) => {
  const winnerMessage = formatWinnerMessage(winner);

  const isActive = (color: Color) => {
    if (winner === 'draw') return false;
    if (winner && winner !== color) return false;
    if (winner && winner === color) return true;
    return currentPlayer === color;
  };

  return (
    <div className="w-full flex flex-col gap-5 px-3 justify-center items-center select-none">
      <div className="flex flex-col items-center">
        <h2 className={cn('text-slate-200 text-sm opacity-50', { 'text-xs': !!winner })}>
          {formatModeLabel(mode)}
        </h2>
        {winnerMessage ? (
          <h2 className="font-semibold text-green-400 text-lg">{winnerMessage}</h2>
        ) : null}
      </div>
      <div className="flex gap-3 w-full">
        <StatCard
          color={PieceColor.light}
          label={`${formatPlayerName(PieceColor.light)}`}
          moves={stats.light.moves}
          captures={stats.light.captures}
          isActive={isActive(PieceColor.light)}
        />
        <StatCard
          color={PieceColor.dark}
          label={`${formatPlayerName(PieceColor.dark)}`}
          moves={stats.dark.moves}
          captures={stats.dark.captures}
          isActive={isActive(PieceColor.dark)}
        />
      </div>
    </div>
  );
};

export { GameStats };
