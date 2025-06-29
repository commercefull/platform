import express from "express";
import { 
  getUserOrders, 
  getOrderDetails, 
  createOrder, 
  cancelOrder 
} from "./controllers/orderCustomerController";
import { isCustomerLoggedIn } from "../../libs/auth";

const router = express.Router();

router.use(isCustomerLoggedIn);

// GET: display user's orders
router.get("/orders", getUserOrders);

// GET: display specific order details
router.get("/orders/:id", getOrderDetails);

// POST: create a new order
router.post("/orders", createOrder);

// POST: cancel an order
router.post("/orders/:id/cancel", cancelOrder);

export const orderCustomerRouter = router;