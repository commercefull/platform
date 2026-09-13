# Inventory Feature

## Overview

The Inventory feature manages product stock levels, reservations, and availability tracking. It supports multi-location inventory, stock reservations for checkout, and low-stock alerts.

---

## Use Cases

| ID         | Use Case                    | Actor           | Purpose                                                                                         |
| ---------- | --------------------------- | --------------- | ----------------------------------------------------------------------------------------------- |
| UC-INV-001 | Check Product Availability  | Customer/Guest  | Check stock availability and status (in_stock, low_stock, out_of_stock) for a product SKU       |
| UC-INV-002 | Get Inventory Levels        | Merchant/Admin  | Retrieve detailed stock levels across products and locations with reserved/available quantities |
| UC-INV-003 | Update Inventory Level      | Merchant/Admin  | Adjust stock level with a reason and create an inventory transaction record                     |
| UC-INV-004 | Create Stock Reservation    | System/Checkout | Reserve stock for checkout items atomically, deducting from available quantity                  |
| UC-INV-005 | Release Stock Reservation   | System/Checkout | Release a stock reservation, returning reserved quantity to available                           |
| UC-INV-006 | Confirm Reservation         | System/Order    | Convert a reservation to a permanent inventory deduction after order completion                 |
| UC-INV-007 | Get Inventory Transactions  | Merchant/Admin  | Retrieve the full inventory transaction audit trail with optional filtering                     |
| UC-INV-008 | Create Inventory Adjustment | Merchant/Admin  | Create a positive or negative stock adjustment with a reason (damaged, lost, found, correction) |
| UC-INV-009 | Transfer Inventory          | Merchant/Admin  | Move stock between warehouse locations atomically                                               |
| UC-INV-010 | Get Low Stock Products      | Merchant/Admin  | Retrieve products below their low-stock threshold for reorder planning                          |
| UC-INV-011 | Get Out of Stock Products   | Merchant/Admin  | Retrieve products with zero available stock                                                     |
| UC-INV-012 | Set Low Stock Threshold     | Merchant/Admin  | Configure the low-stock alert threshold for a specific product                                  |

### API Endpoints

| ID         | Method | Endpoint                                            |
| ---------- | ------ | --------------------------------------------------- |
| UC-INV-001 | GET    | `/inventory/availability/:sku`                      |
| UC-INV-002 | GET    | `/business/inventory/levels`                        |
| UC-INV-003 | PUT    | `/business/inventory/levels/:id`                    |
| UC-INV-004 | POST   | `/business/inventory/reservations`                  |
| UC-INV-005 | DELETE | `/business/inventory/reservations/:id`              |
| UC-INV-006 | POST   | `/business/inventory/reservations/:id/confirm`      |
| UC-INV-007 | GET    | `/business/inventory/transactions`                  |
| UC-INV-008 | POST   | `/business/inventory/adjustments`                   |
| UC-INV-009 | POST   | `/business/inventory/transfers`                     |
| UC-INV-010 | GET    | `/business/inventory/low-stock`                     |
| UC-INV-011 | GET    | `/business/inventory/out-of-stock`                  |
| UC-INV-012 | PUT    | `/business/inventory/products/:productId/threshold` |

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

| Use Case       | Test File                              | Status |
| -------------- | -------------------------------------- | ------ |
| UC-INV-001     | `inventory/inventory.test.ts`          | ✅     |
| UC-INV-002     | `inventory/stockOperations.test.ts`    | ✅     |
| UC-INV-003     | `inventory/stockOperations.test.ts`    | ✅     |
| UC-INV-004     | `inventory/reservationConfirm.test.ts` | ✅     |
| UC-INV-005     | `inventory/reservationConfirm.test.ts` | ✅     |
| UC-INV-006     | `inventory/reservationConfirm.test.ts` | ✅     |
| UC-INV-007     | `inventory/inventory.test.ts`          | ✅     |
| UC-INV-008     | `inventory/stockOperations.test.ts`    | ✅     |
| UC-INV-009     | `inventory/poolAndTransfer.test.ts`    | ✅     |
| UC-INV-010     | `inventory/stockOperations.test.ts`    | ✅     |
| UC-INV-011     | `inventory/stockOperations.test.ts`    | ✅     |
| UC-INV-012     | `inventory/reservationConfirm.test.ts` | ✅     |
| Store Dispatch | `inventory/storeDispatch.test.ts`      | ✅     |
| Locations      | `inventory/location.test.ts`           | ✅     |

