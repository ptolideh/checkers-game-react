import { cn } from '@/lib/utils';
import { useReducer } from 'react';

const BOARD_SIZE = 8;

enum PieceColor {
  dark = 'darkPiece',
  light = 'lightPiece',
}

enum SquareColor {
  dark = 'darkPiece',
  light = 'lightPiece',
}

type Position = {
  x: number;
  y: number;
};

type CaptureOption = {
  capturePos: Position;
  landingPos: Position;
};

type Piece = Position & {
  color: PieceColor;
  isKing: boolean;
  moves: Position[];
  captures: { capturePos: Position; landingPos: Position }[];
};

type Square = Position & {
  color: SquareColor;
  piece: Piece | null;
};

interface State {
  selectedPiece: Piece | null;
  mode: 'pvp' | 'pvc' | null;
  currentPlayer: PieceColor;
  playerMustCapture: boolean;
  game: Square[][];
  board: Omit<Square, 'piece'>[][]; //Square[][];
}

type Action =
  | { type: 'SELECT_PIECE'; payload: Position }
  | { type: 'DESELECT_PIECE' }
  | { type: 'MOVE_PIECE'; payload: Position }
  | { type: 'CAPTURE_PIECE'; payload: Piece['captures'][number] }
  | { type: 'SET_MODE'; payload: 'pvp' | 'pvc' };

const regularMoveOptions: Record<PieceColor, number[][]> = {
  lightPiece: [
    [1, 1],
    [1, -1],
  ],
  darkPiece: [
    [-1, 1],
    [-1, -1],
  ],
};

const kingMoveOptions: number[][] = [
  [-1, 1],
  [-1, -1],
  [1, 1],
  [1, -1],
];

const shouldPromoteToKing = (color: PieceColor, targetRow: number) => {
  if (color === PieceColor.light && targetRow === BOARD_SIZE - 1) return true;
  if (color === PieceColor.dark && targetRow === 0) return true;
  return false;
};

//A valid square must be inside the board
const isMoveInBounds = (y: number, x: number): boolean => {
  return y >= 0 && y < BOARD_SIZE && x >= 0 && x < BOARD_SIZE;
};

//A valid move target must be inside the board and empty
const isValidLandingPos = (game: Square[][], y: number, x: number): boolean => {
  return isMoveInBounds(y, x) && game[y][x].piece === null && game[y][x].color === SquareColor.dark;
};

const isNextOpponent = (current: Square, next: Square) => {
  return next.piece?.color && current.piece?.color !== next.piece?.color;
};

const hasCaptures = (game: Square[][], currentPlayer: PieceColor) =>
  game.some((row) =>
    row.some(
      (square) =>
        square.piece && square.piece.color === currentPlayer && square.piece.captures.length > 0,
    ),
  );

const getNextPlayer = (currentPlayer: PieceColor) => {
  return currentPlayer === PieceColor.light ? PieceColor.dark : PieceColor.light;
};

const getSimpleMovesPerPiece = (game: Square[][], square: Square) => {
  const piece = square.piece;
  if (!piece) return [];

  const movementOptions = piece.isKing ? kingMoveOptions : regularMoveOptions[piece.color];

  return movementOptions.reduce<Position[]>((acc, option) => {
    const [rowMovement, colMovement] = option;
    const nextY = square.y + rowMovement;
    const nextX = square.x + colMovement;

    if (isValidLandingPos(game, nextY, nextX)) {
      acc.push({
        x: nextX,
        y: nextY,
      });
    }

    return acc;
  }, []);
};

const getValidCapturesPerPiece = (game: Square[][], square: Square): CaptureOption[] => {
  const piece = square.piece;
  if (!piece) return [];

  const movementOptions = piece.isKing ? kingMoveOptions : regularMoveOptions[piece.color];

  return movementOptions.reduce<CaptureOption[]>((acc, option) => {
    const [rowMovement, colMovement] = option;
    const nextY = square.y + rowMovement;
    const nextX = square.x + colMovement;
    const jumpY = square.y + rowMovement * 2;
    const jumpX = square.x + colMovement * 2;

    if (!isMoveInBounds(nextY, nextX)) return acc;
    if (!isMoveInBounds(jumpY, jumpX)) return acc;
    if (!isValidLandingPos(game, jumpY, jumpX)) return acc;

    const adjacentSquare = game[nextY][nextX];
    if (!isNextOpponent(square, adjacentSquare)) return acc;

    acc.push({
      capturePos: { x: nextX, y: nextY },
      landingPos: { x: jumpX, y: jumpY },
    });

    return acc;
  }, []);
};

