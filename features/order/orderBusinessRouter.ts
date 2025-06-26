import express from "express";
import { 
  getAllOrders, 
  getOrderDetailsAdmin, 
  updateOrderStatus 
} from "./controllers/orderController";

const router = express.Router();

// Middleware to check if the user is authenticated and has admin role
const requireAdmin = (req: any, res: any, next: any) => {
  if (req.isAuthenticated() && req.user?.role === 'admin') {
    return next();
  }
  return res.status(403).json({ success: false, message: 'Unauthorized' });
};

// Admin routes for order management
router.get("/orders", requireAdmin, getAllOrders);
router.get("/orders/:id", requireAdmin, getOrderDetailsAdmin);
router.put("/orders/:id/status", requireAdmin, updateOrderStatus);

export const orderBusinessRouter = router;
