import React from 'react';
import type { Color, Position } from '@/game-logic/types';
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
  isDragging?: boolean;
  onSelect?: (position: Position) => void;
}

const CheckersPiece = React.memo<CheckersPieceProps>(
  ({
    x,
    y,
    color,
    isKing,
    isSelected,
    isDisabled,
    isDimmed,
    isInteractive,
    isDragging,
    onSelect,
  }) => {
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
          'rounded-full flex justify-center items-center opacity-100 ring-1 transition-[opacity,box-shadow] duration-400ms ease-in-out ',
          'size-6.5 sm:size-9',
          color === 'dark' ? 'bg-gray-900 ring-gray-950' : 'bg-red-700 ring-red-800',
          onSelect && !isDisabled ? 'cursor-pointer' : '',
          isDimmed ? 'opacity-60' : '',
          isInteractive ? (color === 'dark' ? 'ring-1 ring-gray-300' : 'ring-1 ring-red-200') : '',
          isSelected ? 'ring-2 ring-green-300' : '',
          isDragging === false ? '' : 'transform scale-130 drop-shadow-xl drop-shadow-black/70',
        )}
        onClick={handleClick}
      >
        <div
          className={cn(
            'flex items-center justify-center rounded-full relative drop-shadow-md',
            'size-5 sm:size-6',
            color === 'dark' ? 'bg-gray-800' : 'bg-red-600',
            isKing ? (color === 'dark' ? 'bg-gray-900' : 'bg-red-900') : '',
          )}
        >
          {isKing ? (
            <span className="inline-block absolute text-[0.8rem] sm:text-[1rem] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
              👑
            </span>
          ) : null}
        </div>
      </div>
    );
  },
);

export type { CheckersPieceProps };
export { CheckersPiece };
