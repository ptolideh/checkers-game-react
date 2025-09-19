import { cn } from '@/lib/utils';
import React, { useReducer } from 'react';
import { CheckersPiece } from '../CheckersPiece';
import type { Position, Board, GameState, Stats } from '@/store/game-logic/types';
import { PieceColor } from '@/store/game-logic/rules';
import { equals, getPiece, isDarkSquare, positionKey } from '@/store/game-logic/utils';
import {
  applyCaptureMove,
  applySimpleMove,
  getNextPlayer,
  hasCaptures,
  selectAllMovesPerTurn,
  selectMoveTargetsFor,
  selectInteractivityState,
  isInMoveTargets,
  incrementStatsFor,
} from '@/store/game-logic/engine';

const BOARD_SIZE = 8;

enum SquareColor {
  dark = 'darkPiece',
  light = 'lightPiece',
}

type Square = Position & {
  color: SquareColor;
};

type Action =
  | { type: 'SELECT_PIECE'; payload: Position }
  | { type: 'DESELECT_PIECE'; payload: Position }
  | { type: 'APPLY_MOVE'; payload: Position }
  | { type: 'SET_MODE'; payload: 'pvp' | 'pvc' };

const getInitialBoardAndSquaresState = () => {
  const squares: Square[][] = Array.from({ length: BOARD_SIZE }, () =>
    Array.from({ length: BOARD_SIZE }, () => ({
      x: 0,
      y: 0,
      color: SquareColor.light,
    })),
  );

  const board: Board = Array.from({ length: squares.length }, () =>
    Array.from({ length: squares.length }, () => null),
  );

  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      const square = squares[row][col];
      square.x = col;
      square.y = row;
      if (isDarkSquare({ x: col, y: row })) {
        square.color = SquareColor.dark;
        if (row < 3) {
          board[row][col] = {
            x: col,
            y: row,
            color: PieceColor.light,
            isKing: false,
          };
        }
        if (row > 4) {
          board[row][col] = {
            x: col,
            y: row,
            color: PieceColor.dark,
            isKing: false,
          };
        }
      }
    }
  }
  return { board, squares };
};

const initialState: GameState = {
  ...getInitialBoardAndSquaresState(),
  selectedPiece: null,
  mode: null,
  currentPlayer: PieceColor.dark,
  winner: null,
  forcedCaptureKey: null,
  stats: {
    [PieceColor.dark]: { moves: 0, captures: 0 },
    [PieceColor.light]: { moves: 0, captures: 0 },
  } as Stats,
};

function reducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case 'SELECT_PIECE': {
      const { x, y } = action.payload;
      const matchingPiece = getPiece(state.board, { x, y });
      const activePlayerPieces = selectInteractivityState(state);
      const pieceKey = positionKey.get({ x, y });
      if (matchingPiece && activePlayerPieces.selectable.has(pieceKey)) {
        return {
          ...state,
          selectedPiece: { ...matchingPiece },
        };
      } else {
        return state;
      }
    }

    case 'DESELECT_PIECE': {
      if (state.forcedCaptureKey && state.selectedPiece) {
        const selectedKey = positionKey.get(state.selectedPiece);
        if (selectedKey === state.forcedCaptureKey) {
          return state;
        }
      }
      if (state.selectedPiece && action.payload && equals(state.selectedPiece, action.payload)) {
        return {
          ...state,
          selectedPiece: null,
        };
      }
      return state;
    }

    case 'APPLY_MOVE': {
      if (!state.selectedPiece) return state;
      const moves = selectAllMovesPerTurn(state);
      const mustCapture = hasCaptures(moves);
      const moveTargetsForSelection = selectMoveTargetsFor(state.selectedPiece, moves);
      if (!isInMoveTargets(moveTargetsForSelection, action.payload)) return state;

      if (mustCapture) {
        const res = applyCaptureMove(state.board, moves, state.selectedPiece, action.payload);
        if (!res) return state;
        const nextState = {
          ...state,
          board: res.newBoard,
        };

        // Check if the player has subsequent captures before updating board and switching players
        const destinationKey = positionKey.get(res.destination);
        const pieceAtDestination = getPiece(nextState.board, res.destination);
        const subsequentCaptures = selectAllMovesPerTurn(nextState).captures.get(destinationKey);

        // if the player has subsequent captures, keep the same player and lock the selection
        if (subsequentCaptures && subsequentCaptures.length > 0 && pieceAtDestination) {
          return {
            ...nextState,
            selectedPiece: { ...pieceAtDestination },
            forcedCaptureKey: destinationKey,
            currentPlayer: state.currentPlayer,
            stats: incrementStatsFor(state.stats, state.currentPlayer, { captures: 1 }),
          };
        } else {
          // otherwise, update the board as is and switch players
          return {
            ...nextState,
            selectedPiece: null,
            forcedCaptureKey: null,
            currentPlayer: getNextPlayer(state.currentPlayer),
            stats: incrementStatsFor(state.stats, state.currentPlayer, { moves: 1, captures: 1 }),
          };
        }
      } else {
        const res = applySimpleMove(state.board, moves, state.selectedPiece, action.payload);
        if (!res) return state;
        const statsAfterMove = incrementStatsFor(state.stats, state.currentPlayer, { moves: 1 });
        return {
          ...state,
          board: res.newBoard,
          selectedPiece: null,
          forcedCaptureKey: null,
          currentPlayer: getNextPlayer(state.currentPlayer),
          stats: statsAfterMove,
        };
      }
    }

    case 'SET_MODE': {
      return {
        ...state,
        mode: action.payload,
        forcedCaptureKey: null,
      };
    }

    default:
      return state;
  }
}

