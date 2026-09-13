/**
 * Filters module — handles PLP filter interactions.
 * Vanilla ES module, no framework.
 */

/**
 * Initialize filter sidebar interactions.
 */
export function initFilters() {
  // Mobile filter toggle
  const toggle = document.getElementById('filter-toggle');
  const sidebar = document.getElementById('filter-sidebar');
  if (toggle && sidebar) {
    toggle.addEventListener('click', () => {
      sidebar.classList.toggle('hidden');
      sidebar.classList.toggle('block');
    });
  }

  // Price filter apply button
  const priceApplyBtn = document.querySelector('[onclick*="applyPriceFilter"]');
  if (priceApplyBtn) {
    // Already handled by inline onclick — no additional logic needed
  }
}

/**
 * Build a filter URL preserving existing params.
 * @param {string} key
 * @param {string|null} value
 * @returns {string}
 */
export function buildFilterUrl(key, value) {
  const params = new URLSearchParams(window.location.search);
  if (value === null || value === '') {
    params.delete(key);
  } else {
    params.set(key, value);
  }
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}
