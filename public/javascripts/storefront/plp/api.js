/**
 * PLP API layer — data access for product listing pages.
 * Vanilla ES module, no framework.
 * All side-effectful I/O lives here; processors stay pure.
 */

import { fetchJSON } from '../utils.js';

/**
 * Fetch the next page of products as JSON.
 * @param {string} url — full URL (may already include query params)
 * @returns {Promise<object>} server payload with `products` and `pagination`
 */
export async function loadMoreProducts(url) {
  const separator = url.includes('?') ? '&' : '?';
  return fetchJSON(url + separator + 'format=json');
}
