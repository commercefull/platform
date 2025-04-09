import express from "express";
import { isLoggedIn, grantAccess } from "../../libs/middlewares";
import checkoutController from "./controllers/checkoutController";

const router = express.Router();

// Apply admin middleware to all routes
router.use(isLoggedIn);
router.use(grantAccess(["ADMIN"]));

// CHECKOUT SESSIONS MANAGEMENT

// Get all checkout sessions (with optional filters)
router.get("/sessions", async (req, res) => {
  await checkoutController.getAllCheckoutSessions(req, res);
});

// Get checkout session by ID
router.get("/sessions/:sessionId", async (req, res) => {
  await checkoutController.getCheckoutSession(req, res);
});

// Clean up expired sessions
router.post("/sessions/cleanup", async (req, res) => {
  await checkoutController.cleanupExpiredSessions(req, res);
});

// SHIPPING METHODS MANAGEMENT

// Get all shipping methods (including disabled ones)
router.get("/shipping-methods", async (req, res) => {
  await checkoutController.getAllShippingMethods(req, res);
});

// Create shipping method
router.post("/shipping-methods", async (req, res) => {
  await checkoutController.createShippingMethod(req, res);
});

// Update shipping method
router.put("/shipping-methods/:methodId", async (req, res) => {
  await checkoutController.updateShippingMethod(req, res);
});

// Delete shipping method
router.delete("/shipping-methods/:methodId", async (req, res) => {
  await checkoutController.deleteShippingMethod(req, res);
});

// PAYMENT METHODS MANAGEMENT

// Get all payment methods (including disabled ones)
router.get("/payment-methods", async (req, res) => {
  await checkoutController.getAllPaymentMethods(req, res);
});

// Create payment method
router.post("/payment-methods", async (req, res) => {
  await checkoutController.createPaymentMethod(req, res);
});

// Update payment method
router.put("/payment-methods/:methodId", async (req, res) => {
  await checkoutController.updatePaymentMethod(req, res);
});

// Delete payment method
router.delete("/payment-methods/:methodId", async (req, res) => {
  await checkoutController.deletePaymentMethod(req, res);
});

export const checkoutAdminRouter = router;
