/**
 * Header UI layer — event delegation and DOM updates for the site header.
 * Vanilla ES module, no framework. Imports pure processors and the API layer.
 */

import { debounce, onAction } from '../utils.js';
import { fetchAutocomplete } from './api.js';
import { buildAutocompleteSuggestions, nextSelectedIndex, buildCurrencyUrl, renderAutocomplete } from './processor.js';

function initMobileMenu() {
  const drawer = document.querySelector('[data-mobile-menu]');
  const overlay = document.querySelector('[data-mobile-menu-overlay]');
  if (!drawer) return;

  function open() {
    drawer.classList.remove('-translate-x-full');
    if (overlay) overlay.classList.remove('opacity-0', 'invisible');
    document.body.style.overflow = 'hidden';
  }

  function close() {
    drawer.classList.add('-translate-x-full');
    if (overlay) overlay.classList.add('opacity-0', 'invisible');
    document.body.style.overflow = '';
  }

  onAction('click', 'open-mobile-menu', function () {
    open();
  });
  if (overlay) overlay.addEventListener('click', close);
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') close();
  });
}

function initMegaMenu() {
  const items = document.querySelectorAll('[data-mega-menu-item]');
  items.forEach(function (item) {
    const panel = item.querySelector('[data-mega-menu-panel]');
    if (!panel) return;
    let hoverTimer = null;

    function open() {
      clearTimeout(hoverTimer);
      panel.classList.remove('opacity-0', 'invisible', 'pointer-events-none');
      item.querySelector('[data-mega-menu-trigger]').setAttribute('aria-expanded', 'true');
    }

    function close() {
      hoverTimer = setTimeout(function () {
        panel.classList.add('opacity-0', 'invisible', 'pointer-events-none');
        item.querySelector('[data-mega-menu-trigger]').setAttribute('aria-expanded', 'false');
      }, 150);
    }

    item.addEventListener('mouseenter', open);
    item.addEventListener('mouseleave', close);
    const trigger = item.querySelector('[data-mega-menu-trigger]');
    if (trigger) {
      trigger.addEventListener('focus', open);
      trigger.addEventListener('blur', close);
    }
  });
}

function initSearchAutocomplete() {
  const input = document.querySelector('[data-search-input]');
  const resultsContainer = document.querySelector('[data-search-autocomplete]');
  if (!input || !resultsContainer) return;

  let results = [];
  let selectedIndex = -1;

  function render(items) {
    results = items;
    if (!items || items.length === 0) {
      resultsContainer.classList.add('hidden');
      resultsContainer.innerHTML = '';
      return;
    }
    resultsContainer.innerHTML = renderAutocomplete(items, selectedIndex);
    resultsContainer.classList.remove('hidden');
  }

  const performSearch = debounce(async function (query) {
    if (!query || query.length < 2) {
      resultsContainer.classList.add('hidden');
      return;
    }
    try {
      const data = await fetchAutocomplete(query);
      render(buildAutocompleteSuggestions(data));
    } catch (_e) {
      resultsContainer.classList.add('hidden');
    }
  }, 300);

  input.addEventListener('input', function (e) {
    performSearch(e.target.value);
  });

  input.addEventListener('focus', function () {
    if (results.length > 0) resultsContainer.classList.remove('hidden');
  });

  input.addEventListener('keydown', function (e) {
    if (results.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      selectedIndex = nextSelectedIndex(selectedIndex, 1, results.length);
      resultsContainer.innerHTML = renderAutocomplete(results, selectedIndex);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      selectedIndex = nextSelectedIndex(selectedIndex, -1, results.length);
      resultsContainer.innerHTML = renderAutocomplete(results, selectedIndex);
    } else if (e.key === 'Enter' && selectedIndex >= 0) {
      e.preventDefault();
      const item = results[selectedIndex];
      if (item && item.url) window.location.href = item.url;
    } else if (e.key === 'Escape') {
      resultsContainer.classList.add('hidden');
      input.blur();
    }
  });

  document.addEventListener('click', function (e) {
    if (!input.contains(e.target) && !resultsContainer.contains(e.target)) {
      resultsContainer.classList.add('hidden');
    }
  });
}

function initCurrencySwitcher() {
  onAction('change', 'switch-currency', function (_event, element) {
    window.location.href = buildCurrencyUrl(window.location.href, element.value);
  });
}

export function initHeader() {
  initMobileMenu();
  initMegaMenu();
  initSearchAutocomplete();
  initCurrencySwitcher();
}
