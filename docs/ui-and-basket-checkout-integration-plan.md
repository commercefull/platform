# UI Parity & Basket/Checkout Integration Plan

**Date:** 2026-09-12
**Companion to:** [`docs/rule-engine-gap-analysis.md`](./rule-engine-gap-analysis.md)

This document covers the two remaining pieces of the rule-engine adoption plan:

1. **Admin UI changes** needed so merchants can configure rules with the same sophistication as the `rule-engine` packages (declarative conditions, stacking, policy, resolution preview).
2. **Basket/Checkout wiring** so the calculation engines are invoked with the right basket data at the right point in the customer order flow, using the platform's **existing ACL port/adapter seam** rather than inventing a new integration mechanism.

---

## 1. Current UI State (as found in `web/admin`)

| Rule type               | Route                                                     | Controller                  | Maturity                                                                                                                                                                                                              |
| ----------------------- | --------------------------------------------------------- | --------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Price Rules             | `/admin/catalog/pricing/rules`                            | `pricingController.ts`      | **Stub** — `listPriceRules` returns `priceRules: []`, create/update/delete don't persist (`res.redirect` only, no use case call)                                                                                      |
| Tax Rates/Zones/Classes | `/admin/tax/*`                                            | `taxController.ts`          | Functional CRUD via modals, but flat fields only (name/rate/country/state/taxClass) — no conditions, no base-type selection, no tiers                                                                                 |
| Shipping Rates          | `/admin/shipping/rates`                                   | `shippingRateController.ts` | Functional CRUD; `rateMatrix` and `conditions` fields exist on the use case but are commented **"Not implemented in UI yet"**                                                                                         |
| Shipping Zones          | `/admin/shipping/zones`                                   | `shippingZoneController.ts` | Functional, JSON-textarea for `locations`/`excludedLocations`                                                                                                                                                         |
| Loyalty Rewards         | `/admin/loyalty/rewards`                                  | `loyaltyController.ts`      | Functional CRUD, flat fields, no earn-rule tiering UI                                                                                                                                                                 |
| Promotions              | _(not found under `/admin`; likely business-portal only)_ | —                           | —                                                                                                                                                                                                                     |
| Automation Rules        | `/admin/automation`                                       | `automationController.ts`   | **Closest existing analog** — has `conditions` (JSON array of `{field, operator, value}`) and `actions` (JSON array), plus `conditionMatchMode: all\|any`. Rendered as a raw JSON **textarea**, not a visual builder. |

**Key finding:** the platform already has one place (`automationController`/`operations/automation/*.ejs`) that stores declarative `field/operator/value` conditions — this is structurally identical to rule-engine's `AttributeCondition`. It's just not exposed as a reusable UI component, and it's raw JSON instead of a builder. This is the template to generalize.

---

## 2. UI Changes Required

### 2.1 Shared Component: Condition Builder (`libs`/`web/admin` partial)

Build one reusable EJS partial + small vanilla-JS/Alpine controller: `web/admin/views/partials/condition-builder.ejs`.

- Renders N rows of `[attribute dropdown] [operator dropdown: eq/neq/gt/gte/lt/lte/in] [value input]` with add/remove row buttons.
- Serializes to the same JSON shape already used by automation: `[{ attribute, operator, value }]` (rename `field`→`attribute` platform-wide for consistency with the shared `AttributeCondition` type from Phase 1 of the gap-analysis doc).
- Accepts a `attributeOptions` param per domain (e.g. tax: `country, state, postalCode, productCategory, orderValue`; promotion: `customerSegment, productCategory, quantity, isFirstOrder`; shipping: `weight, destinationZone, orderValue`).
- Used by: Price Rules, Tax Rates, Promotions, Loyalty Reward Rules, Shipping Rates, (future) Returns Rules, Fraud Rules.

### 2.2 Per-Domain UI Upgrades

**Price Rules** (`/admin/catalog/pricing/rules`) — currently a stub, needs full build:

- Wire `listPriceRules`/`createPriceRule`/`updatePriceRule`/`deletePriceRule` to the real `PriceRule`/`PricingRule` use cases (resolve the two-model duplication noted in the gap-analysis doc first).
- Add `type` selector including the missing `MAPEnforced` type.
- Add condition-builder for eligibility (customer segment, product/category, quantity).
- Add tier editor (repeatable min/max/price rows) for `tiered`/`volume` types.

