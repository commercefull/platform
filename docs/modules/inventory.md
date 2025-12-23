# Inventory Feature

## Overview

The Inventory feature manages product stock levels, reservations, and availability tracking. It supports multi-location inventory, stock reservations for checkout, and low-stock alerts.

---

## Use Cases

### UC-INV-001: Check Product Availability (Customer)

**Actor:** Customer/Guest  
**Priority:** High

#### Given-When-Then

**Given** a product SKU  
**When** a customer checks availability  
**Then** the system returns stock availability information

#### API Endpoint

```
GET /inventory/availability/:sku
```

#### Business Rules

- Returns available quantity
- Returns stock status (in_stock, low_stock, out_of_stock)
- May include location-based availability
- Public endpoint, no auth required

---

### UC-INV-002: Get Inventory Levels (Business)

**Actor:** Merchant/Admin  
**Priority:** High

#### Given-When-Then

**Given** an authenticated merchant  
**When** they request inventory levels  
**Then** the system returns stock levels for all products/locations

#### API Endpoint

```
GET /business/inventory/levels
Query: productId, locationId, status, limit, offset
```

#### Business Rules

- Returns detailed inventory levels
- Supports filtering by product, location, status
- Includes reserved and available quantities

---

### UC-INV-003: Update Inventory Level (Business)

**Actor:** Merchant/Admin  
**Priority:** High

#### Given-When-Then

**Given** an authenticated merchant  
**And** valid inventory data  
**When** they update inventory  
**Then** the system adjusts the stock level  
**And** creates an inventory transaction

#### API Endpoint

```
PUT /business/inventory/levels/:id
Body: { quantity, reason, notes? }
```

#### Business Rules

- Requires reason for audit trail
- Creates inventory transaction record
- Triggers low stock alert if threshold reached
- Emits inventory.updated event

---

### UC-INV-004: Create Stock Reservation (Business)

**Actor:** System/Checkout  
**Priority:** High

#### Given-When-Then

**Given** a checkout in progress  
**And** items in the cart  
**When** the system reserves stock  
**Then** inventory is reserved for the order  
**And** emits inventory.reserved event

#### API Endpoint

```
POST /business/inventory/reservations
Body: { orderId, items: [{ productId, variantId, quantity, locationId? }] }
```

#### Business Rules

- Reservation expires after checkout timeout
- Reserved quantity is deducted from available
- Multiple items can be reserved atomically
- Fails if any item insufficient stock

---

### UC-INV-005: Release Stock Reservation (Business)

**Actor:** System/Checkout  
**Priority:** High

#### Given-When-Then

**Given** an existing reservation  
**When** the reservation is released (cancelled/expired)  
**Then** stock is returned to available  
**And** emits inventory.released event

#### API Endpoint

```
DELETE /business/inventory/reservations/:id
```

#### Business Rules

- Returns reserved quantity to available
- Used on checkout abandonment or order cancellation
- Idempotent - can be called multiple times safely

---

### UC-INV-006: Confirm Reservation (Business)

**Actor:** System/Order  
**Priority:** High

#### Given-When-Then

**Given** an existing reservation  
**And** a completed order  
**When** the reservation is confirmed  
**Then** inventory is permanently deducted

#### API Endpoint

```
POST /business/inventory/reservations/:id/confirm
Body: { orderId }
```

#### Business Rules

- Converts reservation to permanent deduction
- Creates inventory transaction record
- Reservation is marked as fulfilled

---

### UC-INV-007: Get Inventory Transactions (Business)

**Actor:** Merchant/Admin  
**Priority:** Medium

#### Given-When-Then

**Given** an authenticated merchant  
**When** they request inventory transactions  
**Then** the system returns the transaction history

#### API Endpoint

```
GET /business/inventory/transactions
Query: productId, locationId, type, dateFrom, dateTo, limit, offset
```

#### Business Rules

- Transaction types: adjustment, sale, return, transfer, reservation, release
- Full audit trail of all inventory changes
- Supports date range filtering

---

### UC-INV-008: Create Inventory Adjustment (Business)

**Actor:** Merchant/Admin  
**Priority:** High

#### Given-When-Then

**Given** an authenticated merchant  
**And** valid adjustment data  
**When** they create an adjustment  
**Then** inventory is adjusted  
**And** transaction is recorded

#### API Endpoint

```
POST /business/inventory/adjustments
Body: { productId, variantId, locationId, quantity, reason, notes }
```

#### Business Rules

- Positive or negative adjustments
- Reason is required (damaged, lost, found, correction, etc.)
- Creates audit trail

---

### UC-INV-009: Transfer Inventory (Business)

**Actor:** Merchant/Admin  
**Priority:** Medium

#### Given-When-Then

**Given** an authenticated merchant  
**And** multiple warehouse locations  
**When** they transfer inventory between locations  
**Then** stock moves from source to destination

#### API Endpoint

```
POST /business/inventory/transfers
Body: {
  fromLocationId,
  toLocationId,
  items: [{ productId, variantId, quantity }],
  notes?
}
```

#### Business Rules

- Source location must have sufficient stock
- Creates transfer record
- Updates both location inventories atomically

---

### UC-INV-010: Get Low Stock Products (Business)

**Actor:** Merchant/Admin  
**Priority:** Medium

#### Given-When-Then

**Given** an authenticated merchant  
**When** they request low stock products  
**Then** the system returns products below threshold

#### API Endpoint

```
GET /business/inventory/low-stock
Query: threshold, locationId, limit
```

#### Business Rules

- Uses product-specific or default threshold
- Useful for reorder planning
- Can filter by location

---

### UC-INV-011: Get Out of Stock Products (Business)

**Actor:** Merchant/Admin  
**Priority:** Medium

#### Given-When-Then

**Given** an authenticated merchant  
**When** they request out of stock products  
**Then** the system returns products with zero available

#### API Endpoint

```
GET /business/inventory/out-of-stock
Query: locationId, limit
```

#### Business Rules

- Includes products with reservations depleting stock
- Critical for inventory management

---

### UC-INV-012: Set Low Stock Threshold (Business)

**Actor:** Merchant/Admin  
**Priority:** Low

#### Given-When-Then

**Given** an authenticated merchant  
**And** a product  
**When** they set the low stock threshold  
**Then** alerts trigger at that level

#### API Endpoint

```
PUT /business/inventory/products/:productId/threshold
Body: { threshold: number }
```

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

| Use Case   | Test File                     | Status |
| ---------- | ----------------------------- | ------ |
| UC-INV-001 | `inventory/inventory.test.ts` | ✅     |
| UC-INV-002 | `inventory/inventory.test.ts` | 🟡     |
| UC-INV-003 | `inventory/inventory.test.ts` | ❌     |
| UC-INV-004 | `inventory/inventory.test.ts` | ❌     |
| UC-INV-005 | `inventory/inventory.test.ts` | ❌     |
| UC-INV-006 | `inventory/inventory.test.ts` | ❌     |
| UC-INV-007 | `inventory/inventory.test.ts` | ❌     |
| UC-INV-008 | `inventory/inventory.test.ts` | ❌     |
| UC-INV-009 | `inventory/inventory.test.ts` | ❌     |
| UC-INV-010 | `inventory/inventory.test.ts` | ❌     |
| UC-INV-011 | `inventory/inventory.test.ts` | ❌     |
| UC-INV-012 | `inventory/inventory.test.ts` | ❌     |
