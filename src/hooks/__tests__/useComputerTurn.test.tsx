import { act, cleanup, render } from '@testing-library/react';
import { describe, expect, it, vi, afterEach } from 'vitest';
import { useComputerTurn } from '@/hooks/useComputerTurn';
import { AI_PLAYER_COLOR, BOARD_SIZE, GameModes } from '@/game-logic/rules';
import type { GameState, MoveSet, Position } from '@/game-logic/types';
import { pickAiMove } from '@/game-logic/ai-player';
import { selectAllMovesPerTurn } from '@/game-logic/engine';

vi.mock('@/game-logic/ai-player', () => ({
  pickAiMove: vi.fn(),
}));

vi.mock('@/game-logic/engine', () => ({
  selectAllMovesPerTurn: vi.fn(),
}));

const pickAiMoveMock = vi.mocked(pickAiMove);
const selectAllMovesPerTurnMock = vi.mocked(selectAllMovesPerTurn);

const createEmptyBoard = () =>
  Array.from({ length: BOARD_SIZE }, () => Array.from({ length: BOARD_SIZE }, () => null));

const createState = (overrides: Partial<GameState> = {}): GameState => ({
  selectedPiece: null,
  mode: GameModes.PlayerVsComputer,
  currentPlayer: AI_PLAYER_COLOR,
  board: createEmptyBoard(),
  winner: null,
  forcedCaptureKey: null,
  stats: {
    light: { moves: 0, captures: 0 },
    dark: { moves: 0, captures: 0 },
  },
  ...overrides,
});

const createMoves = (): MoveSet => ({
  steps: new Map(),
  captures: new Map(),
});

const TestComponent = ({
  state,
  onSelectPiece,
  onApplyMove,
}: {
  state: GameState;
  onSelectPiece: (position: Position) => void;
  onApplyMove: (position: Position) => void;
}) => {
  useComputerTurn({ state, onSelectPiece, onApplyMove });
  return null;
};

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  vi.useRealTimers();
});

describe('useComputerTurn', () => {
  it('selects the AI move immediately and applies it after a delay', () => {
    vi.useFakeTimers();

    const state = createState();
    const moves = createMoves();
    const aiMove = {
      piece: { x: 2, y: 3 },
      target: { x: 4, y: 5 },
    };

    selectAllMovesPerTurnMock.mockReturnValue(moves);
    pickAiMoveMock.mockReturnValue(aiMove);

    const onSelectPiece = vi.fn();
    const onApplyMove = vi.fn();

    render(<TestComponent state={state} onSelectPiece={onSelectPiece} onApplyMove={onApplyMove} />);

    expect(selectAllMovesPerTurnMock).toHaveBeenCalledWith(state);
    expect(pickAiMoveMock).toHaveBeenCalledWith(moves, state.forcedCaptureKey);
    expect(onSelectPiece).toHaveBeenCalledWith(aiMove.piece);
    expect(onApplyMove).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(onApplyMove).toHaveBeenCalledWith(aiMove.target);
  });

  it('does nothing when the AI has no legal move', () => {
    vi.useFakeTimers();

    const state = createState();
    const moves = createMoves();

    selectAllMovesPerTurnMock.mockReturnValue(moves);
    pickAiMoveMock.mockReturnValue(null);

    const onSelectPiece = vi.fn();
    const onApplyMove = vi.fn();

    render(<TestComponent state={state} onSelectPiece={onSelectPiece} onApplyMove={onApplyMove} />);

    expect(onSelectPiece).not.toHaveBeenCalled();
    expect(onApplyMove).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(onApplyMove).not.toHaveBeenCalled();
  });
});
