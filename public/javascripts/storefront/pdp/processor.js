/**
 * PDP processor — pure business logic for product detail pages.
 * No DOM, no fetch. Fully testable in Node without jsdom.
 */

/**
 * Find the variant matching the selected size and/or colour.
 * Returns null when no match is found.
 *
 * @param {object[]} variants — each has `size` and `colour`
 * @param {string|null|undefined} size
 * @param {string|null|undefined} colour
 * @returns {object|null}
 */
export function findVariant(variants, size, colour) {
  if (!variants || variants.length === 0) return null;
  return (
    variants.find(function (v) {
      const sizeOk = !size || v.size === size;
      const colourOk = !colour || v.colour === colour;
      return sizeOk && colourOk;
    }) || null
  );
}

/**
 * Compute the next quantity after applying a delta, clamped to a minimum.
 *
 * @param {number} current — current quantity
 * @param {number} delta — signed delta (e.g. -1 or +1)
 * @param {number} [min=1] — minimum allowed value
 * @returns {number}
 */
export function applyQuantityDelta(current, delta, min = 1) {
  const next = (parseInt(current, 10) || 0) + delta;
  return Math.max(min, next);
}

/**
 * Build the stock status HTML for a variant.
 *
 * @param {number} stock — available stock count
 * @returns {string} HTML string
 */
export function stockStatusHtml(stock) {
  if (stock > 10) return '<span class="text-green-600">In Stock — Ready to ship</span>';
  if (stock > 0) return '<span class="text-amber-600">Only ' + stock + ' left — Order soon</span>';
  return '<span class="text-red-600">Out of Stock — Notify me</span>';
}

/**
 * Determine whether the add-to-cart button should be disabled.
 *
 * @param {object|null} variant — matched variant (may be null)
 * @returns {boolean}
 */
export function isAddToCartDisabled(variant) {
  if (!variant) return false;
  return variant.stock === 0;
}

/**
 * Build the add-to-cart payload from the current selection.
 *
 * @param {string} productId
 * @param {number} quantity
 * @param {string|null|undefined} size
 * @param {string|null|undefined} colour
 * @returns {{productId: string, quantity: number, size?: string, colour?: string}}
 */
export function buildAddToCartPayload(productId, quantity, size, colour) {
  const payload = { productId, quantity };
  if (size) payload.size = size;
  if (colour) payload.colour = colour;
  return payload;
}

/**
 * Parse the recently-viewed list from a raw localStorage value.
 *
 * @param {string} raw — raw JSON string from localStorage
 * @returns {string[]} array of product IDs
 */
export function parseRecentlyViewed(raw) {
  try {
    const parsed = JSON.parse(raw || '[]');
    return Array.isArray(parsed)
      ? parsed.filter(function (id) {
          return typeof id === 'string';
        })
      : [];
  } catch (_e) {
    return [];
  }
}

/**
 * Add a product ID to the front of the recently-viewed list, deduped and capped.
 *
 * @param {string[]} viewed — current list
 * @param {string} productId — product to add
 * @param {number} [max=8] — maximum entries
 * @returns {string[]} new list
 */
export function addRecentlyViewed(viewed, productId, max = 8) {
  const filtered = viewed.filter(function (id) {
    return id !== productId;
  });
  filtered.unshift(productId);
  return filtered.slice(0, max);
}
