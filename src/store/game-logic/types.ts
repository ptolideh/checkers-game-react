interface Position {
  x: number;
  y: number;
}

type Color = 'dark' | 'light';

type Winner = Color | 'draw' | null;

type Board = (Piece | null)[][];

interface Step {
  from: Position;
  to: Position;
}

interface Capture {
  from: Position;
  over: Position;
  to: Position;
}

type Steps = Step[];
type Captures = Capture[];

interface Piece {
  x: number;
  y: number;
  color: Color;
  isKing: boolean;
}

interface MoveSet {
  steps: Map<string, Steps>;
  captures: Map<string, Captures>;
}

type MoveTargetKeys = Set<string>;

interface PlayerStats {
  moves: number;
  captures: number;
}

type Stats = Record<Color, PlayerStats>;

type GameMode = 'pvp' | 'pvc';

interface GameState {
  selectedPiece: Piece | null;
  mode: 'pvp' | 'pvc' | null;
  currentPlayer: Color;
  board: Board;
  winner: Winner;
  forcedCaptureKey: string | null;
  stats: Stats;
}

export type {
  Position,
  Color,
  Piece,
  Board,
  Step,
  Capture,
  Steps,
  Captures,
  MoveSet,
  MoveTargetKeys,
  GameState,
  PlayerStats,
  Stats,
  Winner,
  GameMode,
};
