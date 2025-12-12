# Checkout Feature

## Overview

The Checkout feature manages the checkout flow, transforming a basket into an order by collecting shipping, billing, and payment information through a multi-step process.

---

## Use Cases

### UC-CHK-001: Get Payment Methods
**Actor:** Customer/Guest  
**Priority:** High

#### Given-When-Then

**Given** a user browsing the store  
**When** they request available payment methods  
**Then** the system returns all active payment methods

#### API Endpoint
```
GET /checkout/payment-methods
```

#### Business Rules
- Returns all enabled payment methods
- Includes payment provider configuration (public keys)
- Can be called without starting checkout

---

### UC-CHK-002: Initiate Checkout
**Actor:** Customer/Guest  
**Priority:** High

#### Given-When-Then

**Given** a basket with items  
**When** the user initiates checkout  
**Then** a checkout session is created  
**And** the basket is locked  
**And** emits checkout.started event

#### API Endpoint
```
POST /checkout
Body: { basketId: string, email?: string }
```

#### Business Rules
- Basket must have at least one item
- Creates a checkout session with expiration
- Items are validated for availability
- Prices are locked at checkout initiation
- Guest email is required for guest checkout

---

### UC-CHK-003: Get Checkout Session
**Actor:** Customer/Guest  
**Priority:** High

#### Given-When-Then

**Given** an active checkout session  
**When** the user requests checkout details  
**Then** the system returns the current checkout state

#### API Endpoint
```
GET /checkout/:checkoutId
```

#### Business Rules
- Returns current checkout state with all collected info
- Includes basket items and totals
- Includes applied discounts
- Returns 404 if checkout expired or not found

---

### UC-CHK-004: Set Shipping Address
**Actor:** Customer/Guest  
**Priority:** High

#### Given-When-Then

**Given** an active checkout session  
**When** the user sets the shipping address  
**Then** the address is validated and saved  
**And** available shipping methods are calculated

#### API Endpoint
```
PUT /checkout/:checkoutId/shipping-address
Body: {
  firstName, lastName, addressLine1, addressLine2?,
  city, state?, postalCode, country, phone?
}
```

#### Business Rules
- Address fields are validated
- Country must be a valid shipping destination
- Shipping methods are recalculated based on address
- Tax is recalculated based on shipping address

---

### UC-CHK-005: Get Shipping Methods
**Actor:** Customer/Guest  
**Priority:** High

#### Given-When-Then

**Given** an active checkout with shipping address set  
**When** the user requests available shipping methods  
**Then** the system returns shipping options with prices

#### API Endpoint
```
GET /checkout/:checkoutId/shipping-methods
```

#### Business Rules
- Requires shipping address to be set first
- Returns methods available for the address
- Includes estimated delivery dates
- Includes shipping costs

---

### UC-CHK-006: Set Shipping Method
**Actor:** Customer/Guest  
**Priority:** High

#### Given-When-Then

**Given** an active checkout  
**And** available shipping methods  
**When** the user selects a shipping method  
**Then** the shipping is applied to the checkout  
**And** totals are recalculated

#### API Endpoint
```
PUT /checkout/:checkoutId/shipping-method
Body: { shippingMethodId: string }
```

#### Business Rules
- Shipping method must be available for the address
- Updates checkout shipping cost
- Recalculates order total
- Recalculates estimated tax

---

### UC-CHK-007: Set Payment Method
**Actor:** Customer/Guest  
**Priority:** High

#### Given-When-Then

**Given** an active checkout  
**When** the user sets the payment method  
**Then** the payment method is saved for processing

#### API Endpoint
```
PUT /checkout/:checkoutId/payment-method
Body: { paymentMethodId: string, paymentToken?: string }
```

#### Business Rules
- Payment method must be active
- May require additional payment provider token
- Validates card if card payment
- Stored for order completion

---

### UC-CHK-008: Apply Coupon Code
**Actor:** Customer/Guest  
**Priority:** Medium

#### Given-When-Then

**Given** an active checkout  
**And** a valid coupon code  
**When** the user applies the coupon  
**Then** the discount is applied  
**And** totals are recalculated

#### API Endpoint
```
POST /checkout/:checkoutId/coupon
Body: { code: string }
```

#### Business Rules
- Coupon must be valid and active
- Coupon must meet minimum order requirements
- Coupon usage limits are checked
- Only one coupon per checkout (unless stacking enabled)
- Discount is calculated and applied