const mapAllMovesForCurrentPlayer = (game: Square[][], color: PieceColor) => {
  return game.map((row) => {
    return row.map((square) => {
      if (!square.piece) return square;

      if (square.piece?.color === color) {
        const validCaptures = getValidCapturesPerPiece(game, square);
        if (validCaptures.length > 0) {
          return {
            ...square,
            piece: {
              ...square.piece,
              captures: validCaptures,
              moves: [],
            },
          } as Square;
        }
        const validMoves = getSimpleMovesPerPiece(game, square);
        return {
          ...square,
          piece: {
            ...square.piece,
            moves: validMoves,
            captures: [],
          },
        } as Square;
      }

      return {
        ...square,
        piece: {
          ...square.piece,
          moves: [],
          captures: [],
        },
      };
    });
  });
};

const isSelected = (currPosition: Piece, selectedPiece: Piece | null) => {
  return currPosition.x === selectedPiece?.x && currPosition.y === selectedPiece?.y;
};

const isSelectablePiece = (piece: Piece | null, playerMustCapture: boolean) => {
  if (!piece) return false;
  if (playerMustCapture) {
    return piece.captures.length > 0;
  } else {
    return piece.moves.length > 0;
  }
};

const getInitialGameState = () => {
  const game: Square[][] = Array.from({ length: BOARD_SIZE }, () =>
    Array.from({ length: BOARD_SIZE }, () => ({
      x: 0,
      y: 0,
      color: SquareColor.light,
      piece: null,
    })),
  );

  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      const s = game[row][col];
      s.x = col;
      s.y = row;
      if ((row + col) % 2 !== 0) {
        s.color = SquareColor.dark;
        if (row < 3)
          s.piece = {
            x: col,
            y: row,
            color: PieceColor.light,
            isKing: false,
            moves: [],
            captures: [],
          };
        else if (row > 4)
          s.piece = {
            x: col,
            y: row,
            color: PieceColor.dark,
            isKing: false,
            moves: [],
            captures: [],
          };
      }
    }
  }
  return game;
};

