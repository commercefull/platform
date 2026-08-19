# Inventory Feature

## Overview

The Inventory feature manages product stock levels, reservations, and availability tracking. It supports multi-location inventory, stock reservations for checkout, and low-stock alerts.

---

## Use Cases

| ID | Use Case | Actor | Purpose |
|---|---|---|---|
| UC-INV-001 | Check Product Availability | Customer/Guest | Check stock availability and status (in_stock, low_stock, out_of_stock) for a product SKU |
| UC-INV-002 | Get Inventory Levels | Merchant/Admin | Retrieve detailed stock levels across products and locations with reserved/available quantities |
| UC-INV-003 | Update Inventory Level | Merchant/Admin | Adjust stock level with a reason and create an inventory transaction record |
| UC-INV-004 | Create Stock Reservation | System/Checkout | Reserve stock for checkout items atomically, deducting from available quantity |
| UC-INV-005 | Release Stock Reservation | System/Checkout | Release a stock reservation, returning reserved quantity to available |
| UC-INV-006 | Confirm Reservation | System/Order | Convert a reservation to a permanent inventory deduction after order completion |
| UC-INV-007 | Get Inventory Transactions | Merchant/Admin | Retrieve the full inventory transaction audit trail with optional filtering |
| UC-INV-008 | Create Inventory Adjustment | Merchant/Admin | Create a positive or negative stock adjustment with a reason (damaged, lost, found, correction) |
| UC-INV-009 | Transfer Inventory | Merchant/Admin | Move stock between warehouse locations atomically |
| UC-INV-010 | Get Low Stock Products | Merchant/Admin | Retrieve products below their low-stock threshold for reorder planning |
| UC-INV-011 | Get Out of Stock Products | Merchant/Admin | Retrieve products with zero available stock |
| UC-INV-012 | Set Low Stock Threshold | Merchant/Admin | Configure the low-stock alert threshold for a specific product |

### API Endpoints

| ID | Method | Endpoint |
|---|---|---|
| UC-INV-001 | GET | `/inventory/availability/:sku` |
| UC-INV-002 | GET | `/business/inventory/levels` |
| UC-INV-003 | PUT | `/business/inventory/levels/:id` |
| UC-INV-004 | POST | `/business/inventory/reservations` |
| UC-INV-005 | DELETE | `/business/inventory/reservations/:id` |
| UC-INV-006 | POST | `/business/inventory/reservations/:id/confirm` |
| UC-INV-007 | GET | `/business/inventory/transactions` |
| UC-INV-008 | POST | `/business/inventory/adjustments` |
| UC-INV-009 | POST | `/business/inventory/transfers` |
| UC-INV-010 | GET | `/business/inventory/low-stock` |
| UC-INV-011 | GET | `/business/inventory/out-of-stock` |
| UC-INV-012 | PUT | `/business/inventory/products/:productId/threshold` |

---

## Events Emitted

| Event                    | Trigger               | Payload                            |
| ------------------------ | --------------------- | ---------------------------------- |
| `inventory.low`          | Stock below threshold | productId, locationId, quantity    |
| `inventory.out_of_stock` | Stock reaches zero    | productId, locationId              |
| `inventory.reserved`     | Stock reserved        | reservationId, productId, quantity |
| `inventory.released`     | Reservation released  | reservationId, quantity            |

---

## Integration Test Coverage

