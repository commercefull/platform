# Pricing Feature

## Overview

The Pricing feature manages product pricing including pricing rules, tier/volume pricing, customer-specific price lists, and multi-currency support. It enables dynamic pricing strategies and localized pricing.

---

## Use Cases

### Pricing Rules

### UC-PRC-001: List Pricing Rules (Business)
**Actor:** Merchant/Admin  
**Priority:** High

#### Given-When-Then

**Given** an authenticated merchant  
**When** they request pricing rules  
**Then** the system returns all configured pricing rules

#### API Endpoint
```
GET /business/pricing/rules
```

#### Business Rules
- Returns all active and inactive rules
- Rules are evaluated in priority order
- Includes conditions and discount configuration

---

### UC-PRC-002: Get Pricing Rule (Business)
**Actor:** Merchant/Admin  
**Priority:** Medium

#### Given-When-Then

**Given** an authenticated merchant  
**And** a valid rule ID  
**When** they request the rule  
**Then** the system returns the rule configuration

#### API Endpoint
```
GET /business/pricing/rules/:id
```

---

### UC-PRC-003: Create Pricing Rule (Business)
**Actor:** Merchant/Admin  
**Priority:** High

#### Given-When-Then

**Given** an authenticated merchant  
**And** valid rule configuration  
**When** they create a pricing rule  
**Then** the rule is created and active

#### API Endpoint
```
POST /business/pricing/rules
Body: {
  name,
  ruleType: 'percentage'|'fixed'|'fixed_price',
  discountValue,
  conditions: {
    minQuantity?, maxQuantity?,
    productIds?, categoryIds?,
    customerGroups?, dateRange?
  },
  priority,
  isActive
}
```

#### Business Rules
- Rule types: percentage discount, fixed discount, fixed price
- Conditions can combine multiple criteria
- Priority determines evaluation order
- Higher priority rules evaluated first

---

### UC-PRC-004: Update Pricing Rule (Business)
**Actor:** Merchant/Admin  
**Priority:** Medium

#### Given-When-Then

**Given** an authenticated merchant  
**And** an existing rule  
**When** they update the rule  
**Then** the changes are saved

#### API Endpoint
```
PUT /business/pricing/rules/:id
Body: { name?, discountValue?, conditions?, priority?, isActive? }
```

---

### UC-PRC-005: Delete Pricing Rule (Business)
**Actor:** Merchant/Admin  
**Priority:** Low

#### Given-When-Then

**Given** an authenticated merchant  
**And** an existing rule  
**When** they delete the rule  
**Then** the rule is removed

#### API Endpoint
```
DELETE /business/pricing/rules/:id
```

---

### Tier Pricing

### UC-PRC-006: List Tier Prices (Business)
**Actor:** Merchant/Admin  
**Priority:** High

#### Given-When-Then

**Given** an authenticated merchant  
**When** they request tier prices  
**Then** the system returns volume-based pricing tiers

#### API Endpoint
```
GET /business/pricing/tier-prices
Query: productId?, limit, offset
```

---

### UC-PRC-007: Get Tier Price (Business)
**Actor:** Merchant/Admin  
**Priority:** Medium

#### API Endpoint
```
GET /business/pricing/tier-prices/:id
```

---

### UC-PRC-008: Create Tier Price (Business)
**Actor:** Merchant/Admin  
**Priority:** High

#### Given-When-Then

**Given** an authenticated merchant  
**And** valid tier configuration  
**When** they create a tier price  
**Then** volume discounts are configured

#### API Endpoint
```
POST /business/pricing/tier-prices
Body: {
  productId,
  productVariantId?,
  minQuantity,
  maxQuantity?,
  price,
  discountType?: 'percentage'|'fixed',
  discountValue?,
  customerGroupId?
}
```

#### Business Rules
- Tiers based on quantity ranges
- Can be percentage or fixed discount
- Can be customer group specific
- Non-overlapping quantity ranges

---

### UC-PRC-009: Update Tier Price (Business)
**Actor:** Merchant/Admin  
**Priority:** Medium