const initialState: State = {
  selectedPiece: null,
  mode: null,
  currentPlayer: PieceColor.dark,
  playerMustCapture: false,
  game: getInitialGameState(),
  board: getInitialGameState(),
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SELECT_PIECE': {
      const { x, y } = action.payload;
      const selectedPiece = state.game[y][x].piece;
      if (selectedPiece && isSelectablePiece(selectedPiece, state.playerMustCapture)) {
        return {
          ...state,
          selectedPiece: { ...selectedPiece },
        };
      }

      return state;
    }
    case 'DESELECT_PIECE': {
      return {
        ...state,
        selectedPiece: null,
      };
    }

    case 'MOVE_PIECE': {
      const { x, y } = action.payload;
      if (state.selectedPiece && !state.playerMustCapture) {
        const nextState = { ...state, game: [...state.game].map((row) => [...row]) };
        const movingPiece: Piece = {
          x,
          y,
          color: state.selectedPiece.color,
          isKing: state.selectedPiece.isKing || shouldPromoteToKing(state.selectedPiece.color, y),
          moves: [],
          captures: [],
        };
        nextState.game[y][x].piece = movingPiece;
        nextState.game[state.selectedPiece.y][state.selectedPiece.x].piece = null;
        nextState.selectedPiece = null;
        nextState.currentPlayer = getNextPlayer(state.currentPlayer);
        nextState.game = mapAllMovesForCurrentPlayer(nextState.game, nextState.currentPlayer);
        nextState.playerMustCapture = hasCaptures(nextState.game, nextState.currentPlayer);
        return nextState;
      }

      return state;
    }

    case 'CAPTURE_PIECE': {
      if (state.selectedPiece && state.playerMustCapture) {
        const { capturePos, landingPos } = action.payload;
        // debugger;
        const nextState = { ...state, game: [...state.game].map((row) => [...row]) };
        const movingPiece: Piece = {
          x: landingPos.x,
          y: landingPos.y,
          color: state.selectedPiece.color,
          isKing:
            state.selectedPiece.isKing ||
            shouldPromoteToKing(state.selectedPiece.color, landingPos.y),
          captures: [],
          moves: [],
        };
        nextState.game[landingPos.y][landingPos.x].piece = movingPiece;
        nextState.game[state.selectedPiece.y][state.selectedPiece.x].piece = null;
        nextState.game[capturePos.y][capturePos.x].piece = null;
        nextState.selectedPiece = null;

        const hasMoreCaptures =
          getValidCapturesPerPiece(nextState.game, nextState.game[movingPiece.y][movingPiece.x])
            .length > 0;

        const nextPlayer = hasMoreCaptures
          ? state.currentPlayer
          : getNextPlayer(state.currentPlayer);
        const nextGameState = mapAllMovesForCurrentPlayer(nextState.game, nextPlayer);
        const playerMustCapture = hasMoreCaptures || hasCaptures(nextGameState, nextPlayer);
        return {
          ...nextState,
          game: nextGameState,
          currentPlayer: nextPlayer,
          playerMustCapture,
        };
      }

      return state;
    }

    case 'SET_MODE': {
      return {
        ...state,
        game: mapAllMovesForCurrentPlayer(state.game, state.currentPlayer),
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
        {state.game.map((row, rowIndex) => (
          <div key={rowIndex} className="flex border-t-black border-b-black items-center">
            {row.map((square, columnIndex) => (
              <div
                key={columnIndex}
                className={cn(
                  'border border-l-black border-r-black size-10 flex justify-center items-center',
                  square.color === SquareColor.dark ? 'bg-orange-900' : 'bg-orange-100',
                  {
                    'bg-green-300':
                      state.selectedPiece?.moves.some(
                        (move) => move.x === square.x && move.y === square.y,
                      ) ||
                      state.selectedPiece?.captures.some(
                        (capture) =>
                          capture.landingPos.x === square.x && capture.landingPos.y === square.y,
                      ),
                  },
                  {
                    'opacity-50':
                      square.piece?.color === state.currentPlayer &&
                      !isSelectablePiece(square.piece, state.playerMustCapture),
                  },
                )}
                onClick={() => {
                  if (square.piece && isSelected(square.piece, state.selectedPiece)) {
                    dispatch({ type: 'DESELECT_PIECE' });
                  } else if (isSelectablePiece(square.piece, state.playerMustCapture)) {
                    dispatch({ type: 'SELECT_PIECE', payload: square });
                  } else if (
                    !state.playerMustCapture &&
                    state.selectedPiece?.moves.some(
                      (move) => move.x === square.x && move.y === square.y,
                    )
                  ) {
                    dispatch({
                      type: 'MOVE_PIECE',
                      payload: { x: square.x, y: square.y },
                    });
                  } else if (state.playerMustCapture) {
                    const captured = state.selectedPiece?.captures.find(
                      (capture) =>
                        capture.landingPos.x === square.x && capture.landingPos.y === square.y,
                    );
                    if (captured) {
                      dispatch({
                        type: 'CAPTURE_PIECE',
                        payload: captured,
                      });
                    }
                  }
                }}
              >
                {square.piece ? (
                  <Piece
                    {...square.piece}
                    isSelected={isSelected(square.piece, state.selectedPiece)}
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

const Piece: React.FC<Piece & { isSelected?: boolean }> = ({ color, isKing, isSelected }) => {
  return (
    <div
      className={cn(
        'rounded-full size-6 flex justify-center items-center border-2',
        color === PieceColor.dark ? 'bg-black' : 'bg-red-600',
        color === PieceColor.dark ? 'border-black' : 'border-red-600',
        { 'border-green-300': isSelected },
      )}
    >
      {isKing ? (
        <div className="flex items-center justify-center bg-yellow-400 size-3 rounded-full relative">
          <span className="absolute text-[0.5rem] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
            👑
          </span>
        </div>
      ) : (
        ''
      )}
    </div>
  );
};
