# Payment Feature

## Overview

The Payment feature handles all payment processing including transactions, refunds, and fraud prevention. It integrates with payment providers and manages the complete payment lifecycle.

---

## Use Cases

### UC-PAY-001: Get Payment Methods (Public)

**Actor:** Customer/Guest  
**Priority:** High

#### Given-When-Then

**Given** any user browsing the store  
**When** they request available payment methods  
**Then** the system returns all active payment methods

#### API Endpoint

```
GET /payment/methods
```

#### Business Rules

- Returns all enabled payment methods
- Includes method type, name, and configuration
- No authentication required
- Used for checkout display

---

### UC-PAY-002: Get My Transactions (Customer)

**Actor:** Customer  
**Priority:** Medium

#### Given-When-Then

**Given** an authenticated customer  
**When** they request their payment transactions  
**Then** the system returns their transaction history

#### API Endpoint

```
GET /payment/transactions
```

#### Business Rules

- Only returns customer's own transactions
- Sorted by date (newest first)
- Includes transaction status and amount

---

### UC-PAY-003: Get Transaction by Order (Customer)

**Actor:** Customer  
**Priority:** Medium

#### Given-When-Then

**Given** an authenticated customer  
**And** an order that belongs to them  
**When** they request payment details for the order  
**Then** the system returns the transaction(s) for that order

#### API Endpoint

```
GET /payment/orders/:orderId
```

#### Business Rules

- Customer can only view their own orders
- Returns all transactions linked to the order
- Includes payment, refund transactions

---

### UC-PAY-004: List Transactions (Business)

**Actor:** Merchant/Admin  
**Priority:** High

#### Given-When-Then

**Given** an authenticated merchant  
**When** they request all transactions  
**Then** the system returns a paginated list of transactions

#### API Endpoint

```
GET /business/payments/transactions
Query: status, customerId, dateFrom, dateTo, limit, offset
```

#### Business Rules

- Returns all transactions for the merchant
- Supports filtering by status, customer, date
- Includes detailed transaction information

---

### UC-PAY-005: Get Transaction Details (Business)

**Actor:** Merchant/Admin  
**Priority:** High

#### Given-When-Then

**Given** an authenticated merchant  
**And** a valid transaction ID  
**When** they request transaction details  
**Then** the system returns complete transaction information

#### API Endpoint

```
GET /business/payments/transactions/:transactionId
```

#### Business Rules

- Returns full transaction details
- Includes payment provider response
- Includes related order information

---

### UC-PAY-006: Initiate Payment (Business)

**Actor:** Merchant/Admin  
**Priority:** High

#### Given-When-Then

**Given** an authenticated merchant  
**And** valid payment details  
**When** they initiate a payment  
**Then** the system processes the payment through the provider

#### API Endpoint

```
POST /business/payments/transactions
Body: { orderId, amount, currency, paymentMethodId, ... }
```

#### Business Rules

- Validates payment amount
- Routes to appropriate payment provider
- Creates transaction record
- Returns provider response

---

### UC-PAY-007: Get Refunds for Transaction (Business)

**Actor:** Merchant/Admin  
**Priority:** Medium

#### Given-When-Then

**Given** an authenticated merchant  
**And** a valid transaction ID  
**When** they request refunds for the transaction  
**Then** the system returns all refunds processed

#### API Endpoint

```
GET /business/payments/transactions/:transactionId/refunds
```

#### Business Rules

- Returns all refunds for the transaction
- Shows partial and full refunds
- Includes refund status and amounts

---

### UC-PAY-008: Process Refund (Business)

**Actor:** Merchant/Admin  
**Priority:** High

#### Given-When-Then

**Given** an authenticated merchant  
**And** a transaction that can be refunded  
**When** they process a refund  
**Then** the system refunds via the payment provider  
**And** creates a refund record

#### API Endpoint

```
POST /business/payments/transactions/:transactionId/refund
Body: { amount, reason }
```

#### Business Rules

- Refund amount cannot exceed captured amount
- Can do partial refunds
- Multiple refunds allowed up to total
- Reason is required for auditing

---

## Fraud Prevention Use Cases

### UC-PAY-009: Get Fraud Rules (Business)

**Actor:** Merchant/Admin  
**Priority:** Medium

#### Given-When-Then

**Given** an authenticated merchant  
**When** they request fraud rules  
**Then** the system returns all configured rules

#### API Endpoint

```
GET /business/payments/fraud/rules
Query: activeOnly
```

#### Business Rules

- Returns all fraud prevention rules
- Can filter by active status

---

### UC-PAY-010: Get Fraud Rule (Business)

**Actor:** Merchant/Admin  
**Priority:** Medium

#### Given-When-Then

**Given** an authenticated merchant  
**And** a valid rule ID  
**When** they request the rule  
**Then** the system returns the rule configuration

#### API Endpoint

```
GET /business/payments/fraud/rules/:id
```

---

### UC-PAY-011: Create Fraud Rule (Business)

**Actor:** Merchant/Admin  
**Priority:** Medium

#### Given-When-Then

**Given** an authenticated merchant  
**When** they create a new fraud rule  
**Then** the system creates and activates the rule

#### API Endpoint

```
POST /business/payments/fraud/rules
Body: { name, ruleType, conditions, action, riskScore, ... }
```

#### Business Rules

- Rule types: velocity, geolocation, amount, pattern, blacklist, custom
- Actions: allow, flag, review, block
- Conditions are rule-specific JSON

---

### UC-PAY-012: Update Fraud Rule (Business)

**Actor:** Merchant/Admin  
**Priority:** Medium

#### Given-When-Then

**Given** an authenticated merchant  
**And** an existing rule  
**When** they update the rule  
**Then** the system saves the changes

