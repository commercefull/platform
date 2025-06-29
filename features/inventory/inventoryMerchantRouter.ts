import express from "express";
import { adjustInventoryQuantity, checkProductAvailability, createInventoryItem, createLocation, createReservation, createTransaction, deleteInventoryItem, deleteLocation, getInventoryItemById, getInventoryItems, getInventoryItemsByProductId, getInventoryItemsBySku, getLocationById, getLocationInventory, getLocations, getLowStockItems, getOutOfStockItems, getReservationsByCartId, getReservationsByInventoryId, getReservationsByOrderId, getTransactionsByInventoryId, getTransactionsByReference, updateInventoryItem, updateLocation, updateReservationStatus } from "./controllers/inventoryMerchantController";
import { isMerchantLoggedIn } from "../../libs/auth";

const router = express.Router();

router.use(isMerchantLoggedIn);

// Inventory Item routes
router.get("/items", getInventoryItems);
router.get("/items/:id", getInventoryItemById);
router.post("/items", createInventoryItem);
router.put("/items/:id", updateInventoryItem);
router.delete("/items/:id", deleteInventoryItem);
router.post("/items/:id/adjust", adjustInventoryQuantity);

// Special inventory item queries
router.get("/items/sku/:sku", getInventoryItemsBySku);
router.get("/items/product/:productId", getInventoryItemsByProductId);
router.get("/low-stock", getLowStockItems);
router.get("/out-of-stock", getOutOfStockItems);

// Inventory Location routes
router.get("/locations", getLocations);
router.get("/locations/:id", getLocationById);
router.get("/locations/:id/inventory", getLocationInventory);
router.post("/locations", createLocation);
router.put("/locations/:id", updateLocation);
router.delete("/locations/:id", deleteLocation);

// Inventory Transaction routes
router.get("/transactions/inventory/:inventoryId", getTransactionsByInventoryId);
router.get("/transactions/reference/:reference", getTransactionsByReference);
router.post("/transactions", createTransaction);

// Inventory Reservation routes
router.get("/reservations/inventory/:inventoryId", getReservationsByInventoryId);
router.get("/reservations/order/:orderId", getReservationsByOrderId);
router.get("/reservations/cart/:cartId", getReservationsByCartId);
router.post("/reservations", createReservation);
router.put("/reservations/:id/status", updateReservationStatus);

// Product Availability routes
router.get("/products/:productId/availability", checkProductAvailability);

export const inventoryMerchantRouter = router;
