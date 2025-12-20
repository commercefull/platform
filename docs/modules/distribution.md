# Distribution Feature

## Overview

The Distribution feature manages order fulfillment, shipping, and delivery. It includes distribution centers, shipping zones, shipping methods, fulfillment partners, click & collect (store pickup), and pre-orders.

---

## Use Cases

### Distribution Centers

### UC-DIS-001: List Distribution Centers (Business)
**Actor:** Merchant/Admin  
**Priority:** High

#### Given-When-Then

**Given** an authenticated merchant  
**When** they request distribution centers  
**Then** the system returns all distribution centers

#### API Endpoint
```
GET /business/distribution/centers
```

---

### UC-DIS-002: Create Distribution Center (Business)
**Actor:** Merchant/Admin  
**Priority:** High

#### Given-When-Then

**Given** an authenticated merchant  
**And** valid center data  
**When** they create a distribution center  
**Then** the center is created

#### API Endpoint
```
POST /business/distribution/centers
Body: { name, code, address, isActive, capabilities, ... }
```

#### Business Rules
- Code must be unique
- Address required for shipping calculations
- Can specify capabilities (ships_hazmat, cold_storage, etc.)

---

### UC-DIS-003: Update Distribution Center (Business)
**Actor:** Merchant/Admin  
**Priority:** Medium

#### API Endpoint
```
PUT /business/distribution/centers/:id
```

---

### UC-DIS-004: Delete Distribution Center (Business)
**Actor:** Merchant/Admin  
**Priority:** Low

#### API Endpoint
```
DELETE /business/distribution/centers/:id
```

---

### UC-DIS-005: Get Active Distribution Centers (Customer)
**Actor:** Customer/Guest  
**Priority:** Medium

#### API Endpoint
```
GET /distribution/centers
```

---

### Shipping Zones

### UC-DIS-006: List Shipping Zones (Business)
**Actor:** Merchant/Admin  
**Priority:** High

#### Given-When-Then

**Given** an authenticated merchant  
**When** they request shipping zones  
**Then** the system returns all configured zones

#### API Endpoint
```
GET /business/distribution/shipping-zones
```

---

### UC-DIS-007: Create Shipping Zone (Business)
**Actor:** Merchant/Admin  
**Priority:** High

#### Given-When-Then

**Given** an authenticated merchant  
**And** valid zone configuration  
**When** they create a shipping zone  
**Then** the zone is created with countries/regions

#### API Endpoint
```
POST /business/distribution/shipping-zones
Body: { name, countries: [], regions: [], postalCodes: [], isActive }
```

#### Business Rules
- Zone can include countries, regions, or postal codes
- Zones can overlap (most specific wins)
- Used to determine available shipping methods

---

### UC-DIS-008: Update Shipping Zone (Business)
**Actor:** Merchant/Admin  
**Priority:** Medium

#### API Endpoint
```
PUT /business/distribution/shipping-zones/:id
```

---

### UC-DIS-009: Delete Shipping Zone (Business)
**Actor:** Merchant/Admin  
**Priority:** Low

#### API Endpoint
```
DELETE /business/distribution/shipping-zones/:id
```

---

### Shipping Methods

### UC-DIS-010: List Shipping Methods (Business)
**Actor:** Merchant/Admin  
**Priority:** High

#### Given-When-Then

**Given** an authenticated merchant  
**When** they request shipping methods  
**Then** the system returns all shipping methods

#### API Endpoint
```
GET /business/distribution/shipping-methods
```

---

### UC-DIS-011: Create Shipping Method (Business)
**Actor:** Merchant/Admin  
**Priority:** High

#### Given-When-Then

**Given** an authenticated merchant  
**And** valid method configuration  
**When** they create a shipping method  
**Then** the method is created

#### API Endpoint
```
POST /business/distribution/shipping-methods
Body: {
  name, carrier, type, price, freeThreshold?,
  estimatedDays, zones: [], isActive
}
```

#### Business Rules
- Types: flat_rate, weight_based, price_based, real_time
- Can set free shipping threshold
- Links to shipping zones

---

### UC-DIS-012: Get Available Shipping Methods (Customer)
**Actor:** Customer/Guest  
**Priority:** High

#### Given-When-Then

