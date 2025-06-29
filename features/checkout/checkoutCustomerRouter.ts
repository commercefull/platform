import express from "express";
import { isCustomerLoggedIn } from "../../libs/auth";
import { abandonCheckout, calculateTotals, completeCheckout, getCheckoutSession, getPaymentMethods, getShippingMethods, initializeCheckout, selectPaymentMethod, selectShippingMethod, updateBillingAddress, updateShippingAddress } from "./checkoutCustomerController";

const router = express.Router();

// Initialize checkout session
router.post("/session", initializeCheckout);

// Get checkout session by ID
router.get("/session/:sessionId", getCheckoutSession);

// Update shipping address
router.put("/session/:sessionId/shipping-address", updateShippingAddress);

// Update billing address
router.put("/session/:sessionId/billing-address", updateBillingAddress);

// Get available shipping methods
router.get("/shipping-methods", getShippingMethods);

// Select shipping method
router.put("/session/:sessionId/shipping-method", selectShippingMethod);

// Get available payment methods
router.get("/payment-methods", getPaymentMethods);

// Select payment method
router.put("/session/:sessionId/payment-method", selectPaymentMethod);

// Calculate totals
router.get("/session/:sessionId/calculate", calculateTotals);

// Complete checkout (requires authentication)
router.post("/session/:sessionId/complete", isCustomerLoggedIn, completeCheckout);

// Abandon checkout session
router.post("/session/:sessionId/abandon", abandonCheckout);

export const checkoutRouter = router;
