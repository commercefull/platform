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

| Method | Endpoint                         | Controller                                    | Description                |
| ------ | -------------------------------- | --------------------------------------------- | -------------------------- |
| PUT    | `/purchase-order-items/:id`      | `asyncHandler(updatePurchaseOrderItem)`       | —                          |
| DELETE | `/purchase-order-items/:id`      | `asyncHandler(deletePurchaseOrderItem)`       | —                          |
| GET    | `/purchase-orders`               | `asyncHandler(getPurchaseOrders)`             | Purchase order CRUD        |
| POST   | `/purchase-orders`               | `asyncHandler(createPurchaseOrder)`           | —                          |
| GET    | `/purchase-orders/:id`           | `asyncHandler(getPurchaseOrderById)`          | —                          |
| PUT    | `/purchase-orders/:id`           | `asyncHandler(updatePurchaseOrder)`           | —                          |
| DELETE | `/purchase-orders/:id`           | `asyncHandler(deletePurchaseOrder)`           | —                          |
| POST   | `/purchase-orders/:id/approve`   | `asyncHandler(approvePurchaseOrder)`          | Purchase order workflow    |
| POST   | `/purchase-orders/:id/cancel`    | `asyncHandler(cancelPurchaseOrder)`           | —                          |
| GET    | `/purchase-orders/:id/items`     | `asyncHandler(getPurchaseOrderItems)`         | Purchase order items       |
| POST   | `/purchase-orders/:id/items`     | `asyncHandler(addPurchaseOrderItem)`          | —                          |
| GET    | `/purchase-orders/:id/receiving` | `asyncHandler(getReceivingByPurchaseOrder)`   | —                          |
| POST   | `/purchase-orders/:id/send`      | `asyncHandler(sendPurchaseOrder)`             | —                          |
| GET    | `/receiving`                     | `asyncHandler(getReceivingRecords)`           | Receiving record CRUD      |
| POST   | `/receiving`                     | `asyncHandler(createReceivingRecord)`         | —                          |
| PUT    | `/receiving-items/:id`           | `asyncHandler(updateReceivingItem)`           | —                          |
| POST   | `/receiving-items/:id/accept`    | `asyncHandler(acceptReceivingItem)`           | —                          |
| POST   | `/receiving-items/:id/reject`    | `asyncHandler(rejectReceivingItem)`           | —                          |
| GET    | `/receiving/:id`                 | `asyncHandler(getReceivingRecordById)`        | —                          |
| PUT    | `/receiving/:id`                 | `asyncHandler(updateReceivingRecord)`         | —                          |
| POST   | `/receiving/:id/complete`        | `asyncHandler(completeReceiving)`             | —                          |
| GET    | `/receiving/:id/items`           | `asyncHandler(getReceivingItems)`             | Receiving items            |
| POST   | `/receiving/:id/items`           | `asyncHandler(createReceivingItem)`           | —                          |
| PUT    | `/supplier-addresses/:id`        | `asyncHandler(updateSupplierAddress)`         | —                          |
| DELETE | `/supplier-addresses/:id`        | `asyncHandler(deleteSupplierAddress)`         | —                          |
| PUT    | `/supplier-products/:id`         | `asyncHandler(updateSupplierProduct)`         | —                          |
| DELETE | `/supplier-products/:id`         | `asyncHandler(removeProductFromSupplier)`     | —                          |
| GET    | `/suppliers`                     | `asyncHandler(getSuppliers)`                  | Supplier CRUD              |
| POST   | `/suppliers`                     | `asyncHandler(createSupplier)`                | —                          |
| GET    | `/suppliers/:id`                 | `asyncHandler(getSupplierById)`               | —                          |
| PUT    | `/suppliers/:id`                 | `asyncHandler(updateSupplier)`                | —                          |
| DELETE | `/suppliers/:id`                 | `asyncHandler(deleteSupplier)`                | —                          |
| GET    | `/suppliers/:id/addresses`       | `asyncHandler(getSupplierAddresses)`          | Supplier addresses         |
| POST   | `/suppliers/:id/addresses`       | `asyncHandler(createSupplierAddress)`         | —                          |
| POST   | `/suppliers/:id/approve`         | `asyncHandler(approveSupplier)`               | —                          |
| GET    | `/suppliers/:id/products`        | `asyncHandler(getSupplierProducts)`           | Supplier products          |
| POST   | `/suppliers/:id/products`        | `asyncHandler(addProductToSupplier)`          | —                          |
| GET    | `/suppliers/:id/purchase-orders` | `asyncHandler(getPurchaseOrdersBySupplierId)` | —                          |
| PATCH  | `/suppliers/:id/status`          | `asyncHandler(updateSupplierStatus)`          | Supplier status management |
| POST   | `/suppliers/:id/suspend`         | `asyncHandler(suspendSupplier)`               | —                          |
| PATCH  | `/suppliers/:id/visibility`      | `asyncHandler(updateSupplierVisibility)`      | —                          |
| GET    | `/suppliers/code/:code`          | `asyncHandler(getSupplierByCode)`             | —                          |
| GET    | `/suppliers/statistics`          | `asyncHandler(getSupplierStatistics)`         | —                          |

<!-- GENERATED:ENDPOINTS:END -->
