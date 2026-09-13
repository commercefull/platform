/**
 * Basket API layer — data access for the basket page.
 * Vanilla ES module, no framework. All side-effectful I/O lives here.
 */

/**
 * Update the quantity of a basket item.
 * @param {string} basketItemId
 * @param {number} quantity
 * @returns {Promise<{success: boolean}>}
 */
export async function updateBasketItem(basketItemId, quantity) {
  const res = await fetch('/basket/item/' + basketItemId, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ quantity }),
  });
  if (!res.ok) throw new Error('Failed to update quantity (' + res.status + ')');
  return res.json();
}

/**
 * Remove an item from the basket.
 * @param {string} basketItemId
 * @returns {Promise<{success: boolean}>}
 */
export async function removeBasketItem(basketItemId) {
  const res = await fetch('/basket/item/' + basketItemId, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to remove item (' + res.status + ')');
  return res.json();
}

/**
 * Apply a coupon code to the basket.
 * @param {string} basketId
 * @param {string} code
 * @returns {Promise<object>} response with success or error message
 */
export async function applyCoupon(basketId, code) {
  const res = await fetch('/basket/' + basketId + '/coupon', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Invalid coupon code');
  }
  return data;
}
