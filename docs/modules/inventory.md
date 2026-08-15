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
| UC-INV-004 | `inventory/reservation.test.ts`        | ✅     |
| UC-INV-005 | `inventory/reservation.test.ts`        | ✅     |
| UC-INV-006 | `inventory/reservationConfirm.test.ts` | ✅     |
| UC-INV-007 | `inventory/transaction.test.ts`        | ✅     |
| UC-INV-008 | `inventory/stockOperations.test.ts`    | ✅     |
| UC-INV-009 | `inventory/poolAndTransfer.test.ts`    | ✅     |
| UC-INV-010 | `inventory/stockOperations.test.ts`    | ✅     |
| UC-INV-011 | `inventory/stockOperations.test.ts`    | ✅     |
| UC-INV-012 | `inventory/reservationConfirm.test.ts` | ✅     |
