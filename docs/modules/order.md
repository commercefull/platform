# Order Feature

## Overview

The Order feature manages the complete order lifecycle from creation through fulfillment, including status management, cancellations, and refunds.

---

## Use Cases

| ID | Use Case | Actor | Purpose |
|---|---|---|---|
| UC-ORD-001 | List Orders | Merchant/Admin | List all orders with optional status/customer/date filtering, sorted newest first |
| UC-ORD-002 | Get Order Details | Merchant/Admin | Retrieve full order details including items, customer info, addresses, and payment info |
| UC-ORD-003 | Get Order Statistics | Merchant/Admin | Retrieve aggregated order metrics (count, revenue, average order value) with date range filtering |
| UC-ORD-004 | Update Order Status | Merchant/Admin | Transition an order to a new status following the valid state machine, creating a history entry |
| UC-ORD-005 | Cancel Order | Merchant/Admin | Cancel a cancellable order with reason, release inventory, and initiate refund if payment was captured |
| UC-ORD-006 | Process Refund | Merchant/Admin | Process a full or partial refund via the payment provider with a required reason |
| UC-ORD-007 | Get Order History | Merchant/Admin | Retrieve the chronological history of all status changes and events for an order |
| UC-ORD-008 | Get My Orders | Customer | Retrieve a paginated list of the authenticated customer's own orders |
| UC-ORD-009 | Get Order Details | Customer | Retrieve the customer's own order details by order ID or order number |
| UC-ORD-010 | Create Order | Customer | Create a new order from a basket, reserving inventory and processing payment authorization |
| UC-ORD-011 | Cancel Order | Customer | Cancel the customer's own order if in pending or confirmed status, with automatic refund for paid orders |

### API Endpoints

| ID | Method | Endpoint |
|---|---|---|
| UC-ORD-001 | GET | `/business/orders` |
| UC-ORD-002 | GET | `/business/orders/:orderId` |
| UC-ORD-003 | GET | `/business/orders/stats` |
| UC-ORD-004 | PUT | `/business/orders/:orderId/status` |
| UC-ORD-005 | POST | `/business/orders/:orderId/cancel` |
| UC-ORD-006 | POST | `/business/orders/:orderId/refund` |
| UC-ORD-007 | GET | `/business/orders/:orderId/history` |
| UC-ORD-008 | GET | `/orders` |
| UC-ORD-009 | GET | `/orders/:orderId` or `/orders/number/:orderNumber` |
| UC-ORD-010 | POST | `/orders` |
| UC-ORD-011 | POST | `/orders/:orderId/cancel` |

---

## Events Emitted

| Event                  | Trigger          | Payload                       |
| ---------------------- | ---------------- | ----------------------------- |
| `order.created`        | Order created    | orderId, customerId, total    |
| `order.status_changed` | Status updated   | orderId, oldStatus, newStatus |
| `order.cancelled`      | Order cancelled  | orderId, reason               |
| `order.refunded`       | Refund processed | orderId, refundAmount         |
| `order.completed`      | Order delivered  | orderId, customerId           |

---

## Integration Test Coverage

| Use Case   | Test File                       | Status |
| ---------- | ------------------------------- | ------ |
| UC-ORD-001 | `order/order.test.ts`           | ✅     |
| UC-ORD-002 | `order/order.test.ts`           | ✅     |
| UC-ORD-003 | `order/orderExpanded.test.ts`   | ✅     |
| UC-ORD-004 | `order/order.test.ts`           | ✅     |
| UC-ORD-005 | `order/order.test.ts`           | ✅     |
| UC-ORD-006 | `order/orderExpanded.test.ts`   | ✅     |
| UC-ORD-007 | `order/orderExpanded.test.ts`   | ✅     |
| UC-ORD-008 | `order/order.test.ts`           | ✅     |
| UC-ORD-009 | `order/order.test.ts`           | ✅     |
| UC-ORD-010 | `order/order.test.ts`           | ✅     |
| UC-ORD-011 | `order/orderExpanded.test.ts`   | ✅     |
| Order Items | `order/orderItem.test.ts`      | ✅     |
| Order Status | `order/orderStatus.test.ts`   | ✅     |


<!-- GENERATED:ENDPOINTS:START -->

