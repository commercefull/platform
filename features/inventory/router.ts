import express from "express";
import { InventoryController } from "./controllers/inventoryController";
import { InventoryPublicController } from "./controllers/inventoryPublicController";

const router = express.Router();
const inventoryController = new InventoryController();
const inventoryPublicController = new InventoryPublicController();

// Public routes for inventory information
// These provide limited access compared to admin routes

// Product availability check (for product detail pages)
router.get("/products/:productId/availability", inventoryController.checkProductAvailability);

// Get inventory by product ID (modified to show limited information)
router.get("/products/:productId/inventory", inventoryPublicController.getProductInventory);

// Get inventory for a specific location (for store pages)
router.get("/locations/:id/availability", inventoryPublicController.getLocationInventory);

// Reserve inventory for a cart
router.post("/cart/:cartId/reserve", inventoryPublicController.reserveCartItems);

// Get cart reservations
router.get("/cart/:cartId/reservations", inventoryController.getReservationsByCartId);

// Release cart reservations
router.post("/cart/:cartId/release", inventoryPublicController.releaseCartReservations);

export const inventoryRouter = router;
