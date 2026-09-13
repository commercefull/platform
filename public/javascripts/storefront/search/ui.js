/**
 * Search UI layer — event delegation and DOM updates for the search page.
 * Vanilla ES module, no framework. Imports pure processors.
 */

import { onAction } from '../utils.js';
import { parseRecentSearches, addRecentSearch, resolveSortUrl } from './processor.js';

/**
 * Initialize sort dropdown via event delegation.
 */
function initSort() {
  onAction('change', 'sort-change', function (_event, element) {
    const url = resolveSortUrl(element.selectedIndex, element.options);
    if (url) window.location.href = url;
  });
}

/**
 * Save the current search query to localStorage and render recent searches.
 */
function initRecentSearches() {
  const searchInput = document.querySelector('[data-search-input]');
  const form = searchInput && searchInput.closest('form');
  const recentContainer = document.getElementById('recent-searches');
  const recentList = document.getElementById('recent-searches-list');

  // Save search on form submit
  if (form && searchInput) {
    form.addEventListener('submit', function () {
      const term = searchInput.value.trim();
      if (!term) return;
      try {
        const recent = parseRecentSearches(localStorage.getItem('recentSearches'));
        const updated = addRecentSearch(recent, term);
        localStorage.setItem('recentSearches', JSON.stringify(updated));
      } catch (_e) {
        // localStorage might be unavailable
      }
    });
  }

  // Render recent searches on the initial state page
  if (recentContainer && recentList) {
    try {
      const recent = parseRecentSearches(localStorage.getItem('recentSearches'));
      if (recent.length > 0) {
        recentList.innerHTML = recent
          .map(function (term) {
            return (
              '<a href="/search?q=' +
              encodeURIComponent(term) +
              '" class="px-4 py-2 bg-white border border-gray-200 rounded-full text-sm text-gray-700 hover:border-ink-900 hover:text-ink-900 transition-colors">' +
              term +
              '</a>'
            );
          })
          .join('');
        recentContainer.classList.remove('hidden');
      }
    } catch (_e) {
      // localStorage might be unavailable
    }
  }
}

/**
 * Initialize all search page behaviors.
 */
export function initSearch() {
  initSort();
  initRecentSearches();
}
