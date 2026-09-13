/**
 * Quick View component — product quick view modal.
 * Vanilla ES module, no framework.
 * Uses event delegation via onAction — no inline handlers in templates.
 */

import { fetchJSON, onAction } from '../utils.js';
import { openModal } from './modal.js';
import { addToCart } from '../cart/ui.js';

/**
 * Open a quick view modal for a product.
 * @param {string} productId
 */
export async function openQuickView(productId) {
  const modal = document.querySelector('[data-quick-view-modal]');
  const content = document.querySelector('[data-quick-view-content]');
  if (!modal || !content) return;

  // Show loading state
  content.innerHTML =
    '<div class="flex items-center justify-center py-12"><svg class="animate-spin w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg></div>';
  openModal('[data-quick-view-modal]');

  try {
    const product = await fetchJSON('/api/products/' + productId);
    content.innerHTML =
      '<div class="grid md:grid-cols-2 gap-6">' +
      '<div class="aspect-square bg-gray-100 rounded-lg overflow-hidden">' +
      '<img src="' +
      (product.primaryImageUrl || '') +
      '" alt="' +
      product.name +
      '" class="w-full h-full object-cover">' +
      '</div>' +
      '<div class="flex flex-col">' +
      '<p class="text-xs text-gray-500 uppercase tracking-wide">' +
      (product.brandName || '') +
      '</p>' +
      '<h2 class="text-xl font-semibold text-ink-900 mt-1" style="font-family: \'Playfair Display\', serif;">' +
      product.name +
      '</h2>' +
      '<p class="text-lg font-medium text-ink-900 mt-2">' +
      (product.priceFormatted || '') +
      '</p>' +
      '<p class="text-sm text-gray-600 mt-3 line-clamp-3">' +
      (product.description || '') +
      '</p>' +
      '<div class="mt-4 flex gap-3">' +
      '<a href="/products/' +
      product.slug +
      '" class="flex-1 text-center px-4 py-3 bg-ink-900 text-white rounded font-medium hover:bg-ink-800 transition-colors">View Details</a>' +
      '<button type="button" data-action="quick-view-add" data-product-id="' +
      product.productId +
      '" class="px-4 py-3 border border-ink-900 text-ink-900 rounded font-medium hover:bg-ink-900 hover:text-white transition-colors">Add to Cart</button>' +
      '</div>' +
      '</div>' +
      '</div>';
  } catch (_e) {
    content.innerHTML = '<p class="text-center text-gray-500 py-12">Could not load product details.</p>';
  }
}

/**
 * Initialize quick view triggers via event delegation.
 * Handles data-action="quick-view" (open modal) and data-action="quick-view-add" (add to cart from modal).
 */
export function initQuickView() {
  onAction('click', 'quick-view', function (event, element) {
    event.preventDefault();
    const productId = element.dataset.productId;
    if (productId) openQuickView(productId);
  });

  onAction('click', 'quick-view-add', function (event, element) {
    event.preventDefault();
    const productId = element.dataset.productId;
    if (productId) addToCart(productId, 1);
  });
}
