import {
  clampIndex,
  computeInsertPosition,
  nextAppendPosition,
  POSITION_GAP,
  renormalizedPositions,
} from './position.util';

describe('position.util', () => {
  describe('computeInsertPosition', () => {
    it('returns the gap constant for an empty list', () => {
      const result = computeInsertPosition([], 0);
      expect(result).toEqual({
        position: POSITION_GAP,
        needsRenormalization: false,
      });
    });

    it('inserts before the only item when index is 0', () => {
      const result = computeInsertPosition([{ id: 'a', position: 100 }], 0);
      expect(result.position).toBe(50);
      expect(result.needsRenormalization).toBe(false);
    });

    it('inserts after the only item when index is at the end', () => {
      const result = computeInsertPosition([{ id: 'a', position: 100 }], 1);
      expect(result.position).toBe(100 + POSITION_GAP);
    });

    it('inserts at the midpoint between two neighbors', () => {
      const siblings = [
        { id: 'a', position: 100 },
        { id: 'b', position: 200 },
      ];
      const result = computeInsertPosition(siblings, 1);
      expect(result.position).toBe(150);
      expect(result.needsRenormalization).toBe(false);
    });

    it('clamps a negative index to the start', () => {
      const siblings = [
        { id: 'a', position: 100 },
        { id: 'b', position: 200 },
      ];
      const result = computeInsertPosition(siblings, -5);
      expect(result.position).toBe(50);
    });

    it('clamps an overflowing index to the end', () => {
      const siblings = [
        { id: 'a', position: 100 },
        { id: 'b', position: 200 },
      ];
      const result = computeInsertPosition(siblings, 999);
      expect(result.position).toBe(200 + POSITION_GAP);
    });

    it('flags renormalization when neighbors are nearly identical', () => {
      const siblings = [
        { id: 'a', position: 1.0 },
        { id: 'b', position: 1.00000005 },
      ];
      const result = computeInsertPosition(siblings, 1);
      expect(result.needsRenormalization).toBe(true);
    });

    it('does not flag renormalization for a healthy gap', () => {
      const siblings = [
        { id: 'a', position: 1 },
        { id: 'b', position: 2 },
      ];
      const result = computeInsertPosition(siblings, 1);
      expect(result.needsRenormalization).toBe(false);
    });
  });

  describe('clampIndex', () => {
    it('clamps negative and overflowing indexes into range', () => {
      expect(clampIndex(-10, 5)).toBe(0);
      expect(clampIndex(999, 5)).toBe(5);
      expect(clampIndex(2, 5)).toBe(2);
    });
  });

  describe('nextAppendPosition', () => {
    it('starts at the gap constant when there is no last position', () => {
      expect(nextAppendPosition(undefined)).toBe(POSITION_GAP);
    });

    it('adds the gap constant to the last position', () => {
      expect(nextAppendPosition(500)).toBe(500 + POSITION_GAP);
    });
  });

  describe('renormalizedPositions', () => {
    it('produces evenly spaced increasing positions', () => {
      const positions = renormalizedPositions(4);
      expect(positions).toEqual([
        POSITION_GAP,
        POSITION_GAP * 2,
        POSITION_GAP * 3,
        POSITION_GAP * 4,
      ]);
    });

    it('produces an empty array for zero items', () => {
      expect(renormalizedPositions(0)).toEqual([]);
    });
  });
});
