/**
 * Basket processor — pure business logic for the basket page.
 * No DOM, no fetch. Fully testable in Node without jsdom.
 */

/**
 * Validate a quantity value for a basket item update.
 * @param {number} currentQuantity
 * @param {number} delta — +1 or -1
 * @returns {number} new quantity, or -1 if invalid (below 1)
 */
export function computeNewQuantity(currentQuantity, delta) {
  const newQty = (currentQuantity || 0) + delta;
  return newQty >= 1 ? newQty : -1;
}

/**
 * Determine if the decrease button should be disabled.
 * @param {number} quantity
 * @returns {boolean}
 */
export function isDecreaseDisabled(quantity) {
  return quantity <= 1;
}

/**
 * Validate a coupon code before submission.
 * @param {string} code
 * @returns {boolean}
 */
export function isValidCouponCode(code) {
  return !!(code && code.trim().length > 0);
}

/**
 * Build the confirmation message for item removal.
 * @param {string} itemName
 * @returns {string}
 */
export function buildRemoveConfirmation(itemName) {
  return 'Remove "' + (itemName || 'this item') + '" from your cart?';
}
