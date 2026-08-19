# Supplier Feature

## Overview

The Supplier feature manages supplier/vendor relationships for inventory sourcing. It handles supplier profiles, purchase orders, and product sourcing for dropshipping or traditional inventory models.

---

## Use Cases

| ID | Use Case | Actor | Purpose |
|---|---|---|---|
| UC-SUP-001 | List Suppliers | Merchant/Admin | List all supplier accounts with optional status/search filtering |
| UC-SUP-002 | Get Supplier | Merchant/Admin | Retrieve a specific supplier by ID |
| UC-SUP-003 | Create Supplier | Merchant/Admin | Create a supplier with contact info, address, payment terms, and lead time |
| UC-SUP-004 | Update Supplier | Merchant/Admin | Update an existing supplier's profile or contact details |
| UC-SUP-005 | Delete Supplier | Merchant/Admin | Permanently delete a supplier account |
| UC-SUP-006 | List Supplier Products | Merchant/Admin | List all products linked to a specific supplier |
| UC-SUP-007 | Link Product to Supplier | Merchant/Admin | Link a product to a supplier with cost and minimum order quantity |
| UC-SUP-008 | Update Supplier Product | Merchant/Admin | Update a supplier-product link's cost or min order quantity |
| UC-SUP-009 | Unlink Product from Supplier | Merchant/Admin | Remove a product-supplier association |
| UC-SUP-010 | List Purchase Orders | Merchant/Admin | List all purchase orders with optional supplier/status filtering |
| UC-SUP-011 | Get Purchase Order | Merchant/Admin | Retrieve a specific purchase order by ID |
| UC-SUP-012 | Create Purchase Order | Merchant/Admin | Create a purchase order with line items for a supplier |
| UC-SUP-013 | Update Purchase Order | Merchant/Admin | Update an existing purchase order's details |
| UC-SUP-014 | Send Purchase Order | Merchant/Admin | Send a purchase order to the supplier |
| UC-SUP-015 | Receive Purchase Order | Merchant/Admin | Record received inventory from a purchase order, updating stock levels |
| UC-SUP-016 | Cancel Purchase Order | Merchant/Admin | Cancel a purchase order with a reason |

### API Endpoints

| ID | Method | Endpoint |
|---|---|---|
| UC-SUP-001 | GET | `/business/suppliers` |
| UC-SUP-002 | GET | `/business/suppliers/:id` |
| UC-SUP-003 | POST | `/business/suppliers` |
| UC-SUP-004 | PUT | `/business/suppliers/:id` |
| UC-SUP-005 | DELETE | `/business/suppliers/:id` |
| UC-SUP-006 | GET | `/business/suppliers/:supplierId/products` |
| UC-SUP-007 | POST | `/business/suppliers/:supplierId/products` |
| UC-SUP-008 | PUT | `/business/suppliers/:supplierId/products/:productId` |
| UC-SUP-009 | DELETE | `/business/suppliers/:supplierId/products/:productId` |
| UC-SUP-010 | GET | `/business/suppliers/purchase-orders` |
| UC-SUP-011 | GET | `/business/suppliers/purchase-orders/:id` |
| UC-SUP-012 | POST | `/business/suppliers/purchase-orders` |
| UC-SUP-013 | PUT | `/business/suppliers/purchase-orders/:id` |
| UC-SUP-014 | POST | `/business/suppliers/purchase-orders/:id/send` |
| UC-SUP-015 | POST | `/business/suppliers/purchase-orders/:id/receive` |
| UC-SUP-016 | POST | `/business/suppliers/purchase-orders/:id/cancel` |

---

## Events Emitted

| Event                   | Trigger          | Payload                     |
| ----------------------- | ---------------- | --------------------------- |
| `supplier.created`      | Supplier created | supplierId                  |
| `supplier.po.created`   | PO created       | purchaseOrderId, supplierId |
| `supplier.po.sent`      | PO sent          | purchaseOrderId             |
| `supplier.po.received`  | PO received      | purchaseOrderId, items      |
| `supplier.po.cancelled` | PO cancelled     | purchaseOrderId             |

---

## Integration Test Coverage