**Tax Rates** (`/admin/tax`):

- Add `baseType` selector: `AdValorem | SpecificUnit | WeightBased | VolumeBased | Compound | Tiered` (currently only percentage/fixed).
- Add `sourcingRule` selector (destination/origin/place-of-supply).
- Add tier editor for `Tiered` base type.
- Add condition-builder for attribute-based rate selection (needed for "most specific wins" resolution — see §3.3).
- **New screen:** Tax Exemptions (`/admin/tax/exemptions`) — certificate number, expiry, exemption type, buyer types, min/max amounts — net-new per the gap-analysis Phase 2 priority.

**Promotions** (new/expanded admin screens):

- Add `TieredDiscount` and `FreeGift` type options.
- Replace binary `stackable` checkbox with `stackability: None | Stackable | Exclusive` selector.
- Wire the existing (currently dead) `conditions` field to the shared condition-builder.
- Add a **"Preview" panel**: given a sample cart (manually entered items), show which promotions would match and the resulting stack/discount — this directly surfaces the resolver+stacking logic to merchants and is the highest-value UX addition (rule-engine has no UI, but its `worked-examples.ts` pattern is exactly this — expose it as a live preview instead of a dev script).

**Shipping Rates** (`/admin/shipping/rates`):

- Un-comment and wire `conditions` and `rateMatrix` fields already present in the use case.
- Add surcharge configuration sub-form (fuel/remote-area/residential/oversize/signature/insurance — each with type/amount/condition).
- Add dimensional-weight fields (`dimensionalFactor`).

**Loyalty Rewards** (`/admin/loyalty`):

- Add tier management screen (`/admin/loyalty/tiers` route exists but likely stubbed — verify and wire to a new `LoyaltyTier` enum: Bronze/Silver/Gold/Platinum/Diamond with spend thresholds).
- Add expiration-policy selector per earn rule.
- Add category-multiplier condition-builder usage.

**Returns Rules** (net-new screen, `/admin/returns/rules`):

- Return-window days, restocking-fee %, shipping-cost mode, auto-approve threshold, allowed refund methods — all currently missing from any UI since the underlying logic doesn't exist yet either (build UI alongside the Phase 2 backend work in the gap-analysis doc).

**Fraud Rules** (`/admin/payment/fraud` — controller exists, verify view):

- Ensure the condition-builder is used for `FraudRule.conditions` (currently `Record<string, unknown>`, opaque).
- Add a risk-score simulator: enter sample order attributes, see which rules would trigger and the resulting `riskScore`/`verdict` — same "preview" pattern as promotions.

### 2.3 New Cross-Cutting Screens

1. **Rule Resolution Preview** (reusable modal, invoked from any rule-list page): given sample transaction attributes, show every candidate rule, its specificity score, and which one(s) "win" — direct UI expression of rule-engine's `rates.ts` resolver.
2. **Policy Management** (`/admin/settings/policies`): per-store/region caps and defaults (max discount %, max stacked promotions, default tax-inclusive/exclusive) — UI for the rule-engine `policy/` layer once it's ported (Phase 1/3 of gap-analysis).

---

## 3. Basket & Checkout Integration Plan

### 3.1 The Existing Seam (good news: it already exists)

`modules/checkout/application/ports/` already defines exactly the right abstraction boundary for plugging in rule-engine-style calculation:

| Port                    | Purpose                                                                                                                                | Current adapter                                                             |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| `TaxQuotePort`          | `calculateTax(items, shippingAddress, shippingAmount, customerId)` → `{ taxAmount, breakdown }`                                        | `TaxTaxQuoteAdapter` → `tax/CalculateOrderTax` use case                     |
| `ShippingQuotePort`     | `getShippingOptions(basketId, shippingAddress, weight, value)` → `ShippingOption[]`                                                    | `ShippingShippingQuoteAdapter` → `shipping/CalculateShippingRates` use case |
| `PromotionQuotePort`    | `evaluatePromotions(items, subtotal, shippingAmount, customerId, currency, couponCode)` → `{ totalDiscountAmount, appliedPromotions }` | `PromotionPromotionQuoteAdapter` → `promotion/PromotionEvaluationService`   |
| `DiscountQuotePort`     | `validateDiscount(code, subtotal, currency)` → `DiscountQuoteResult`                                                                   | `CouponDiscountQuoteAdapter`                                                |
| `StockAvailabilityPort` | `checkAvailability(productId, variantId, quantity)`                                                                                    | `InventoryStockAvailabilityAdapter`                                         |
| `BasketSnapshotPort`    | `getSnapshot(basketId)` → immutable `BasketSnapshot` (uses `libs/money.ts` `Money`)                                                    | `BasketBasketSnapshotAdapter`                                               |