**Given** an address  
**When** requesting available shipping methods  
**Then** the system returns methods for that location

#### API Endpoint
```
GET /distribution/shipping-methods/available
Query: country, region?, postalCode?
```

#### Business Rules
- Matches address to shipping zones
- Returns only active methods
- Includes calculated prices

---

### UC-DIS-013: Get Active Shipping Methods (Customer)
**Actor:** Customer/Guest  
**Priority:** Medium

#### API Endpoint
```
GET /distribution/shipping-methods
```

---

### Fulfillment Partners

### UC-DIS-014: List Fulfillment Partners (Business)
**Actor:** Merchant/Admin  
**Priority:** Medium

#### API Endpoint
```
GET /business/distribution/fulfillment-partners
```

---

### UC-DIS-015: Create Fulfillment Partner (Business)
**Actor:** Merchant/Admin  
**Priority:** Medium

#### API Endpoint
```
POST /business/distribution/fulfillment-partners
Body: { name, code, type, apiConfig, isActive }
```

---

### Order Fulfillments

### UC-DIS-016: Get Order Fulfillments (Business)
**Actor:** Merchant/Admin  
**Priority:** High

#### Given-When-Then

**Given** an authenticated merchant  
**When** they request fulfillments  
**Then** the system returns fulfillment records

#### API Endpoint
```
GET /business/distribution/fulfillments
GET /business/distribution/fulfillments/order/:orderId
GET /business/distribution/fulfillments/status/:status
```

---

### UC-DIS-017: Create Order Fulfillment (Business)
**Actor:** Merchant/Admin  
**Priority:** High

#### Given-When-Then

**Given** an authenticated merchant  
**And** an order to fulfill  
**When** they create a fulfillment  
**Then** the fulfillment is created

#### API Endpoint
```
POST /business/distribution/fulfillments
Body: { orderId, centerId, items, trackingNumber?, carrier? }
```

---

### UC-DIS-018: Update Fulfillment Status (Business)
**Actor:** Merchant/Admin  
**Priority:** High

#### Given-When-Then

**Given** an existing fulfillment  
**When** the status is updated  
**Then** the order fulfillment status changes  
**And** customer is notified

#### API Endpoint
```
PUT /business/distribution/fulfillments/:id/status
Body: { status, trackingNumber?, notes? }
```

#### Business Rules
- Statuses: pending, processing, packed, shipped, delivered, cancelled
- Can add tracking number
- Triggers customer notification

---

### UC-DIS-019: Get Order Tracking (Customer)
**Actor:** Customer  
**Priority:** High

#### Given-When-Then

**Given** an order ID  
**When** tracking is requested  
**Then** the system returns tracking information

#### API Endpoint
```
GET /distribution/tracking/:orderId
```

---

### Store Locations (Click & Collect)

### UC-DIS-020: List Store Locations (Business)
**Actor:** Merchant/Admin  
**Priority:** Medium

#### API Endpoint
```
GET /business/distribution/locations
```

---

### UC-DIS-021: Create Store Location (Business)
**Actor:** Merchant/Admin  
**Priority:** Medium

#### Given-When-Then

**Given** an authenticated merchant  
**And** valid location data  
**When** they create a store location  
**Then** the location is available for click & collect

#### API Endpoint
```
POST /business/distribution/locations
Body: {
  name, code, address, phone, email,
  coordinates: { lat, lng },
  operatingHours, isPickupEnabled, isActive
}
```

---

### UC-DIS-022: Find Nearby Locations (Customer)
**Actor:** Customer/Guest  
**Priority:** High

#### Given-When-Then

**Given** customer coordinates or address  
**When** they search for nearby pickup locations  
**Then** the system returns locations sorted by distance

#### API Endpoint
```
GET /distribution/locations/nearby
Query: lat, lng, radius?, limit?
```

---

### UC-DIS-023: Create Pickup Order (Customer)
**Actor:** Customer  
**Priority:** High

#### Given-When-Then

**Given** an authenticated customer  
**And** a store location  
**When** they create a pickup order  
**Then** the order is scheduled for pickup

#### API Endpoint
```
POST /distribution/pickups
Body: { orderId, locationId, preferredDate?, notes? }
```

---

