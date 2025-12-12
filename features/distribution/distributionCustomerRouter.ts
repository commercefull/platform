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
router.get("/centers", getActiveDistributionCenters);

// Get active shipping methods with limited information
router.get("/shipping-methods", getActiveShippingMethods);

// Get shipping methods available for a specific address (requires country, optional region and postalCode)
router.get("/shipping-methods/available", getAvailableShippingMethods);

// Get tracking information for an order
router.get("/tracking/:orderId", getOrderTracking);

// Store Location routes (Click & Collect)
router.get("/locations/nearby", pickupController.findNearbyLocations);
router.get("/locations/pickup", pickupController.getPickupLocations);
router.get("/locations/:id", pickupController.getLocationDetails);

// Pickup Order routes
router.post("/pickups", pickupController.createPickupOrder);
router.get("/pickups/mine", pickupController.getMyPickupOrders);
router.get("/pickups/mine/:id", pickupController.getMyPickupOrder);
router.post("/pickups/mine/:id/cancel", pickupController.cancelMyPickup);
router.post("/pickups/:id/verify", pickupController.verifyPickupCode);

// Pre-Order routes
router.get("/pre-orders/product/:productId", preOrderController.getProductPreOrder);
router.get("/pre-orders/product/:productId/:productVariantId", preOrderController.getProductPreOrder);
router.post("/pre-orders/reserve", preOrderController.createPreOrderReservation);
router.get("/pre-orders/mine", preOrderController.getMyReservations);
router.get("/pre-orders/mine/:id", preOrderController.getMyReservation);
router.post("/pre-orders/mine/:id/cancel", preOrderController.cancelMyReservation);

export const distributionCustomerRouter = router;