export const App: React.FC = () => {
  const [state, dispatch] = useReducer(reducer, initialState);
  console.log(state);

  const movesPerTurn = React.useMemo(() => {
    return selectAllMovesPerTurn(state);
  }, [state.board, state.currentPlayer]);

  const mustCapture = React.useMemo(() => {
    return hasCaptures(movesPerTurn);
  }, [movesPerTurn]);

  const activePlayerPieces = React.useMemo(() => {
    return selectInteractivityState(state);
  }, [movesPerTurn, state.board, state.currentPlayer, state.forcedCaptureKey]);

  const moveTargetsForSelection = React.useMemo(() => {
    return state.selectedPiece ? selectMoveTargetsFor(state.selectedPiece, movesPerTurn) : null;
  }, [state.selectedPiece, movesPerTurn]);

  console.log({ mustCapture, moveTargetsForSelection, movesPerTurn });

  const handleClickSquare = (target: Position) => () => {
    const targetKey = positionKey.get(target);
    if (state.selectedPiece && equals(state.selectedPiece, target)) {
      dispatch({ type: 'DESELECT_PIECE', payload: target });
      return;
    }

    if (activePlayerPieces.selectable.has(targetKey)) {
      dispatch({ type: 'SELECT_PIECE', payload: target });
      return;
    }

    if (isInMoveTargets(moveTargetsForSelection, target)) {
      dispatch({
        type: 'APPLY_MOVE',
        payload: target,
      });
    }
  };

  // Game mode selection
  if (!state.mode) {
    return (
      <div className="p-4">
        <h1 className="text-xl font-semibold mb-4">Checkers Game</h1>
        <p className="mb-2">Choose a mode to start:</p>
        <div className="flex gap-2">
          <button
            className="px-3 py-1 rounded border border-black hover:bg-gray-100"
            onClick={() => dispatch({ type: 'SET_MODE', payload: 'pvp' })}
          >
            Two Players (PvP)
          </button>
          <button
            className="px-3 py-1 rounded border border-black hover:bg-gray-100"
            onClick={() => dispatch({ type: 'SET_MODE', payload: 'pvc' })}
          >
            Single Player (PvC)
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h1 className="text-xl font-semibold mb-2">Checkers Game</h1>
      <div className="text-sm mb-4">
        <span className="mr-3">
          Mode: {state.mode === 'pvp' ? 'Two Players (PvP)' : 'Single Player (PvC)'}
        </span>
        <span className="mr-3">
          Current: {state.currentPlayer === PieceColor.light ? 'Red' : 'Black'}
        </span>
        <span className="mr-2">
          Red — Moves: {state.stats.light.moves}, Captures: {state.stats.light.captures}
        </span>
        <span>
          Black — Moves: {state.stats.dark.moves}, Captures: {state.stats.dark.captures}
        </span>
      </div>
      <div className="flex flex-col border border-black w-fit">
        {state.board?.map((row, rowIndex) => (
          <div key={rowIndex} className="flex border-t-black border-b-black items-center">
            {row.map((piece, columnIndex) => (
              <div
                key={columnIndex}
                className={cn(
                  'border border-l-black border-r-black size-10 flex justify-center items-center',
                  isDarkSquare({ x: columnIndex, y: rowIndex }) ? 'bg-orange-900' : 'bg-orange-100',
                  {
                    'bg-green-300': isInMoveTargets(moveTargetsForSelection, {
                      x: columnIndex,
                      y: rowIndex,
                    }),
                  },
                  {
                    'opacity-50': activePlayerPieces.disabled.has(
                      positionKey.get({ x: columnIndex, y: rowIndex }),
                    ),
                  },
                )}
                onClick={handleClickSquare({ x: columnIndex, y: rowIndex })}
              >
                {piece ? (
                  <CheckersPiece
                    color={piece.color}
                    king={piece.isKing}
                    isSelected={!!state.selectedPiece && equals(piece, state.selectedPiece)}
                  />
                ) : (
                  ''
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};
