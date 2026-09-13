/**
 * Wishlist module — handles add-to-wishlist interactions.
 * Vanilla ES module, no framework.
 * Uses event delegation via onAction — no inline handlers in templates.
 */

import { onAction, showToast } from './utils.js';

/**
 * Add a product to the wishlist via the customer API.
 * @param {string} productId
 */
export async function addToWishlist(productId) {
  try {
    const res = await fetch('/customer/wishlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId }),
    });
    if (!res.ok) {
      throw new Error(`Failed to add to wishlist (status ${res.status})`);
    }
    showToast('Added to wishlist');
  } catch (err) {
    console.error('Wishlist error:', err);
    showToast('Could not add to wishlist. Please sign in.', 'error');
  }
}

/**
 * Initialize wishlist buttons via event delegation.
 * Handles all elements with data-action="wishlist-add" and data-product-id.
 */
export function initWishlist() {
  onAction('click', 'wishlist-add', function (event, element) {
    event.preventDefault();
    const productId = element.dataset.productId;
    if (productId) addToWishlist(productId);
  });
}
