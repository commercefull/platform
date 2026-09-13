/**
 * Cart processor — pure business logic for the cart drawer.
 * No DOM, no fetch. Fully testable in Node without jsdom.
 */

/**
 * Calculate the line total for a cart item.
 *
 * @param {object} item — must have `price` (string|number) and `quantity` (number)
 * @returns {number} line total as a number
 */
export function lineTotal(item) {
  const price = parseFloat(item.price) || 0;
  const qty = parseInt(item.quantity, 10) || 0;
  return price * qty;
}

/**
 * Format a numeric amount as a USD price string.
 *
 * @param {number} amount
 * @returns {string} e.g. "$12.50"
 */
export function formatPrice(amount) {
  return '$' + (Number(amount) || 0).toFixed(2);
}

/**
 * Calculate the cart subtotal from an array of items.
 *
 * @param {object[]} items
 * @returns {number}
 */
export function calculateSubtotal(items) {
  return (items || []).reduce(function (sum, item) {
    return sum + lineTotal(item);
  }, 0);
}

/**
 * Determine whether the cart is empty.
 *
 * @param {object} cartData — must have `items` array
 * @returns {boolean}
 */
export function isCartEmpty(cartData) {
  return !cartData || !cartData.items || cartData.items.length === 0;
}

/**
 * Escape a string for safe HTML interpolation.
 * @param {string} value
 * @returns {string}
 */
export function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '\u0026amp;')
    .replace(/</g, '\u0026lt;')
    .replace(/>/g, '\u0026gt;')
    .replace(/"/g, '\u0026quot;')
    .replace(/'/g, '\u0026#39;');
}

/**
 * Render the empty-cart placeholder HTML.
 * @returns {string}
 */
export function renderEmptyCart() {
  return (
    '<div class="text-center py-12 text-gray-400">' +
    '<svg class="w-16 h-16 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">' +
    '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.1 5H19M7 13v8a2 2 0 002 2h10a2 2 0 002-2v-3"></path>' +
    '</svg>' +
    '<p class="text-sm">Your cart is empty</p>' +
    '</div>'
  );
}

/**
 * Render a single cart item row as an HTML string.
 * @param {object} item — must have `name`, `quantity`, `price`, and optionally `image`
 * @returns {string}
 */
export function renderCartItem(item) {
  const name = escapeHtml(item.name || '');
  const image = escapeHtml(item.image || '');
  const imgTag = image ? '<img src="' + image + '" alt="' + name + '" class="w-full h-full object-cover">' : '';
  return (
    '<div class="flex gap-3">' +
    '<div class="w-16 h-20 bg-gray-100 rounded overflow-hidden flex-shrink-0">' +
    imgTag +
    '</div>' +
    '<div class="flex-1 min-w-0">' +
    '<p class="text-sm font-medium text-ink-900 truncate">' +
    name +
    '</p>' +
    '<p class="text-xs text-gray-500">Qty: ' +
    item.quantity +
    '</p>' +
    '<p class="text-sm font-semibold text-ink-900 mt-1">' +
    formatPrice(lineTotal(item)) +
    '</p>' +
    '</div>' +
    '</div>'
  );
}

/**
 * Render all cart items as a single HTML string.
 * @param {object[]} items
 * @returns {string}
 */
export function renderCartItems(items) {
  return (items || []).map(renderCartItem).join('');
}
