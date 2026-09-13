/**
 * Checkout processor tests — pure business logic, no DOM required.
 */

import { nextStep, stepCircleState, stepLabelState, isLineActive } from './processor.js';

describe('Checkout processor', () => {
  describe('nextStep', () => {
    it('increments by 1', () => {
      expect(nextStep(1, 1, 4)).toBe(2);
    });

    it('decrements by 1', () => {
      expect(nextStep(3, -1, 4)).toBe(2);
    });

    it('clamps to 1 when going below minimum', () => {
      expect(nextStep(1, -1, 4)).toBe(1);
    });

    it('clamps to totalSteps when going above maximum', () => {
      expect(nextStep(4, 1, 4)).toBe(4);
    });
  });

  describe('stepCircleState', () => {
    it('returns completed state for steps before current', () => {
      const state = stepCircleState(1, 3);
      expect(state.classes).toContain('bg-green-600');
      expect(state.content).toBe('\u2713');
    });

    it('returns active state for the current step', () => {
      const state = stepCircleState(2, 2);
      expect(state.classes).toContain('bg-ink-900');
      expect(state.content).toBe('2');
    });

    it('returns inactive state for steps after current', () => {
      const state = stepCircleState(4, 2);
      expect(state.classes).toContain('bg-gray-200');
      expect(state.content).toBe('4');
    });
  });

  describe('stepLabelState', () => {
    it('returns active classes for current step', () => {
      expect(stepLabelState(2, 2)).toContain('font-medium');
    });

    it('returns completed classes for past steps', () => {
      expect(stepLabelState(1, 3)).toContain('text-ink-900');
      expect(stepLabelState(1, 3)).not.toContain('font-medium');
    });

    it('returns inactive classes for future steps', () => {
      expect(stepLabelState(4, 2)).toContain('text-gray-500');
    });
  });

  describe('isLineActive', () => {
    it('returns true for lines before the current step', () => {
      expect(isLineActive(1, 3)).toBe(true);
      expect(isLineActive(2, 3)).toBe(true);
    });

    it('returns false for lines at or after the current step', () => {
      expect(isLineActive(3, 3)).toBe(false);
      expect(isLineActive(4, 3)).toBe(false);
    });
  });
});
