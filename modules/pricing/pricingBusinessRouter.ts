import express from 'express';
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
} from './controllers/pricingController';

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
} from './controllers/pricingBusinessController';
import { isMerchantLoggedIn } from '../../libs/auth';

const router = express.Router();

// Apply authentication and permission middleware for all routes
router.use('/pricing', isMerchantLoggedIn);

/**
 * Pricing Rules Routes
 */
router.get('/pricing/rules', getPricingRules);
router.get('/pricing/rules/:id', getPricingRule);
router.post('/pricing/rules', createPricingRule);
router.put('/pricing/rules/:id', updatePricingRule);
router.delete('/pricing/rules/:id', deletePricingRule);

/**
 * Tier Pricing Routes
 */
router.get('/pricing/tier-prices', getTierPrices);
router.get('/pricing/tier-prices/:id', getTierPrice);
router.post('/pricing/tier-prices', createTierPrice);
router.put('/pricing/tier-prices/:id', updateTierPrice);
router.delete('/pricing/tier-prices/:id', deleteTierPrice);

/**
 * Customer Price List Routes
 */
router.get('/pricing/price-lists', getPriceLists);
router.get('/pricing/price-lists/:id', getPriceList);
router.post('/pricing/price-lists', createPriceList);
router.put('/pricing/price-lists/:id', updatePriceList);
router.delete('/pricing/price-lists/:id', deletePriceList);

/**
 * Customer Prices Routes
 */
router.post('/pricing/price-lists/:priceListId/prices', addPriceToList);

/**
 * Currency Management Routes
 */
router.get('/pricing/currencies', getAllCurrencies);
router.get('/pricing/currencies/default', getDefaultCurrency);
router.get('/pricing/currencies/:code', getCurrencyByCode);
router.post('/pricing/currencies', saveCurrency);
router.delete('/pricing/currencies/:code', deleteCurrency);
router.post('/pricing/currencies/update-exchange-rates', updateExchangeRates);

/**
 * Currency Region Routes
 */
router.get('/pricing/currency-regions', getAllCurrencyRegions);
router.get('/pricing/currency-regions/:id', getCurrencyRegionById);
router.post('/pricing/currency-regions', createCurrencyRegion);
router.put('/pricing/currency-regions/:id', updateCurrencyRegion);
router.delete('/pricing/currency-regions/:id', deleteCurrencyRegion);

/**
 * Currency Price Rule Routes
 */
router.get('/pricing/currency-price-rules', getAllPriceRules);
router.get('/pricing/currency-price-rules/:id', getPriceRuleById);
router.post('/pricing/currency-price-rules', createPriceRule);
router.put('/pricing/currency-price-rules/:id', updatePriceRule);
router.delete('/pricing/currency-price-rules/:id', deletePriceRule);

export const pricingMerchantRouter = router;
