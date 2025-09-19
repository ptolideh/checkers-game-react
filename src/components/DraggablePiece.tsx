import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import type { Piece, Position } from '@/store/game-logic/types';
import { positionKey } from '@/store/game-logic/utils';
import { CheckersPiece, type CheckersPieceProps } from './CheckersPiece';

interface DraggablePieceProps extends CheckersPieceProps {
  dragDisabled?: boolean;
}

export const DraggablePiece: React.FC<DraggablePieceProps> = ({
  x,
  y,
  color,
  isKing,
  isSelected,
  isDisabled,
  isDimmed,
  isInteractive,
  dragDisabled,
  onSelect,
}) => {
  const draggableDisabled = dragDisabled ?? isDisabled;
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: positionKey.get({ x, y }),
    data: { piece: { x, y, color, isKing } },
    disabled: draggableDisabled,
  });

  const style: React.CSSProperties = {
    transform: transform ? CSS.Translate.toString(transform) : undefined,
    touchAction: 'none',
    opacity: isDragging ? 0 : undefined,
  };

  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
      <CheckersPiece
        x={x}
        y={y}
        color={color}
        isKing={isKing}
        isSelected={isSelected}
        isDisabled={isDisabled}
        isDimmed={isDimmed}
        isInteractive={isInteractive}
        onSelect={onSelect}
        isDragging={isDragging}
      />
    </div>
  );
};
