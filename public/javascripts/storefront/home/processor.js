/**
 * Home processor — pure business logic for home page carousels.
 * No DOM, no fetch. Fully testable in Node without jsdom.
 */

/**
 * Compute the next slide index, wrapping around.
 *
 * @param {number} current — current slide index
 * @param {number} delta — signed delta (e.g. +1 or -1)
 * @param {number} length — total number of slides
 * @returns {number} wrapped index
 */
export function nextSlideIndex(current, delta, length) {
  if (length === 0) return 0;
  return (((current + delta) % length) + length) % length;
}

/**
 * Clamp a slide index to the valid range.
 *
 * @param {number} index
 * @param {number} length
 * @returns {number}
 */
export function clampSlideIndex(index, length) {
  if (length === 0) return 0;
  return Math.max(0, Math.min(index, length - 1));
}

/**
 * Determine whether an image element should be lazy-loaded.
 * An image qualifies if it has a `data-src` attribute.
 *
 * @param {object} img — DOM-like object with `dataset` property
 * @returns {boolean}
 */
export function shouldLazyLoad(img) {
  return !!(img && img.dataset && img.dataset.src);
}
