import express from "express";
import {
  getShippingZones,
  getActiveShippingZones,
  getShippingZoneById,
  createShippingZone,
  updateShippingZone,
  deleteShippingZone,
  getShippingMethods,
  getActiveShippingMethods,
  getShippingMethodById,
  getShippingMethodsByCarrier,
  createShippingMethod,
  updateShippingMethod,
  deleteShippingMethod,
  getShippingCarriers,
  getActiveShippingCarriers,
  getShippingCarrierById,
  getShippingCarrierByCode,
  createShippingCarrier,
  updateShippingCarrier,
  deleteShippingCarrier,
  getShippingRates,
  getShippingRateById,
  getShippingRatesByZone,
  getShippingRatesByMethod,
  createShippingRate,
  updateShippingRate,
  deleteShippingRate,
  calculateRate,
  getAvailableMethods
} from "./controllers/shippingBusinessController";
import { 
  createFulfillmentPartner,
  deleteFulfillmentPartner,
  getActiveFulfillmentPartners,
  getFulfillmentPartnerByCode,
  getFulfillmentPartnerById,
  getFulfillmentPartners,
  updateFulfillmentPartner,
  createOrderFulfillment,
  deleteOrderFulfillment,
  getOrderFulfillmentById,
  getOrderFulfillments,
  getOrderFulfillmentsByWarehouse,
  getOrderFulfillmentsByOrderId,
  getOrderFulfillmentsByStatus,
  updateOrderFulfillment,
  updateOrderFulfillmentStatus,
  getBestWarehouse
} from "./controllers/fulfillmentBusinessController";
import { createDistributionCenter, createDistributionRule, deleteDistributionCenter, deleteDistributionRule, getActiveDistributionCenters, getActiveDistributionRules, getDefaultDistributionRule, getDistributionCenterByCode, getDistributionCenterById, getDistributionCenters, getDistributionRuleById, getDistributionRules, getDistributionRulesByZone, updateDistributionCenter, updateDistributionRule } from "./controllers/distributionBusinessController";
import { getChannels, getActiveChannels, getChannelById, getChannelByCode, createChannel, updateChannel, deleteChannel, getChannelProducts, addProductToChannel, removeProductFromChannel, getProductChannels } from "./controllers/channelController";
import * as pickupController from "./controllers/pickupBusinessController";
import * as preOrderController from "./controllers/preOrderBusinessController";
import { isMerchantLoggedIn } from "../../libs/auth";

const router = express.Router();

router.use(isMerchantLoggedIn);

// Distribution Center routes
router.get("/distribution/centers", getDistributionCenters);
router.get("/distribution/centers/active", getActiveDistributionCenters);
router.get("/distribution/centers/:id", getDistributionCenterById);
router.get("/distribution/centers/code/:code", getDistributionCenterByCode);
router.post("/distribution/centers", createDistributionCenter);
router.put("/distribution/centers/:id", updateDistributionCenter);
router.delete("/distribution/centers/:id", deleteDistributionCenter);

// Distribution Rule routes
router.get("/distribution/rules", getDistributionRules);
router.get("/distribution/rules/active", getActiveDistributionRules);
router.get("/distribution/rules/:id", getDistributionRuleById);
router.get("/distribution/rules/zone/:zoneId", getDistributionRulesByZone);
router.get("/distribution/rules/default", getDefaultDistributionRule);
router.post("/distribution/rules", createDistributionRule);
router.put("/distribution/rules/:id", updateDistributionRule);
router.delete("/distribution/rules/:id", deleteDistributionRule);

// Shipping Zone routes
router.get("/distribution/shipping-zones", getShippingZones);
router.get("/distribution/shipping-zones/active", getActiveShippingZones);
router.get("/distribution/shipping-zones/:id", getShippingZoneById);
router.post("/distribution/shipping-zones", createShippingZone);
router.put("/distribution/shipping-zones/:id", updateShippingZone);
router.delete("/distribution/shipping-zones/:id", deleteShippingZone);

// Channel routes
router.get("/distribution/channels", getChannels);
router.get("/distribution/channels/active", getActiveChannels);
router.get("/distribution/channels/:id", getChannelById);
router.get("/distribution/channels/code/:code", getChannelByCode);
router.post("/distribution/channels", createChannel);
router.put("/distribution/channels/:id", updateChannel);
router.delete("/distribution/channels/:id", deleteChannel);

// Channel product routes
router.get("/distribution/channels/:id/products", getChannelProducts);
router.post("/distribution/channels/:id/products", addProductToChannel);
router.delete("/distribution/channels/:id/products/:productId", removeProductFromChannel);
router.get("/distribution/products/:productId/channels", getProductChannels);