<!-- GENERATED:ENDPOINTS:START -->

| Method | Endpoint | Controller | Description |
|---|---|---|---|
| POST | `/dispatches` | `asyncHandler(createStoreDispatch)` | — |
| GET | `/dispatches` | `asyncHandler(listStoreDispatches)` | — |
| GET | `/dispatches/:dispatchId` | `asyncHandler(getStoreDispatch)` | — |
| PUT | `/dispatches/:dispatchId/approve` | `asyncHandler(approveStoreDispatch)` | — |
| PUT | `/dispatches/:dispatchId/cancel` | `asyncHandler(cancelStoreDispatch)` | — |
| PUT | `/dispatches/:dispatchId/dispatch` | `asyncHandler(dispatchFromStore)` | — |
| PUT | `/dispatches/:dispatchId/receive` | `asyncHandler(receiveStoreDispatch)` | — |
| GET | `/inventory` | `asyncHandler(inventoryController.listInventoryLocations)` | — |
| GET | `/inventory/:inventoryId` | `asyncHandler(inventoryController.getInventoryLocation)` | — |
| POST | `/inventory/:inventoryId/adjust` | `asyncHandler(inventoryController.adjustStock)` | — |
| POST | `/inventory/:inventoryId/reserve` | `asyncHandler(inventoryController.reserveStock)` | — |
| POST | `/inventory/:inventoryId/restock` | `asyncHandler(inventoryController.adjustStock)` | — |
| GET | `/inventory/availability/:sku` | `asyncHandler(checkAvailability)` | Check product availability by SKU |
| GET | `/inventory/availability/product/:productId` | `asyncHandler(checkProductAvailability)` | Check product availability by productId |
| POST | `/inventory/items` | `asyncHandler(inventoryController.createInventoryItem)` | — |
| GET | `/inventory/items` | `asyncHandler(inventoryController.listInventoryItems)` | — |
| GET | `/inventory/items/lookup` | `asyncHandler(inventoryController.getInventoryItem)` | — |
| GET | `/inventory/locations` | `asyncHandler(inventoryController.listInventoryLocations)` | — |
| POST | `/inventory/locations` | `asyncHandler(inventoryController.createInventoryLocation)` | — |
| GET | `/inventory/locations/:inventoryLocationId` | `asyncHandler(inventoryController.getInventoryLocation)` | — |
| PUT | `/inventory/locations/:inventoryLocationId` | `asyncHandler(inventoryController.updateInventoryLocation)` | — |
| DELETE | `/inventory/locations/:inventoryLocationId` | `asyncHandler(inventoryController.deleteInventoryLocation)` | — |
| POST | `/inventory/locations/:inventoryLocationId/adjust` | `asyncHandler(inventoryController.adjustStock)` | — |
| POST | `/inventory/locations/:inventoryLocationId/release` | `asyncHandler(inventoryController.releaseReservation)` | — |
| POST | `/inventory/locations/:inventoryLocationId/reserve` | `asyncHandler(inventoryController.reserveStock)` | — |
| GET | `/inventory/locations/low-stock` | `asyncHandler(inventoryController.getLowStock)` | — |
| GET | `/inventory/locations/out-of-stock` | `asyncHandler(inventoryController.getOutOfStock)` | — |
| GET | `/inventory/low-stock` | `asyncHandler(inventoryController.getLowStock)` | — |
| POST | `/inventory/pools` | `asyncHandler(inventoryController.createInventoryPool)` | — |
| POST | `/inventory/pools/allocate` | `asyncHandler(inventoryController.allocateFromPool)` | — |
| PUT | `/inventory/products/:productId/threshold` | `asyncHandler(inventoryController.setLowStockThreshold)` | — |
| POST | `/inventory/reservations/:reservationId/confirm` | `asyncHandler(inventoryController.confirmReservation)` | — |
| GET | `/inventory/transactions/product/:productId` | `asyncHandler(inventoryController.getTransactionHistory)` | — |
| GET | `/inventory/transactions/types` | `asyncHandler(inventoryController.getTransactionTypes)` | — |
| POST | `/inventory/transfer` | `asyncHandler(inventoryController.transferStock)` | — |
| POST | `/inventory/transfer-between-stores` | `asyncHandler(inventoryController.transferBetweenStores)` | — |

<!-- GENERATED:ENDPOINTS:END -->
