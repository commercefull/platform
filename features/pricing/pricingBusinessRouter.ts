import express from "express";
// Import pricing controller functions for existing pricing endpoints
import { 
  getPricingRules, getPricingRule, createPricingRule, updatePricingRule, deletePricingRule, 
  getTierPrices, getTierPrice, createTierPrice, updateTierPrice, deleteTierPrice, 
  getPriceLists, getPriceList, createPriceList, updatePriceList, deletePriceList, addPriceToList
} from "./controllers/pricingController";

// Import currency management functions from merchant controller
import {
  // Currency management routes
  getAllCurrencies, getCurrencyByCode, saveCurrency, deleteCurrency, updateExchangeRates,
  // Currency region routes
  getAllCurrencyRegions, getCurrencyRegionById, createCurrencyRegion, updateCurrencyRegion, deleteCurrencyRegion,
  // Currency price rules
  getAllPriceRules, getPriceRuleById, createPriceRule, updatePriceRule, deletePriceRule
} from "./controllers/pricingBusinessController";
import { isMerchantLoggedIn } from "../../libs/auth";

const router = express.Router();

// Apply authentication and permission middleware for all routes
router.use(isMerchantLoggedIn);

/**
 * Pricing Rules Routes
 */
router.get("/rules", getPricingRules);
router.get("/rules/:id", getPricingRule);
router.post("/rules", createPricingRule);
router.put("/rules/:id", updatePricingRule);
router.delete("/rules/:id", deletePricingRule);

/**
 * Tier Pricing Routes
 */
router.get("/tier-prices", getTierPrices);
router.get("/tier-prices/:id", getTierPrice);
router.post("/tier-prices", createTierPrice);
router.put("/tier-prices/:id", updateTierPrice);
router.delete("/tier-prices/:id", deleteTierPrice);

/**
 * Customer Price List Routes
 */
router.get("/price-lists", getPriceLists);
router.get("/price-lists/:id", getPriceList);
router.post("/price-lists", createPriceList);
router.put("/price-lists/:id", updatePriceList);
router.delete("/price-lists/:id", deletePriceList);

/**
 * Customer Prices Routes
 */
router.post("/price-lists/:priceListId/prices", addPriceToList);

/**
 * Currency Management Routes
 */
router.get("/currencies", getAllCurrencies);
router.get("/currencies/:code", getCurrencyByCode);
router.post("/currencies", saveCurrency);
router.delete("/currencies/:code", deleteCurrency);
router.post("/currencies/update-exchange-rates", updateExchangeRates);

/**
 * Currency Region Routes
 */
router.get("/currency-regions", getAllCurrencyRegions);
router.get("/currency-regions/:id", getCurrencyRegionById);
router.post("/currency-regions", createCurrencyRegion);
router.put("/currency-regions/:id", updateCurrencyRegion);
router.delete("/currency-regions/:id", deleteCurrencyRegion);

/**
 * Currency Price Rule Routes
 */
router.get("/currency-price-rules", getAllPriceRules);
router.get("/currency-price-rules/:id", getPriceRuleById);
router.post("/currency-price-rules", createPriceRule);
router.put("/currency-price-rules/:id", updatePriceRule);
router.delete("/currency-price-rules/:id", deletePriceRule);

export const pricingMerchantRouter = router;
export default router;
