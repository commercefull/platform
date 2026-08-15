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