// Shipping Method routes
router.get("/distribution/shipping-methods", getShippingMethods);
router.get("/distribution/shipping-methods/active", getActiveShippingMethods);
router.get("/distribution/shipping-methods/:id", getShippingMethodById);
router.get("/distribution/shipping-methods/carrier/:carrierId", getShippingMethodsByCarrier);
router.post("/distribution/shipping-methods", createShippingMethod);
router.put("/distribution/shipping-methods/:id", updateShippingMethod);
router.delete("/distribution/shipping-methods/:id", deleteShippingMethod);

// Shipping Carrier routes
router.get("/distribution/shipping-carriers", getShippingCarriers);
router.get("/distribution/shipping-carriers/active", getActiveShippingCarriers);
router.get("/distribution/shipping-carriers/:id", getShippingCarrierById);
router.get("/distribution/shipping-carriers/code/:code", getShippingCarrierByCode);
router.post("/distribution/shipping-carriers", createShippingCarrier);
router.put("/distribution/shipping-carriers/:id", updateShippingCarrier);
router.delete("/distribution/shipping-carriers/:id", deleteShippingCarrier);

// Shipping Rate routes
router.get("/distribution/shipping-rates", getShippingRates);
router.get("/distribution/shipping-rates/:id", getShippingRateById);
router.get("/distribution/shipping-rates/zone/:zoneId", getShippingRatesByZone);
router.get("/distribution/shipping-rates/method/:methodId", getShippingRatesByMethod);
router.post("/distribution/shipping-rates", createShippingRate);
router.put("/distribution/shipping-rates/:id", updateShippingRate);
router.delete("/distribution/shipping-rates/:id", deleteShippingRate);

// Shipping Calculation routes (Use Cases)
router.post("/distribution/shipping/calculate-rate", calculateRate);
router.get("/distribution/shipping/available-methods", getAvailableMethods);

// Warehouse Selection routes (Use Cases)
router.get("/distribution/warehouses/best", getBestWarehouse);

// Fulfillment Partner routes
router.get("/distribution/fulfillment-partners", getFulfillmentPartners);
router.get("/distribution/fulfillment-partners/active", getActiveFulfillmentPartners);
router.get("/distribution/fulfillment-partners/:id", getFulfillmentPartnerById);
router.get("/distribution/fulfillment-partners/code/:code", getFulfillmentPartnerByCode);
router.post("/distribution/fulfillment-partners", createFulfillmentPartner);
router.put("/distribution/fulfillment-partners/:id", updateFulfillmentPartner);
router.delete("/distribution/fulfillment-partners/:id", deleteFulfillmentPartner);

// Order Fulfillment routes
router.get("/distribution/fulfillments", getOrderFulfillments);
router.get("/distribution/fulfillments/:id", getOrderFulfillmentById);
router.get("/distribution/fulfillments/order/:orderId", getOrderFulfillmentsByOrderId);
router.get("/distribution/fulfillments/status/:status", getOrderFulfillmentsByStatus);
router.get("/distribution/fulfillments/warehouse/:warehouseId", getOrderFulfillmentsByWarehouse);
router.post("/distribution/fulfillments", createOrderFulfillment);
router.put("/distribution/fulfillments/:id", updateOrderFulfillment);
router.put("/distribution/fulfillments/:id/status", updateOrderFulfillmentStatus);
router.delete("/distribution/fulfillments/:id", deleteOrderFulfillment);

// Store Location routes (Click & Collect)
router.get("/distribution/locations", pickupController.getLocations);
router.get("/distribution/locations/:id", pickupController.getLocation);
router.post("/distribution/locations", pickupController.createLocation);
router.put("/distribution/locations/:id", pickupController.updateLocation);
router.delete("/distribution/locations/:id", pickupController.deleteLocation);

// Pickup Order routes
router.get("/distribution/pickups", pickupController.getPickupOrders);
router.post("/distribution/pickups/:id/ready", pickupController.markPickupReady);
router.post("/distribution/pickups/:id/notify", pickupController.notifyPickupReady);
router.post("/distribution/pickups/:id/complete", pickupController.completePickup);

// Pre-Order routes
router.get("/distribution/pre-orders", preOrderController.getPreOrders);
router.get("/distribution/pre-orders/:id", preOrderController.getPreOrder);
router.post("/distribution/pre-orders", preOrderController.createPreOrder);
router.put("/distribution/pre-orders/:id", preOrderController.updatePreOrder);

// Pre-Order Reservation routes
router.get("/distribution/reservations", preOrderController.getReservations);
router.post("/distribution/reservations/:id/fulfill", preOrderController.fulfillReservation);
router.post("/distribution/reservations/:id/cancel", preOrderController.cancelReservation);

export const distributionBusinessRouter = router;
