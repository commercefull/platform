/**
 * Search processor — pure business logic for search page.
 * No DOM, no fetch. Fully testable in Node without jsdom.
 */

/**
 * Parse the recent searches list from a raw localStorage value.
 *
 * @param {string} raw — raw JSON string from localStorage
 * @param {number} [max=5] — maximum entries
 * @returns {string[]} array of search terms
 */
export function parseRecentSearches(raw, max = 5) {
  try {
    const parsed = JSON.parse(raw || '[]');
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(function (term) {
        return typeof term === 'string' && term.length > 0;
      })
      .slice(0, max);
  } catch (_e) {
    return [];
  }
}

/**
 * Add a search term to the front of the recent searches list, deduped and capped.
 *
 * @param {string[]} recent — current list
 * @param {string} term — search term to add
 * @param {number} [max=5] — maximum entries
 * @returns {string[]} new list
 */
export function addRecentSearch(recent, term, max = 5) {
  const trimmed = (term || '').trim();
  if (!trimmed) return recent || [];
  const filtered = (recent || []).filter(function (t) {
    return t.toLowerCase() !== trimmed.toLowerCase();
  });
  filtered.unshift(trimmed);
  return filtered.slice(0, max);
}

/**
 * Build the URL for a sort change on the search page.
 *
 * @param {string} searchQuery — current search query
 * @param {string} sort — sort value
 * @returns {string} full URL
 */
export function buildSortUrl(searchQuery, sort) {
  return '/search?q=' + encodeURIComponent(searchQuery) + '&sort=' + sort;
}

/**
 * Resolve the navigation URL for a sort `<select>` change.
 *
 * @param {number} selectedIndex — `select.selectedIndex`
 * @param {HTMLOptionElement[]|Array<{dataset?: {url?: string}}>} options — option list
 * @returns {string|null} URL or null if missing
 */
export function resolveSortUrl(selectedIndex, options) {
  const option = options[selectedIndex];
  return option && option.dataset && option.dataset.url ? option.dataset.url : null;
}
