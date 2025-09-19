import type { AiMove, MoveSet } from './types';
import { positionKey, selectRandom } from './utils';

// This is a simple AI player logic that picks a move at random based on capture priority

const pickAiMove = (moves: MoveSet, forcedCaptureKey: string | null): AiMove | null => {
  // First, see if there are any locked selections that can be captured
  const forcedCaptures = moves.captures.get(forcedCaptureKey ?? '') ?? [];
  if (forcedCaptureKey && forcedCaptures.length > 0) {
    const capture = selectRandom(forcedCaptures);
    if (!capture) return null;
    return {
      piece: positionKey.parse(forcedCaptureKey),
      target: capture.to,
    };
  }

  // Otherwise, look through possible moves and prioritize captures.
  // Pick a random piece with capture, and then a random available capture for that piece
  const captureEntries = Array.from(moves.captures.entries());
  const captureEntry = selectRandom(captureEntries);
  if (captureEntry) {
    const [pieceKey, captures] = captureEntry;
    const capture = selectRandom(captures);
    if (!capture) return null;
    return {
      piece: positionKey.parse(pieceKey),
      target: capture.to,
    };
  }

  // If no captures, look through possible existing step moves
  // Pick a random piece with step, and then a random available step option for that piece
  const stepEntries = Array.from(moves.steps.entries());
  const stepEntry = selectRandom(stepEntries);
  if (stepEntry) {
    const [pieceKey, steps] = stepEntry;
    const step = selectRandom(steps);
    if (!step) return null;
    return {
      piece: positionKey.parse(pieceKey),
      target: step.to,
    };
  }

  return null;
};

export { pickAiMove };
