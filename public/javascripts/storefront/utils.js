/**
 * Storefront Utilities — shared helpers for all storefront JS modules.
 * Vanilla ES module, no framework.
 */

/**
 * Debounce a function call.
 * @param {Function} fn
 * @param {number} delay — milliseconds
 * @returns {Function}
 */
export function debounce(fn, delay = 300) {
  let timer = null;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

/**
 * Fetch wrapper with JSON parsing and error handling.
 * @param {string} url
 * @param {object} options — fetch options
 * @returns {Promise<any>}
 */
export async function fetchJSON(url, options = {}) {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Request failed (${res.status}): ${body || res.statusText}`);
  }
  return res.json();
}

/**
 * Format a number as currency using Intl.NumberFormat.
 * @param {number} amount
 * @param {string} currency — ISO currency code (e.g. 'USD', 'GBP')
 * @param {string} locale — BCP 47 locale (e.g. 'en-US', 'en-GB')
 * @returns {string}
 */
export function formatCurrency(amount, currency = 'USD', locale = 'en-US') {
  return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(amount);
}

/**
 * Get a URL query parameter value.
 * @param {string} name
 * @param {string} [search] — defaults to window.location.search
 * @returns {string|null}
 */
export function getQueryParam(name, search) {
  const params = new URLSearchParams(search || window.location.search);
  return params.get(name);
}

/**
 * Update URL query parameters without reloading the page.
 * @param {object} params — key-value pairs (null/undefined values are removed)
 */
export function updateQueryParams(params) {
  const url = new URL(window.location.href);
  Object.entries(params).forEach(function (_ref) {
    const key = _ref[0];
    const value = _ref[1];
    if (value === null || value === undefined || value === '') {
      url.searchParams.delete(key);
    } else {
      url.searchParams.set(key, String(value));
    }
  });
  window.history.replaceState({}, '', url.toString());
}

/**
 * Show a toast notification.
 * @param {string} message
 * @param {'success'|'error'|'info'} type
 * @param {number} duration — milliseconds
 */
export function showToast(message, type = 'success', duration = 2500) {
  const toast = document.createElement('div');
  const bg = type === 'error' ? 'bg-red-600' : type === 'info' ? 'bg-gray-800' : 'bg-ink-900';
  toast.className = `fixed bottom-6 right-6 px-4 py-3 rounded shadow-lg text-white text-sm z-[200] ${bg} transition-opacity duration-300`;
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(function () {
    toast.style.opacity = '0';
    setTimeout(function () {
      return toast.remove();
    }, 300);
  }, duration);
}

/**
 * Register a delegated event listener on the document.
 * Matches elements via `closest('[data-action="<action>"]')` so it works
 * for dynamically-added content and uses a single listener per event type.
 *
 * @param {string} eventType — e.g. 'click', 'change', 'submit'
 * @param {string} action — the `data-action` value to match
 * @param {(event: Event, element: Element) => void} handler
 * @returns {() => void} cleanup function that removes the listener
 */
export function onAction(eventType, action, handler) {
  function listener(event) {
    const element = event.target.closest(`[data-action="${action}"]`);
    if (!element) return;
    handler(event, element);
  }
  document.addEventListener(eventType, listener);
  return function off() {
    document.removeEventListener(eventType, listener);
  };
}

/**
 * Register a delegated event listener matching any `[data-action]` element.
 * The handler receives the resolved action string from the element's dataset.
 *
 * @param {string} eventType
 * @param {Record<string, (event: Event, element: Element) => void>} handlers — map of action → handler
 * @returns {() => void} cleanup function
 */
export function onActions(eventType, handlers) {
  function listener(event) {
    const element = event.target.closest('[data-action]');
    if (!element) return;
    const action = element.dataset.action;
    const handler = handlers[action];
    if (handler) handler(event, element);
  }
  document.addEventListener(eventType, listener);
  return function off() {
    document.removeEventListener(eventType, listener);
  };
}

/**
 * Copy text to clipboard.
 * @param {string} text
 * @returns {Promise<boolean>}
 */
export async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (_e) {
    // Fallback for older browsers
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand('copy');
      return true;
    } catch (_e2) {
      return false;
    } finally {
      textarea.remove();
    }
  }
}
