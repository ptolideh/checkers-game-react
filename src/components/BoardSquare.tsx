import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { cn } from '@/lib/utils';
import type { Position } from '@/store/game-logic/types';
import { isDarkSquare } from '@/store/game-logic/rules';

export interface BoardSquareProps {
  x: number;
  y: number;
  isTarget: boolean;
  isDisabled: boolean;
  onSquareSelect: (position: Position) => void;
  droppableId: string;
  dropDisabled?: boolean;
  children?: React.ReactNode;
}

export const BoardSquare = React.memo<BoardSquareProps>(
  ({ x, y, isTarget, isDisabled, onSquareSelect, droppableId, dropDisabled = false, children }) => {
    const position = { x, y };

    const handleClick = React.useCallback(() => {
      !isDisabled && onSquareSelect(position);
    }, [onSquareSelect, position, isDisabled]);

    const { setNodeRef, isOver } = useDroppable({
      id: droppableId,
      disabled: dropDisabled,
      data: { position },
    });

    return (
      <div
        className={cn(
          'border border-l-gray-800 border-r-gray-800  flex justify-center items-center transition-[background-color,box-shadow] duration-[400ms,300ms] ease-in-out',
          'size-10 sm:size-13',
          isDarkSquare(position) ? 'bg-green-800' : 'bg-orange-100',
          { 'bg-yellow-300 inset-ring-4 inset-ring-yellow-500': isTarget },
          { 'cursor-pointer': !isDisabled },
          { 'inset-ring-10 duration-500': isOver && !dropDisabled },
        )}
        ref={setNodeRef}
        onClick={handleClick}
      >
        {children}
      </div>
    );
  },
);

BoardSquare.displayName = 'BoardSquare';
