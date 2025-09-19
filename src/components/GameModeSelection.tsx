import React from 'react';
import { cn } from '@/lib/utils';
import type { GameMode } from '@/store/game-logic/types';
import { GameModes } from '@/store/game-logic/rules';

interface GameModeSelectionProps {
  onSelectMode: (mode: GameMode) => void;
  className?: string;
}

export const GameModeSelection: React.FC<GameModeSelectionProps> = ({
  onSelectMode,
  className,
}) => {
  const handleSelectMode = React.useCallback(
    (mode: GameMode) => () => {
      onSelectMode(mode);
    },
    [onSelectMode],
  );

  return (
    <div className={cn('space-y-4', className)}>
      <p className="text-sm">Choose a mode to start:</p>
      <div className="flex gap-2">
        <button
          className="px-3 py-1 rounded border border-black hover:bg-gray-100"
          onClick={handleSelectMode(GameModes.PlayerVsPlayer)}
        >
          Two Players (PvP)
        </button>
        <button
          className="px-3 py-1 rounded border border-black hover:bg-gray-100"
          onClick={handleSelectMode(GameModes.PlayerVsComputer)}
        >
          Single Player (PvC)
        </button>
      </div>
    </div>
  );
};

GameModeSelection.displayName = 'GameModeSelection';