---

### UC-CHK-009: Remove Coupon Code
**Actor:** Customer/Guest  
**Priority:** Medium

#### Given-When-Then

**Given** an active checkout with a coupon applied  
**When** the user removes the coupon  
**Then** the discount is removed  
**And** totals are recalculated

#### API Endpoint
```
DELETE /checkout/:checkoutId/coupon
```

#### Business Rules
- Removes any applied coupon
- Recalculates totals without discount

---

### UC-CHK-010: Complete Checkout
**Actor:** Customer/Guest  
**Priority:** High

#### Given-When-Then

**Given** an active checkout  
**And** all required information is provided  
**When** the user completes checkout  
**Then** the order is created  
**And** payment is processed  
**And** inventory is reserved  
**And** confirmation is sent  
**And** emits checkout.completed event

#### API Endpoint
```
POST /checkout/:checkoutId/complete
Body: { notes?: string, acceptTerms: boolean }
```

#### Business Rules
- Shipping address must be set
- Shipping method must be selected
- Payment method must be set
- Terms must be accepted
- Stock is validated before completion
- Payment is authorized/captured
- Order confirmation email is sent
- Basket is marked as converted

---

### UC-CHK-011: Abandon Checkout
**Actor:** Customer/Guest  
**Priority:** Medium

#### Given-When-Then

**Given** an active checkout  
**When** the user abandons checkout (or session expires)  
**Then** the checkout is marked abandoned  
**And** basket is unlocked  
**And** emits checkout.abandoned event

#### API Endpoint
```
POST /checkout/:checkoutId/abandon
```

#### Business Rules
- Releases any payment holds
- Basket returns to normal state
- Triggers abandoned cart recovery flow
- Records abandonment metrics

---

### UC-CHK-012: Set Guest Email
**Actor:** Guest  
**Priority:** High

#### Given-When-Then

**Given** a guest checkout (no customer logged in)  
**When** the guest provides their email  
**Then** the email is stored for order communication

#### API Endpoint
```
PUT /checkout/:checkoutId/guest-email
Body: { email: string }
```

#### Business Rules
- Required for guest checkout
- Email is validated
- Used for order confirmation and updates
- May trigger account creation prompt

---

## Checkout Flow Diagram

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Basket    │ ──▶ │  Initiate   │ ──▶ │  Shipping   │
│   Ready     │     │  Checkout   │     │  Address    │
└─────────────┘     └─────────────┘     └─────────────┘
                                               │
                                               ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Order     │ ◀── │   Payment   │ ◀── │  Shipping   │
│   Created   │     │   Method    │     │   Method    │
└─────────────┘     └─────────────┘     └─────────────┘
```

---

## Events Emitted

| Event | Trigger | Payload |
|-------|---------|---------|
| `checkout.started` | Checkout initiated | checkoutId, basketId |
| `checkout.updated` | Checkout modified | checkoutId, field |
| `checkout.completed` | Order created | checkoutId, orderId |
| `checkout.abandoned` | Checkout abandoned | checkoutId, basketId |
| `checkout.payment_initiated` | Payment started | checkoutId, amount |
| `checkout.payment_completed` | Payment successful | checkoutId, transactionId |
| `checkout.payment_failed` | Payment failed | checkoutId, reason |

---

## Integration Test Coverage

| Use Case | Test File | Status |
|----------|-----------|--------|
| UC-CHK-001 | `checkout/checkout.test.ts` | ✅ |
| UC-CHK-002 | `checkout/checkout.test.ts` | ✅ |
| UC-CHK-003 | `checkout/checkout.test.ts` | ✅ |
| UC-CHK-004 | `checkout/checkout.test.ts` | ✅ |
| UC-CHK-005 | `checkout/checkout.test.ts` | 🟡 |
| UC-CHK-006 | `checkout/checkout.test.ts` | ✅ |
| UC-CHK-007 | `checkout/checkout.test.ts` | ✅ |
| UC-CHK-008 | `checkout/checkout.test.ts` | 🟡 |
| UC-CHK-009 | `checkout/checkout.test.ts` | ❌ |
| UC-CHK-010 | `checkout/checkout.test.ts` | ✅ |
| UC-CHK-011 | `checkout/checkout.test.ts` | ❌ |
| UC-CHK-012 | `checkout/checkout.test.ts` | ❌ |
