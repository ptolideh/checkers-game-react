import React from 'react';
import { DndContext, DragOverlay, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import type { DragCancelEvent, DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import { cn } from '@/lib/utils';
import type {
  Board,
  InteractiveState,
  MoveTargetKeys,
  Piece,
  Position,
  Winner,
} from '@/store/game-logic/types';
import { isInMoveTargets } from '@/store/game-logic/engine';
import { equals, positionKey } from '@/store/game-logic/utils';
import { BoardSquare } from './BoardSquare';
import { CheckersPiece } from './CheckersPiece';
import { DraggablePiece } from './DraggablePiece';

interface BoardViewProps {
  board: Board;
  selectedPiece: Piece | null;
  moveTargets: MoveTargetKeys | null;
  currPlayerPieces: InteractiveState;
  onSquareSelect: (position: Position) => void;
  onPieceSelect: (position: Position) => void;
  winner: Winner;
}

const BoardView: React.FC<BoardViewProps> = ({
  board,
  selectedPiece,
  moveTargets,
  currPlayerPieces,
  onSquareSelect,
  onPieceSelect,
  winner,
}) => {
  const isInteractive = !winner;

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 4 },
    }),
  );

  const [activePiece, setActivePiece] = React.useState<Piece | null>(null);

  const isSquareDisabled = (position: Position) => {
    if (!isInteractive) return true;
    if (!isInMoveTargets(moveTargets, position)) return true;
    return false;
  };

  const isPieceDisabled = (position: Position) => {
    if (!isInteractive) return true;
    const key = positionKey.get(position);
    if (!currPlayerPieces.selectable.has(key)) return true;
    return false;
  };

  const handleDragStart = React.useCallback(
    (event: DragStartEvent) => {
      if (!isInteractive) return;
      const piece = event.active.data.current?.piece as Piece | undefined;
      if (!piece) return;
      const { x, y } = piece;

      setActivePiece(piece);
      onPieceSelect({ x, y });
    },
    [isInteractive, onPieceSelect],
  );

  const handleDragEnd = React.useCallback(
    (event: DragEndEvent) => {
      setActivePiece(null);
      const overId = event.over?.id;
      const piece = event.active.data.current?.piece as Piece | undefined;
      if (!isInteractive || !piece) return;
      if (!overId) return;
      const targetPosition = positionKey.parse(String(overId));
      if (!isInMoveTargets(moveTargets, targetPosition)) return;
      onSquareSelect(targetPosition);
    },
    [isInteractive, moveTargets, onSquareSelect],
  );

  const handleDragCancel = React.useCallback((_event: DragCancelEvent) => {
    setActivePiece(null);
  }, []);

  const overlayIsSelected =
    activePiece && selectedPiece ? equals(activePiece, selectedPiece) : false;

  const frameStyle = [
    'rounded-2xl border-16 border-orange-950',
    'bg-gradient-to-br from-[#5c3b20] via-[#4b2e14] to-[#2e1b0a]',
    'shadow-[0_6px_0_#2f1d0f,0_10px_0_#1d1109,0_18px_24px_rgba(0,0,0,0.55)]',
  ];

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div
        className={cn('relative flex flex-col w-fit overflow-hidden', frameStyle, {
          'pointer-events-none opacity-80': !isInteractive,
        })}
      >
        {board.map((row, rowIndex) => (
          <div key={rowIndex} className="flex border-t-gray-800 border-b-gray-800 items-center">
            {row.map((piece, columnIndex) => {
              const position = { x: columnIndex, y: rowIndex };
              const key = positionKey.get(position);
              const isTarget = isInMoveTargets(moveTargets, position);
              const squareDisabled = isSquareDisabled(position);

              let pieceNode: React.ReactNode = null;
              if (piece) {
                const pieceDisabled = isPieceDisabled(piece);
                const pieceInteractive = currPlayerPieces.selectable.has(key);
                const pieceDimmed = currPlayerPieces.disabled.has(key);
                const pieceSelected = !!selectedPiece && equals(piece, selectedPiece);

                pieceNode = (
                  <DraggablePiece
                    x={piece.x}
                    y={piece.y}
                    color={piece.color}
                    isKing={piece.isKing}
                    isSelected={pieceSelected}
                    isDisabled={pieceDisabled}
                    isDimmed={pieceDimmed}
                    isInteractive={pieceInteractive}
                    dragDisabled={!isInteractive || pieceDisabled}
                    onSelect={onPieceSelect}
                  />
                );
              }

              return (
                <BoardSquare
                  key={key}
                  x={columnIndex}
                  y={rowIndex}
                  isTarget={isTarget}
                  isDisabled={squareDisabled}
                  onSquareSelect={onSquareSelect}
                  droppableId={key}
                  dropDisabled={squareDisabled}
                >
                  {pieceNode}
                </BoardSquare>
              );
            })}
          </div>
        ))}
      </div>
      <DragOverlay dropAnimation={null}>
        {activePiece ? (
          <CheckersPiece
            x={activePiece.x}
            y={activePiece.y}
            color={activePiece.color}
            isKing={activePiece.isKing}
            isSelected={overlayIsSelected}
            isInteractive
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};

export { BoardView };
