import express from "express";
import { InventoryController } from "./controllers/inventoryController";

const router = express.Router();
const inventoryController = new InventoryController();

// Inventory Item routes
router.get("/items", inventoryController.getInventoryItems);
router.get("/items/:id", inventoryController.getInventoryItemById);
router.post("/items", inventoryController.createInventoryItem);
router.put("/items/:id", inventoryController.updateInventoryItem);
router.delete("/items/:id", inventoryController.deleteInventoryItem);
router.post("/items/:id/adjust", inventoryController.adjustInventoryQuantity);

// Special inventory item queries
router.get("/items/sku/:sku", inventoryController.getInventoryItemsBySku);
router.get("/items/product/:productId", inventoryController.getInventoryItemsByProductId);
router.get("/low-stock", inventoryController.getLowStockItems);
router.get("/out-of-stock", inventoryController.getOutOfStockItems);

// Inventory Location routes
router.get("/locations", inventoryController.getLocations);
router.get("/locations/:id", inventoryController.getLocationById);
router.get("/locations/:id/inventory", inventoryController.getLocationInventory);
router.post("/locations", inventoryController.createLocation);
router.put("/locations/:id", inventoryController.updateLocation);
router.delete("/locations/:id", inventoryController.deleteLocation);

// Inventory Transaction routes
router.get("/transactions/inventory/:inventoryId", inventoryController.getTransactionsByInventoryId);
router.get("/transactions/reference/:reference", inventoryController.getTransactionsByReference);
router.post("/transactions", inventoryController.createTransaction);

// Inventory Reservation routes
router.get("/reservations/inventory/:inventoryId", inventoryController.getReservationsByInventoryId);
router.get("/reservations/order/:orderId", inventoryController.getReservationsByOrderId);
router.get("/reservations/cart/:cartId", inventoryController.getReservationsByCartId);
router.post("/reservations", inventoryController.createReservation);
router.put("/reservations/:id/status", inventoryController.updateReservationStatus);

// Product Availability routes
router.get("/products/:productId/availability", inventoryController.checkProductAvailability);

export const inventoryRouterAdmin = router;
