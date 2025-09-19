import React from 'react';
import type { Color, Position } from '@/store/game-logic/types';
import { cn } from '@/lib/utils';

interface CheckersPieceProps {
  x: number;
  y: number;
  color: Color;
  isKing: boolean;
  isSelected?: boolean;
  isDisabled?: boolean;
  onSelect?: (position: Position) => void;
}

export const CheckersPiece = React.memo<CheckersPieceProps>(
  ({ x, y, color, isKing, isSelected, isDisabled, onSelect }) => {
    const position = { x, y };
    const handleClick = React.useCallback(
      (event: React.MouseEvent<HTMLDivElement>) => {
        if (isDisabled) return;
        event.stopPropagation();
        onSelect?.(position);
      },
      [isDisabled, onSelect, position],
    );

    return (
      <div
        className={cn(
          'rounded-full size-6 flex justify-center items-center border-2',
          color === 'dark' ? 'bg-black border-black' : 'bg-red-600 border-red-600',
          isSelected ? 'ring-2 ring-green-400' : '',
          onSelect && !isDisabled ? 'cursor-pointer' : '',
          isDisabled ? 'opacity-70' : '',
        )}
        onClick={handleClick}
      >
        {isKing ? (
          <div className="flex items-center justify-center bg-yellow-400 size-3 rounded-full relative">
            <span className="absolute text-[0.5rem] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
              👑
            </span>
          </div>
        ) : null}
      </div>
    );
  },
);
