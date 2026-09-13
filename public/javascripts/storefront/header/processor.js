/**
 * Header processor — pure business logic for header search and navigation.
 * No DOM, no fetch. Fully testable in Node without jsdom.
 */

/**
 * Map a raw autocomplete API response into a flat list of suggestions.
 *
 * @param {object} data — raw API response with `products`, `brands`, `categories`
 * @param {number} [maxProducts=5]
 * @param {number} [maxBrands=3]
 * @param {number} [maxCategories=3]
 * @returns {Array<{type: string, name: string, url: string, image?: string}>}
 */
export function buildAutocompleteSuggestions(data, maxProducts = 5, maxBrands = 3, maxCategories = 3) {
  const products = (data && data.products ? data.products : []).slice(0, maxProducts).map(function (p) {
    return { type: 'product', name: p.name, url: p.url || '/products/' + p.slug, image: p.image };
  });
  const brands = (data && data.brands ? data.brands : []).slice(0, maxBrands).map(function (b) {
    return { type: 'brand', name: b.name, url: '/brands/' + b.slug };
  });
  const categories = (data && data.categories ? data.categories : []).slice(0, maxCategories).map(function (c) {
    return { type: 'category', name: c.name, url: '/categories/' + c.slug };
  });
  return products.concat(brands, categories);
}

/**
 * Get a human-readable label for a suggestion type.
 * @param {string} type
 * @returns {string}
 */
export function suggestionTypeLabel(type) {
  if (type === 'product') return 'Product';
  if (type === 'brand') return 'Brand';
  if (type === 'category') return 'Category';
  return '';
}

/**
 * Compute the next selected index for keyboard navigation.
 *
 * @param {number} current — current index (-1 = none)
 * @param {number} delta — +1 for ArrowDown, -1 for ArrowUp
 * @param {number} length — number of results
 * @returns {number} new index, clamped
 */
export function nextSelectedIndex(current, delta, length) {
  if (length === 0) return -1;
  if (delta > 0) return Math.min(current + 1, length - 1);
  return Math.max(current - 1, -1);
}

/**
 * Build the URL for currency switching.
 *
 * @param {string} currentHref — `window.location.href`
 * @param {string} currency — currency code
 * @returns {string} new URL
 */
export function buildCurrencyUrl(currentHref, currency) {
  const url = new URL(currentHref);
  url.searchParams.set('currency', currency);
  return url.toString();
}

/**
 * Escape a string for safe HTML interpolation.
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
 * Render autocomplete suggestions as an HTML string.
 *
 * @param {Array<{type: string, name: string, url: string, image?: string}>} items
 * @param {number} [selectedIndex=-1]
 * @returns {string}
 */
export function renderAutocomplete(items, selectedIndex = -1) {
  return (items || [])
    .map(function (item, index) {
      const label = suggestionTypeLabel(item.type);
      const name = escapeHtml(item.name || '');
      const url = escapeHtml(item.url || '#');
      const img = item.image ? '<img src="' + escapeHtml(item.image) + '" alt="" class="w-10 h-10 object-cover rounded">' : '';
      const selectedClass = index === selectedIndex ? 'bg-gray-50' : '';
      return (
        '<a href="' +
        url +
        '" data-autocomplete-index="' +
        index +
        '" class="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 ' +
        selectedClass +
        '">' +
        img +
        '<div class="flex-1 min-w-0">' +
        '<p class="text-sm font-medium text-ink-900 truncate">' +
        name +
        '</p>' +
        '<p class="text-xs text-gray-500">' +
        label +
        '</p>' +
        '</div>' +
        '</a>'
      );
    })
    .join('');
}
