# Subscription Feature

## Overview

The Subscription feature manages recurring billing products, subscription plans, customer subscriptions, and automated billing cycles. It supports pause/resume, plan changes, dunning for failed payments, and flexible billing schedules.

---

## Use Cases

### Subscription Products (Business)

### UC-SUB-001: List Subscription Products (Business)

**Actor:** Merchant/Admin  
**Priority:** High

#### Given-When-Then

**Given** an authenticated merchant  
**When** they request subscription products  
**Then** the system returns all subscription-enabled products

#### API Endpoint

```
GET /business/subscriptions/products
```

---

### UC-SUB-002: Get Subscription Product (Business)

**Actor:** Merchant/Admin  
**Priority:** Medium

#### API Endpoint

```
GET /business/subscriptions/products/:id
```

---

### UC-SUB-003: Create Subscription Product (Business)

**Actor:** Merchant/Admin  
**Priority:** High

#### Given-When-Then

**Given** an authenticated merchant  
**And** valid product configuration  
**When** they create a subscription product  
**Then** the product is available for subscriptions

#### API Endpoint

```
POST /business/subscriptions/products
Body: {
  name, description, productId?,
  billingInterval: 'daily'|'weekly'|'monthly'|'yearly',
  isActive
}
```

---

### UC-SUB-004: Update Subscription Product (Business)

**Actor:** Merchant/Admin  
**Priority:** Medium

#### API Endpoint

```
PUT /business/subscriptions/products/:id
```

---

### UC-SUB-005: Delete Subscription Product (Business)

**Actor:** Merchant/Admin  
**Priority:** Low

#### API Endpoint

```
DELETE /business/subscriptions/products/:id
```

---

### Subscription Plans (Business)

### UC-SUB-006: List Subscription Plans (Business)

**Actor:** Merchant/Admin  
**Priority:** High

#### API Endpoint

```
GET /business/subscriptions/products/:productId/plans
```

---

### UC-SUB-007: Create Subscription Plan (Business)

**Actor:** Merchant/Admin  
**Priority:** High

#### Given-When-Then

**Given** an authenticated merchant  
**And** a subscription product  
**When** they create a plan  
**Then** customers can subscribe to that plan

#### API Endpoint

```
POST /business/subscriptions/products/:productId/plans
Body: {
  name, price, billingPeriod, billingInterval,
  trialDays?, features: [], isActive
}
```

#### Business Rules

- Multiple plans per product
- Different pricing tiers
- Optional trial period

---

### UC-SUB-008: Update Subscription Plan (Business)

**Actor:** Merchant/Admin  
**Priority:** Medium

#### API Endpoint

```
PUT /business/subscriptions/products/:productId/plans/:planId
```

---

### UC-SUB-009: Delete Subscription Plan (Business)

**Actor:** Merchant/Admin  
**Priority:** Low

#### API Endpoint

```
DELETE /business/subscriptions/products/:productId/plans/:planId
```

---

### Customer Subscriptions Management (Business)

### UC-SUB-010: List Customer Subscriptions (Business)

**Actor:** Merchant/Admin  
**Priority:** High

#### Given-When-Then

**Given** an authenticated merchant  
**When** they request subscriptions  
**Then** the system returns all customer subscriptions

#### API Endpoint

```
GET /business/subscriptions/subscriptions
Query: customerId?, status?, planId?, limit, offset
```

---

### UC-SUB-011: Get Customer Subscription (Business)

**Actor:** Merchant/Admin  
**Priority:** High

#### API Endpoint

```
GET /business/subscriptions/subscriptions/:id
```

---

### UC-SUB-012: Cancel Subscription (Business)

**Actor:** Merchant/Admin  
**Priority:** High

#### Given-When-Then

**Given** an authenticated merchant  
**And** an active subscription  
**When** they cancel the subscription  
**Then** the subscription is marked for cancellation

#### API Endpoint

```
POST /business/subscriptions/subscriptions/:id/cancel
Body: { reason?, cancelAt?: 'immediate'|'period_end' }
```

#### Business Rules

- Can cancel immediately or at period end
- Reason is recorded for analytics
- Customer is notified

---

### UC-SUB-013: Pause Subscription (Business)

**Actor:** Merchant/Admin  
**Priority:** Medium

#### API Endpoint

```
POST /business/subscriptions/subscriptions/:id/pause
Body: { resumeDate? }
```

---

### UC-SUB-014: Resume Subscription (Business)

**Actor:** Merchant/Admin  
**Priority:** Medium

#### API Endpoint

```
POST /business/subscriptions/subscriptions/:id/resume
```

---

### UC-SUB-015: Update Subscription Status (Business)

**Actor:** Merchant/Admin  
**Priority:** Medium

#### API Endpoint

```
PUT /business/subscriptions/subscriptions/:id/status
Body: { status }
```

---

### Subscription Orders (Business)

### UC-SUB-016: Get Subscription Orders (Business)

**Actor:** Merchant/Admin  
**Priority:** Medium

#### API Endpoint

```
GET /business/subscriptions/subscriptions/:subscriptionId/orders
```

---

### UC-SUB-017: Retry Failed Order (Business)

**Actor:** Merchant/Admin  
**Priority:** Medium

#### API Endpoint

```
POST /business/subscriptions/orders/:orderId/retry
```

---

### UC-SUB-018: Skip Order (Business)

**Actor:** Merchant/Admin  
**Priority:** Low

#### API Endpoint

```
POST /business/subscriptions/orders/:orderId/skip
```

---

### Dunning (Business)

### UC-SUB-019: Get Dunning Attempts (Business)

**Actor:** Merchant/Admin  
**Priority:** Medium

#### Given-When-Then

