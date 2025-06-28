import express from "express";
import {
  getMerchants,
  createMerchant,
  getMerchantById,
  updateMerchant,
  deleteMerchant,
  getMerchantAddresses,
  addMerchantAddress,
  getMerchantPaymentInfo,
  addMerchantPaymentInfo
} from "./controllers/merchantBusinessController";
import { isMerchantLoggedIn } from "../../libs/auth";

const router = express.Router();

router.use(isMerchantLoggedIn);

// Admin routes for merchant management
router.get("/", getMerchants);
router.post("/", createMerchant);
router.get("/:id", getMerchantById);
router.put("/:id", updateMerchant);
router.delete("/:id", deleteMerchant);

// Admin routes for merchant addresses
router.get("/:merchantId/addresses", getMerchantAddresses);
router.post("/:merchantId/addresses", addMerchantAddress);

// Admin routes for merchant payment information
router.get("/:merchantId/payment-info", getMerchantPaymentInfo);
router.post("/:merchantId/payment-info", addMerchantPaymentInfo);

export const merchantBusinessRouter = router;