**This means the integration work is almost entirely inside the existing adapters, not a new architecture.** Each adapter currently calls a single module use case and does a thin translation. The plan is to evolve what's _behind_ the adapter (the module's own calculation logic) to use the rule-engine patterns, while the port contracts stay stable — this is the same ACL principle already documented in `docs/guidelines/module-integration.md`.

### 3.2 Data Flow: When Each Engine Runs

```
Basket phase (modules/basket)
  AddItem / UpdateItemQuantity / ApplyCoupon / RemoveItem
    → Basket entity recalculates its own subtotal (existing, simple arithmetic)
    → No tax/shipping calculation here — basket doesn't know the destination yet

Checkout phase (modules/checkout) — sequenced by existing use cases:
  1. InitiateCheckout
       → BasketSnapshotPort.getSnapshot(basketId)   [immutable Money-based snapshot]
  2. SetShippingAddress
       → ShippingQuotePort.getShippingOptions(snapshot.items, address)
         [NEW: adapter calls shipping's rule resolver — see §3.3]
  3. SetShippingMethod
       → (chosen ShippingOption.amount is now fixed for this session)
  4. ApplyCoupon (checkout's own, distinct from basket's ApplyCoupon)
       → DiscountQuotePort.validateDiscount(code, subtotal, currency)
       → PromotionQuotePort.evaluatePromotions(items, subtotal, shippingAmount, customerId, currency, couponCode)
         [NEW: adapter calls promotion's resolver+stacking engine — see §3.4]
  5. (implicit, before CompleteCheckout / on every totals recompute)
       → TaxQuotePort.calculateTax(items, shippingAddress, shippingAmount, customerId)
         [NEW: adapter calls tax's resolver — see §3.5]
         respects TaxQuotePort.getTaxSettings() → applyDiscountBeforeTax / applyTaxToShipping
         (this ordering flag ALREADY EXISTS — it's the exact "policy" concept from rule-engine,
          just narrower in scope; extend it rather than replace it)
  6. CreatePaymentIntent → uses final total (subtotal - discount + shipping + tax)
  7. CompleteCheckout → OrderPlacementPort (order gets the final, itemized breakdown)
```

