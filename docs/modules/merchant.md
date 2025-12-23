# Merchant Feature

## Overview

The Merchant feature manages merchant/seller accounts in a multi-vendor marketplace setup. It handles merchant profiles, addresses, and payment information for commission payouts.

---

## Use Cases

### Merchant Management (Business)

### UC-MER-001: List Merchants (Business)

**Actor:** Admin  
**Priority:** High

#### Given-When-Then

**Given** an authenticated admin  
**When** they request merchants  
**Then** the system returns all merchant accounts

#### API Endpoint

```
GET /business/merchants
Query: status?, search?, limit, offset
```

---

### UC-MER-002: Create Merchant (Business)

**Actor:** Admin  
**Priority:** High

#### Given-When-Then

**Given** an authenticated admin  
**And** valid merchant data  
**When** they create a merchant  
**Then** the merchant account is created

#### API Endpoint

```
POST /business/merchants
Body: {
  name, email, phone?,
  companyName?, taxId?,
  commissionRate?,
  status: 'pending'|'active'|'suspended'
}
```

#### Business Rules

- Email must be unique
- Commission rate determines platform fee
- Pending merchants need approval

---

### UC-MER-003: Get Merchant (Business)

**Actor:** Admin  
**Priority:** High

#### API Endpoint

```
GET /business/merchants/:id
```

---

### UC-MER-004: Update Merchant (Business)

**Actor:** Admin  
**Priority:** Medium

#### API Endpoint

```
PUT /business/merchants/:id
Body: { name?, commissionRate?, status?, ... }
```

---

### UC-MER-005: Delete Merchant (Business)

**Actor:** Admin  
**Priority:** Low

#### API Endpoint

```
DELETE /business/merchants/:id
```

---

### Merchant Addresses (Business)

### UC-MER-006: Get Merchant Addresses (Business)

**Actor:** Admin  
**Priority:** Medium

#### API Endpoint

```
GET /business/merchants/:merchantId/addresses
```

---

### UC-MER-007: Add Merchant Address (Business)

**Actor:** Admin  
**Priority:** Medium

#### Given-When-Then

**Given** an authenticated admin  
**And** a merchant  
**When** adding an address  
**Then** the address is associated with the merchant

#### API Endpoint

```
POST /business/merchants/:merchantId/addresses
Body: {
  type: 'business'|'warehouse'|'return',
  addressLine1, addressLine2?,
  city, state?, postalCode, country,
  isDefault?
}
```

---

### Merchant Payment Info (Business)

### UC-MER-008: Get Merchant Payment Info (Business)

**Actor:** Admin  
**Priority:** Medium

#### API Endpoint

```
GET /business/merchants/:merchantId/payment-info
```

---

### UC-MER-009: Add Merchant Payment Info (Business)

**Actor:** Admin  
**Priority:** Medium

#### Given-When-Then

**Given** an authenticated admin  
**And** a merchant  
**When** adding payment info  
**Then** payouts can be processed

#### API Endpoint

```
POST /business/merchants/:merchantId/payment-info
Body: {
  type: 'bank_transfer'|'paypal'|'stripe',
  accountDetails: {},
  isDefault?
}
```

#### Business Rules

- Bank details are encrypted
- At least one payment method required for payouts
- Can have multiple payment methods

---

## Events Emitted

| Event                       | Trigger            | Payload            |
| --------------------------- | ------------------ | ------------------ |
| `merchant.created`          | Merchant created   | merchantId         |
| `merchant.approved`         | Merchant approved  | merchantId         |
| `merchant.suspended`        | Merchant suspended | merchantId, reason |
| `merchant.payout.processed` | Payout sent        | merchantId, amount |

---

## Integration Test Coverage

| Use Case                 | Test File                    | Status |
| ------------------------ | ---------------------------- | ------ |
| UC-MER-001 to UC-MER-005 | `merchant/merchant.test.ts`  | 🟡     |
| UC-MER-006 to UC-MER-007 | `merchant/addresses.test.ts` | ❌     |
| UC-MER-008 to UC-MER-009 | `merchant/payment.test.ts`   | ❌     |