#### API Endpoint
```
PUT /business/pricing/tier-prices/:id
```

---

### UC-PRC-010: Delete Tier Price (Business)
**Actor:** Merchant/Admin  
**Priority:** Low

#### API Endpoint
```
DELETE /business/pricing/tier-prices/:id
```

---

### Price Lists (Customer-Specific Pricing)

### UC-PRC-011: List Price Lists (Business)
**Actor:** Merchant/Admin  
**Priority:** Medium

#### Given-When-Then

**Given** an authenticated merchant  
**When** they request price lists  
**Then** the system returns customer price lists

#### API Endpoint
```
GET /business/pricing/price-lists
```

---

### UC-PRC-012: Get Price List (Business)
**Actor:** Merchant/Admin  
**Priority:** Medium

#### API Endpoint
```
GET /business/pricing/price-lists/:id
```

---

### UC-PRC-013: Create Price List (Business)
**Actor:** Merchant/Admin  
**Priority:** Medium

#### Given-When-Then

**Given** an authenticated merchant  
**And** valid price list data  
**When** they create a price list  
**Then** custom pricing is available for assigned customers

#### API Endpoint
```
POST /business/pricing/price-lists
Body: {
  name,
  description?,
  customerIds?: [],
  customerGroupIds?: [],
  currency?,
  priority,
  isActive
}
```

#### Business Rules
- Can assign to specific customers or groups
- Priority determines which list applies
- Currency-specific lists supported

---

### UC-PRC-014: Update Price List (Business)
**Actor:** Merchant/Admin  
**Priority:** Medium

#### API Endpoint
```
PUT /business/pricing/price-lists/:id
```

---

### UC-PRC-015: Delete Price List (Business)
**Actor:** Merchant/Admin  
**Priority:** Low

#### API Endpoint
```
DELETE /business/pricing/price-lists/:id
```

---

### UC-PRC-016: Add Price to List (Business)
**Actor:** Merchant/Admin  
**Priority:** Medium

#### Given-When-Then

**Given** a price list  
**And** a product  
**When** adding a custom price  
**Then** the product has special pricing for that list

#### API Endpoint
```
POST /business/pricing/price-lists/:priceListId/prices
Body: { productId, productVariantId?, price }
```

---

### Currency Management

### UC-PRC-017: List Currencies (Business)
**Actor:** Merchant/Admin  
**Priority:** High

#### Given-When-Then

**Given** an authenticated merchant  
**When** they request currencies  
**Then** the system returns configured currencies

#### API Endpoint
```
GET /business/pricing/currencies
```

---

### UC-PRC-018: Get Currency (Business)
**Actor:** Merchant/Admin  
**Priority:** Medium

#### API Endpoint
```
GET /business/pricing/currencies/:code
```

---

### UC-PRC-019: Save Currency (Business)
**Actor:** Merchant/Admin  
**Priority:** High

#### Given-When-Then

**Given** an authenticated merchant  
**And** valid currency data  
**When** they save a currency  
**Then** the currency is configured

#### API Endpoint
```
POST /business/pricing/currencies
Body: {
  code: 'USD'|'EUR'|'GBP'|...,
  symbol,
  name,
  exchangeRate,
  isActive,
  isDefault?
}
```

#### Business Rules
- ISO 4217 currency codes
- Exchange rate relative to base currency
- One default currency required
- Affects price display and checkout

---

### UC-PRC-020: Delete Currency (Business)
**Actor:** Merchant/Admin  
**Priority:** Low

#### API Endpoint
```
DELETE /business/pricing/currencies/:code
```

#### Business Rules
- Cannot delete default currency
- Cannot delete currency with active orders

---

### UC-PRC-021: Update Exchange Rates (Business)
**Actor:** Merchant/Admin  
**Priority:** Medium

#### Given-When-Then

**Given** an authenticated merchant  
**When** they update exchange rates  
**Then** all currency rates are refreshed

#### API Endpoint
```
POST /business/pricing/currencies/update-exchange-rates
Body: { provider?: string } // Optional: specify rate provider
```

