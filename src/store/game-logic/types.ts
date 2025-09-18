interface Position {
  x: number;
  y: number;
}

type Color = 'dark' | 'light';

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
interface Moves {
  steps: Steps;
  captures: Captures;
}

interface Piece {
  x: number;
  y: number;
  color: Color;
  isKing: boolean;
  moves: Moves;
}

interface MoveSet {
  steps: Map<string, Steps>;
  captures: Map<string, Captures>;
}

export type { Position, Color, Piece, Board, Step, Capture, Steps, Captures, MoveSet };
