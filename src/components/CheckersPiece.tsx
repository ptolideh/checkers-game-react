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

const colorVariants: Record<
  Color,
  {
    outer: string;
    interactiveRing: string;
    inner: string;
    king: string;
  }
> = {
  dark: {
    outer: 'bg-gray-900 ring-gray-950',
    interactiveRing: 'ring-1 ring-gray-300',
    inner: 'bg-gray-800',
    king: 'bg-gray-900',
  },
  light: {
    outer: 'bg-red-700 ring-red-800',
    interactiveRing: 'ring-1 ring-red-200',
    inner: 'bg-red-600',
    king: 'bg-red-900',
  },
};

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
    const colorStyles = colorVariants[color];
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
          colorStyles.outer,
          {
            'cursor-pointer': Boolean(onSelect) && !isDisabled,
            'opacity-60': isDimmed,
            [colorStyles.interactiveRing]: isInteractive,
            'ring-2 ring-green-300': isSelected,
            'transform scale-130 drop-shadow-xl drop-shadow-black/70': isDragging !== false,
          },
        )}
        onClick={handleClick}
      >
        <div
          className={cn(
            'flex items-center justify-center rounded-full relative drop-shadow-md',
            'size-5 sm:size-6',
            colorStyles.inner,
            { [colorStyles.king]: isKing },
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
