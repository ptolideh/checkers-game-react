import React from 'react';
import type { GameMode } from '@/store/game-logic/types';
import { GameModes } from '@/store/game-logic/rules';

interface GameModeButtonProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}

const GameModeButton: React.FC<GameModeButtonProps> = ({ icon, label, onClick }) => (
  <button
    className="flex flex-col gap-2 justify-center items-center px-4 py-8 w-full sm:w-1/2 transition-all rounded-3xl drop-shadow-xl drop-shadow-slate-800 border border-slate-950 bg-slate-800 hover:bg-slate-900  hover:cursor-pointer  focus-visible:outline-offset-2 focus-visible:outline-slate-200"
    onClick={onClick}
  >
    <span className="text-3xl" aria-hidden>
      {icon}
    </span>
    <span>{label}</span>
  </button>
);

interface GameModeSelectionProps {
  onSelectMode: (mode: GameMode) => void;
}

const GameModeSelection: React.FC<GameModeSelectionProps> = ({ onSelectMode }) => {
  const handleSelectMode = React.useCallback(
    (mode: GameMode) => () => {
      onSelectMode(mode);
    },
    [onSelectMode],
  );

  return (
    <div className="flex flex-col justify-center items-center h-full w-full gap-10 px-4">
      <p className="text-md text-slate-300 text-center select-none">
        Choose a mode to start playing
      </p>
      <div className="flex flex-col sm:flex-row gap-6 sm:gap-10 justify-center items-center w-full text-white font-bold tracking-wider">
        <GameModeButton
          icon="👥"
          label="Two Players"
          onClick={handleSelectMode(GameModes.PlayerVsPlayer)}
        />
        <GameModeButton
          icon="🤖"
          label="Single Player"
          onClick={handleSelectMode(GameModes.PlayerVsComputer)}
        />
      </div>
    </div>
  );
};

export { GameModeSelection };
