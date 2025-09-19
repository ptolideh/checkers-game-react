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
  onRestart: () => void;
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

const GameStats: React.FC<GameStatsProps> = ({ mode, currentPlayer, stats, winner, onRestart }) => {
  const winnerMessage = formatWinnerMessage(winner);
  const winnerMessageRef = React.useRef<HTMLHeadingElement | null>(null);
  const isGameOver = winner !== null;

  React.useEffect(() => {
    if (winnerMessage && winnerMessageRef.current) {
      winnerMessageRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [winnerMessage]);

  const isActive = (color: Color) => {
    if (winner === 'draw') return false;
    if (winner && winner !== color) return false;
    if (winner && winner === color) return true;
    return currentPlayer === color;
  };

  return (
    <section
      aria-label="Game status"
      className="w-full flex flex-col gap-5 px-3 justify-center items-center select-none"
    >
      <div className="flex w-full flex-wrap items-center justify-between gap-4 border-b border-slate-700 pb-4 mb-4">
        <div className="flex flex-col items-start">
          <h2 className={cn('text-slate-200 text-sm opacity-50', { 'text-xs': !!winner })}>
            {formatModeLabel(mode)}
          </h2>
          {winnerMessage ? (
            <h2
              ref={winnerMessageRef}
              className="font-semibold text-green-400 text-lg"
              role="status"
              aria-live="polite"
            >
              {winnerMessage}
            </h2>
          ) : null}
        </div>
        <button
          type="button"
          className="px-3 py-2 rounded-xl border border-slate-600 text-slate-300 bg-transparent text-sm font-semibold transition-colors duration-300 hover:bg-slate-200 hover:text-slate-900 hover:cursor-pointer flex-shrink-0"
          onClick={onRestart}
        >
          {isGameOver ? 'New Game' : 'Restart'}
        </button>
      </div>
      <div className="flex gap-3 w-full" role="list" aria-label="Player statistics">
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
    </section>
  );
};

export { GameStats };
