/**
 * PLP processor — pure business logic for product listing pages.
 * No DOM, no fetch. Fully testable in Node without jsdom.
 */

/**
 * Apply a grid or list view to a container's class list.
 * Returns the new className string; does not mutate the DOM.
 *
 * @param {string} view — 'grid' or 'list'
 * @returns {string} className for the products container
 */
export function viewClassName(view) {
  if (view === 'list') return 'flex flex-col gap-4 mb-8';
  return 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-8';
}

/**
 * Build the URL for a price filter from min/max inputs.
 *
 * @param {string} currentSearch — current `window.location.search` value
 * @param {string|null|undefined} min
 * @param {string|null|undefined} max
 * @returns {string} full URL to navigate to
 */
export function buildPriceFilterUrl(currentSearch, min, max) {
  const params = new URLSearchParams(currentSearch || '');
  if (min) params.set('priceMin', min);
  else params.delete('priceMin');
  if (max) params.set('priceMax', max);
  else params.delete('priceMax');
  return '/products?' + params.toString();
}

/**
 * Resolve the navigation URL for a filter checkbox change.
 *
 * @param {boolean} checked — new checked state
 * @param {string} urlChecked — URL to navigate to when checked
 * @param {string} urlUnchecked — URL to navigate to when unchecked
 * @returns {string|null} URL or null if missing
 */
export function resolveFilterUrl(checked, urlChecked, urlUnchecked) {
  const url = checked ? urlChecked : urlUnchecked;
  return url || null;
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

/**
 * Escape a string for safe interpolation into HTML text content or attributes.
 * @param {string} value
 * @returns {string}
 */
export function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '\u0026amp;')
    .replace(/</g, '\u0026lt;')
    .replace(/>/g, '\u0026gt;')
    .replace(/"/g, '\u0026quot;')
    .replace(/'/g, '\u0026#39;');
}

/**
 * Render a single product card as an HTML string for the listing grid.
 * Pure — no DOM access. Escapes user-supplied strings to prevent XSS.
 *
 * @param {object} product — product with slug, name, primaryImageUrl, priceFormatted
 * @returns {string} HTML string
 */
export function renderProductCard(product) {
  const slug = escapeHtml(product.slug || '');
  const name = escapeHtml(product.name || '');
  const image = escapeHtml(product.primaryImageUrl || '');
  const price = escapeHtml(product.priceFormatted || '');
  return (
    '<div class="product-card">' +
    '<a href="/products/' +
    slug +
    '">' +
    (image ? '<img src="' + image + '" alt="' + name + '" loading="lazy" class="w-full aspect-square object-cover">' : '') +
    '<h3 class="mt-2 text-sm font-medium text-ink-900">' +
    name +
    '</h3>' +
    '<p class="text-sm text-gray-600">' +
    price +
    '</p>' +
    '</a>' +
    '</div>'
  );
}

/**
 * Render an array of products into a single HTML string.
 *
 * @param {object[]} products
 * @returns {string}
 */
export function renderProductCards(products) {
  return (products || []).map(renderProductCard).join('');
}
