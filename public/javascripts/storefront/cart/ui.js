/**
 * Cart UI layer — event delegation and DOM updates for the cart drawer.
 * Vanilla ES module, no framework. Imports pure processors and the API layer.
 */

import { onAction, showToast } from '../utils.js';
import { fetchCart, addCartItem } from './api.js';
import { isCartEmpty, calculateSubtotal, formatPrice, renderEmptyCart, renderCartItems } from './processor.js';

/**
 * Open the cart drawer.
 */
export function openCartDrawer() {
  const drawer = document.getElementById('cart-drawer');
  const overlay = document.getElementById('cart-drawer-overlay');
  if (!drawer || !overlay) return;
  overlay.classList.remove('opacity-0', 'invisible');
  drawer.classList.remove('translate-x-full');
  document.body.style.overflow = 'hidden';
}

/**
 * Close the cart drawer.
 */
export function closeCartDrawer() {
  const drawer = document.getElementById('cart-drawer');
  const overlay = document.getElementById('cart-drawer-overlay');
  if (!drawer || !overlay) return;
  overlay.classList.add('opacity-0', 'invisible');
  drawer.classList.add('translate-x-full');
  document.body.style.overflow = '';
}

/**
 * Fetch cart contents and render in the drawer.
 */
export async function refreshCartDrawer() {
  try {
    const data = await fetchCart();
    renderCart(data);
  } catch (err) {
    console.error('Failed to refresh cart:', err);
  }
}

/**
 * Add an item to the cart via AJAX, then open the drawer.
 * @param {string} productId
 * @param {number} quantity
 * @param {object} variantOptions
 */
export async function addToCart(productId, quantity = 1, variantOptions = {}) {
  try {
    await addCartItem(productId, quantity, variantOptions);
    await refreshCartDrawer();
    openCartDrawer();
  } catch (err) {
    console.error('Add to cart error:', err);
    showToast('Could not add to cart. Please try again.', 'error');
  }
}

/**
 * Render cart items in the drawer.
 * @param {object} cartData
 */
function renderCart(cartData) {
  const itemsContainer = document.getElementById('cart-drawer-items');
  const footer = document.getElementById('cart-drawer-footer');
  const subtotalEl = document.getElementById('cart-drawer-subtotal');
  if (!itemsContainer || !footer) return;

  if (isCartEmpty(cartData)) {
    itemsContainer.innerHTML = renderEmptyCart();
    footer.classList.add('hidden');
    return;
  }

  itemsContainer.innerHTML = renderCartItems(cartData.items);
  const subtotal = cartData.totals && cartData.totals.subtotal != null ? cartData.totals.subtotal : calculateSubtotal(cartData.items);
  if (subtotalEl) subtotalEl.textContent = formatPrice(subtotal);
  footer.classList.remove('hidden');
}

/**
 * Initialize cart drawer event listeners via event delegation.
 */
export function initCartDrawer() {
  onAction('click', 'close-cart-drawer', closeCartDrawer);
  const overlay = document.getElementById('cart-drawer-overlay');
  if (overlay) overlay.addEventListener('click', closeCartDrawer);
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeCartDrawer();
  });
}
