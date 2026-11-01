# Market Launch Guide

How to configure, validate, and launch a new selling market on the Commercefull platform. Launching market N+1 is a **configuration exercise** — no storefront, checkout, order, or pricing code changes are required. The only exception is a brand-new external protocol (a local PSP rail or domestic carrier API with no existing adapter), which is delivered as a plug-in behind the existing ports.

For the architectural model see `ARCHITECTURE.md → Global Commerce`. For where markets fit in the overall setup progression (single store → multi-store/channel → multi-market) see [`global-expansion.md`](./global-expansion.md).

> **Prerequisite:** an organization with at least one store, a catalog assortment, and a default price list — see [`organization-setup.md`](./organization-setup.md).

## Concepts

| Concept                | Where                            | Purpose                                                                    |
| ---------------------- | -------------------------------- | -------------------------------------------------------------------------- |
| `Market`               | `modules/store` (`market` table) | First-class aggregate binding countries, currencies, locales, capabilities |
| `MarketCapabilities`   | `domain/valueObjects`            | Declared market behaviors (COD, pickup, coupons, guest checkout, FX, …)    |
| `CommerceContext`      | `libs/commerceContext`           | Customer + Market + Transaction + Legal dimensions resolved per request    |
| `PolicyDecisionRecord` | `libs/rules/policyEngine`        | Explainable decision trail persisted on orders                             |

## 1. Create the market (draft)

`POST /business/markets` (or Admin → Markets → New):

```json
{
  "code": "EU-BE",
  "name": "Belgium",
  "countries": ["BE"],
  "defaultCurrencyCode": "EUR",
  "supportedCurrencyCodes": ["EUR"],
  "defaultLocaleCode": "nl-BE",
  "supportedLocaleCodes": ["nl-BE", "fr-BE", "en-GB"],
  "taxDisplayMode": "inclusive_tax",
  "storeId": "<storeId>",
  "catalogAssortmentId": "<assortmentId>",
  "defaultPriceListId": "<priceListId>",
  "contractingEntityId": "<legalEntityId>",
  "capabilities": { "coupons": true, "guestCheckout": true },
  "paymentMethods": ["card", "bancontact"],
  "fulfillmentMethods": ["shipping", "pickup"],
  "hostnames": ["be.example.com"]
}
```

New markets are created in `draft` — they never serve traffic until launched. `code` is unique per organization.

## 2. Evaluate readiness

`GET /business/markets/:marketId/readiness` (or Admin → Markets → Readiness) audits all 12 dimensions via `MarketReadinessEvaluator` + `MarketReadinessAdapter`:

| Dimension  | Checked facts                                                        |
| ---------- | -------------------------------------------------------------------- |
| Locale     | default/supported locales configured                                 |
| Currency   | default + supported currencies, exchange rates when converting       |
| Catalog    | assortment bound and non-empty                                       |
| Pricing    | default price list bound, prices in market currency                  |
| Tax        | tax engine coverage for the market's selling countries               |
| Payments   | at least one payment method supported by a PSP route for the country |
| Shipping   | a shipping zone + rate covers the selling countries                  |
| Returns    | a return rule exists for the organization                            |
| Legal      | contracting entity bound                                             |
| Compliance | applicable compliance policy rules configured                        |
| Support    | support channels configured                                          |
| Fraud      | fraud screening rules configured                                     |

Each dimension reports `ready` / `warning` / `missing` plus an `issues` list. The response includes `readinessScorePercent` and `launchable`.

## 3. Resolve gaps

Work the `issues` list — every gap is data, not code:

- **Currency** → add exchange rates (`currencyExchangeRate`) and store currency support.
- **Payments** → add/enable a PSP route covering the country (`RoutePayment` country rules).
- **Shipping** → extend a `shippingZone` `locations` set and bind a `shippingRate`.
- **Compliance/Privacy** → author `compliancePolicyRule` rows; jurisdiction consent (GDPR/CCPA/LGPD/APPI) derives automatically from `libs/geo` country groups.
- **Legal** → bind `contractingEntityId` and publish the market's terms version.

## 4. Launch

`POST /business/markets/:marketId/launch` gates on the readiness report: any `missing` **blocking** dimension rejects the launch (`409` with the failing dimensions). On success the market transitions `ready → active` and `version` increments — the version is snapshotted onto orders (`versionSnapshot.marketVersion`) for historical replay.

Once active, the market resolves on the storefront by `hostnames`, by explicit `?market=` selection, or by session. Disabling (`POST /business/markets/:marketId/disable`) stops resolution without deleting configuration.

## 5. Verify in production-like flow

- Storefront market resolution + `GET /customer/markets/context` returns the market's currency/locale.
- Checkout a basket for a selling country: address validation follows `countryAddressMetadata` (e.g. BE needs no region, AE needs no postal code), totals use the market's `taxDisplayMode` and `TaxDecision`.
- Audit the order via `GET /business/orders/:orderId/decisions` — market context, `versionSnapshot`, `decisionLog`, and discount/tax provenance must be present.

## When code IS required

Only when a market introduces an external protocol with no adapter:

- New PSP rail → implement behind the existing payment gateway port; register in `RoutePayment` configuration.
- New carrier API → implement a fulfillment/carrier adapter; lanes already evaluate ship-from → ship-to.
- New tax provider → implement `TaxEnginePort` alongside `InternalRuleTaxEngine`.

Everything else — countries, currencies, locales, capabilities, policies — is configuration.