**Recommended calculation order (confirming/extending what's implicit today):**

```
subtotal
  → apply promotions (PromotionQuotePort)          [may depend on: cart contents, customer segment, coupon]
  → resolve shipping option (ShippingQuotePort)     [may depend on: destination, weight, discounted subtotal for free-shipping thresholds]
  → apply tax (TaxQuotePort)                        [respects applyDiscountBeforeTax + applyTaxToShipping flags]
  → final total
  → (post-order) award loyalty points on final total — currently NOT wired to any checkout port; see §3.6
```

### 3.3 Tax Integration Detail

`TaxTaxQuoteAdapter` currently calls `calculateOrderTaxUseCase.execute()`, which (per the gap-analysis) only supports flat `country/state/postalCode` matching with `percentage|fixed` types — no resolver for multiple competing rate definitions.
**Change required (inside `modules/tax`, port contract unchanged):**

- `CalculateOrderTax` use case internally adopts the Phase 1 shared resolver (`libs/rules/resolver.ts`) to pick the most-specific `TaxRateDefinition` per line item's `taxCategoryId` + address, instead of a single flat lookup.
- `TaxQuoteRequest.items[].taxCategoryId` (already present in the port!) becomes the resolver's match key — **no port contract change needed**, the field is already there and just unused today.
- `getTaxSettings()`'s `applyDiscountBeforeTax`/`applyTaxToShipping` become the first two entries in a proper per-jurisdiction tax policy, extensible later for sourcing rules.

### 3.4 Promotion Integration Detail

`PromotionPromotionQuoteAdapter` calls `promotionEvaluationService.evaluate()`.
**Change required (inside `modules/promotion`):**

- `PromotionEvaluationService` adopts resolver (find all matching `Promotion`s via the now-wired `conditions` field) + stacking (`Stackability` enum instead of binary `stackable`) + calculators (add `TieredDiscount`/`FreeGift`).
- `PromotionQuoteResult.appliedPromotions[]` already returns a list (not a single value) — the port **already assumes multiple promotions can apply**, it's the service behind it that currently only evaluates one. This is the clearest "just needs the engine wired in" case in the whole plan.

### 3.5 Shipping Integration Detail

`ShippingShippingQuoteAdapter` calls `CalculateShippingRatesUseCase`.
**Change required (inside `modules/shipping`):**

- Consolidate `ShippingRate` + `ShippingMethod` (noted as duplicated in gap-analysis) into one resolver-driven calculation behind this use case.
- Add surcharge calculators; `ShippingOption.amount` becomes `baseRate + Σ(surcharges)`.
- `ShippingQuoteRequest.totalWeight`/`totalValue` (already in the port) feed the new dimensional-weight and free-shipping-threshold logic — again, no port change, just richer logic behind it.

### 3.6 Gaps in the Integration Seam Itself

1. **No `FraudEvaluationPort` on checkout.** Fraud screening currently isn't part of the checkout ports list at all — `CreatePaymentIntent`/`CompleteCheckout` should gain a `FraudScreeningPort` (mirroring the other ports) so the fraud rule-evaluation engine (gap-analysis §3.5) has a defined integration point before payment authorization.
2. **No `LoyaltyAccrualPort`.** Points are presumably awarded post-order via an event handler (`checkout/application/eventHandlers.ts` — verify), not through a dedicated port. Once loyalty gains tier/expiration logic, consider a `LoyaltyQuotePort` (preview points-to-be-earned, shown at checkout) and confirm accrual happens via a domain event after `CompleteCheckout`, which is likely the right pattern already — don't force it through a synchronous port unnecessarily.
3. **No `ComplianceScreeningPort`.** If the Phase 4 trade-compliance module (age-gating, embargoed countries, export control) is ever built, it needs a checkout-time port (likely invoked at the same point as `StockAvailabilityPort`, before payment) to block/flag prohibited orders.
4. **No `ReturnsQuotePort`** — not needed at checkout time, but once the returns rule engine exists, `modules/returns` should expose a preview (e.g. "this order is returnable until <date>, restocking fee <x>%") — could be surfaced post-purchase via order confirmation rather than during checkout.

### 3.7 Testing Strategy

- Each ACL adapter already has a matching `.test.ts` (confirmed: `TaxTaxQuoteAdapter.test.ts`, `PromotionPromotionQuoteAdapter.test.ts`, etc.) — extend these with new fixtures once the underlying engines change, keeping the port contracts (and therefore these tests' shape) stable.
- Add new unit tests inside each module (`modules/tax`, `modules/promotion`, `modules/shipping`) for the resolver/stacking/calculator logic itself, following the rule-engine's own test patterns (100% branch coverage per calculator).
- Add one integration test per checkout flow step verifying the full sequence in §3.2 produces the expected final total for a multi-rule scenario (e.g. stacked promotion + tiered tax + surcharge shipping).

---

## 4. Summary of Concrete Next Steps

1. Build the shared **condition-builder EJS partial** and retrofit `automationController`'s views to use it (proves it out on a domain that already has the JSON shape).
2. Wire the **Price Rules admin UI** (currently a non-functional stub) — quick win, high visibility.
3. Un-comment and wire **shipping rate `conditions`/`rateMatrix`** fields already present in the use case signature.
4. Port promotion's resolver+stacking behind `PromotionEvaluationService` — the checkout port (`PromotionQuoteResult.appliedPromotions[]`) already supports multiple results, so this is a pure backend change with no port/adapter contract change.
5. Add `FraudScreeningPort` to checkout ports once the fraud evaluation engine (gap-analysis §3.5) exists.
6. Add the **Promotion/Fraud "Preview" panels** in admin — the single highest-leverage UX addition, since it makes the resolver+stacking logic visible/debuggable to merchants without requiring them to understand the underlying rule model.
