# Tax Feature

## Overview

The Tax feature manages tax rates, categories, and zones for accurate tax calculation. It supports multiple tax jurisdictions, compound taxes, and product-specific tax categories.

---

## Use Cases

| ID | Use Case | Actor | Purpose |
|---|---|---|---|
| UC-TAX-001 | List Tax Rates | Merchant/Admin | List all configured tax rates with optional zone/category/active filtering |
| UC-TAX-002 | Get Tax Rate | Merchant/Admin | Retrieve a specific tax rate by ID |
| UC-TAX-003 | Create Tax Rate | Merchant/Admin | Create a tax rate (percentage) for a zone, optionally category-specific, compound, with priority |
| UC-TAX-004 | Update Tax Rate | Merchant/Admin | Update an existing tax rate's configuration |
| UC-TAX-005 | Delete Tax Rate | Merchant/Admin | Permanently delete a tax rate |
| UC-TAX-006 | List Tax Categories | Merchant/Admin | List all tax categories |
| UC-TAX-007 | Get Tax Category | Merchant/Admin | Retrieve a specific tax category by ID |
| UC-TAX-008 | Create Tax Category | Merchant/Admin | Create a tax category (e.g., Standard, Reduced, Zero-rated, Exempt) with optional default flag |
| UC-TAX-009 | Update Tax Category | Merchant/Admin | Update an existing tax category |
| UC-TAX-010 | Delete Tax Category | Merchant/Admin | Permanently delete a tax category |
| UC-TAX-011 | Get Tax Zone | Merchant/Admin | Retrieve a specific tax zone by ID |
| UC-TAX-012 | Create Tax Zone | Merchant/Admin | Create a geographic tax jurisdiction (country, state, or postal code level) with optional default flag |
| UC-TAX-013 | Update Tax Zone | Merchant/Admin | Update an existing tax zone's geographic scope |
| UC-TAX-014 | Delete Tax Zone | Merchant/Admin | Permanently delete a tax zone |
| UC-TAX-015 | Calculate Tax | System/Checkout | Calculate tax for cart items based on shipping address, zone matching, and category-specific rates |
| UC-TAX-016 | Get Tax Summary | Customer | Retrieve an itemized tax breakdown for a specific order |

### API Endpoints

| ID | Method | Endpoint |
|---|---|---|
| UC-TAX-001 | GET | `/business/tax/rates` |
| UC-TAX-002 | GET | `/business/tax/rates/:id` |
| UC-TAX-003 | POST | `/business/tax/rates` |
| UC-TAX-004 | PUT | `/business/tax/rates/:id` |
| UC-TAX-005 | DELETE | `/business/tax/rates/:id` |
| UC-TAX-006 | GET | `/business/tax/categories` |
| UC-TAX-007 | GET | `/business/tax/categories/:id` |
| UC-TAX-008 | POST | `/business/tax/categories` |
| UC-TAX-009 | PUT | `/business/tax/categories/:id` |
| UC-TAX-010 | DELETE | `/business/tax/categories/:id` |
| UC-TAX-011 | GET | `/business/tax/zones/:id` |
| UC-TAX-012 | POST | `/business/tax/zones` |
| UC-TAX-013 | PUT | `/business/tax/zones/:id` |
| UC-TAX-014 | DELETE | `/business/tax/zones/:id` |
| UC-TAX-015 | POST | `/tax/calculate` |
| UC-TAX-016 | GET | `/tax/summary/:orderId` |

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

| Use Case                 | Test File                       | Status |
| ------------------------ | ------------------------------- | ------ |
| UC-TAX-001 to UC-TAX-005 | `tax/taxRates.test.ts`          | ✅     |
| UC-TAX-006 to UC-TAX-010 | `tax/taxCategories.test.ts`     | ✅     |
| UC-TAX-011 to UC-TAX-014 | `tax/taxZones.test.ts`             | ✅     |
| UC-TAX-015 to UC-TAX-016 | `tax/taxCalculation.test.ts`    | ✅     |
