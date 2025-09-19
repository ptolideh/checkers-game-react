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
  isDimmed?: boolean;
  isInteractive?: boolean;
  onSelect?: (position: Position) => void;
}

export const CheckersPiece = React.memo<CheckersPieceProps>(
  ({ x, y, color, isKing, isSelected, isDisabled, isDimmed, isInteractive, onSelect }) => {
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
          'rounded-full size-6 flex justify-center items-center opacity-100 ring-1 transition-[opacity,box-shadow] duration-400 ease-in-out ',
          color === 'dark' ? 'bg-gray-900 ring-gray-950' : 'bg-red-700 ring-red-800',
          onSelect && !isDisabled ? 'cursor-pointer' : '',
          isDimmed ? 'opacity-50' : '',
          isInteractive ? (color === 'dark' ? 'ring-2 ring-gray-300' : 'ring-2 ring-red-200') : '',
          isSelected ? 'ring-2 ring-green-400' : '',
        )}
        onClick={handleClick}
      >
        <div
          className={cn(
            'flex items-center justify-center size-4.5 rounded-full relative drop-shadow-md',
            color === 'dark' ? 'bg-gray-800' : 'bg-red-600',
            isKing ? (color === 'dark' ? 'bg-gray-900' : 'bg-red-900') : '',
          )}
        >
          {isKing ? (
            <span className="absolute text-[0.7rem] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
              👑
            </span>
          ) : null}
        </div>
      </div>
    );
  },
);
