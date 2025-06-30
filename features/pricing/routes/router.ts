import express from "express";
import pricingPublicController from "../controllers/pricingPublicController";
import { checkAuthOptional } from "../../../middleware/auth";

const router = express.Router();

// Apply optional authentication middleware to allow both logged-in and guest users
router.use(checkAuthOptional);

/**
 * Public Pricing Routes
 */

// Get price for a single product with all applicable discounts
router.get("/products/:productId/price", pricingPublicController.getProductPrice);

// Bulk pricing endpoint for multiple products
router.post("/bulk-prices", pricingPublicController.getBulkPrices);

// Preview the effect of a specific pricing rule on a product
router.get("/rules/:ruleId/preview/:productId", pricingPublicController.previewRuleEffect);

export default router;
