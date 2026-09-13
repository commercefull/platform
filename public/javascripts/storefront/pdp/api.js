/**
 * PDP API layer — data access for product detail pages.
 * Vanilla ES module, no framework. All side-effectful I/O lives here.
 */

/**
 * Subscribe to back-in-stock notifications.
 * @param {string} productId
 * @param {string} email
 * @returns {Promise<boolean>} true on success
 */
export async function subscribeNotifyMe(productId, email) {
  const res = await fetch('/products/' + productId + '/notify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  if (!res.ok) throw new Error('Request failed (' + res.status + ')');
  return true;
}
