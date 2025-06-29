import express from "express";
import { getLocationInventory, getProductInventory, releaseCartReservations, reserveCartItems } from "./controllers/inventoryCustomerController";

const router = express.Router();

// Get inventory by product ID (modified to show limited information)
router.get("/products/:productId/inventory", getProductInventory);

// Get inventory for a specific location (for store pages)
router.get("/locations/:id/availability", getLocationInventory);

// Reserve inventory for a cart
router.post("/cart/:cartId/reserve", reserveCartItems);

// Release cart reservations
router.post("/cart/:cartId/release", releaseCartReservations);

export const inventoryCustomerRouter = router;
