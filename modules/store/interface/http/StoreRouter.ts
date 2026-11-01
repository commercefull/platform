/**
 * Store HTTP Router
 * Defines routes for store operations
 */

import { createHttpRouter } from 'libs/http';
import { asyncHandler } from '../../../../libs/asyncHandler';
import { StoreController } from './StoreController';
import { isOrganizationLoggedIn } from '../../../../libs/auth';
import {
  assignSalesChannel,
  createSalesChannel,
  deleteSalesChannel,
  listSalesChannels,
  listStoreSalesChannels,
  unassignSalesChannel,
  updateSalesChannel,
} from '../controllers/SalesChannelController';
import {
  createMarket,
  deleteMarket,
  disableMarket,
  getMarket,
  getMarketReadiness,
  launchMarket,
  listMarkets,
  updateMarket,
} from '../controllers/MarketController';

const router = createHttpRouter();
const storeController = new StoreController();

router.use(isOrganizationLoggedIn);

router.get('/stores/channels', asyncHandler(listSalesChannels));
router.post('/stores/channels', asyncHandler(createSalesChannel));
router.put('/stores/channels/:channelId', asyncHandler(updateSalesChannel));
router.delete('/stores/channels/:channelId', asyncHandler(deleteSalesChannel));
router.get('/stores/:storeId/channels', asyncHandler(listStoreSalesChannels));
router.post('/stores/:storeId/channels', asyncHandler(assignSalesChannel));
router.delete('/stores/:storeId/channels/:channelId', asyncHandler(unassignSalesChannel));

// Create store
router.post('/stores', asyncHandler(storeController.createStore.bind(storeController)));

// Get active stores (must be before :storeId to avoid collision)
router.get('/stores/active', asyncHandler(storeController.getActiveStores.bind(storeController)));

// Get store by slug
router.get('/stores/slug/:slug', asyncHandler(storeController.getStoreBySlug.bind(storeController)));

// Get store by ID
router.get('/stores/:storeId', asyncHandler(storeController.getStore.bind(storeController)));

// Get stores by business
router.get('/stores/business/:organizationId', asyncHandler(storeController.getStoresByBusiness.bind(storeController)));

// Update store
router.put('/stores/:storeId', asyncHandler(storeController.updateStore.bind(storeController)));

// Delete store
router.delete('/stores/:storeId', asyncHandler(storeController.deleteStore.bind(storeController)));

// Configure store pickup (BOPIS)
router.put('/stores/:storeId/pickup', asyncHandler(storeController.configurePickup.bind(storeController)));

// Set local delivery zone
router.put('/stores/:storeId/local-delivery', asyncHandler(storeController.setLocalDelivery.bind(storeController)));

// Create store hierarchy
router.post('/stores/hierarchy', asyncHandler(storeController.createStoreHierarchy.bind(storeController)));

// List stores with filtering and pagination
router.get('/stores', asyncHandler(storeController.listStores.bind(storeController)));

// Markets — global commerce configuration
router.get('/markets', asyncHandler(listMarkets));
router.post('/markets', asyncHandler(createMarket));
router.get('/markets/:marketId', asyncHandler(getMarket));
router.put('/markets/:marketId', asyncHandler(updateMarket));
router.delete('/markets/:marketId', asyncHandler(deleteMarket));
router.get('/markets/:marketId/readiness', asyncHandler(getMarketReadiness));
router.post('/markets/:marketId/launch', asyncHandler(launchMarket));
router.post('/markets/:marketId/disable', asyncHandler(disableMarket));

export { router as storeRouter };
