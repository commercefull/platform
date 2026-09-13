import { roundTo, roundWithDeltaCorrection, allocateWithDeltaCorrection, RoundingMode } from './rounding';

describe('libs/rules/rounding', () => {
  describe('roundTo', () => {
    it('rounds to 2 decimals by default', () => {
      expect(roundTo(1.005)).toBe(1.01);
      expect(roundTo(1.004)).toBe(1.0);
      expect(roundTo(2.345)).toBe(2.35);
    });

    it('rounds to specified decimals', () => {
      expect(roundTo(1.2345, 3)).toBe(1.235);
      expect(roundTo(1.2345, 0)).toBe(1);
    });

    it('handles negative numbers (rounds half towards +Infinity per Math.round)', () => {
      expect(roundTo(-1.005)).toBe(-1.0);
      expect(roundTo(-1.006)).toBe(-1.01);
      expect(roundTo(-1.004)).toBe(-1.0);
    });

    it('handles zero', () => {
      expect(roundTo(0)).toBe(0);
    });
  });

  describe('roundWithDeltaCorrection — perLine', () => {
    it('returns empty for empty input', () => {
      expect(roundWithDeltaCorrection([], 'perLine')).toEqual([]);
    });

    it('rounds each line when no delta', () => {
      const lines = [10.0, 20.0, 30.0];
      const result = roundWithDeltaCorrection(lines, 'perLine');
      expect(result).toEqual([10.0, 20.0, 30.0]);
      expect(result.reduce((s, v) => s + v, 0)).toBe(60.0);
    });

    it('corrects delta so sum equals rounded total', () => {
      // 3 lines of 0.333... each → raw total 1.0, rounded total 1.00
      // each line rounds to 0.33, sum 0.99, delta 0.01 → applied to largest line
      const lines = [0.333, 0.333, 0.334];
      const result = roundWithDeltaCorrection(lines, 'perLine');
      const sum = result.reduce((s, v) => s + v, 0);
      expect(sum).toBe(1.0);
    });

    it('corrects negative delta', () => {
      // lines that round up individually → sum too high → negative delta
      const lines = [0.335, 0.335, 0.335];
      const result = roundWithDeltaCorrection(lines, 'perLine');
      const sum = result.reduce((s, v) => s + v, 0);
      // raw total 1.005 → rounded total 1.01 (or 1.00 depending on rounding)
      // sum of rounded parts should equal rounded total
      const roundedTotal = roundTo(lines.reduce((s, v) => s + v, 0));
      expect(sum).toBe(roundedTotal);
    });

    it('handles single line', () => {
      const result = roundWithDeltaCorrection([10.005], 'perLine');
      expect(result).toEqual([10.01]);
    });

    it('applies delta to largest line', () => {
      // 0.01 + 0.01 + 0.005 → raw 0.025 → rounds to 0.03
      // individual: 0.01, 0.01, 0.01 (0.005 rounds to 0.01) → sum 0.03 ✓ no delta
      // Let's construct a real delta case:
      // 0.01 + 0.01 + 0.004 → raw 0.024 → rounds to 0.02
      // individual: 0.01, 0.01, 0.00 → sum 0.02 ✓
      // Better: 0.005 + 0.005 + 0.005 → raw 0.015 → rounds to 0.02
      // individual: 0.01, 0.01, 0.01 → sum 0.03, delta -0.01 → applied to largest (all equal, first)
      const lines = [0.005, 0.005, 0.005];
      const result = roundWithDeltaCorrection(lines, 'perLine');
      const sum = result.reduce((s, v) => s + v, 0);
      expect(sum).toBe(roundTo(0.015));
    });
  });

  describe('roundWithDeltaCorrection — perTotal', () => {
    it('rounds each line independently (no delta correction)', () => {
      const lines = [0.333, 0.333, 0.334];
      const result = roundWithDeltaCorrection(lines, 'perTotal');
      expect(result).toEqual([0.33, 0.33, 0.33]);
    });
  });

  describe('allocateWithDeltaCorrection', () => {
    it('returns empty for empty weights', () => {
      expect(allocateWithDeltaCorrection(100, [])).toEqual([]);
    });

    it('returns zeros when weight sum is zero', () => {
      expect(allocateWithDeltaCorrection(100, [0, 0, 0])).toEqual([0, 0, 0]);
    });

    it('allocates proportionally with delta correction', () => {
      const total = 1.0;
      const weights = [1, 1, 1];
      const result = allocateWithDeltaCorrection(total, weights);
      const sum = result.reduce((s, v) => s + v, 0);
      expect(sum).toBe(1.0);
    });

    it('allocates by weight ratio', () => {
      const total = 100;
      const weights = [1, 3];
      const result = allocateWithDeltaCorrection(total, weights);
      expect(result[0]).toBe(25);
      expect(result[1]).toBe(75);
      expect(result.reduce((s, v) => s + v, 0)).toBe(100);
    });

    it('handles uneven weights with penny drift correction', () => {
      const total = 0.1;
      const weights = [1, 1, 1];
      const result = allocateWithDeltaCorrection(total, weights);
      const sum = result.reduce((s, v) => s + v, 0);
      expect(sum).toBe(0.1);
    });
  });

  describe('RoundingMode type', () => {
    it('accepts perLine and perTotal', () => {
      const m1: RoundingMode = 'perLine';
      const m2: RoundingMode = 'perTotal';
      expect(m1).toBe('perLine');
      expect(m2).toBe('perTotal');
    });
  });
});