| Use Case   | Test File                              | Status |
| ---------- | -------------------------------------- | ------ |
| UC-INV-001 | `inventory/inventory.test.ts`          | ✅     |
| UC-INV-002 | `inventory/stockOperations.test.ts`    | ✅     |
| UC-INV-003 | `inventory/stockOperations.test.ts`    | ✅     |
| UC-INV-004 | `inventory/reservationConfirm.test.ts` | ✅     |
| UC-INV-005 | `inventory/reservationConfirm.test.ts` | ✅     |
| UC-INV-006 | `inventory/reservationConfirm.test.ts` | ✅     |
| UC-INV-007 | `inventory/inventory.test.ts`          | ✅     |
| UC-INV-008 | `inventory/stockOperations.test.ts`    | ✅     |
| UC-INV-009 | `inventory/poolAndTransfer.test.ts`    | ✅     |
| UC-INV-010 | `inventory/stockOperations.test.ts`    | ✅     |
| UC-INV-011 | `inventory/stockOperations.test.ts`    | ✅     |
| UC-INV-012 | `inventory/reservationConfirm.test.ts` | ✅     |
| Store Dispatch | `inventory/storeDispatch.test.ts`  | ✅     |
| Locations  | `inventory/location.test.ts`           | ✅     |


<!-- GENERATED:ENDPOINTS:START -->

| Method | Endpoint | Controller | Description |
|---|---|---|---|
| GET | `/business/inventory` | `listInventory` | — |
| GET | `/business/inventory/:inventoryId` | `getInventory` | — |
| POST | `/business/inventory/:inventoryId/adjust` | `adjustStock` | — |
| POST | `/business/inventory/:inventoryId/reserve` | `reserveStock` | — |
| POST | `/business/inventory/:inventoryId/restock` | `restockInventory` | — |
| POST | `/business/inventory/items` | `createInventoryItem` | — |
| GET | `/business/inventory/items` | `listInventoryItems` | — |
| GET | `/business/inventory/items/lookup` | `getInventoryItem` | — |
| GET | `/business/inventory/locations` | `listInventoryLocations` | — |
| POST | `/business/inventory/locations` | `createInventoryLocation` | — |
| GET | `/business/inventory/locations/:inventoryLocationId` | `getInventoryLocation` | — |
| PUT | `/business/inventory/locations/:inventoryLocationId` | `updateInventoryLocation` | — |
| DELETE | `/business/inventory/locations/:inventoryLocationId` | `deleteInventoryLocation` | — |
| POST | `/business/inventory/locations/:inventoryLocationId/adjust` | `adjustStock` | — |
| POST | `/business/inventory/locations/:inventoryLocationId/release` | `releaseReservation` | — |
| POST | `/business/inventory/locations/:inventoryLocationId/reserve` | `reserveStock` | — |
| GET | `/business/inventory/locations/low-stock` | `getLowStock` | — |
| GET | `/business/inventory/locations/out-of-stock` | `getOutOfStock` | — |
| GET | `/business/inventory/low-stock` | `getLowStock` | — |
| POST | `/business/inventory/pools` | `createInventoryPool` | — |
| POST | `/business/inventory/pools/allocate` | `allocateFromPool` | — |
| PUT | `/business/inventory/products/:productId/threshold` | `setLowStockThreshold` | — |
| POST | `/business/inventory/reservations/:reservationId/confirm` | `confirmReservation` | — |
| GET | `/business/inventory/transactions/product/:productId` | `getTransactionHistory` | — |
| GET | `/business/inventory/transactions/types` | `getTransactionTypes` | — |
| POST | `/business/inventory/transfer` | `transferStock` | — |
| POST | `/business/inventory/transfer-between-stores` | `transferBetweenStores` | — |
| GET | `/customer/inventory/availability/:sku` | `checkAvailability` | Check product availability by SKU |
| GET | `/customer/inventory/availability/product/:productId` | `checkProductAvailability` | Check product availability by productId |
| POST | `/dispatches` | `createStoreDispatch` | — |
| GET | `/dispatches` | `listStoreDispatches` | — |
| GET | `/dispatches/:dispatchId` | `getStoreDispatch` | — |
| PUT | `/dispatches/:dispatchId/approve` | `approveStoreDispatch` | — |
| PUT | `/dispatches/:dispatchId/cancel` | `cancelStoreDispatch` | — |
| PUT | `/dispatches/:dispatchId/dispatch` | `dispatchFromStore` | — |
| PUT | `/dispatches/:dispatchId/receive` | `receiveStoreDispatch` | — |

<!-- GENERATED:ENDPOINTS:END -->