| Method | Endpoint | Controller | Description |
|---|---|---|---|
| POST | `/business/order-items` | `createOrderItem` | — |
| GET | `/business/order-items/:orderItemId` | `getOrderItemById` | — |
| PUT | `/business/order-items/:orderItemId` | `updateOrderItem` | — |
| DELETE | `/business/order-items/:orderItemId` | `deleteOrderItem` | — |
| GET | `/business/orders` | `listOrders` | List all orders with filters
GET /business/orders |
| GET | `/business/orders/:orderId` | `getOrder` | Get order details
GET /business/orders/:orderId |
| POST | `/business/orders/:orderId/cancel` | `cancelOrder` | Cancel an order
POST /business/orders/:orderId/cancel |
| GET | `/business/orders/:orderId/fulfillment-history` | `getFulfillmentHistory` | — |
| PUT | `/business/orders/:orderId/fulfillment-status` | `updateFulfillmentStatus` | — |
| GET | `/business/orders/:orderId/history` | `getOrderHistory` | Get order status history
GET /business/orders/:orderId/history |
| GET | `/business/orders/:orderId/items` | `getOrderItems` | ============================================================================ Order Items ============================================================================ |
| GET | `/business/orders/:orderId/notes` | `listOrderNotes` | — |
| POST | `/business/orders/:orderId/notes` | `addOrderNote` | — |
| DELETE | `/business/orders/:orderId/notes/:noteId` | `deleteOrderNote` | — |
| GET | `/business/orders/:orderId/packages` | `listFulfillmentPackages` | — |
| POST | `/business/orders/:orderId/packages` | `createFulfillmentPackage` | — |
| POST | `/business/orders/:orderId/packages/:packageId/tracking` | `trackFulfillmentPackage` | — |
| GET | `/business/orders/:orderId/payment-history` | `getPaymentHistory` | — |
| PUT | `/business/orders/:orderId/payment-status` | `updatePaymentStatus` | ============================================================================ Payment & Fulfillment Status ============================================================================ |
| POST | `/business/orders/:orderId/refund` | `processRefund` | Process refund
POST /business/orders/:orderId/refund |
| GET | `/business/orders/:orderId/refunds` | `listOrderRefunds` | — |
| POST | `/business/orders/:orderId/refunds` | `createOrderRefund` | — |
| PUT | `/business/orders/:orderId/status` | `updateOrderStatus` | Update order status
PUT /business/orders/:orderId/status |
| GET | `/business/orders/:orderId/status-history` | `getStatusHistory` | ============================================================================ Status History ============================================================================ |
| GET | `/business/orders/number/:orderNumber` | `getOrderByNumber` | Get order by order number
GET /business/orders/number/:orderNumber |
| GET | `/business/orders/stats` | `getOrderStats` | Get order statistics
GET /business/orders/stats |
| GET | `/business/orders/store-summary` | `getStoreSalesSummary` | Get store sales summary
GET /business/orders/store-summary |
| GET | `/customer/order` | `getMyOrders` | Get customer's orders
GET /orders |
| POST | `/customer/order` | `createOrder` | Create a new order
POST /orders |
| GET | `/customer/order/:orderId` | `getOrder` | Get order by ID
GET /orders/:orderId |
| POST | `/customer/order/:orderId/cancel` | `cancelOrder` | Cancel an order
POST /orders/:orderId/cancel |
| GET | `/customer/order/number/:orderNumber` | `getOrderByNumber` | Get order by order number
GET /orders/number/:orderNumber |

<!-- GENERATED:ENDPOINTS:END -->

---

## Domain Errors

All errors extend `AppError` and are defined in `modules/order/domain/errors/OrderErrors.ts`.

### Order Not Found / Permission Errors

| Error Class | Code | HTTP | Description |
|---|---|---|---|
| `OrderNotFoundError` | `order.not_found` | 404 | Order not found |
| `OrderPermissionError` | `order.permission_denied` | 403 | No permission to view this order |
| `CancelOrderPermissionError` | `order.cancel_permission_denied` | 403 | No permission to cancel this order |

### Order State Errors

| Error Class | Code | HTTP | Description |
|---|---|---|---|
| `OrderCannotBeCancelledError` | `order.cannot_be_cancelled` | 400 | Order cannot be cancelled in current status |
| `OrderCannotBeRefundedError` | `order.cannot_be_refunded` | 400 | Order cannot be refunded in current status |
| `OrderCannotBeModifiedError` | `order.cannot_be_modified` | 400 | Order cannot be modified in current status |
| `InvalidOrderTransitionError` | `order.invalid_transition` | 400 | Invalid order status transition |
| `InvalidPaymentTransitionError` | `order.invalid_payment_transition` | 400 | Invalid payment status transition |
| `InvalidFulfillmentTransitionError` | `order.invalid_fulfillment_transition` | 400 | Invalid fulfillment status transition |

### Validation Errors

