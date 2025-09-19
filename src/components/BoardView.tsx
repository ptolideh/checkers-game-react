import React from 'react';
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

interface BoardViewProps {
  board: Board;
  selectedPiece: Piece | null;
  moveTargets: MoveTargetKeys | null;
  currPlayerPieces: InteractiveState;
  onSquareSelect: (position: Position) => void;
  onPieceSelect: (position: Position) => void;
  winner: Winner;
}

export const BoardView: React.FC<BoardViewProps> = ({
  board,
  selectedPiece,
  moveTargets,
  currPlayerPieces,
  onSquareSelect,
  onPieceSelect,
  winner,
}) => {
  const isInteractive = !winner;

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

  const isPieceSelected = (piece: Piece) => {
    return piece ? !!selectedPiece && equals(piece, selectedPiece) : false;
  };

  return (
    <div
      className={cn('flex flex-col border border-black w-fit', {
        'pointer-events-none opacity-80': !isInteractive,
      })}
    >
      {board.map((row, rowIndex) => (
        <div key={rowIndex} className="flex border-t-black border-b-black items-center">
          {row.map((piece, columnIndex) => {
            const position = { x: columnIndex, y: rowIndex };
            const key = positionKey.get(position);

            return (
              <BoardSquare
                key={key}
                x={columnIndex}
                y={rowIndex}
                isTarget={isInMoveTargets(moveTargets, position)}
                isDisabled={isSquareDisabled(position)}
                onSquareSelect={onSquareSelect}
              >
                {piece ? (
                  <CheckersPiece
                    x={piece.x}
                    y={piece.y}
                    color={piece.color}
                    isKing={piece.isKing}
                    isSelected={isPieceSelected(piece)}
                    isDisabled={isPieceDisabled(position)}
                    onSelect={onPieceSelect}
                  />
                ) : null}
              </BoardSquare>
            );
          })}
        </div>
      ))}
    </div>
  );
};

BoardView.displayName = 'BoardView';