#### API Endpoint

```
PUT /business/payments/fraud/rules/:id
Body: { name?, conditions?, action?, isActive?, ... }
```

---

### UC-PAY-013: Delete Fraud Rule (Business)

**Actor:** Merchant/Admin  
**Priority:** Medium

#### Given-When-Then

**Given** an authenticated merchant  
**And** an existing rule  
**When** they delete the rule  
**Then** the system deactivates the rule

#### API Endpoint

```
DELETE /business/payments/fraud/rules/:id
```

---

### UC-PAY-014: Get Fraud Checks (Business)

**Actor:** Merchant/Admin  
**Priority:** Medium

#### Given-When-Then

**Given** an authenticated merchant  
**When** they request fraud checks  
**Then** the system returns fraud check results

#### API Endpoint

```
GET /business/payments/fraud/checks
Query: status, riskLevel, customerId, limit, offset
```

---

### UC-PAY-015: Get Fraud Check (Business)

**Actor:** Merchant/Admin  
**Priority:** Medium

#### Given-When-Then

**Given** an authenticated merchant  
**And** a valid check ID  
**When** they request the check  
**Then** the system returns the full fraud check details

#### API Endpoint

```
GET /business/payments/fraud/checks/:id
```

---

### UC-PAY-016: Get Pending Reviews (Business)

**Actor:** Merchant/Admin  
**Priority:** Medium

#### Given-When-Then

**Given** an authenticated merchant  
**When** they request pending fraud reviews  
**Then** the system returns checks needing manual review

#### API Endpoint

```
GET /business/payments/fraud/reviews
```

---

### UC-PAY-017: Review Fraud Check (Business)

**Actor:** Merchant/Admin  
**Priority:** Medium

#### Given-When-Then

**Given** an authenticated merchant  
**And** a fraud check pending review  
**When** they submit a review decision  
**Then** the system updates the check status

#### API Endpoint

```
POST /business/payments/fraud/checks/:id/review
Body: { decision: 'approve'|'reject', notes?: string }
```

---

### UC-PAY-018: Get Blacklist (Business)

**Actor:** Merchant/Admin  
**Priority:** Medium

#### Given-When-Then

**Given** an authenticated merchant  
**When** they request the fraud blacklist  
**Then** the system returns blacklisted entities

#### API Endpoint

```
GET /business/payments/fraud/blacklist
Query: type, isActive, limit, offset
```

---

### UC-PAY-019: Add to Blacklist (Business)

**Actor:** Merchant/Admin  
**Priority:** Medium

#### Given-When-Then

**Given** an authenticated merchant  
**When** they add an entity to the blacklist  
**Then** the entity is blocked from transactions

#### API Endpoint

```
POST /business/payments/fraud/blacklist
Body: { type, value, reason }
```

#### Business Rules

- Types: email, ip, card, phone, device
- Reason is required

---

### UC-PAY-020: Remove from Blacklist (Business)

**Actor:** Merchant/Admin  
**Priority:** Medium

#### Given-When-Then

**Given** an authenticated merchant  
**And** a blacklist entry  
**When** they remove it  
**Then** the entry is deactivated

#### API Endpoint

```
DELETE /business/payments/fraud/blacklist/:id
```

---

## Events Emitted

| Event                   | Trigger                | Payload                        |
| ----------------------- | ---------------------- | ------------------------------ |
| `payment.received`      | Payment captured       | transactionId, orderId, amount |
| `payment.failed`        | Payment failed         | transactionId, reason          |
| `payment.success`       | Payment succeeded      | transactionId, orderId, amount |
| `payment.refunded`      | Refund processed       | transactionId, refundAmount    |
| `fraud.check.created`   | Fraud check run        | checkId, orderId, riskScore    |
| `fraud.check.flagged`   | High risk detected     | checkId, riskLevel             |
| `fraud.check.blocked`   | Transaction blocked    | checkId, reason                |
| `fraud.check.reviewed`  | Manual review complete | checkId, decision              |
| `fraud.blacklist.added` | Blacklist entry added  | type, value                    |

---

## Integration Test Coverage

| Use Case   | Test File                 | Status |
| ---------- | ------------------------- | ------ |
| UC-PAY-001 | `payment/payment.test.ts` | ✅     |
| UC-PAY-002 | `payment/payment.test.ts` | 🟡     |
| UC-PAY-003 | `payment/payment.test.ts` | 🟡     |
| UC-PAY-004 | `payment/payment.test.ts` | ✅     |
| UC-PAY-005 | `payment/payment.test.ts` | ✅     |
| UC-PAY-006 | `payment/payment.test.ts` | ✅     |
| UC-PAY-007 | `payment/payment.test.ts` | 🟡     |
| UC-PAY-008 | `payment/payment.test.ts` | ✅     |
| UC-PAY-009 | `payment/fraud.test.ts`   | ❌     |
| UC-PAY-010 | `payment/fraud.test.ts`   | ❌     |
| UC-PAY-011 | `payment/fraud.test.ts`   | ❌     |
| UC-PAY-012 | `payment/fraud.test.ts`   | ❌     |
| UC-PAY-013 | `payment/fraud.test.ts`   | ❌     |
| UC-PAY-014 | `payment/fraud.test.ts`   | ❌     |
| UC-PAY-015 | `payment/fraud.test.ts`   | ❌     |
| UC-PAY-016 | `payment/fraud.test.ts`   | ❌     |
| UC-PAY-017 | `payment/fraud.test.ts`   | ❌     |
| UC-PAY-018 | `payment/fraud.test.ts`   | ❌     |
| UC-PAY-019 | `payment/fraud.test.ts`   | ❌     |
| UC-PAY-020 | `payment/fraud.test.ts`   | ❌     |
