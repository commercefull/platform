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
  deleteShippingMethod
} from "./controllers/shippingMerchantController";
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
  getOrderFulfillmentsByDistributionCenter,
  getOrderFulfillmentsByOrderId,
  getOrderFulfillmentsByStatus,
  updateOrderFulfillment,
  updateOrderFulfillmentStatus
} from "./controllers/fulfillmentMerchantController";
import { createDistributionCenter, createDistributionRule, deleteDistributionCenter, deleteDistributionRule, getActiveDistributionCenters, getActiveDistributionRules, getDefaultDistributionRule, getDistributionCenterByCode, getDistributionCenterById, getDistributionCenters, getDistributionRuleById, getDistributionRules, getDistributionRulesByZone, updateDistributionCenter, updateDistributionRule } from "./controllers/distributionMerchantController";
import { getChannels, getActiveChannels, getChannelById, getChannelByCode, createChannel, updateChannel, deleteChannel, getChannelProducts, addProductToChannel, removeProductFromChannel, getProductChannels } from "./controllers/channelController";
import { isMerchantLoggedIn } from "../../libs/auth";

const router = express.Router();

router.use(isMerchantLoggedIn);

// Distribution Center routes
router.get("/centers", getDistributionCenters);
router.get("/centers/active", getActiveDistributionCenters);
router.get("/centers/:id", getDistributionCenterById);
router.get("/centers/code/:code", getDistributionCenterByCode);
router.post("/centers", createDistributionCenter);
router.put("/centers/:id", updateDistributionCenter);
router.delete("/centers/:id", deleteDistributionCenter);

// Distribution Rule routes
router.get("/rules", getDistributionRules);
router.get("/rules/active", getActiveDistributionRules);
router.get("/rules/:id", getDistributionRuleById);
router.get("/rules/zone/:zoneId", getDistributionRulesByZone);
router.get("/rules/default", getDefaultDistributionRule);
router.post("/rules", createDistributionRule);
router.put("/rules/:id", updateDistributionRule);
router.delete("/rules/:id", deleteDistributionRule);

// Shipping Zone routes
router.get("/shipping-zones", getShippingZones);
router.get("/shipping-zones/active", getActiveShippingZones);
router.get("/shipping-zones/:id", getShippingZoneById);
router.post("/shipping-zones", createShippingZone);
router.put("/shipping-zones/:id", updateShippingZone);
router.delete("/shipping-zones/:id", deleteShippingZone);

// Channel routes
router.get("/channels", getChannels);
router.get("/channels/active", getActiveChannels);
router.get("/channels/:id", getChannelById);
router.get("/channels/code/:code", getChannelByCode);
router.post("/channels", createChannel);
router.put("/channels/:id", updateChannel);
router.delete("/channels/:id", deleteChannel);

// Channel product routes
router.get("/channels/:id/products", getChannelProducts);
router.post("/channels/:id/products", addProductToChannel);
router.delete("/channels/:id/products/:productId", removeProductFromChannel);
router.get("/products/:productId/channels", getProductChannels);

// Shipping Method routes
router.get("/shipping-methods", getShippingMethods);
router.get("/shipping-methods/active", getActiveShippingMethods);
router.get("/shipping-methods/:id", getShippingMethodById);
router.get("/shipping-methods/carrier/:carrier", getShippingMethodsByCarrier);
router.post("/shipping-methods", createShippingMethod);
router.put("/shipping-methods/:id", updateShippingMethod);
router.delete("/shipping-methods/:id", deleteShippingMethod);

// Fulfillment Partner routes
router.get("/fulfillment-partners", getFulfillmentPartners);
router.get("/fulfillment-partners/active", getActiveFulfillmentPartners);
router.get("/fulfillment-partners/:id", getFulfillmentPartnerById);
router.get("/fulfillment-partners/code/:code", getFulfillmentPartnerByCode);
router.post("/fulfillment-partners", createFulfillmentPartner);
router.put("/fulfillment-partners/:id", updateFulfillmentPartner);
router.delete("/fulfillment-partners/:id", deleteFulfillmentPartner);

// Order Fulfillment routes
router.get("/fulfillments", getOrderFulfillments);
router.get("/fulfillments/:id", getOrderFulfillmentById);
router.get("/fulfillments/order/:orderId", getOrderFulfillmentsByOrderId);
router.get("/fulfillments/status/:status", getOrderFulfillmentsByStatus);
router.get("/fulfillments/center/:centerId", getOrderFulfillmentsByDistributionCenter);
router.post("/fulfillments", createOrderFulfillment);
router.put("/fulfillments/:id", updateOrderFulfillment);
router.put("/fulfillments/:id/status", updateOrderFulfillmentStatus);
router.delete("/fulfillments/:id", deleteOrderFulfillment);

export const distributionMerchantRouter = router;
