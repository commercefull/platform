import express from "express";
import { MerchantController } from "./controllers/merchantController";

const router = express.Router();
const merchantController = new MerchantController();

// Admin routes for merchant management
router.get("/", merchantController.getMerchants);
router.post("/", merchantController.createMerchant);
router.get("/:id", merchantController.getMerchantById);
router.put("/:id", merchantController.updateMerchant);
router.delete("/:id", merchantController.deleteMerchant);

// Admin routes for merchant addresses
router.get("/:merchantId/addresses", merchantController.getMerchantAddresses);
router.post("/:merchantId/addresses", merchantController.addMerchantAddress);

// Admin routes for merchant payment information
router.get("/:merchantId/payment-info", merchantController.getMerchantPaymentInfo);
router.post("/:merchantId/payment-info", merchantController.addMerchantPaymentInfo);

export const merchantRouterAdmin = router;