#### Business Rules
- Can use automatic provider (fixer.io, etc.)
- Or manual rate entry
- Creates rate history record

---

### Currency Regions

### UC-PRC-022: List Currency Regions (Business)
**Actor:** Merchant/Admin  
**Priority:** Medium

#### Given-When-Then

**Given** an authenticated merchant  
**When** they request currency regions  
**Then** the system returns geographic currency mappings

#### API Endpoint
```
GET /business/pricing/currency-regions
```

---

### UC-PRC-023: Create Currency Region (Business)
**Actor:** Merchant/Admin  
**Priority:** Medium

#### Given-When-Then

**Given** an authenticated merchant  
**And** valid region data  
**When** they create a currency region  
**Then** visitors from that region see that currency

#### API Endpoint
```
POST /business/pricing/currency-regions
Body: {
  name,
  countries: ['US', 'CA', ...],
  currencyCode,
  isActive
}
```

#### Business Rules
- Maps countries to preferred currency
- Used for automatic currency detection
- Customer can override

---

### UC-PRC-024: Update Currency Region (Business)
**Actor:** Merchant/Admin  
**Priority:** Low

#### API Endpoint
```
PUT /business/pricing/currency-regions/:id
```

---

### UC-PRC-025: Delete Currency Region (Business)
**Actor:** Merchant/Admin  
**Priority:** Low

#### API Endpoint
```
DELETE /business/pricing/currency-regions/:id
```

---

### Currency Price Rules

### UC-PRC-026: List Currency Price Rules (Business)
**Actor:** Merchant/Admin  
**Priority:** Medium

#### Given-When-Then

**Given** an authenticated merchant  
**When** they request currency price rules  
**Then** the system returns currency-specific pricing rules

#### API Endpoint
```
GET /business/pricing/currency-price-rules
```

---

### UC-PRC-027: Create Currency Price Rule (Business)
**Actor:** Merchant/Admin  
**Priority:** Medium

#### Given-When-Then

**Given** an authenticated merchant  
**And** valid rule configuration  
**When** they create a currency price rule  
**Then** prices are adjusted for that currency

#### API Endpoint
```
POST /business/pricing/currency-price-rules
Body: {
  currencyCode,
  adjustmentType: 'percentage'|'fixed',
  adjustmentValue,
  roundingMethod?: 'none'|'nearest'|'up'|'down',
  roundingPrecision?,
  isActive
}
```

#### Business Rules
- Adjust prices beyond exchange rate
- Account for market conditions
- Apply psychological pricing (rounding)

---

### UC-PRC-028: Update Currency Price Rule (Business)
**Actor:** Merchant/Admin  
**Priority:** Low

#### API Endpoint
```
PUT /business/pricing/currency-price-rules/:id
```

---

### UC-PRC-029: Delete Currency Price Rule (Business)
**Actor:** Merchant/Admin  
**Priority:** Low

#### API Endpoint
```
DELETE /business/pricing/currency-price-rules/:id
```

---

## Price Calculation Logic

```
Final Price = 
  (Base Price × Exchange Rate)
  + Currency Adjustment
  + Tier Discount (if applicable)
  + Price List Override (if applicable)
  + Pricing Rule Discount (if applicable)
  → Rounding
```

## Events Emitted

| Event | Trigger | Payload |
|-------|---------|---------|
| `product.price_changed` | Price updated | productId, oldPrice, newPrice |

---

## Integration Test Coverage

| Use Case | Test File | Status |
|----------|-----------|--------|
| UC-PRC-001 to UC-PRC-005 | `pricing/rules.test.ts` | ❌ |
| UC-PRC-006 to UC-PRC-010 | `pricing/tiers.test.ts` | ❌ |
| UC-PRC-011 to UC-PRC-016 | `pricing/pricelists.test.ts` | ❌ |
| UC-PRC-017 to UC-PRC-021 | `pricing/currencies.test.ts` | ❌ |
| UC-PRC-022 to UC-PRC-025 | `pricing/regions.test.ts` | ❌ |
| UC-PRC-026 to UC-PRC-029 | `pricing/currencyrules.test.ts` | ❌ |