### UC-DIS-024: Get My Pickup Orders (Customer)
**Actor:** Customer  
**Priority:** Medium

#### API Endpoint
```
GET /distribution/pickups/mine
```

---

### UC-DIS-025: Mark Pickup Ready (Business)
**Actor:** Merchant/Admin  
**Priority:** High

#### Given-When-Then

**Given** a pickup order  
**When** the order is ready  
**Then** status is updated  
**And** customer is notified  
**And** emits pickup.ready event

#### API Endpoint
```
POST /business/distribution/pickups/:id/ready
```

---

### UC-DIS-026: Complete Pickup (Business)
**Actor:** Merchant/Admin  
**Priority:** High

#### API Endpoint
```
POST /business/distribution/pickups/:id/complete
```

---

### UC-DIS-027: Verify Pickup Code (Customer)
**Actor:** Customer  
**Priority:** Medium

#### API Endpoint
```
POST /distribution/pickups/:id/verify
Body: { code }
```

---

### Pre-Orders

### UC-DIS-028: Get Pre-Order Config (Customer)
**Actor:** Customer/Guest  
**Priority:** Medium

#### Given-When-Then

**Given** a product ID  
**When** checking pre-order availability  
**Then** the system returns pre-order information

#### API Endpoint
```
GET /distribution/pre-orders/product/:productId
```

---

### UC-DIS-029: Create Pre-Order Reservation (Customer)
**Actor:** Customer  
**Priority:** Medium

#### Given-When-Then

**Given** an authenticated customer  
**And** a product with pre-order enabled  
**When** they create a reservation  
**Then** the reservation is created  
**And** emits preorder.reserved event

#### API Endpoint
```
POST /distribution/pre-orders/reserve
Body: { productId, productVariantId?, quantity, email? }
```

---

### UC-DIS-030: Get My Reservations (Customer)
**Actor:** Customer  
**Priority:** Medium

#### API Endpoint
```
GET /distribution/pre-orders/mine
```

---

### UC-DIS-031: Fulfill Reservation (Business)
**Actor:** Merchant/Admin  
**Priority:** Medium

#### Given-When-Then

**Given** stock becomes available  
**When** a reservation is fulfilled  
**Then** the customer is notified to complete purchase

#### API Endpoint
```
POST /business/distribution/reservations/:id/fulfill
```

---

### Channels

### UC-DIS-032: Manage Sales Channels (Business)
**Actor:** Merchant/Admin  
**Priority:** Low

#### API Endpoints
```
GET /business/distribution/channels
POST /business/distribution/channels
PUT /business/distribution/channels/:id
DELETE /business/distribution/channels/:id
```

---

## Events Emitted

| Event | Trigger | Payload |
|-------|---------|---------|
| `pickup.created` | Pickup order created | pickupId, orderId, locationId |
| `pickup.ready` | Ready for pickup | pickupId, orderId |
| `pickup.notified` | Customer notified | pickupId |
| `pickup.completed` | Pickup completed | pickupId |
| `pickup.expired` | Pickup expired | pickupId |
| `preorder.created` | Pre-order created | preOrderId, productId |
| `preorder.reserved` | Reservation made | reservationId, customerId |
| `preorder.fulfilled` | Reservation fulfilled | reservationId |
| `preorder.cancelled` | Reservation cancelled | reservationId |

---

## Integration Test Coverage

| Use Case | Test File | Status |
|----------|-----------|--------|
| UC-DIS-001 to UC-DIS-005 | `distribution/centers.test.ts` | 🟡 |
| UC-DIS-006 to UC-DIS-009 | `distribution/zones.test.ts` | 🟡 |
| UC-DIS-010 to UC-DIS-013 | `distribution/methods.test.ts` | 🟡 |
| UC-DIS-014 to UC-DIS-015 | `distribution/partners.test.ts` | ❌ |
| UC-DIS-016 to UC-DIS-019 | `distribution/fulfillment.test.ts` | 🟡 |
| UC-DIS-020 to UC-DIS-027 | `distribution/pickup.test.ts` | ❌ |
| UC-DIS-028 to UC-DIS-031 | `distribution/preorder.test.ts` | ❌ |
| UC-DIS-032 | `distribution/channels.test.ts` | ❌ |
