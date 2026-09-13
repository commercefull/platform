/**
 * Header API layer — data access for header search autocomplete.
 * Vanilla ES module, no framework. All side-effectful I/O lives here.
 */

import { fetchJSON } from '../utils.js';

/**
 * Fetch autocomplete suggestions for a search query.
 * @param {string} query — search term
 * @returns {Promise<object>} raw payload with `products`, `brands`, `categories`
 */
export async function fetchAutocomplete(query) {
  return fetchJSON('/search/autocomplete?q=' + encodeURIComponent(query));
}
