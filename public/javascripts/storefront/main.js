/**
 * Storefront Main JavaScript
 * Entry point for all storefront client-side behavior.
 * Vanilla ES modules — no framework.
 *
 * All interactivity is wired via event delegation (onAction) using
 * data-action attributes in templates. No inline event handlers.
 */

import { initNavigation } from './navigation.js';
import { initWishlist } from './wishlist.js';
import { initCartDrawer } from './cart/ui.js';
import { initBasket } from './basket/ui.js';
import { initFilters } from './filters.js';
import { initProductGallery } from './product-gallery.js';
import { initHeader } from './header/ui.js';
import { initPLP } from './plp/ui.js';
import { initPDP } from './pdp/ui.js';
import { initHome } from './home/ui.js';
import { initSearch } from './search/ui.js';
import { initAccount } from './account.js';
import { initCheckout } from './checkout/ui.js';
import { initModals } from './components/modal.js';
import { initQuickView } from './components/quick-view.js';

/**
 * Initialize all storefront modules on DOM ready.
 */
function init() {
  initNavigation();
  initWishlist();
  initCartDrawer();
  initBasket();
  initFilters();
  initProductGallery();
  initHeader();
  initPLP();
  initPDP();
  initHome();
  initSearch();
  initAccount();
  initCheckout();
  initModals();
  initQuickView();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
