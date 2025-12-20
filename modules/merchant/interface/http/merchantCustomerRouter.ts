import express from "express";
import {
  getActiveMerchants,
  getMerchantById
} from "../../controllers/merchantCustomerController";

const router = express.Router();

// Public routes for merchant information
// These provide limited access compared to admin routes

// Get active merchants (public storefront view)
router.get("/", getActiveMerchants);

// Get specific merchant by ID (if active)
router.get("/:id", getMerchantById);

// Get products from a specific merchant
router.get("/:id/products", (req, res) => {
  res.status(404).json({
    success: false,
    message: 'This endpoint will be implemented in a future update'
  });
});

export const merchantCustomerRouter = router;
