import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { cn } from '@/lib/utils';
import type { Position } from '@/game-logic/types';
import { isDarkSquare } from '@/game-logic/rules';

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

// Renders each square on the board
// Handles movement target selection and drops
const BoardSquare = React.memo<BoardSquareProps>(
  ({ x, y, isTarget, isDisabled, onSquareSelect, droppableId, dropDisabled = false, children }) => {
    const position = { x, y };

    const { setNodeRef, isOver } = useDroppable({
      id: droppableId,
      disabled: dropDisabled,
      data: { position },
    });

    const handleClick = React.useCallback(() => {
      !isDisabled && onSquareSelect(position);
    }, [onSquareSelect, position, isDisabled]);

    return (
      <div
        className={cn(
          'border border-l-gray-800 border-r-gray-800  flex justify-center items-center transition-[background-color,box-shadow] duration-[400ms,300ms] ease-in-out',
          'size-10 sm:size-13',
          isDarkSquare(position) ? 'bg-green-800' : 'bg-orange-100',
          {
            'bg-yellow-300 inset-ring-4 inset-ring-yellow-500': isTarget,
            'cursor-pointer': !isDisabled,
            'inset-ring-10 duration-500': isOver && !dropDisabled,
          },
        )}
        ref={setNodeRef}
        onClick={handleClick}
        role="gridcell"
        aria-label={`Square ${y + 1}, ${x + 1}`}
        aria-disabled={isDisabled}
        aria-selected={isTarget}
        aria-rowindex={y + 1}
        aria-colindex={x + 1}
      >
        {children}
      </div>
    );
  },
);

export { BoardSquare };
