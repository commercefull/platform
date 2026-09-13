/**
 * PLP UI layer — event delegation and DOM updates for product listing pages.
 * Vanilla ES module, no framework. Imports pure processors and the API layer.
 */

import { onAction, showToast } from '../utils.js';
import { loadMoreProducts } from './api.js';
import { viewClassName, buildPriceFilterUrl, resolveFilterUrl, resolveSortUrl, renderProductCards } from './processor.js';

/**
 * Initialize grid/list view toggle via event delegation.
 */
function initViewToggle() {
  const container = document.getElementById('products-container');
  if (!container) return;

  const saved = localStorage.getItem('plp-view') || 'grid';
  applyView(saved);

  onAction('click', 'view-grid', function () {
    applyView('grid');
  });
  onAction('click', 'view-list', function () {
    applyView('list');
  });

  function applyView(view) {
    const gridBtn = document.getElementById('grid-view-btn');
    const listBtn = document.getElementById('list-view-btn');
    container.className = viewClassName(view);
    if (view === 'grid') {
      if (gridBtn) gridBtn.classList.replace('text-gray-400', 'text-ink-900');
      if (listBtn) listBtn.classList.replace('text-ink-900', 'text-gray-400');
    } else {
      if (listBtn) listBtn.classList.replace('text-gray-400', 'text-ink-900');
      if (gridBtn) gridBtn.classList.replace('text-ink-900', 'text-gray-400');
    }
    localStorage.setItem('plp-view', view);
  }
}

/**
 * Initialize mobile filter sidebar toggle via event delegation.
 */
function initFilterToggle() {
  onAction('click', 'toggle-filters', function () {
    const sidebar = document.getElementById('filter-sidebar');
    if (sidebar) {
      sidebar.classList.toggle('hidden');
      sidebar.classList.toggle('block');
    }
  });
}

/**
 * Initialize filter checkboxes via event delegation.
 */
function initFilterCheckboxes() {
  onAction('change', 'filter-navigate', function (_event, element) {
    const url = resolveFilterUrl(element.checked, element.dataset.urlChecked, element.dataset.urlUnchecked);
    if (url) window.location.href = url;
  });
}

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
 * Initialize price filter apply button via event delegation.
 */
function initPriceFilter() {
  onAction('click', 'apply-price-filter', function () {
    const minInput = document.querySelector('input[name="priceMin"]');
    const maxInput = document.querySelector('input[name="priceMax"]');
    const url = buildPriceFilterUrl(window.location.search, minInput && minInput.value, maxInput && maxInput.value);
    window.location.href = url;
  });
}

/**
 * Initialize infinite scroll / load more.
 */
function initInfiniteScroll() {
  const loadMoreBtn = document.querySelector('[data-load-more]');
  const container = document.getElementById('products-container');
  if (!loadMoreBtn || !container) return;

  const nextPageUrl = loadMoreBtn.getAttribute('data-next-page');
  if (!nextPageUrl) return;

  let loading = false;

  async function loadMore() {
    if (loading) return;
    loading = true;
    loadMoreBtn.textContent = 'Loading...';
    loadMoreBtn.disabled = true;

    try {
      const data = await loadMoreProducts(nextPageUrl);
      if (data.products && data.products.length > 0) {
        container.insertAdjacentHTML('beforeend', renderProductCards(data.products));
      }
      if (data.pagination && data.pagination.hasNext) {
        loadMoreBtn.setAttribute('data-next-page', data.pagination.nextUrl);
        loadMoreBtn.textContent = 'Load More';
        loadMoreBtn.disabled = false;
      } else {
        loadMoreBtn.remove();
      }
    } catch (err) {
      console.error('Load more error:', err);
      showToast('Failed to load more products', 'error');
      loadMoreBtn.textContent = 'Load More';
      loadMoreBtn.disabled = false;
    }
    loading = false;
  }

  loadMoreBtn.addEventListener('click', loadMore);

  const observer = new IntersectionObserver(
    function (entries) {
      if (entries[0].isIntersecting) loadMore();
    },
    { rootMargin: '200px' },
  );
  observer.observe(loadMoreBtn);
}

/**
 * Initialize all PLP behaviors.
 */
export function initPLP() {
  initViewToggle();
  initFilterToggle();
  initFilterCheckboxes();
  initSort();
  initPriceFilter();
  initInfiniteScroll();
}
