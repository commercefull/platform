import express from "express";
import { 
  getAllOrders, 
  getOrderDetails, 
  updateOrderStatus 
} from "./controllers/orderMerchantController";
import { isMerchantLoggedIn } from "../../libs/auth";

const router = express.Router();

router.use(isMerchantLoggedIn);

// Admin routes for order management
router.get("/orders", getAllOrders);
router.get("/orders/:id", getOrderDetails);
router.put("/orders/:id/status", updateOrderStatus);

export const orderMerchantRouter = router;