| Error Class | Code | HTTP | Description |
|---|---|---|---|
| `OrderMustContainItemsError` | `order.must_contain_items` | 400 | Order must contain at least one item |
| `CustomerEmailRequiredError` | `order.customer_email_required` | 400 | Customer email is required |
| `ShippingAddressRequiredError` | `order.shipping_address_required` | 400 | Shipping address is required |
| `NoteContentEmptyError` | `order.note_content_empty` | 400 | Note content cannot be empty |
| `CustomerIdRequiredError` | `order.customer_id_required` | 400 | Customer ID is required |
| `OrderIdOrNumberRequiredError` | `order.id_or_number_required` | 400 | Either orderId or orderNumber must be provided |

### Refund Errors

| Error Class | Code | HTTP | Description |
|---|---|---|---|
| `OrderPaymentNotFoundError` | `order.payment_not_found` | 404 | Order payment not found |
| `RefundAmountMustBePositiveError` | `order.refund_amount_must_be_positive` | 400 | Refund amount must be greater than zero |
| `RefundExceedsOrderTotalError` | `order.refund_exceeds_total` | 400 | Refund amount cannot exceed order total |
| `RefundExceedsRefundableBalanceError` | `order.refund_exceeds_refundable_balance` | 400 | Refund amount exceeds refundable balance |

### Domain Entity Errors

| Error Class | Code | HTTP | Description |
|---|---|---|---|
| `OrderItemNotFoundError` | `order.item_not_found` | 404 | Order item not found by ID |
| `QuantityMustBeAtLeastOneError` | `order.quantity_must_be_at_least_one` | 400 | Quantity must be at least 1 |
| `FulfillmentPackageNotFoundError` | `order.fulfillment_package_not_found` | 404 | Fulfillment package not found |

### Order Router Errors

| Error Class | Code | HTTP | Description |
|---|---|---|---|
| `NoEligibleStoresError` | `order.no_eligible_stores` | 400 | No eligible stores found for order fulfillment |
| `NoStoresWithInventoryError` | `order.no_stores_with_inventory` | 400 | No stores have sufficient inventory |
| `NoPickupStoresError` | `order.no_pickup_stores` | 400 | No pickup-enabled stores available |
| `NoFulfillmentStoresError` | `order.no_fulfillment_stores` | 400 | No fulfillment-enabled stores available |
| `NoStoresWithInventoryForFulfillmentError` | `order.no_stores_with_inventory_for_fulfillment` | 400 | No stores have inventory for fulfillment |

### Infrastructure Errors

| Error Class | Code | HTTP | Description |
|---|---|---|---|
| `FailedToCreateFulfillmentStatusHistoryError` | `order.fulfillment_status_history_creation_failed` | 500 | Failed to create fulfillment status history |
| `FailedToCreateOrderAddressError` | `order.address_creation_failed` | 500 | Failed to create order address |
| `FailedToCreateOrderAllocationError` | `order.allocation_creation_failed` | 500 | Failed to create order allocation |
| `FailedToCreateOrderDiscountError` | `order.discount_creation_failed` | 500 | Failed to create order discount |
| `FailedToCreateOrderFulfillmentItemError` | `order.fulfillment_item_creation_failed` | 500 | Failed to create order fulfillment item |
| `FailedToCreateOrderFulfillmentPackageError` | `order.fulfillment_package_creation_failed` | 500 | Failed to create order fulfillment package |
| `FailedToCreateOrderFulfillmentError` | `order.fulfillment_creation_failed` | 500 | Failed to create order fulfillment |
| `FailedToCreateOrderItemError` | `order.item_creation_failed` | 500 | Failed to create order item |
| `FailedToCreateOrderNoteError` | `order.note_creation_failed` | 500 | Failed to create order note |
| `FailedToCreateOrderPaymentRefundError` | `order.payment_refund_creation_failed` | 500 | Failed to create order payment refund |
| `FailedToCreateOrderPaymentError` | `order.payment_creation_failed` | 500 | Failed to create order payment |
| `FailedToCreateOrderError` | `order.creation_failed` | 500 | Failed to create order |
| `FailedToCreateOrderReturnItemError` | `order.return_item_creation_failed` | 500 | Failed to create order return item |
| `FailedToCreateOrderReturnError` | `order.return_creation_failed` | 500 | Failed to create order return |
| `FailedToCreateOrderShippingRateError` | `order.shipping_rate_creation_failed` | 500 | Failed to create order shipping rate |
| `FailedToCreateOrderShippingError` | `order.shipping_creation_failed` | 500 | Failed to create order shipping |
| `FailedToCreateOrderTaxError` | `order.tax_creation_failed` | 500 | Failed to create order tax |
