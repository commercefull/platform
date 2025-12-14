import express from "express";
import { 
  getActiveDistributionCenters,
  getActiveShippingMethods,
  getAvailableShippingMethods,
  getOrderTracking
} from "./controllers/distributionCustomerController";
import * as pickupController from "./controllers/pickupCustomerController";
import * as preOrderController from "./controllers/preOrderCustomerController";

const router = express.Router();

// Public routes for distribution information
// These provide limited access compared to admin routes

// Get active distribution centers with limited information
router.get("/distribution/centers", getActiveDistributionCenters);

// Get active shipping methods with limited information
router.get("/distribution/shipping-methods", getActiveShippingMethods);

// Get shipping methods available for a specific address (requires country, optional region and postalCode)
router.get("/distribution/shipping-methods/available", getAvailableShippingMethods);

// Get tracking information for an order
router.get("/distribution/tracking/:orderId", getOrderTracking);

// Store Location routes (Click & Collect)
router.get("/distribution/locations/nearby", pickupController.findNearbyLocations);
router.get("/distribution/locations/pickup", pickupController.getPickupLocations);
router.get("/distribution/locations/:id", pickupController.getLocationDetails);

// Pickup Order routes
router.post("/distribution/pickups", pickupController.createPickupOrder);
router.get("/distribution/pickups/mine", pickupController.getMyPickupOrders);
router.get("/distribution/pickups/mine/:id", pickupController.getMyPickupOrder);
router.post("/distribution/pickups/mine/:id/cancel", pickupController.cancelMyPickup);
router.post("/distribution/pickups/:id/verify", pickupController.verifyPickupCode);

// Pre-Order routes
router.get("/distribution/pre-orders/product/:productId", preOrderController.getProductPreOrder);
router.get("/distribution/pre-orders/product/:productId/:productVariantId", preOrderController.getProductPreOrder);
router.post("/distribution/pre-orders/reserve", preOrderController.createPreOrderReservation);
router.get("/distribution/pre-orders/mine", preOrderController.getMyReservations);
router.get("/distribution/pre-orders/mine/:id", preOrderController.getMyReservation);
router.post("/distribution/pre-orders/mine/:id/cancel", preOrderController.cancelMyReservation);

export const distributionCustomerRouter = router;
