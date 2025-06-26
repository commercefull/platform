import express from "express";
import { isLoggedIn } from "../../libs/middlewares";
import { 
  getUserOrders, 
  getOrderDetails, 
  createOrder, 
  cancelOrder 
} from "./controllers/orderController";

const router = express.Router();

// GET: display user's orders
router.get("/orders", isLoggedIn, getUserOrders);

// GET: display specific order details
router.get("/orders/:id", isLoggedIn, getOrderDetails);

// POST: create a new order
router.post("/orders", isLoggedIn, createOrder);

// POST: cancel an order
router.post("/orders/:id/cancel", isLoggedIn, cancelOrder);

export const orderStorefrontRouter = router;