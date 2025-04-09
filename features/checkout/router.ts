import express from "express";
import { isLoggedIn } from "../../libs/middlewares";
import checkoutPublicController from "./controllers/checkoutPublicController";

const router = express.Router();

// Initialize checkout session
router.post("/session", async (req, res) => {
  await checkoutPublicController.initializeCheckout(req, res);
});

// Get checkout session by ID
router.get("/session/:sessionId", async (req, res) => {
  await checkoutPublicController.getCheckoutSession(req, res);
});

// Update shipping address
router.put("/session/:sessionId/shipping-address", async (req, res) => {
  await checkoutPublicController.updateShippingAddress(req, res);
});

// Update billing address
router.put("/session/:sessionId/billing-address", async (req, res) => {
  await checkoutPublicController.updateBillingAddress(req, res);
});

// Get available shipping methods
router.get("/shipping-methods", async (req, res) => {
  await checkoutPublicController.getShippingMethods(req, res);
});

// Select shipping method
router.put("/session/:sessionId/shipping-method", async (req, res) => {
  await checkoutPublicController.selectShippingMethod(req, res);
});

// Get available payment methods
router.get("/payment-methods", async (req, res) => {
  await checkoutPublicController.getPaymentMethods(req, res);
});

// Select payment method
router.put("/session/:sessionId/payment-method", async (req, res) => {
  await checkoutPublicController.selectPaymentMethod(req, res);
});

// Calculate totals
router.get("/session/:sessionId/calculate", async (req, res) => {
  await checkoutPublicController.calculateTotals(req, res);
});

// Complete checkout (requires authentication)
router.post("/session/:sessionId/complete", isLoggedIn, async (req, res) => {
  await checkoutPublicController.completeCheckout(req, res);
});

// Abandon checkout session
router.post("/session/:sessionId/abandon", async (req, res) => {
  await checkoutPublicController.abandonCheckout(req, res);
});

export const checkoutRouter = router;
