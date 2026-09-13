/**
 * Basket UI layer — event delegation and DOM updates for the basket page.
 * Vanilla ES module, no framework. Imports pure processors and the API layer.
 */

import { onAction, showToast } from '../utils.js';
import { updateBasketItem, removeBasketItem, applyCoupon } from './api.js';
import { computeNewQuantity, isValidCouponCode, buildRemoveConfirmation } from './processor.js';

function initQuantityControls() {
  onAction('click', 'basket-qty-decrease', function (_event, element) {
    const basketItemId = element.dataset.basketItemId;
    const currentQty = parseInt(element.dataset.quantity, 10);
    if (!basketItemId || isNaN(currentQty)) return;
    const newQty = computeNewQuantity(currentQty, -1);
    if (newQty < 0) return;
    updateBasketItem(basketItemId, newQty)
      .then(function () {
        window.location.reload();
      })
      .catch(function () {
        showToast('Failed to update quantity', 'error');
      });
  });

  onAction('click', 'basket-qty-increase', function (_event, element) {
    const basketItemId = element.dataset.basketItemId;
    const currentQty = parseInt(element.dataset.quantity, 10);
    if (!basketItemId || isNaN(currentQty)) return;
    const newQty = computeNewQuantity(currentQty, 1);
    updateBasketItem(basketItemId, newQty)
      .then(function () {
        window.location.reload();
      })
      .catch(function () {
        showToast('Failed to update quantity', 'error');
      });
  });
}

function initRemoveButtons() {
  onAction('click', 'basket-remove', function (_event, element) {
    const basketItemId = element.dataset.basketItemId;
    const itemName = element.dataset.itemName || '';
    if (!basketItemId) return;
    if (!window.confirm(buildRemoveConfirmation(itemName))) return;
    removeBasketItem(basketItemId)
      .then(function () {
        window.location.reload();
      })
      .catch(function () {
        showToast('Failed to remove item', 'error');
      });
  });
}

function initCouponForm() {
  onAction('click', 'basket-apply-coupon', function (_event, element) {
    const input = document.getElementById('coupon-code');
    const msgEl = document.getElementById('coupon-message');
    const basketId = element.dataset.basketId;
    if (!input || !basketId) return;
    const code = input.value.trim();
    if (!isValidCouponCode(code)) {
      if (msgEl) {
        msgEl.className = 'mt-2 text-sm text-red-600';
        msgEl.textContent = 'Please enter a coupon code';
        msgEl.classList.remove('hidden');
      }
      return;
    }
    applyCoupon(basketId, code)
      .then(function () {
        if (msgEl) {
          msgEl.className = 'mt-2 text-sm text-green-600';
          msgEl.textContent = 'Coupon applied successfully!';
          msgEl.classList.remove('hidden');
        }
        setTimeout(function () {
          window.location.reload();
        }, 1000);
      })
      .catch(function (err) {
        if (msgEl) {
          msgEl.className = 'mt-2 text-sm text-red-600';
          msgEl.textContent = err.message || 'Invalid coupon code';
          msgEl.classList.remove('hidden');
        }
      });
  });
}

export function initBasket() {
  initQuantityControls();
  initRemoveButtons();
  initCouponForm();
}
