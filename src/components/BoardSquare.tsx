import React from 'react';
import { cn } from '@/lib/utils';
import type { Position } from '@/store/game-logic/types';
import { isDarkSquare } from '@/store/game-logic/rules';

export interface BoardSquareProps {
  x: number;
  y: number;
  isTarget: boolean;
  isDisabled: boolean;
  onSquareSelect: (position: Position) => void;
  children?: React.ReactNode;
}

export const BoardSquare = React.memo<BoardSquareProps>(
  ({ x, y, isTarget, isDisabled, onSquareSelect, children }) => {
    const position = { x, y };

    const handleClick = React.useCallback(() => {
      !isDisabled && onSquareSelect(position);
    }, [onSquareSelect, position, isDisabled]);

    return (
      <div
        className={cn(
          'border border-l-black border-r-black size-10 flex justify-center items-center',
          isDarkSquare(position) ? 'bg-orange-900' : 'bg-orange-100',
          { 'bg-green-300': isTarget },
          { 'cursor-pointer': !isDisabled },
        )}
        onClick={handleClick}
      >
        {children}
      </div>
    );
  },
);

BoardSquare.displayName = 'BoardSquare';
