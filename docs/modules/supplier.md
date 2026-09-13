# Supplier Feature

## Overview

The Supplier feature manages supplier/vendor relationships for inventory sourcing. It handles supplier profiles, purchase orders, and product sourcing for dropshipping or traditional inventory models.

---

## Use Cases

| ID         | Use Case                     | Actor          | Purpose                                                                    |
| ---------- | ---------------------------- | -------------- | -------------------------------------------------------------------------- |
| UC-SUP-001 | List Suppliers               | Merchant/Admin | List all supplier accounts with optional status/search filtering           |
| UC-SUP-002 | Get Supplier                 | Merchant/Admin | Retrieve a specific supplier by ID                                         |
| UC-SUP-003 | Create Supplier              | Merchant/Admin | Create a supplier with contact info, address, payment terms, and lead time |
| UC-SUP-004 | Update Supplier              | Merchant/Admin | Update an existing supplier's profile or contact details                   |
| UC-SUP-005 | Delete Supplier              | Merchant/Admin | Permanently delete a supplier account                                      |
| UC-SUP-006 | List Supplier Products       | Merchant/Admin | List all products linked to a specific supplier                            |
| UC-SUP-007 | Link Product to Supplier     | Merchant/Admin | Link a product to a supplier with cost and minimum order quantity          |
| UC-SUP-008 | Update Supplier Product      | Merchant/Admin | Update a supplier-product link's cost or min order quantity                |
| UC-SUP-009 | Unlink Product from Supplier | Merchant/Admin | Remove a product-supplier association                                      |
| UC-SUP-010 | List Purchase Orders         | Merchant/Admin | List all purchase orders with optional supplier/status filtering           |
| UC-SUP-011 | Get Purchase Order           | Merchant/Admin | Retrieve a specific purchase order by ID                                   |
| UC-SUP-012 | Create Purchase Order        | Merchant/Admin | Create a purchase order with line items for a supplier                     |
| UC-SUP-013 | Update Purchase Order        | Merchant/Admin | Update an existing purchase order's details                                |
| UC-SUP-014 | Send Purchase Order          | Merchant/Admin | Send a purchase order to the supplier                                      |
| UC-SUP-015 | Receive Purchase Order       | Merchant/Admin | Record received inventory from a purchase order, updating stock levels     |
| UC-SUP-016 | Cancel Purchase Order        | Merchant/Admin | Cancel a purchase order with a reason                                      |

### API Endpoints

| ID         | Method | Endpoint                                              |
| ---------- | ------ | ----------------------------------------------------- |
| UC-SUP-001 | GET    | `/business/suppliers`                                 |
| UC-SUP-002 | GET    | `/business/suppliers/:id`                             |
| UC-SUP-003 | POST   | `/business/suppliers`                                 |
| UC-SUP-004 | PUT    | `/business/suppliers/:id`                             |
| UC-SUP-005 | DELETE | `/business/suppliers/:id`                             |
| UC-SUP-006 | GET    | `/business/suppliers/:supplierId/products`            |
| UC-SUP-007 | POST   | `/business/suppliers/:supplierId/products`            |
| UC-SUP-008 | PUT    | `/business/suppliers/:supplierId/products/:productId` |
| UC-SUP-009 | DELETE | `/business/suppliers/:supplierId/products/:productId` |
| UC-SUP-010 | GET    | `/business/suppliers/purchase-orders`                 |
| UC-SUP-011 | GET    | `/business/suppliers/purchase-orders/:id`             |
| UC-SUP-012 | POST   | `/business/suppliers/purchase-orders`                 |
| UC-SUP-013 | PUT    | `/business/suppliers/purchase-orders/:id`             |
| UC-SUP-014 | POST   | `/business/suppliers/purchase-orders/:id/send`        |
| UC-SUP-015 | POST   | `/business/suppliers/purchase-orders/:id/receive`     |
| UC-SUP-016 | POST   | `/business/suppliers/purchase-orders/:id/cancel`      |

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

| Use Case                 | Test File                           | Status |
| ------------------------ | ----------------------------------- | ------ |
| UC-SUP-001 to UC-SUP-005 | `supplier/supplier.test.ts`         | ✅     |
| UC-SUP-006 to UC-SUP-009 | `supplier/supplier.test.ts`         | ✅     |
| UC-SUP-010 to UC-SUP-016 | `supplier/supplier.test.ts`         | ✅     |
| UC-SUP-017 to UC-SUP-025 | `supplier/supplierExpanded.test.ts` | ✅     |

<!-- GENERATED:ENDPOINTS:START -->

