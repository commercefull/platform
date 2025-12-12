# Basket Feature

## Overview

The Basket (Shopping Cart) feature manages customer shopping sessions, allowing items to be added, modified, and removed before checkout. Supports both authenticated customers and anonymous sessions.

---

## Use Cases

### UC-BSK-001: Get or Create Basket
**Actor:** Customer/Guest  
**Priority:** High

#### Given-When-Then

**Given** a user (authenticated or anonymous)  
**When** they request a basket  
**Then** the system returns their existing basket OR creates a new one

#### API Endpoint
```
POST /basket
Body: { sessionId?: string, customerId?: string }
```

#### Business Rules
- Authenticated users get basket by customerId
- Anonymous users get basket by sessionId
- If no basket exists, create a new empty basket
- Baskets expire after 30 days of inactivity

---

### UC-BSK-002: Get My Basket
**Actor:** Customer  
**Priority:** High

#### Given-When-Then

**Given** an authenticated customer  
**When** they request their current basket  
**Then** the system returns their active basket with all items

#### API Endpoint
```
GET /basket/me
```

#### Business Rules
- Returns null if no active basket exists
- Only returns non-expired baskets
- Includes calculated totals and item details

---

### UC-BSK-003: Get Basket by ID
**Actor:** Customer/Guest  
**Priority:** High

#### Given-When-Then

**Given** a valid basket ID  
**When** the user requests the basket  
**Then** the system returns the basket with all items and calculations

#### API Endpoint
```
GET /basket/:basketId
```

#### Business Rules
- Public endpoint (no auth required for anonymous carts)
- Returns 404 if basket doesn't exist or is expired
- Includes real-time pricing calculations

---

### UC-BSK-004: Get Basket Summary
**Actor:** Customer/Guest  
**Priority:** Medium

#### Given-When-Then

**Given** a valid basket ID  
**When** the user requests a basket summary  
**Then** the system returns a lightweight summary (item count, totals)

#### API Endpoint
```
GET /basket/:basketId/summary
```

#### Business Rules
- Optimized for header cart widgets
- Returns only counts and totals, not full item details
- Cached for performance

---

### UC-BSK-005: Add Item to Basket
**Actor:** Customer/Guest  
**Priority:** High

#### Given-When-Then

**Given** a valid basket  
**And** a valid product/variant  
**And** the item is in stock  
**When** the user adds the item  
**Then** the system adds the item to the basket  
**And** recalculates totals  
**And** emits basket.item_added event

#### API Endpoint
```
POST /basket/:basketId/items
Body: { productId, productVariantId?, quantity, options?: object }
```

#### Business Rules
- If item already exists, quantity is increased
- Validates product availability
- Validates maximum quantity limits
- Applies any applicable product promotions
- Updates basket totals

---

### UC-BSK-006: Update Item Quantity
**Actor:** Customer/Guest  
**Priority:** High

#### Given-When-Then

**Given** a basket with items  
**And** a valid basket item ID  
**When** the user updates the quantity  
**Then** the system updates the item quantity  
**And** recalculates totals

#### API Endpoint
```
PATCH /basket/:basketId/items/:basketItemId
Body: { quantity: number }
```

#### Business Rules
- Quantity must be > 0 (use delete for removal)
- Validates against available stock
- Validates against maximum quantity limits
- Recalculates line item total and basket total

---

### UC-BSK-007: Remove Item from Basket
**Actor:** Customer/Guest  
**Priority:** High

#### Given-When-Then

**Given** a basket with items  
**And** a valid basket item ID  
**When** the user removes the item  
**Then** the system removes the item from the basket  
**And** recalculates totals  
**And** emits basket.item_removed event

#### API Endpoint
```
DELETE /basket/:basketId/items/:basketItemId
```

#### Business Rules
- Item is completely removed
- Basket totals are recalculated
- Returns updated basket

---

### UC-BSK-008: Clear Basket
**Actor:** Customer/Guest  
**Priority:** Medium

#### Given-When-Then

**Given** a basket with items  
**When** the user clears the basket  
**Then** all items are removed  
**And** basket totals are reset to zero  
**And** emits basket.cleared event

#### API Endpoint
```
DELETE /basket/:basketId/items
```

#### Business Rules
- Removes all items but keeps basket
- Basket can be reused
- Any applied coupons are also removed

---

### UC-BSK-009: Merge Guest Basket with Customer Basket
**Actor:** Customer  
**Priority:** Medium

#### Given-When-Then

**Given** a customer who was shopping anonymously  
**And** they have items in a guest basket  
**When** they log in  
**Then** the guest basket items are merged into their customer basket  
**And** the guest basket is marked as merged

#### API Endpoint
```
POST /basket/:basketId/merge
Body: { targetBasketId: string }
```

#### Business Rules
- Items from source basket are added to target
- If same product exists, quantities are combined
- Source basket is deactivated after merge
- Maintains the higher quantity if limits apply

---

### UC-BSK-010: Assign Basket to Customer
**Actor:** System/Customer  
**Priority:** Medium

#### Given-When-Then

**Given** an anonymous basket  
**And** a valid customer ID  
**When** the basket is assigned  
**Then** the basket becomes associated with the customer  
**And** emits basket.assigned_to_customer event

#### API Endpoint
```
POST /basket/:basketId/assign
Body: { customerId: string }
```

#### Business Rules
- Used when anonymous user registers or logs in
- Customer's previous basket may need merging
- Triggers basket merge if customer has existing basket

---

## Events Emitted

| Event | Trigger | Payload |
|-------|---------|---------|
| `basket.created` | New basket created | basketId, customerId, sessionId |
| `basket.item_added` | Item added | basketId, productId, quantity |
| `basket.item_removed` | Item removed | basketId, productId |
| `basket.item_updated` | Quantity changed | basketId, itemId, quantity |
| `basket.cleared` | All items removed | basketId |
| `basket.abandoned` | Basket expired/abandoned | basketId, value |
| `basket.converted_to_order` | Checkout completed | basketId, orderId |
| `basket.merged` | Baskets merged | sourceId, targetId |
| `basket.assigned_to_customer` | Assigned to customer | basketId, customerId |

---

## Integration Test Coverage

| Use Case | Test File | Status |
|----------|-----------|--------|
| UC-BSK-001 | `basket/basket.test.ts` | ✅ |
| UC-BSK-002 | `basket/basket.test.ts` | ✅ |
| UC-BSK-003 | `basket/basket.test.ts` | ✅ |
| UC-BSK-004 | `basket/basket.test.ts` | 🟡 |
| UC-BSK-005 | `basket/basket.test.ts` | ✅ |
| UC-BSK-006 | `basket/basket.test.ts` | ✅ |
| UC-BSK-007 | `basket/basket.test.ts` | ✅ |
| UC-BSK-008 | `basket/basket.test.ts` | 🟡 |
| UC-BSK-009 | `basket/basket.test.ts` | ❌ |
| UC-BSK-010 | `basket/basket.test.ts` | ❌ |
