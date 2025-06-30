import express from "express";
import pricingController from "../controllers/pricingController";
import { isMerchantLoggedIn } from "../../../libs/auth";

const router = express.Router();

// Apply authentication and permission middleware for all routes
router.use(isMerchantLoggedIn);

/**
 * Pricing Rules Routes
 */
router.get("/rules", pricingController.getPricingRules);
router.get("/rules/:id", pricingController.getPricingRule);
router.post("/rules", pricingController.createPricingRule);
router.put("/rules/:id", pricingController.updatePricingRule);
router.delete("/rules/:id", pricingController.deletePricingRule);

/**
 * Tier Pricing Routes
 */
router.get("/tier-prices", pricingController.getTierPrices);
router.get("/tier-prices/:id", pricingController.getTierPrice);
router.post("/tier-prices", pricingController.createTierPrice);
router.put("/tier-prices/:id", pricingController.updateTierPrice);
router.delete("/tier-prices/:id", pricingController.deleteTierPrice);

/**
 * Customer Price List Routes
 */
router.get("/price-lists", pricingController.getPriceLists);
router.get("/price-lists/:id", pricingController.getPriceList);
router.post("/price-lists", pricingController.createPriceList);
router.put("/price-lists/:id", pricingController.updatePriceList);
router.delete("/price-lists/:id", pricingController.deletePriceList);

/**
 * Customer Prices Routes
 */
router.post("/price-lists/:priceListId/prices", pricingController.addPriceToList);

export default router;
