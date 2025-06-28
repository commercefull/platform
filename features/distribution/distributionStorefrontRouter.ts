import express from "express";
import { 
  getActiveDistributionCenters,
  getActiveShippingMethods,
  getAvailableShippingMethods,
  getOrderTracking
} from "./controllers/distributionStorefrontController";

const router = express.Router();

// Public routes for distribution information
// These provide limited access compared to admin routes

// Get active distribution centers with limited information
router.get("/centers", getActiveDistributionCenters);

// Get active shipping methods with limited information
router.get("/shipping-methods", getActiveShippingMethods);

// Get shipping methods available for a specific address (requires country, optional region and postalCode)
router.get("/shipping-methods/available", getAvailableShippingMethods);

// Get tracking information for an order
router.get("/tracking/:orderId", getOrderTracking);

export const distributionStorefrontRouter = router;
