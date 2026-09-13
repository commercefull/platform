/**
 * Cart API layer — data access for the cart drawer.
 * Vanilla ES module, no framework. All side-effectful I/O lives here.
 */

/**
 * Fetch the current cart as JSON.
 * @returns {Promise<object>} cart payload with `items` and `totals`
 */
export async function fetchCart() {
  const res = await fetch('/basket/json');
  if (!res.ok) throw new Error('Failed to fetch cart (' + res.status + ')');
  return res.json();
}

/**
 * Add an item to the cart.
 * @param {string} productId
 * @param {number} quantity
 * @param {object} [variantOptions] — optional { size, colour }
 * @returns {Promise<object>} updated cart response
 */
export async function addCartItem(productId, quantity = 1, variantOptions = {}) {
  const res = await fetch('/basket/add', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ productId, quantity, ...variantOptions }),
  });
  if (!res.ok) throw new Error('Failed to add to cart (' + res.status + ')');
  return res.json();
}

/**
 * Update the quantity of a cart item.
 * @param {string} itemId
 * @param {number} quantity
 * @returns {Promise<object>}
 */
export async function updateCartItem(itemId, quantity) {
  const res = await fetch('/basket/update', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ itemId, quantity }),
  });
  if (!res.ok) throw new Error('Update failed (' + res.status + ')');
  return res.json();
}

/**
 * Remove an item from the cart.
 * @param {string} itemId
 * @returns {Promise<object>}
 */
export async function removeCartItem(itemId) {
  const res = await fetch('/basket/remove', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ itemId }),
  });
  if (!res.ok) throw new Error('Remove failed (' + res.status + ')');
  return res.json();
}
