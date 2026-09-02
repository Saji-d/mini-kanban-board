/**
 * Fractional/float position keys with midpoint insertion. Reordering (the
 * overwhelmingly common case) writes exactly one row - only the moved item's
 * position - instead of rewriting every sibling. The only failure mode, float
 * precision exhaustion after many repeated insertions at the same exact slot,
 * is bounded by renormalizedPositions() below.
 */

export const POSITION_GAP = 65536;
export const POSITION_EPSILON = 1e-7;

export function nextAppendPosition(lastPosition: number | undefined): number {
  return (lastPosition ?? 0) + POSITION_GAP;
}

export interface PositionCandidate {
  id: string;
  position: number;
}

export interface ComputeInsertPositionResult {
  position: number;
  needsRenormalization: boolean;
}

/**
 * `siblings` must be sorted ascending by position and must NOT include the
 * item being placed. `targetIndex` is clamped into [0, siblings.length]
 * before use, so out-of-range indexes degrade to "insert at start/end"
 * rather than throwing.
 */
export function computeInsertPosition(
  siblings: PositionCandidate[],
  targetIndex: number,
): ComputeInsertPositionResult {
  const clampedIndex = Math.max(0, Math.min(targetIndex, siblings.length));
  const prev = clampedIndex > 0 ? siblings[clampedIndex - 1] : undefined;
  const next =
    clampedIndex < siblings.length ? siblings[clampedIndex] : undefined;

  if (!prev && !next) {
    return { position: POSITION_GAP, needsRenormalization: false };
  }

  if (!prev && next) {
    return {
      position: next.position / 2,
      needsRenormalization: next.position < POSITION_EPSILON * 2,
    };
  }

  if (prev && !next) {
    return {
      position: prev.position + POSITION_GAP,
      needsRenormalization: false,
    };
  }

  const gap = next!.position - prev!.position;
  return {
    position: (prev!.position + next!.position) / 2,
    needsRenormalization: gap <= POSITION_EPSILON,
  };
}

export function clampIndex(targetIndex: number, siblingCount: number): number {
  return Math.max(0, Math.min(targetIndex, siblingCount));
}

/** Fresh evenly-spaced positions for a renormalization pass, in list order. */
export function renormalizedPositions(count: number): number[] {
  return Array.from({ length: count }, (_, i) => (i + 1) * POSITION_GAP);
}
