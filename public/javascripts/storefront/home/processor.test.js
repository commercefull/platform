/**
 * Home processor tests — pure business logic, no DOM required.
 */

import { nextSlideIndex, clampSlideIndex, shouldLazyLoad } from './processor.js';

describe('Home processor', () => {
  describe('nextSlideIndex', () => {
    it('increments by 1', () => {
      expect(nextSlideIndex(0, 1, 5)).toBe(1);
    });

    it('wraps forward past the end', () => {
      expect(nextSlideIndex(4, 1, 5)).toBe(0);
    });

    it('decrements by 1', () => {
      expect(nextSlideIndex(3, -1, 5)).toBe(2);
    });

    it('wraps backward past the start', () => {
      expect(nextSlideIndex(0, -1, 5)).toBe(4);
    });

    it('handles large delta', () => {
      expect(nextSlideIndex(0, 6, 5)).toBe(1);
    });

    it('returns 0 for empty slides', () => {
      expect(nextSlideIndex(0, 1, 0)).toBe(0);
    });
  });

  describe('clampSlideIndex', () => {
    it('clamps to 0 for negative index', () => {
      expect(clampSlideIndex(-1, 5)).toBe(0);
    });

    it('clamps to max for index beyond length', () => {
      expect(clampSlideIndex(10, 5)).toBe(4);
    });

    it('returns index when in range', () => {
      expect(clampSlideIndex(2, 5)).toBe(2);
    });

    it('returns 0 for empty slides', () => {
      expect(clampSlideIndex(5, 0)).toBe(0);
    });
  });

  describe('shouldLazyLoad', () => {
    it('returns true when data-src is present', () => {
      expect(shouldLazyLoad({ dataset: { src: '/img.jpg' } })).toBe(true);
    });

    it('returns false when data-src is absent', () => {
      expect(shouldLazyLoad({ dataset: {} })).toBe(false);
    });

    it('returns false for null input', () => {
      expect(shouldLazyLoad(null)).toBe(false);
    });

    it('returns false for object without dataset', () => {
      expect(shouldLazyLoad({})).toBe(false);
    });
  });
});
