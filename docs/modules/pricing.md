# Pricing Feature

## Overview

The Pricing feature manages product pricing including pricing rules, tier/volume pricing, customer-specific price lists, and multi-currency support. It enables dynamic pricing strategies and localized pricing.

---

## Use Cases

| ID | Use Case | Actor | Purpose |
|---|---|---|---|
| UC-PRC-001 | List Pricing Rules | Merchant/Admin | List all configured pricing rules with conditions and discount configuration |
| UC-PRC-002 | Get Pricing Rule | Merchant/Admin | Retrieve a specific pricing rule configuration by ID |
| UC-PRC-003 | Create Pricing Rule | Merchant/Admin | Create a pricing rule (percentage, fixed, fixed_price) with conditions and priority |
| UC-PRC-004 | Update Pricing Rule | Merchant/Admin | Update an existing pricing rule's discount, conditions, priority, or active status |
| UC-PRC-005 | Delete Pricing Rule | Merchant/Admin | Permanently remove a pricing rule |
| UC-PRC-006 | List Tier Prices | Merchant/Admin | List volume-based tier pricing with optional product filtering |
| UC-PRC-007 | Get Tier Price | Merchant/Admin | Retrieve a specific tier price configuration by ID |
| UC-PRC-008 | Create Tier Price | Merchant/Admin | Create a quantity-based tier price with optional customer group targeting |
| UC-PRC-009 | Update Tier Price | Merchant/Admin | Update an existing tier price's quantity range or discount |
| UC-PRC-010 | Delete Tier Price | Merchant/Admin | Permanently remove a tier price |
| UC-PRC-011 | List Price Lists | Merchant/Admin | List all customer-specific price lists |
| UC-PRC-012 | Get Price List | Merchant/Admin | Retrieve a specific price list by ID |
| UC-PRC-013 | Create Price List | Merchant/Admin | Create a price list assigned to specific customers or groups with currency and priority |
| UC-PRC-014 | Update Price List | Merchant/Admin | Update an existing price list's assignments, currency, or priority |
| UC-PRC-015 | Delete Price List | Merchant/Admin | Permanently remove a price list |
| UC-PRC-016 | Add Price to List | Merchant/Admin | Add a custom product price to a specific price list |
| UC-PRC-017 | List Currencies | Merchant/Admin | List all configured currencies with exchange rates |
| UC-PRC-018 | Get Currency | Merchant/Admin | Retrieve a specific currency configuration by code |
| UC-PRC-019 | Save Currency | Merchant/Admin | Create or update a currency with exchange rate and default flag |
| UC-PRC-020 | Delete Currency | Merchant/Admin | Remove a currency (cannot delete default or currency with active orders) |
| UC-PRC-021 | Update Exchange Rates | Merchant/Admin | Refresh all currency exchange rates from a provider or manual entry |
| UC-PRC-022 | List Currency Regions | Merchant/Admin | List geographic currency mappings for automatic currency detection |
| UC-PRC-023 | Create Currency Region | Merchant/Admin | Map countries to a preferred currency for automatic detection |
| UC-PRC-024 | Update Currency Region | Merchant/Admin | Update an existing currency region's country mappings or currency |
| UC-PRC-025 | Delete Currency Region | Merchant/Admin | Permanently remove a currency region mapping |
| UC-PRC-026 | List Currency Price Rules | Merchant/Admin | List currency-specific pricing adjustment rules |
| UC-PRC-027 | Create Currency Price Rule | Merchant/Admin | Create a currency price adjustment (percentage or fixed) with optional rounding for psychological pricing |
| UC-PRC-028 | Update Currency Price Rule | Merchant/Admin | Update an existing currency price rule's adjustment or rounding |
| UC-PRC-029 | Delete Currency Price Rule | Merchant/Admin | Permanently remove a currency price rule |

### API Endpoints

| ID | Method | Endpoint |
|---|---|---|
| UC-PRC-001 | GET | `/business/pricing/rules` |
| UC-PRC-002 | GET | `/business/pricing/rules/:id` |
| UC-PRC-003 | POST | `/business/pricing/rules` |
| UC-PRC-004 | PUT | `/business/pricing/rules/:id` |
| UC-PRC-005 | DELETE | `/business/pricing/rules/:id` |
| UC-PRC-006 | GET | `/business/pricing/tier-prices` |
| UC-PRC-007 | GET | `/business/pricing/tier-prices/:id` |
| UC-PRC-008 | POST | `/business/pricing/tier-prices` |
| UC-PRC-009 | PUT | `/business/pricing/tier-prices/:id` |
| UC-PRC-010 | DELETE | `/business/pricing/tier-prices/:id` |
| UC-PRC-011 | GET | `/business/pricing/price-lists` |
| UC-PRC-012 | GET | `/business/pricing/price-lists/:id` |
| UC-PRC-013 | POST | `/business/pricing/price-lists` |
| UC-PRC-014 | PUT | `/business/pricing/price-lists/:id` |
| UC-PRC-015 | DELETE | `/business/pricing/price-lists/:id` |
| UC-PRC-016 | POST | `/business/pricing/price-lists/:priceListId/prices` |
| UC-PRC-017 | GET | `/business/pricing/currencies` |
| UC-PRC-018 | GET | `/business/pricing/currencies/:code` |
| UC-PRC-019 | POST | `/business/pricing/currencies` |
| UC-PRC-020 | DELETE | `/business/pricing/currencies/:code` |
| UC-PRC-021 | POST | `/business/pricing/currencies/update-exchange-rates` |
| UC-PRC-022 | GET | `/business/pricing/currency-regions` |
| UC-PRC-023 | POST | `/business/pricing/currency-regions` |
| UC-PRC-024 | PUT | `/business/pricing/currency-regions/:id` |
| UC-PRC-025 | DELETE | `/business/pricing/currency-regions/:id` |
| UC-PRC-026 | GET | `/business/pricing/currency-price-rules` |
| UC-PRC-027 | POST | `/business/pricing/currency-price-rules` |
| UC-PRC-028 | PUT | `/business/pricing/currency-price-rules/:id` |
| UC-PRC-029 | DELETE | `/business/pricing/currency-price-rules/:id` |

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

