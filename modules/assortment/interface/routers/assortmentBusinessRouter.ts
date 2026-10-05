/**
 * Assortment Business Router
 * Merchant-facing collection + store assortment management.
 * Mounted at /business — paths carry the /assortment topic prefix
 * (replaces the legacy /business/products/collections endpoints).
 */

import { createHttpRouter } from 'libs/http';
import { asyncHandler } from '../../../../libs/asyncHandler';
import { isOrganizationLoggedIn } from '../../../../libs/auth';
import * as controller from '../controllers/AssortmentBusinessController';

const router = createHttpRouter();

// ============================================================================
// Collections
// ============================================================================

/**
 * List collections
 * GET /business/assortment/collections
 */
router.get('/assortment/collections', isOrganizationLoggedIn, asyncHandler(controller.listCollections));

/**
 * Create collection
 * POST /business/assortment/collections
 */
router.post('/assortment/collections', isOrganizationLoggedIn, asyncHandler(controller.createCollection));

/**
 * Get collection (with members)
 * GET /business/assortment/collections/:collectionId
 */
router.get('/assortment/collections/:collectionId', isOrganizationLoggedIn, asyncHandler(controller.getCollection));

/**
 * Resolve collection products (manual or smart)
 * GET /business/assortment/collections/:collectionId/products
 */
router.get('/assortment/collections/:collectionId/products', isOrganizationLoggedIn, asyncHandler(controller.getCollectionProducts));

/**
 * Update collection
 * PUT /business/assortment/collections/:collectionId
 */
router.put('/assortment/collections/:collectionId', isOrganizationLoggedIn, asyncHandler(controller.updateCollection));

/**
 * Delete collection (soft)
 * DELETE /business/assortment/collections/:collectionId
 */
router.delete('/assortment/collections/:collectionId', isOrganizationLoggedIn, asyncHandler(controller.deleteCollection));

/**
 * List collection visibility publications (store/channel scoping)
 * GET /business/assortment/collections/:collectionId/publications
 */
router.get(
  '/assortment/collections/:collectionId/publications',
  isOrganizationLoggedIn,
  asyncHandler(controller.listCollectionPublications),
);

/**
 * Create or update a collection publication for a store/channel scope
 * POST /business/assortment/collections/:collectionId/publications
 */
router.post(
  '/assortment/collections/:collectionId/publications',
  isOrganizationLoggedIn,
  asyncHandler(controller.setCollectionPublication),
);

/**
 * Remove a collection publication
 * DELETE /business/assortment/collections/:collectionId/publications/:publicationId
 */
router.delete(
  '/assortment/collections/:collectionId/publications/:publicationId',
  isOrganizationLoggedIn,
  asyncHandler(controller.deleteCollectionPublication),
);

// ============================================================================
// Store Assortment (per-store ranging)
// ============================================================================

/**
 * Get store assortment config + entries
 * GET /business/assortment/stores/:storeId
 */
router.get('/assortment/stores/:storeId', isOrganizationLoggedIn, asyncHandler(controller.getStoreAssortment));

/**
 * Set assortment mode (all | include | exclude)
 * PUT /business/assortment/stores/:storeId
 */
router.put('/assortment/stores/:storeId', isOrganizationLoggedIn, asyncHandler(controller.setStoreAssortmentMode));

/**
 * Add assortment entry (product | collection | category)
 * POST /business/assortment/stores/:storeId/entries
 */
router.post('/assortment/stores/:storeId/entries', isOrganizationLoggedIn, asyncHandler(controller.addStoreAssortmentEntry));

/**
 * Remove assortment entry
 * DELETE /business/assortment/stores/:storeId/entries/:entryId
 */
router.delete('/assortment/stores/:storeId/entries/:entryId', isOrganizationLoggedIn, asyncHandler(controller.removeStoreAssortmentEntry));

/**
 * Resolve effective store catalog
 * GET /business/assortment/stores/:storeId/catalog
 */
router.get('/assortment/stores/:storeId/catalog', isOrganizationLoggedIn, asyncHandler(controller.getStoreCatalog));

export const assortmentBusinessRouter = router;
