# Tax Feature

## Overview

The Tax feature manages tax rates, categories, and zones for accurate tax calculation. It supports multiple tax jurisdictions, compound taxes, and product-specific tax categories.

---

## Use Cases

### Tax Rates (Business)

### UC-TAX-001: List Tax Rates (Business)

**Actor:** Merchant/Admin  
**Priority:** High

#### Given-When-Then

**Given** an authenticated merchant  
**When** they request tax rates  
**Then** the system returns all configured rates

#### API Endpoint

```
GET /business/tax/rates
Query: zoneId?, categoryId?, isActive?, limit, offset
```

---

### UC-TAX-002: Get Tax Rate (Business)

**Actor:** Merchant/Admin  
**Priority:** Medium

#### API Endpoint

```
GET /business/tax/rates/:id
```

---

### UC-TAX-003: Create Tax Rate (Business)

**Actor:** Merchant/Admin  
**Priority:** High

#### Given-When-Then

**Given** an authenticated merchant  
**And** valid rate configuration  
**When** they create a tax rate  
**Then** the rate is applied to matching orders

#### API Endpoint

```
POST /business/tax/rates
Body: {
  name,
  rate,
  zoneId,
  categoryId?,
  isCompound?,
  priority?,
  isActive
}
```

#### Business Rules

- Rate is a percentage (e.g., 8.25 for 8.25%)
- Compound taxes apply on top of other taxes
- Priority determines calculation order
- Can be category-specific

---

### UC-TAX-004: Update Tax Rate (Business)

**Actor:** Merchant/Admin  
**Priority:** Medium

#### API Endpoint

```
PUT /business/tax/rates/:id
```

---

### UC-TAX-005: Delete Tax Rate (Business)

**Actor:** Merchant/Admin  
**Priority:** Low

#### API Endpoint

```
DELETE /business/tax/rates/:id
```

---

### Tax Categories (Business)

### UC-TAX-006: List Tax Categories (Business)

**Actor:** Merchant/Admin  
**Priority:** High

#### Given-When-Then

**Given** an authenticated merchant  
**When** they request tax categories  
**Then** the system returns all categories

#### API Endpoint

```
GET /business/tax/categories
```

---

### UC-TAX-007: Get Tax Category (Business)

**Actor:** Merchant/Admin  
**Priority:** Medium

#### API Endpoint

```
GET /business/tax/categories/:id
```

---

### UC-TAX-008: Create Tax Category (Business)

**Actor:** Merchant/Admin  
**Priority:** High

#### Given-When-Then

**Given** an authenticated merchant  
**And** valid category data  
**When** they create a tax category  
**Then** products can be assigned to it

#### API Endpoint

```
POST /business/tax/categories
Body: {
  name, code, description?,
  isDefault?
}
```

#### Business Rules

- Categories group products for tax purposes
- Examples: Standard, Reduced, Zero-rated, Exempt
- One default category for uncategorized products

---

### UC-TAX-009: Update Tax Category (Business)

**Actor:** Merchant/Admin  
**Priority:** Medium

#### API Endpoint

```
PUT /business/tax/categories/:id
```

---

### UC-TAX-010: Delete Tax Category (Business)

**Actor:** Merchant/Admin  
**Priority:** Low

#### API Endpoint

```
DELETE /business/tax/categories/:id
```

---

### Tax Zones (Business)

### UC-TAX-011: Get Tax Zone (Business)

**Actor:** Merchant/Admin  
**Priority:** Medium

#### API Endpoint

```
GET /business/tax/zones/:id
```

---

### UC-TAX-012: Create Tax Zone (Business)

**Actor:** Merchant/Admin  
**Priority:** High

#### Given-When-Then

**Given** an authenticated merchant  
**And** valid zone configuration  
**When** they create a tax zone  
**Then** addresses in that zone use its rates

#### API Endpoint

```
POST /business/tax/zones
Body: {
  name,
  countries: [],
  states?: [],
  postalCodes?: [],
  isDefault?
}
```

#### Business Rules

- Zones define geographic tax jurisdictions
- Can be country, state, or postal code level
- Most specific zone wins
- One default zone for unmatched addresses

---

### UC-TAX-013: Update Tax Zone (Business)

**Actor:** Merchant/Admin  
**Priority:** Medium

#### API Endpoint

```
PUT /business/tax/zones/:id
```

---

### UC-TAX-014: Delete Tax Zone (Business)

**Actor:** Merchant/Admin  
**Priority:** Low

#### API Endpoint

```
DELETE /business/tax/zones/:id
```

---

### Tax Calculation (Customer)

### UC-TAX-015: Calculate Tax (Customer)

**Actor:** System/Checkout  
**Priority:** High

#### Given-When-Then

**Given** a cart with items  
**And** a shipping address  
**When** calculating tax  
**Then** the correct tax amount is returned

#### API Endpoint

```
POST /tax/calculate
Body: {
  items: [{ productId, quantity, price, categoryId? }],
  shippingAddress: { country, state?, postalCode? }
}
```

#### Business Rules

- Matches address to tax zone
- Applies category-specific rates
- Handles compound taxes
- Returns itemized tax breakdown

---

### UC-TAX-016: Get Tax Summary (Customer)

**Actor:** Customer  
**Priority:** Medium

#### Given-When-Then

**Given** an order  
**When** requesting tax summary  
**Then** the system returns tax breakdown

#### API Endpoint

```
GET /tax/summary/:orderId
```

---

## Tax Calculation Logic

```
For each item:
  1. Determine tax zone from shipping address
  2. Find applicable tax rates for zone
  3. Filter by product's tax category
  4. Sort rates by priority
  5. Calculate non-compound taxes first
  6. Calculate compound taxes on (subtotal + non-compound taxes)
  7. Sum all taxes for item

Total Tax = Sum of all item taxes
```

---

## Events Emitted

| Event              | Trigger        | Payload                  |
| ------------------ | -------------- | ------------------------ |
| `tax.rate.created` | Rate created   | rateId, zoneId           |
| `tax.rate.updated` | Rate updated   | rateId, oldRate, newRate |
| `tax.calculated`   | Tax calculated | orderId, taxAmount       |

---

## Integration Test Coverage

| Use Case                 | Test File                 | Status |
| ------------------------ | ------------------------- | ------ |
| UC-TAX-001 to UC-TAX-005 | `tax/rates.test.ts`       | 🟡     |
| UC-TAX-006 to UC-TAX-010 | `tax/categories.test.ts`  | 🟡     |
| UC-TAX-011 to UC-TAX-014 | `tax/zones.test.ts`       | ❌     |
| UC-TAX-015 to UC-TAX-016 | `tax/calculation.test.ts` | 🟡     |