| Method | Endpoint | Controller | Description |
|---|---|---|---|
| PUT | `/purchase-order-items/:id` | `asyncHandler(purchaseOrderController.updatePurchaseOrderItem` | — |
| DELETE | `/purchase-order-items/:id` | `asyncHandler(purchaseOrderController.deletePurchaseOrderItem` | — |
| GET | `/purchase-orders` | `asyncHandler(purchaseOrderController.getPurchaseOrders)` | Purchase order CRUD |
| POST | `/purchase-orders` | `asyncHandler(purchaseOrderController.createPurchaseOrder)` | — |
| GET | `/purchase-orders/:id` | `asyncHandler(purchaseOrderController.getPurchaseOrderById)` | — |
| PUT | `/purchase-orders/:id` | `asyncHandler(purchaseOrderController.updatePurchaseOrder)` | — |
| DELETE | `/purchase-orders/:id` | `asyncHandler(purchaseOrderController.deletePurchaseOrder)` | — |
| POST | `/purchase-orders/:id/approve` | `asyncHandler(purchaseOrderController.approvePurchaseOrder)` | Purchase order workflow |
| POST | `/purchase-orders/:id/cancel` | `asyncHandler(purchaseOrderController.cancelPurchaseOrder)` | — |
| GET | `/purchase-orders/:id/items` | `asyncHandler(purchaseOrderController.getPurchaseOrderItems)` | Purchase order items |
| POST | `/purchase-orders/:id/items` | `asyncHandler(purchaseOrderController.addPurchaseOrderItem)` | — |
| GET | `/purchase-orders/:id/receiving` | `asyncHandler(receivingController.getReceivingByPurchaseOrder` | — |
| POST | `/purchase-orders/:id/send` | `asyncHandler(purchaseOrderController.sendPurchaseOrder)` | — |
| GET | `/receiving` | `asyncHandler(receivingController.getReceivingRecords)` | Receiving record CRUD |
| POST | `/receiving` | `asyncHandler(receivingController.createReceivingRecord)` | — |
| PUT | `/receiving-items/:id` | `asyncHandler(receivingController.updateReceivingItem)` | — |
| POST | `/receiving-items/:id/accept` | `asyncHandler(receivingController.acceptReceivingItem)` | — |
| POST | `/receiving-items/:id/reject` | `asyncHandler(receivingController.rejectReceivingItem)` | — |
| GET | `/receiving/:id` | `asyncHandler(receivingController.getReceivingRecordById)` | — |
| PUT | `/receiving/:id` | `asyncHandler(receivingController.updateReceivingRecord)` | — |
| POST | `/receiving/:id/complete` | `asyncHandler(receivingController.completeReceiving)` | — |
| GET | `/receiving/:id/items` | `asyncHandler(receivingController.getReceivingItems)` | Receiving items |
| POST | `/receiving/:id/items` | `asyncHandler(receivingController.createReceivingItem)` | — |
| PUT | `/supplier-addresses/:id` | `asyncHandler(supplierController.updateSupplierAddress)` | — |
| DELETE | `/supplier-addresses/:id` | `asyncHandler(supplierController.deleteSupplierAddress)` | — |
| PUT | `/supplier-products/:id` | `asyncHandler(supplierController.updateSupplierProduct)` | — |
| DELETE | `/supplier-products/:id` | `asyncHandler(supplierController.removeProductFromSupplier)` | — |
| GET | `/suppliers` | `asyncHandler(supplierController.getSuppliers)` | Supplier CRUD |
| POST | `/suppliers` | `asyncHandler(supplierController.createSupplier)` | — |
| GET | `/suppliers/:id` | `asyncHandler(supplierController.getSupplierById)` | — |
| PUT | `/suppliers/:id` | `asyncHandler(supplierController.updateSupplier)` | — |
| DELETE | `/suppliers/:id` | `asyncHandler(supplierController.deleteSupplier)` | — |
| GET | `/suppliers/:id/addresses` | `asyncHandler(supplierController.getSupplierAddresses)` | Supplier addresses |
| POST | `/suppliers/:id/addresses` | `asyncHandler(supplierController.createSupplierAddress)` | — |
| POST | `/suppliers/:id/approve` | `asyncHandler(supplierController.approveSupplier)` | — |
| GET | `/suppliers/:id/products` | `asyncHandler(supplierController.getSupplierProducts)` | Supplier products |
| POST | `/suppliers/:id/products` | `asyncHandler(supplierController.addProductToSupplier)` | — |
| GET | `/suppliers/:id/purchase-orders` | `asyncHandler(purchaseOrderController.getPurchaseOrdersBySupp` | — |
| PATCH | `/suppliers/:id/status` | `asyncHandler(supplierController.updateSupplierStatus)` | Supplier status management |
| POST | `/suppliers/:id/suspend` | `asyncHandler(supplierController.suspendSupplier)` | — |
| PATCH | `/suppliers/:id/visibility` | `asyncHandler(supplierController.updateSupplierVisibility)` | — |
| GET | `/suppliers/code/:code` | `asyncHandler(supplierController.getSupplierByCode)` | — |
| GET | `/suppliers/statistics` | `asyncHandler(supplierController.getSupplierStatistics)` | — |

<!-- GENERATED:ENDPOINTS:END -->