| Use Case                 | Test File                          | Status |
| ------------------------ | ---------------------------------- | ------ |
| UC-SUP-001 to UC-SUP-005 | `supplier/supplier.test.ts`        | ✅     |
| UC-SUP-006 to UC-SUP-009 | `supplier/supplier.test.ts`        | ✅     |
| UC-SUP-010 to UC-SUP-016 | `supplier/supplier.test.ts`        | ✅     |
| UC-SUP-017 to UC-SUP-025 | `supplier/supplierExpanded.test.ts`| ✅     |


<!-- GENERATED:ENDPOINTS:START -->

| Method | Endpoint | Controller | Description |
|---|---|---|---|
| PUT | `/business/purchase-order-items/:id` | `updatePurchaseOrderItem` | — |
| DELETE | `/business/purchase-order-items/:id` | `deletePurchaseOrderItem` | — |
| GET | `/business/purchase-orders` | `getPurchaseOrders` | Purchase order CRUD |
| POST | `/business/purchase-orders` | `createPurchaseOrder` | — |
| GET | `/business/purchase-orders/:id` | `getPurchaseOrderById` | — |
| PUT | `/business/purchase-orders/:id` | `updatePurchaseOrder` | — |
| DELETE | `/business/purchase-orders/:id` | `deletePurchaseOrder` | — |
| POST | `/business/purchase-orders/:id/approve` | `approvePurchaseOrder` | Purchase order workflow |
| POST | `/business/purchase-orders/:id/cancel` | `cancelPurchaseOrder` | — |
| GET | `/business/purchase-orders/:id/items` | `getPurchaseOrderItems` | Purchase order items |
| POST | `/business/purchase-orders/:id/items` | `addPurchaseOrderItem` | — |
| GET | `/business/purchase-orders/:id/receiving` | `getReceivingByPurchaseOrder` | — |
| POST | `/business/purchase-orders/:id/send` | `sendPurchaseOrder` | — |
| GET | `/business/receiving` | `getReceivingRecords` | Receiving record CRUD |
| POST | `/business/receiving` | `createReceivingRecord` | — |
| PUT | `/business/receiving-items/:id` | `updateReceivingItem` | — |
| POST | `/business/receiving-items/:id/accept` | `acceptReceivingItem` | — |
| POST | `/business/receiving-items/:id/reject` | `rejectReceivingItem` | — |
| GET | `/business/receiving/:id` | `getReceivingRecordById` | — |
| PUT | `/business/receiving/:id` | `updateReceivingRecord` | — |
| POST | `/business/receiving/:id/complete` | `completeReceiving` | — |
| GET | `/business/receiving/:id/items` | `getReceivingItems` | Receiving items |
| POST | `/business/receiving/:id/items` | `createReceivingItem` | — |
| PUT | `/business/supplier-addresses/:id` | `updateSupplierAddress` | — |
| DELETE | `/business/supplier-addresses/:id` | `deleteSupplierAddress` | — |
| PUT | `/business/supplier-products/:id` | `updateSupplierProduct` | — |
| DELETE | `/business/supplier-products/:id` | `removeProductFromSupplier` | — |
| GET | `/business/suppliers` | `getSuppliers` | Supplier CRUD |
| POST | `/business/suppliers` | `createSupplier` | — |
| GET | `/business/suppliers/:id` | `getSupplierById` | — |
| PUT | `/business/suppliers/:id` | `updateSupplier` | — |
| DELETE | `/business/suppliers/:id` | `deleteSupplier` | — |
| GET | `/business/suppliers/:id/addresses` | `getSupplierAddresses` | Supplier addresses |
| POST | `/business/suppliers/:id/addresses` | `createSupplierAddress` | — |
| POST | `/business/suppliers/:id/approve` | `approveSupplier` | — |
| GET | `/business/suppliers/:id/products` | `getSupplierProducts` | Supplier products |
| POST | `/business/suppliers/:id/products` | `addProductToSupplier` | — |
| GET | `/business/suppliers/:id/purchase-orders` | `getPurchaseOrdersBySupplierId` | — |
| PATCH | `/business/suppliers/:id/status` | `updateSupplierStatus` | Supplier status management |
| POST | `/business/suppliers/:id/suspend` | `suspendSupplier` | — |
| PATCH | `/business/suppliers/:id/visibility` | `updateSupplierVisibility` | — |
| GET | `/business/suppliers/code/:code` | `getSupplierByCode` | — |
| GET | `/business/suppliers/statistics` | `getSupplierStatistics` | — |

<!-- GENERATED:ENDPOINTS:END -->
