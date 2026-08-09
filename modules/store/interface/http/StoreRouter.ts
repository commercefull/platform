/**
 * Store HTTP Router
 * Defines routes for store operations
 */

import { Router } from 'express';
import { StoreController } from './StoreController';

const router = Router();
const storeController = new StoreController();

// Create store
router.post('/stores', storeController.createStore.bind(storeController));

// Get store by ID
router.get('/stores/:storeId', storeController.getStore.bind(storeController));

// Get store by slug
router.get('/stores/slug/:slug', storeController.getStoreBySlug.bind(storeController));

// Get stores by business
router.get('/stores/business/:businessId', storeController.getStoresByBusiness.bind(storeController));

// Get active stores
router.get('/stores/active', storeController.getActiveStores.bind(storeController));

// Update store
router.put('/stores/:storeId', storeController.updateStore.bind(storeController));

// Delete store
router.delete('/stores/:storeId', storeController.deleteStore.bind(storeController));

// Configure store pickup (BOPIS)
router.put('/stores/:storeId/pickup', storeController.configurePickup.bind(storeController));

// Set local delivery zone
router.put('/stores/:storeId/local-delivery', storeController.setLocalDelivery.bind(storeController));

// Create store hierarchy
router.post('/stores/hierarchy', storeController.createStoreHierarchy.bind(storeController));

// List stores with filtering and pagination
router.get('/stores', storeController.listStores.bind(storeController));

export { router as storeRouter };
