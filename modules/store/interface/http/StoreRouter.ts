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

export { router as storeRouter };
