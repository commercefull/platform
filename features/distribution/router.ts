import express from "express";
import { DistributionPublicController } from "./controllers/distributionPublicController";

const router = express.Router();
const distributionPublicController = new DistributionPublicController();

// Public routes for distribution information
// These provide limited access compared to admin routes

// Get active distribution centers with limited information
router.get("/centers", distributionPublicController.getActiveDistributionCenters);

// Get active shipping methods with limited information
router.get("/shipping-methods", distributionPublicController.getActiveShippingMethods);

// Get shipping methods available for a specific address (requires country, optional region and postalCode)
router.get("/shipping-methods/available", distributionPublicController.getAvailableShippingMethods);

// Get tracking information for an order
router.get("/tracking/:orderId", distributionPublicController.getOrderTracking);

export const distributionRouter = router;
