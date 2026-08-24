import express from 'express';
import { asyncHandler } from '../../../../libs/asyncHandler';
// Import pricing controller functions for existing pricing endpoints
import {
  getPricingRules,
  getPricingRule,
  createPricingRule,
  updatePricingRule,
  deletePricingRule,
  getTierPrices,
  getTierPrice,
  createTierPrice,
  updateTierPrice,
  deleteTierPrice,
  getPriceLists,
  getPriceList,
  createPriceList,
  updatePriceList,
  deletePriceList,
  addPriceToList,
} from '../controllers/pricingController';

// Import currency management functions from merchant controller
import {
  // Currency management routes
  getAllCurrencies,
  getDefaultCurrency,
  getCurrencyByCode,
  saveCurrency,
  deleteCurrency,
  updateExchangeRates,
  // Currency region routes
  getAllCurrencyRegions,
  getCurrencyRegionById,
  createCurrencyRegion,
  updateCurrencyRegion,
  deleteCurrencyRegion,
  // Currency price rules
  getAllPriceRules,
  getPriceRuleById,
  createPriceRule,
  updatePriceRule,
  deletePriceRule,
} from '../controllers/pricingBusinessController';
import { isOrganizationLoggedIn } from '../../../../libs/auth';

const router = express.Router();

// Apply authentication and permission middleware for all routes
router.use('/pricing', isOrganizationLoggedIn);

/**
 * Pricing Rules Routes
 */
router.get('/pricing/rules', asyncHandler(getPricingRules));
router.get('/pricing/rules/:id', asyncHandler(getPricingRule));
router.post('/pricing/rules', asyncHandler(createPricingRule));
router.put('/pricing/rules/:id', asyncHandler(updatePricingRule));
router.delete('/pricing/rules/:id', asyncHandler(deletePricingRule));

/**
 * Tier Pricing Routes
 */
router.get('/pricing/tier-prices', asyncHandler(getTierPrices));
router.get('/pricing/tier-prices/:id', asyncHandler(getTierPrice));
router.post('/pricing/tier-prices', asyncHandler(createTierPrice));
router.put('/pricing/tier-prices/:id', asyncHandler(updateTierPrice));
router.delete('/pricing/tier-prices/:id', asyncHandler(deleteTierPrice));

/**
 * Customer Price List Routes
 */
router.get('/pricing/price-lists', asyncHandler(getPriceLists));
router.get('/pricing/price-lists/:id', asyncHandler(getPriceList));
router.post('/pricing/price-lists', asyncHandler(createPriceList));
router.put('/pricing/price-lists/:id', asyncHandler(updatePriceList));
router.delete('/pricing/price-lists/:id', asyncHandler(deletePriceList));

/**
 * Customer Prices Routes
 */
router.post('/pricing/price-lists/:priceListId/prices', asyncHandler(addPriceToList));

/**
 * Currency Management Routes
 */
router.get('/pricing/currencies', asyncHandler(getAllCurrencies));
router.get('/pricing/currencies/default', asyncHandler(getDefaultCurrency));
router.get('/pricing/currencies/:code', asyncHandler(getCurrencyByCode));
router.post('/pricing/currencies', asyncHandler(saveCurrency));
router.delete('/pricing/currencies/:code', asyncHandler(deleteCurrency));
router.post('/pricing/currencies/update-exchange-rates', asyncHandler(updateExchangeRates));

/**
 * Currency Region Routes
 */
router.get('/pricing/currency-regions', asyncHandler(getAllCurrencyRegions));
router.get('/pricing/currency-regions/:id', asyncHandler(getCurrencyRegionById));
router.post('/pricing/currency-regions', asyncHandler(createCurrencyRegion));
router.put('/pricing/currency-regions/:id', asyncHandler(updateCurrencyRegion));
router.delete('/pricing/currency-regions/:id', asyncHandler(deleteCurrencyRegion));

/**
 * Currency Price Rule Routes
 */
router.get('/pricing/currency-price-rules', asyncHandler(getAllPriceRules));
router.get('/pricing/currency-price-rules/:id', asyncHandler(getPriceRuleById));
router.post('/pricing/currency-price-rules', asyncHandler(createPriceRule));
router.put('/pricing/currency-price-rules/:id', asyncHandler(updatePriceRule));
router.delete('/pricing/currency-price-rules/:id', asyncHandler(deletePriceRule));

export const pricingMerchantRouter = router;
