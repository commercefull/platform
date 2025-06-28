import express from "express";
import { DistributionController } from "./controllers/distributionController";
import { DistributionControllerPart2 } from "./controllers/distributionControllerPart2";
import { DistributionControllerPart3 } from "./controllers/distributionControllerPart3";

const router = express.Router();
const distributionController = new DistributionController();
const distributionControllerPart2 = new DistributionControllerPart2();
const distributionControllerPart3 = new DistributionControllerPart3();

// Distribution Center routes
router.get("/centers", distributionController.getDistributionCenters);
router.get("/centers/active", distributionController.getActiveDistributionCenters);
router.get("/centers/:id", distributionController.getDistributionCenterById);
router.get("/centers/code/:code", distributionController.getDistributionCenterByCode);
router.post("/centers", distributionController.createDistributionCenter);
router.put("/centers/:id", distributionController.updateDistributionCenter);
router.delete("/centers/:id", distributionController.deleteDistributionCenter);

// Shipping Zone routes
router.get("/shipping-zones", distributionController.getShippingZones);
router.get("/shipping-zones/active", distributionController.getActiveShippingZones);
router.get("/shipping-zones/:id", distributionController.getShippingZoneById);
router.post("/shipping-zones", distributionController.createShippingZone);
router.put("/shipping-zones/:id", distributionController.updateShippingZone);
router.delete("/shipping-zones/:id", distributionController.deleteShippingZone);

// Shipping Method routes
router.get("/shipping-methods", distributionController.getShippingMethods);
router.get("/shipping-methods/active", distributionController.getActiveShippingMethods);
router.get("/shipping-methods/:id", distributionController.getShippingMethodById);
router.get("/shipping-methods/carrier/:carrier", distributionController.getShippingMethodsByCarrier);
router.post("/shipping-methods", distributionController.createShippingMethod);
router.put("/shipping-methods/:id", distributionController.updateShippingMethod);
router.delete("/shipping-methods/:id", distributionControllerPart2.deleteShippingMethod);

// Fulfillment Partner routes
router.get("/fulfillment-partners", distributionControllerPart2.getFulfillmentPartners);
router.get("/fulfillment-partners/active", distributionControllerPart2.getActiveFulfillmentPartners);
router.get("/fulfillment-partners/:id", distributionControllerPart2.getFulfillmentPartnerById);
router.get("/fulfillment-partners/code/:code", distributionControllerPart2.getFulfillmentPartnerByCode);
router.post("/fulfillment-partners", distributionControllerPart2.createFulfillmentPartner);
router.put("/fulfillment-partners/:id", distributionControllerPart2.updateFulfillmentPartner);
router.delete("/fulfillment-partners/:id", distributionControllerPart2.deleteFulfillmentPartner);

// Distribution Rule routes
router.get("/rules", distributionControllerPart3.getDistributionRules);
router.get("/rules/active", distributionControllerPart3.getActiveDistributionRules);
router.get("/rules/:id", distributionControllerPart3.getDistributionRuleById);
router.get("/rules/zone/:zoneId", distributionControllerPart3.getDistributionRulesByZone);
router.get("/rules/default", distributionControllerPart3.getDefaultDistributionRule);
router.post("/rules", distributionControllerPart3.createDistributionRule);
router.put("/rules/:id", distributionControllerPart3.updateDistributionRule);
router.delete("/rules/:id", distributionControllerPart3.deleteDistributionRule);

// Order Fulfillment routes
router.get("/fulfillments", distributionControllerPart3.getOrderFulfillments);
router.get("/fulfillments/:id", distributionControllerPart3.getOrderFulfillmentById);
router.get("/fulfillments/order/:orderId", distributionControllerPart3.getOrderFulfillmentsByOrderId);
router.get("/fulfillments/status/:status", distributionControllerPart3.getOrderFulfillmentsByStatus);
router.get("/fulfillments/center/:centerId", distributionControllerPart3.getOrderFulfillmentsByDistributionCenter);
router.post("/fulfillments", distributionControllerPart3.createOrderFulfillment);
router.put("/fulfillments/:id", distributionControllerPart3.updateOrderFulfillment);
router.put("/fulfillments/:id/status", distributionControllerPart3.updateOrderFulfillmentStatus);
router.delete("/fulfillments/:id", distributionControllerPart3.deleteOrderFulfillment);

export const distributionBusinessRouter = router;
