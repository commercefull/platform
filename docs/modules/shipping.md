# Shipping Feature

## Overview

The Shipping feature manages carrier integrations, rate calculations, and label generation. It works alongside the Distribution feature to provide end-to-end shipping functionality.

---

## Use Cases

### Carrier Management (Business)

### UC-SHP-001: List Carriers (Business)
**Actor:** Merchant/Admin  
**Priority:** High

#### Given-When-Then

**Given** an authenticated merchant  
**When** they request carriers  
**Then** the system returns configured carriers

#### API Endpoint
```
GET /business/shipping/carriers
```

---

### UC-SHP-002: Get Carrier (Business)
**Actor:** Merchant/Admin  
**Priority:** Medium

#### API Endpoint
```
GET /business/shipping/carriers/:id
```

---

### UC-SHP-003: Create Carrier (Business)
**Actor:** Merchant/Admin  
**Priority:** High

#### Given-When-Then

**Given** an authenticated merchant  
**And** carrier API credentials  
**When** they configure a carrier  
**Then** the carrier is available for shipping

#### API Endpoint
```
POST /business/shipping/carriers
Body: {
  name, code,
  type: 'ups'|'fedex'|'usps'|'dhl'|'custom',
  apiCredentials: {},
  isActive
}
```

---

### UC-SHP-004: Update Carrier (Business)
**Actor:** Merchant/Admin  
**Priority:** Medium

#### API Endpoint
```
PUT /business/shipping/carriers/:id
```

---

### UC-SHP-005: Delete Carrier (Business)
**Actor:** Merchant/Admin  
**Priority:** Low

#### API Endpoint
```
DELETE /business/shipping/carriers/:id
```

---

### Rate Calculation

### UC-SHP-006: Get Shipping Rates (Customer)
**Actor:** Customer  
**Priority:** High

#### Given-When-Then

**Given** cart items and shipping address  
**When** requesting shipping rates  
**Then** the system returns available rates

#### API Endpoint
```
POST /shipping/rates
Body: {
  items: [{ productId, quantity, weight?, dimensions? }],
  origin: { postalCode, country },
  destination: { postalCode, country, state? }
}
```

#### Business Rules
- Queries configured carriers
- Returns rates sorted by price
- Includes estimated delivery dates

---

### Label Generation (Business)

### UC-SHP-007: Create Shipping Label (Business)
**Actor:** Merchant/Admin  
**Priority:** High

#### Given-When-Then

**Given** an order ready to ship  
**When** creating a shipping label  
**Then** the label is generated and tracking starts

#### API Endpoint
```
POST /business/shipping/labels
Body: {
  orderId, carrierId, serviceCode,
  packageWeight, packageDimensions?,
  shipDate?
}
```

---

### UC-SHP-008: Get Shipping Label (Business)
**Actor:** Merchant/Admin  
**Priority:** High

#### API Endpoint
```
GET /business/shipping/labels/:id
```

---

### UC-SHP-009: Void Shipping Label (Business)
**Actor:** Merchant/Admin  
**Priority:** Medium

#### API Endpoint
```
POST /business/shipping/labels/:id/void
```

---

### Tracking

### UC-SHP-010: Get Tracking Info (Customer)
**Actor:** Customer  
**Priority:** High

#### Given-When-Then

**Given** a tracking number  
**When** requesting tracking info  
**Then** the system returns shipment status

#### API Endpoint
```
GET /shipping/tracking/:trackingNumber
```

---

## Events Emitted

| Event | Trigger | Payload |
|-------|---------|---------|
| `shipping.label.created` | Label generated | labelId, orderId, trackingNumber |
| `shipping.label.voided` | Label voided | labelId |
| `shipping.tracking.updated` | Tracking update | trackingNumber, status |
| `shipping.delivered` | Package delivered | trackingNumber, orderId |

---

## Integration Test Coverage

| Use Case | Test File | Status |
|----------|-----------|--------|
| UC-SHP-001 to UC-SHP-005 | `shipping/carriers.test.ts` | ❌ |
| UC-SHP-006 | `shipping/rates.test.ts` | ❌ |
| UC-SHP-007 to UC-SHP-009 | `shipping/labels.test.ts` | ❌ |
| UC-SHP-010 | `shipping/tracking.test.ts` | ❌ |
