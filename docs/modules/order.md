# Order Feature

## Overview

The Order feature manages the complete order lifecycle from creation through fulfillment, including status management, cancellations, and refunds.

---

## Use Cases

### UC-ORD-001: List Orders (Business)

**Actor:** Merchant/Admin  
**Priority:** High

#### Given-When-Then

**Given** an authenticated merchant  
**When** they request the list of orders with optional filters  
**Then** the system returns a paginated list of orders matching the criteria

#### API Endpoint

```
GET /business/orders
Query: status, customerId, dateFrom, dateTo, limit, offset
```

#### Business Rules

- Orders are sorted by creation date (newest first) by default
- Supports filtering by status, customer, date range
- Returns order summary (not full details) for performance

---

### UC-ORD-002: Get Order Details (Business)

**Actor:** Merchant/Admin  
**Priority:** High

#### Given-When-Then

**Given** an authenticated merchant  
**And** a valid order ID  
**When** they request order details  
**Then** the system returns the complete order with items, addresses, and payment info

#### API Endpoint

```
GET /business/orders/:orderId
```

#### Business Rules

- Returns full order details including all line items
- Includes customer information
- Includes shipping and billing addresses
- Includes payment information

---

### UC-ORD-003: Get Order Statistics (Business)

**Actor:** Merchant/Admin  
**Priority:** Medium

#### Given-When-Then

**Given** an authenticated merchant  
**When** they request order statistics  
**Then** the system returns aggregated order metrics

#### API Endpoint

```
GET /business/orders/stats
Query: dateFrom, dateTo
```

#### Business Rules

- Returns total order count, revenue, average order value
- Can be filtered by date range
- Includes breakdown by status

---

### UC-ORD-004: Update Order Status (Business)

**Actor:** Merchant/Admin  
**Priority:** High

#### Given-When-Then

**Given** an authenticated merchant  
**And** a valid order ID  
**And** a valid target status  
**When** they update the order status  
**Then** the system transitions the order to the new status  
**And** creates a status history entry  
**And** emits an order.status_changed event

#### API Endpoint

```
PUT /business/orders/:orderId/status
Body: { status: string, notes?: string }
```

#### Business Rules

- Status transitions must follow valid state machine
- Cannot transition from completed/cancelled states
- Records who made the change and when
- Triggers appropriate notifications

#### Valid Status Transitions

```
pending → confirmed → processing → shipped → delivered
pending → cancelled
confirmed → cancelled
processing → cancelled (with refund)
delivered → returned
```

---

### UC-ORD-005: Cancel Order (Business)

**Actor:** Merchant/Admin  
**Priority:** High

#### Given-When-Then

**Given** an authenticated merchant  
**And** a cancellable order  
**When** they cancel the order with a reason  
**Then** the system marks the order as cancelled  
**And** releases any reserved inventory  
**And** initiates refund if payment was captured  
**And** emits order.cancelled event

#### API Endpoint

```
POST /business/orders/:orderId/cancel
Body: { reason: string, refundAmount?: number }
```

#### Business Rules

- Order must be in pending, confirmed, or processing status
- Shipped orders cannot be cancelled (must use returns)
- Full or partial refund can be specified
- Inventory reservations are released

---

### UC-ORD-006: Process Refund (Business)

**Actor:** Merchant/Admin  
**Priority:** High

#### Given-When-Then

**Given** an authenticated merchant  
**And** an order with captured payment  
**When** they initiate a refund  
**Then** the system processes the refund via payment provider  
**And** updates order refund status  
**And** emits order.refunded event

#### API Endpoint

```
POST /business/orders/:orderId/refund
Body: { amount: number, reason: string, lineItems?: array }
```

#### Business Rules

- Refund amount cannot exceed captured amount
- Can refund full or partial amount
- Multiple partial refunds allowed up to total captured
- Refund reason is required for auditing

---

### UC-ORD-007: Get Order History (Business)

**Actor:** Merchant/Admin  
**Priority:** Medium

#### Given-When-Then

**Given** an authenticated merchant  
**And** a valid order ID  
**When** they request the order history  
**Then** the system returns all status changes and events for the order

#### API Endpoint

```
GET /business/orders/:orderId/history
```

#### Business Rules

- Returns chronological list of all order events
- Includes status changes, notes, and who made changes
- Read-only historical record

---

### UC-ORD-008: Get My Orders (Customer)

**Actor:** Customer  
**Priority:** High

#### Given-When-Then

**Given** an authenticated customer  
**When** they request their orders  
**Then** the system returns a list of their orders

#### API Endpoint

```
GET /orders
Query: status, limit, offset
```

#### Business Rules

- Only returns orders belonging to the customer
- Sorted by date (newest first)
- Supports pagination

---

### UC-ORD-009: Get Order Details (Customer)

**Actor:** Customer  
**Priority:** High

#### Given-When-Then

**Given** an authenticated customer  
**And** an order that belongs to them  
**When** they request order details  
**Then** the system returns the order information

#### API Endpoint

```
GET /orders/:orderId
GET /orders/number/:orderNumber
```

#### Business Rules

- Customer can only view their own orders
- Returns 404 if order doesn't exist or doesn't belong to customer
- Can retrieve by order ID or order number

---

### UC-ORD-010: Create Order (Customer)

**Actor:** Customer  
**Priority:** High

#### Given-When-Then

**Given** an authenticated customer  
**And** a valid basket with items  
**And** valid shipping and payment information  
**When** they create an order  
**Then** the system creates a new order from the basket  
**And** reserves inventory  
**And** processes payment authorization  
**And** emits order.created event

#### API Endpoint

```
POST /orders
Body: { basketId, shippingAddressId, billingAddressId, paymentMethodId, ... }
```

#### Business Rules

- Basket must have items and not be empty
- All items must be in stock
- Payment must be authorized
- Basket is converted and cleared upon order creation

---

### UC-ORD-011: Cancel Order (Customer)

**Actor:** Customer  
**Priority:** Medium

#### Given-When-Then

**Given** an authenticated customer  
**And** an order that belongs to them  
**And** the order is in a cancellable state  
**When** they request to cancel the order  
**Then** the system cancels the order  
**And** initiates refund process

#### API Endpoint

```
POST /orders/:orderId/cancel
Body: { reason?: string }
```

#### Business Rules

- Customer can only cancel their own orders
- Order must be in pending or confirmed status
- Processing/shipped orders cannot be cancelled by customer
- Refund is automatic for paid orders

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

| Use Case   | Test File             | Status |
| ---------- | --------------------- | ------ |
| UC-ORD-001 | `order/order.test.ts` | ✅     |
| UC-ORD-002 | `order/order.test.ts` | ✅     |
| UC-ORD-003 | `order/order.test.ts` | 🟡     |
| UC-ORD-004 | `order/order.test.ts` | ✅     |
| UC-ORD-005 | `order/order.test.ts` | ✅     |
| UC-ORD-006 | `order/order.test.ts` | 🟡     |
| UC-ORD-007 | `order/order.test.ts` | ❌     |
| UC-ORD-008 | `order/order.test.ts` | ✅     |
| UC-ORD-009 | `order/order.test.ts` | ✅     |
| UC-ORD-010 | `order/order.test.ts` | ✅     |
| UC-ORD-011 | `order/order.test.ts` | 🟡     |
