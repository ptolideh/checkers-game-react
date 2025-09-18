import { cn } from '@/lib/utils';
import React, { useReducer } from 'react';
import { CheckersPiece } from '../CheckersPiece';
import type { Color, Position, Board, Piece, Capture } from '@/store/game-logic/types';
import { PieceColor } from '@/store/game-logic/rules';
import { equals, getPiece, positionKey } from '@/store/game-logic/utils';
import {
  getNextPlayer,
  hasCaptures,
  legalCapturesPerPiece,
  mapAllMovesForActivePlayer,
  selectAllMovesPerTurn,
  selectHighlightedSquares,
  selectInteractivityState,
} from '@/store/game-logic/engine';

const BOARD_SIZE = 8;

enum SquareColor {
  dark = 'darkPiece',
  light = 'lightPiece',
}

type Square = Position & {
  color: SquareColor;
};

interface State {
  selectedPiece: Piece | null;
  mode: 'pvp' | 'pvc' | null;
  currentPlayer: Color;
  board: Board;
  squares: Square[][];
}

type Action =
  | { type: 'SELECT_PIECE'; payload: Position }
  | { type: 'DESELECT_PIECE'; payload: Position }
  | { type: 'MOVE_PIECE'; payload: Position }
  | { type: 'CAPTURE_PIECE'; payload: Position }
  | { type: 'SET_MODE'; payload: 'pvp' | 'pvc' };

// shouldPromoteToKing(color: Color, y: number): boolean {
//   if (
//     (color === PieceColor.light && y === BOARD_SIZE - 1) ||
//     (color === PieceColor.dark && y === 0)
//   ) {
//     return true;
//   }
//   return false;
// }

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
      if ((row + col) % 2 !== 0) {
        square.color = SquareColor.dark;
        if (row < 3) {
          board[row][col] = {
            x: col,
            y: row,
            color: PieceColor.light,
            isKing: false,
            moves: {
              steps: [],
              captures: [],
            },
          };
        }
        if (row > 4) {
          board[row][col] = {
            x: col,
            y: row,
            color: PieceColor.dark,
            isKing: false,
            moves: {
              steps: [],
              captures: [],
            },
          };
        }
      }
    }
  }
  return { board, squares };
};

const initialState: State = {
  selectedPiece: null,
  mode: null,
  currentPlayer: PieceColor.dark,
  ...getInitialBoardAndSquaresState(),
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SELECT_PIECE': {
      const { x, y } = action.payload;
      const matchingPiece = getPiece(state.board, { x, y });
      const moves = selectAllMovesPerTurn(state.board, state.currentPlayer);
      const activePlayerPieces = selectInteractivityState(state.board, state.currentPlayer, moves);
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
      if (state.selectedPiece && action.payload && equals(state.selectedPiece, action.payload)) {
        return {
          ...state,
          selectedPiece: null,
        };
      }
      return state;
    }

    case 'MOVE_PIECE': {
      const { x, y } = action.payload;
      const moves = selectAllMovesPerTurn(state.board, state.currentPlayer);
      const mustCapture = hasCaptures(moves);
      if (state.selectedPiece && !mustCapture) {
        const nextState = { ...state, board: [...state.board].map((row) => [...row]) };
        const pieceAfterMove = {
          ...state.selectedPiece,
          x,
          y,
          moves: {
            steps: [],
            captures: [],
          },
        };
        nextState.board[y][x] = pieceAfterMove;
        nextState.board[state.selectedPiece.y][state.selectedPiece.x] = null;
        nextState.selectedPiece = null;
        nextState.currentPlayer = getNextPlayer(state.currentPlayer);
        return nextState;
      }

      return state;
    }

    case 'CAPTURE_PIECE': {
      const moves = selectAllMovesPerTurn(state.board, state.currentPlayer);
      const mustCapture = hasCaptures(moves);
      const targetKey = positionKey.get(action.payload);
      if (!moves.captures.has(targetKey)) return state;
      if (state.selectedPiece && mustCapture) {
        const { over: capturePosition, to: landingPosition } = moves.captures.get(targetKey);
        // debugger;
        const nextState = { ...state, board: [...state.board].map((row) => [...row]) };

        const pieceAfterMove = {
          ...state.selectedPiece,
          x: landingPosition.x,
          y: landingPosition.y,
          moves: {
            steps: [],
            captures: [],
          },
        };
        nextState.board[landingPosition.y][landingPosition.x] = pieceAfterMove;
        nextState.board[state.selectedPiece.y][state.selectedPiece.x] = null;
        nextState.board[capturePosition.y][capturePosition.x] = null;
        nextState.selectedPiece = null;

        const moreCapturesFound = legalCapturesPerPiece(nextState.board, pieceAfterMove).length > 0;

        const nextPlayer = moreCapturesFound
          ? state.currentPlayer
          : getNextPlayer(state.currentPlayer);
        return {
          ...nextState,
          currentPlayer: nextPlayer,
        };
      }

      return state;
    }

    case 'SET_MODE': {
      return {
        ...state,
        mode: action.payload,
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
    return selectAllMovesPerTurn(state.board, state.currentPlayer);
  }, [state.board, state.currentPlayer]);

  const mustCapture = React.useMemo(() => {
    return hasCaptures(movesPerTurn);
  }, [movesPerTurn]);

  const activePlayerPieces = React.useMemo(() => {
    return selectInteractivityState(state.board, state.currentPlayer, movesPerTurn);
  }, [movesPerTurn, state.board, state.currentPlayer]);

  const highlightedSquares = React.useMemo(() => {
    return state.selectedPiece ? selectHighlightedSquares(state.selectedPiece, movesPerTurn) : null;
  }, [state.selectedPiece, movesPerTurn]);

  console.log({ mustCapture, highlightedSquares });

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

    if (!mustCapture && highlightedSquares?.has(targetKey)) {
      dispatch({
        type: 'MOVE_PIECE',
        payload: target,
      });
      return;
    }

    if (mustCapture && highlightedSquares?.has(targetKey)) {
      dispatch({
        type: 'CAPTURE_PIECE',
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
        <span>Current: {state.currentPlayer === PieceColor.light ? 'Red' : 'Black'}</span>
      </div>
      <div className="flex flex-col border border-black w-fit">
        {state.board?.map((row, rowIndex) => (
          <div key={rowIndex} className="flex border-t-black border-b-black items-center">
            {row.map((piece, columnIndex) => (
              <div
                key={columnIndex}
                className={cn(
                  'border border-l-black border-r-black size-10 flex justify-center items-center',
                  state.squares[rowIndex][columnIndex].color === SquareColor.dark
                    ? 'bg-orange-900'
                    : 'bg-orange-100',
                  {
                    'bg-green-300': highlightedSquares?.has(
                      positionKey.get({ x: columnIndex, y: rowIndex }),
                    ),
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