| Event                   | Trigger       | Payload                       |
| ----------------------- | ------------- | ----------------------------- |
| `product.price_changed` | Price updated | productId, oldPrice, newPrice |

---

## Integration Test Coverage

| Use Case                 | Test File                       | Status |
| ------------------------ | ------------------------------- | ------ |
| UC-PRC-001 to UC-PRC-005 | `pricing/rules.test.ts`         | ❌     |
| UC-PRC-006 to UC-PRC-010 | `pricing/tiers.test.ts`         | ❌     |
| UC-PRC-011 to UC-PRC-016 | `pricing/pricelists.test.ts`    | ❌     |
| UC-PRC-017 to UC-PRC-021 | `pricing/currencies.test.ts`    | ❌     |
| UC-PRC-022 to UC-PRC-025 | `pricing/regions.test.ts`       | ❌     |
| UC-PRC-026 to UC-PRC-029 | `pricing/currencyrules.test.ts` | ❌     |


<!-- GENERATED:ENDPOINTS:START -->

| Method | Endpoint | Controller | Description |
|---|---|---|---|
| GET | `/business/pricing/currencies` | `getAllCurrencies` | Currency Management Routes |
| POST | `/business/pricing/currencies` | `saveCurrency` | — |
| GET | `/business/pricing/currencies/:code` | `getCurrencyByCode` | — |
| DELETE | `/business/pricing/currencies/:code` | `deleteCurrency` | — |
| GET | `/business/pricing/currencies/default` | `getDefaultCurrency` | — |
| POST | `/business/pricing/currencies/update-exchange-rates` | `updateExchangeRates` | — |
| GET | `/business/pricing/currency-price-rules` | `getAllPriceRules` | Currency Price Rule Routes |
| POST | `/business/pricing/currency-price-rules` | `createPriceRule` | — |
| GET | `/business/pricing/currency-price-rules/:id` | `getPriceRuleById` | — |
| PUT | `/business/pricing/currency-price-rules/:id` | `updatePriceRule` | — |
| DELETE | `/business/pricing/currency-price-rules/:id` | `deletePriceRule` | — |
| GET | `/business/pricing/currency-regions` | `getAllCurrencyRegions` | Currency Region Routes |
| POST | `/business/pricing/currency-regions` | `createCurrencyRegion` | — |
| GET | `/business/pricing/currency-regions/:id` | `getCurrencyRegionById` | — |
| PUT | `/business/pricing/currency-regions/:id` | `updateCurrencyRegion` | — |
| DELETE | `/business/pricing/currency-regions/:id` | `deleteCurrencyRegion` | — |
| GET | `/business/pricing/price-lists` | `getPriceLists` | Customer Price List Routes |
| POST | `/business/pricing/price-lists` | `createPriceList` | — |
| GET | `/business/pricing/price-lists/:id` | `getPriceList` | — |
| PUT | `/business/pricing/price-lists/:id` | `updatePriceList` | — |
| DELETE | `/business/pricing/price-lists/:id` | `deletePriceList` | — |
| POST | `/business/pricing/price-lists/:priceListId/prices` | `addPriceToList` | Customer Prices Routes |
| GET | `/business/pricing/rules` | `getPricingRules` | Pricing Rules Routes |
| POST | `/business/pricing/rules` | `createPricingRule` | — |
| GET | `/business/pricing/rules/:id` | `getPricingRule` | — |
| PUT | `/business/pricing/rules/:id` | `updatePricingRule` | — |
| DELETE | `/business/pricing/rules/:id` | `deletePricingRule` | — |
| GET | `/business/pricing/tier-prices` | `getTierPrices` | Tier Pricing Routes |
| POST | `/business/pricing/tier-prices` | `createTierPrice` | — |
| GET | `/business/pricing/tier-prices/:id` | `getTierPrice` | — |
| PUT | `/business/pricing/tier-prices/:id` | `updateTierPrice` | — |
| DELETE | `/business/pricing/tier-prices/:id` | `deleteTierPrice` | — |

<!-- GENERATED:ENDPOINTS:END -->
