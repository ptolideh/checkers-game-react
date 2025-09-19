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
          'border border-l-black border-r-black size-10 flex justify-center items-center transition-[background-color,box-shadow] duration-[250ms,200ms] ease-in-out',
          isDarkSquare(position) ? 'bg-green-800' : 'bg-orange-100',
          { 'bg-green-300 inset-ring-4 inset-ring-green-500': isTarget },
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