**Given** an authenticated merchant  
**And** a subscription with payment failures  
**When** they request dunning attempts  
**Then** the system returns retry history

#### API Endpoint

```
GET /business/subscriptions/subscriptions/:subscriptionId/dunning
```

---

### UC-SUB-020: Get Pending Dunning (Business)

**Actor:** Merchant/Admin  
**Priority:** Medium

#### API Endpoint

```
GET /business/subscriptions/dunning/pending
```

---

### Billing Operations (Business)

### UC-SUB-021: Get Due Billing (Business)

**Actor:** Merchant/Admin  
**Priority:** High

#### Given-When-Then

**Given** an authenticated merchant  
**When** they request subscriptions due for billing  
**Then** the system returns subscriptions to be charged

#### API Endpoint

```
GET /business/subscriptions/billing/due
```

---

### UC-SUB-022: Process Billing Cycle (Business)

**Actor:** Merchant/Admin  
**Priority:** High

#### API Endpoint

```
POST /business/subscriptions/subscriptions/:id/bill
```

---

### Customer-Facing Use Cases

### UC-SUB-023: Browse Subscription Products (Customer)

**Actor:** Customer/Guest  
**Priority:** High

#### API Endpoint

```
GET /subscriptions/products
```

---

### UC-SUB-024: Get Product Details (Customer)

**Actor:** Customer/Guest  
**Priority:** High

#### API Endpoint

```
GET /subscriptions/products/:productId
```

---

### UC-SUB-025: Get Plan Details (Customer)

**Actor:** Customer/Guest  
**Priority:** Medium

#### API Endpoint

```
GET /subscriptions/plans/:planId
```

---

### UC-SUB-026: Get My Subscriptions (Customer)

**Actor:** Customer  
**Priority:** High

#### Given-When-Then

**Given** an authenticated customer  
**When** they request their subscriptions  
**Then** the system returns their active subscriptions

#### API Endpoint

```
GET /subscriptions/mine
```

---

### UC-SUB-027: Create Subscription (Customer)

**Actor:** Customer  
**Priority:** High

#### Given-When-Then

**Given** an authenticated customer  
**And** a valid plan ID  
**When** they subscribe  
**Then** the subscription is created  
**And** first charge is processed  
**And** emits subscription.created event

#### API Endpoint

```
POST /subscriptions/subscribe
Body: { planId, paymentMethodId?, shippingAddressId? }
```

#### Business Rules

- Payment method required or on file
- Trial period starts if configured
- First billing occurs after trial

---

### UC-SUB-028: Update My Subscription (Customer)

**Actor:** Customer  
**Priority:** Medium

#### API Endpoint

```
PUT /subscriptions/mine/:id
Body: { shippingAddressId?, quantity? }
```

---

### UC-SUB-029: Change Plan (Customer)

**Actor:** Customer  
**Priority:** Medium

#### Given-When-Then

**Given** an authenticated customer  
**And** an active subscription  
**When** they change to a different plan  
**Then** the subscription is updated  
**And** prorated charges/credits are applied

#### API Endpoint

```
POST /subscriptions/mine/:id/change-plan
Body: { newPlanId }
```

---

### UC-SUB-030: Pause My Subscription (Customer)

**Actor:** Customer  
**Priority:** Medium

#### API Endpoint

```
POST /subscriptions/mine/:id/pause
```

---

### UC-SUB-031: Resume My Subscription (Customer)

**Actor:** Customer  
**Priority:** Medium

#### API Endpoint

```
POST /subscriptions/mine/:id/resume
```

---

### UC-SUB-032: Cancel My Subscription (Customer)

**Actor:** Customer  
**Priority:** High

#### API Endpoint

```
POST /subscriptions/mine/:id/cancel
Body: { reason? }
```

---

### UC-SUB-033: Reactivate Subscription (Customer)

**Actor:** Customer  
**Priority:** Low

#### API Endpoint

```
POST /subscriptions/mine/:id/reactivate
```

---

### UC-SUB-034: Skip Next Delivery (Customer)

**Actor:** Customer  
**Priority:** Medium

#### API Endpoint

```
POST /subscriptions/mine/:id/skip
```

---

### UC-SUB-035: Get Billing History (Customer)

**Actor:** Customer  
**Priority:** Medium

#### API Endpoint

```
GET /subscriptions/mine/:id/orders
```

---

## Events Emitted

| Event                         | Trigger                | Payload                              |
| ----------------------------- | ---------------------- | ------------------------------------ |
| `subscription.created`        | New subscription       | subscriptionId, customerId, planId   |
| `subscription.activated`      | Subscription activated | subscriptionId                       |
| `subscription.paused`         | Subscription paused    | subscriptionId                       |
| `subscription.resumed`        | Subscription resumed   | subscriptionId                       |
| `subscription.cancelled`      | Subscription cancelled | subscriptionId, reason               |
| `subscription.renewed`        | Billing successful     | subscriptionId, orderId              |
| `subscription.payment_failed` | Billing failed         | subscriptionId, attempt              |
| `subscription.plan_changed`   | Plan changed           | subscriptionId, oldPlanId, newPlanId |

---

## Integration Test Coverage

| Use Case                 | Test File                         | Status |
| ------------------------ | --------------------------------- | ------ |
| UC-SUB-001 to UC-SUB-005 | `subscription/products.test.ts`   | ❌     |
| UC-SUB-006 to UC-SUB-009 | `subscription/plans.test.ts`      | ❌     |
| UC-SUB-010 to UC-SUB-015 | `subscription/management.test.ts` | ❌     |
| UC-SUB-016 to UC-SUB-022 | `subscription/billing.test.ts`    | ❌     |
| UC-SUB-023 to UC-SUB-035 | `subscription/customer.test.ts`   | ❌     |
