/**
 * PDP UI layer — event delegation and DOM updates for product detail pages.
 * Vanilla ES module, no framework. Imports pure processors and the API layer.
 */

import { onAction, copyToClipboard, showToast } from '../utils.js';
import { addToCart } from '../cart/ui.js';
import { subscribeNotifyMe } from './api.js';
import {
  findVariant,
  applyQuantityDelta,
  stockStatusHtml,
  isAddToCartDisabled,
  buildAddToCartPayload,
  parseRecentlyViewed,
  addRecentlyViewed,
} from './processor.js';

let selectedSize = null;
let selectedColour = null;

/**
 * Update SKU, price, stock, and image based on selected variant.
 */
function updateVariant() {
  const skuDisplay = document.querySelector('[data-variant-sku]');
  const priceDisplay = document.querySelector('[data-variant-price]');
  const stockDisplay = document.querySelector('[data-variant-stock]');
  const mainImage = document.querySelector('[data-gallery-main]');
  const addToCartBtn = document.querySelector('[data-add-to-cart-btn]');

  const variants = window.__productVariants || [];
  const match = findVariant(variants, selectedSize, selectedColour);
  if (!match) return;

  if (skuDisplay) skuDisplay.textContent = match.sku;
  if (priceDisplay) priceDisplay.textContent = match.priceFormatted || priceDisplay.textContent;
  if (stockDisplay) stockDisplay.innerHTML = stockStatusHtml(match.stock);
  if (match.imageUrl && mainImage) mainImage.src = match.imageUrl;
  if (addToCartBtn) {
    addToCartBtn.disabled = isAddToCartDisabled(match);
    addToCartBtn.dataset.variantId = match.variantId || '';
  }
}

function initVariantSelector() {
  const hasVariants = document.querySelector('[data-action="select-size"], [data-action="select-colour"]');
  if (!hasVariants) return;

  onAction('click', 'select-size', function (_event, element) {
    selectedSize = element.dataset.size || null;
    document.querySelectorAll('[data-action="select-size"]').forEach(function (btn) {
      btn.classList.remove('bg-ink-900', 'text-white', 'border-ink-900');
      btn.classList.add('border-gray-300', 'text-ink-900');
    });
    element.classList.add('bg-ink-900', 'text-white', 'border-ink-900');
    element.classList.remove('border-gray-300', 'text-ink-900');
    const label = document.getElementById('selected-size');
    if (label) label.textContent = (selectedSize || '').toUpperCase();
    updateVariant();
  });

  onAction('click', 'select-colour', function (_event, element) {
    selectedColour = element.dataset.colour || null;
    document.querySelectorAll('[data-action="select-colour"]').forEach(function (btn) {
      btn.classList.remove('ring-2', 'ring-ink-900', 'ring-offset-1', 'border-ink-900');
      btn.classList.add('border-gray-300');
    });
    element.classList.add('ring-2', 'ring-ink-900', 'ring-offset-1', 'border-ink-900');
    element.classList.remove('border-gray-300');
    const label = document.getElementById('selected-colour');
    if (label) label.textContent = element.dataset.colourLabel || selectedColour;
    updateVariant();
  });
}

function initQuantityControls() {
  onAction('click', 'qty-decrease', function () {
    const input = document.querySelector('[data-qty-input]');
    if (!input) return;
    input.value = String(applyQuantityDelta(input.value, -1));
  });

  onAction('click', 'qty-increase', function () {
    const input = document.querySelector('[data-qty-input]');
    if (!input) return;
    input.value = String(applyQuantityDelta(input.value, 1));
  });
}

function initAddToCart() {
  onAction('click', 'add-to-cart', function (event, element) {
    event.preventDefault();
    const productId = element.dataset.productId;
    if (!productId) return;
    const qtyInput = document.querySelector('[data-qty-input]');
    const quantity = qtyInput ? parseInt(qtyInput.value, 10) || 1 : 1;
    const payload = buildAddToCartPayload(productId, quantity, selectedSize, selectedColour);
    addToCart(payload.productId, payload.quantity, { size: payload.size, colour: payload.colour });
  });
}

function initTabs() {
  const tabs = document.querySelectorAll('[data-tab]');
  const panels = document.querySelectorAll('[data-tab-panel]');
  if (tabs.length === 0) return;

  tabs.forEach(function (tab) {
    tab.addEventListener('click', function () {
      const target = tab.dataset.tab;
      tabs.forEach(function (t) {
        return t.classList.remove('border-ink-900', 'text-ink-900');
      });
      tab.classList.add('border-ink-900', 'text-ink-900');
      panels.forEach(function (panel) {
        if (panel.dataset.tabPanel === target) panel.classList.remove('hidden');
        else panel.classList.add('hidden');
      });
    });
  });
}

function initShare() {
  onAction('click', 'share-copy', async function (event) {
    event.preventDefault();
    const ok = await copyToClipboard(window.location.href);
    showToast(ok ? 'Link copied!' : 'Could not copy link', ok ? 'success' : 'error');
  });
}

function initSizeGuide() {
  const modal = document.querySelector('[data-size-guide-modal]');
  if (!modal) return;

  function open() {
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    document.body.style.overflow = 'hidden';
  }

  function close() {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
    document.body.style.overflow = '';
  }

  onAction('click', 'open-size-guide', function (event) {
    event.preventDefault();
    open();
  });

  modal.addEventListener('click', function (e) {
    if (e.target === modal) close();
  });

  const closeBtn = modal.querySelector('[data-size-guide-close]');
  if (closeBtn) closeBtn.addEventListener('click', close);

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') close();
  });
}

function initNotifyMe() {
  const form = document.querySelector('[data-notify-me-form]');
  if (!form) return;
  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    const email = form.querySelector('[name="email"]')?.value;
    const productId = form.dataset.productId;
    if (!email || !productId) return;
    try {
      await subscribeNotifyMe(productId, email);
      showToast('You will be notified when this item is back in stock.', 'success');
      form.reset();
    } catch (_e) {
      showToast('Could not subscribe. Please try again.', 'error');
    }
  });
}

function initRecentlyViewed() {
  const productId = document.querySelector('[data-product-id]')?.dataset.productId;
  if (!productId) return;
  try {
    const viewed = parseRecentlyViewed(localStorage.getItem('recentlyViewed'));
    const updated = addRecentlyViewed(viewed, productId);
    localStorage.setItem('recentlyViewed', JSON.stringify(updated));
  } catch (_e) {
    // localStorage might be unavailable
  }
}

export function initPDP() {
  initVariantSelector();
  initQuantityControls();
  initAddToCart();
  initTabs();
  initShare();
  initSizeGuide();
  initNotifyMe();
  initRecentlyViewed();
}
