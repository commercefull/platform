# Rule-Engine vs Platform — Domain Gap Analysis & Extension Plan

**Date:** 2026-09-12
**Compared repos:**

- `~/work/n17foo/rule-engine` (10 standalone `@rule-engine/*` packages, 1,836 tests, 100% coverage, production-ready)
- `~/work/commercefull/platform` (`modules/*`, DDD monorepo, web + business + customer APIs)

## 1. Executive Summary

The `rule-engine` monorepo implements **declarative, policy-driven calculation engines** for 10 e-commerce domains (tax, tax-exemption, promotion, loyalty, fraud, returns, shipping, pricing, compliance, inventory-allocation). Every engine follows an identical, mature layered architecture:

```
model/       — enums, Money, AttributeCondition, RuleDefinition, transaction/cart entities, Result types
calculation/ — Strategy-pattern calculators/screeners, eligibility matcher, stacking resolver, rounding
rates/       — resolver (scope + date + condition matching, "most specific wins")
policy/      — per channel/region/jurisdiction policy registry (caps, defaults, allowed types)
engine/      — Template Method (CalculationTemplate), StandardCalculation, Orchestrator
examples/    — worked-examples.ts
docs/        — ARCHITECTURE.md
```

The `commercefull/platform` has a **module per domain** (`modules/tax`, `modules/promotion`, `modules/loyalty`, `modules/returns`, `modules/shipping`, `modules/pricing`, `modules/inventory`, `modules/compliance`, fraud embedded in `modules/payment`) following DDD (`domain/entities`, `domain/repositories`, `application/useCases`, `infrastructure/repositories`, `interface/controllers`). These modules are **CRUD/state-machine-oriented persistence layers** with some domain logic on the entity (e.g. `Promotion.calculateDiscount()`, `TaxRate.calculateTax()`), but they **lack the declarative rule-resolution machinery** the rule-engine packages provide: no `AttributeCondition` eligibility matching, no rule resolver ("most specific wins"), no policy layer, no stacking resolution, no rounding-mode strategy, no Strategy-pattern calculators for rule _types_.

**Bottom line:** the rule-engine packages are architecturally "higher class" — they are general-purpose calculation kernels that can evaluate _many_ rule definitions against a transaction and produce an auditable, itemized result. The platform modules today mostly evaluate a _single_ entity's own logic (one `PriceRule`, one `Promotion`) rather than resolving/stacking _many_ competing rule definitions declaratively. This is the central gap across every domain.

---

## 2. Architecture Pattern Comparison

| Layer                    | rule-engine                                                                                                                                             | platform                                                                                                                                    | Gap                                                                                                            |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Rule definition          | `XxxRuleDefinition` with `conditions: AttributeCondition[]`, `stackability`, `effectiveFrom/To`, typed numeric params per rule `type`                   | Single aggregate entity (`Promotion`, `PriceRule`, `TaxRate`) with fixed fields, no declarative condition list                              | **High** — platform can't express "apply this rule only if attribute X eq Y AND quantity gte 10" declaratively |
| Eligibility / conditions | `AttributeCondition` with operators `eq,neq,gt,gte,lt,lte,in` + generic matcher                                                                         | Ad-hoc `if` checks inside entity methods (`isApplicable`, `isApplicable`)                                                                   | **High**                                                                                                       |
| Resolver                 | `rates.ts` — picks best-matching definition(s) by scope + date + "most specific wins" (most conditions matched)                                         | None — application use cases fetch by ID or simple filter, no specificity ranking                                                           | **High**                                                                                                       |
| Policy                   | `policy.ts` — per channel/region/jurisdiction registry of caps/defaults/allowed types                                                                   | None — no configurable per-store/region policy layer for these domains                                                                      | **Medium**                                                                                                     |
| Stacking                 | `stacking.ts` — resolves `NONE / STACKABLE / EXCLUSIVE` across multiple matched rules                                                                   | Only `Promotion.stackable: boolean` (binary), no multi-rule stacking resolution                                                             | **Medium**                                                                                                     |
| Rounding                 | `rounding.ts` — `PerLine` vs `PerInvoice/PerCart/PerShipment` strategies with delta correction                                                          | None — ad-hoc `Math.round`/no rounding-mode concept                                                                                         | **Low-Medium**                                                                                                 |
| Calculators              | Strategy per rule `type` (e.g. `PercentageOff`, `FixedOff`, `TieredPrice`, `MarketSpecific`)                                                            | Single `switch` inside entity method, fewer types                                                                                           | **Medium**                                                                                                     |
| Orchestration            | `engine/orchestrator.ts` + `template.ts` (Template Method) coordinating resolver→eligibility→calculators→stacking→rounding for a whole cart/transaction | `application/useCases/*` — one use case per operation, no unified "calculate for this transaction across all applicable rules" orchestrator | **High**                                                                                                       |
| Money type               | Dedicated `Money` value object (cents + currency, arithmetic-safe)                                                                                      | Plain `number` fields (`value: number`, `discountAmount?: number`) — currency handled ad hoc elsewhere (`libs`)                             | **Medium**                                                                                                     |
| Test coverage            | 100% stmt/branch/func/line across all 10 packages                                                                                                       | Good but partial coverage; no equivalent domain-service test suites for rule resolution (because the resolution logic doesn't exist yet)    | **Medium**                                                                                                     |

---

## 3. Per-Domain Gap Analysis

### 3.1 Tax — `packages/tax-rule-engine` vs `modules/tax`

**rule-engine:** `TaxRateDefinition` supports `AdValorem, SpecificUnit, WeightBased, VolumeBased, Compound, Tiered` base types, `RateClass` (standard/reduced/super-reduced/zero/exempt), `SourcingRule` (destination/origin/place-of-supply), `SpecialScheme` (margin/reverse-charge/flat-rate/import-de-minimis), a `schemes/` layer, per-unit rounding, and multi-condition resolution ("most specific wins" when multiple rate definitions exist for a category).
**platform (`modules/tax`):** `TaxRate` entity supports only `percentage | fixed`, single country/state/postalCodes match, `isCompound` flag (unused compound logic), `priority` field (unused for resolution). Use cases: `CalculateOrderTax`, `CreateTaxRate`, `GetTaxRateForAddress`, `ManageAdminTax`.
**Gaps:**

- No weight/volume-based tax base types (needed for excise taxes on alcohol, fuel, etc.)
- No tiered tax rates (quantity/value brackets)
- No sourcing-rule concept (origin vs destination vs place-of-supply) — important for US sales tax vs EU VAT correctness
- No special schemes (margin scheme, reverse charge for B2B EU, import de-minimis)
- No "most specific wins" resolver when multiple rates could apply to the same category/jurisdiction
- `isCompound` flag exists on the entity but no compound calculation implemented

### 3.2 Tax Exemption — `packages/tax-exemption-engine` vs platform

**rule-engine:** 10 exemption types (resale certificate, diplomatic, nonprofit, VAT reverse charge, agricultural, manufacturing, government, educational, medical, export) each with certificate tracking, expiry, min/max amounts, verdicts (`Exempt/NotExempt/PartiallyExempt/Pending`).
**platform:** **No equivalent module exists.** `modules/tax` has no exemption concept at all — `modules/compliance` and `modules/gdpr` are about data privacy/audit, not tax exemptions.
**Gap: Complete absence.** This is the single largest missing domain.

### 3.3 Promotion — `packages/promotion-rule-engine` vs `modules/promotion`

**rule-engine:** `PromotionDefinition` with 6 types (`Percentage, FixedAmount, BuyXGetYFree, FreeShipping, FreeGift, TieredDiscount`), `DiscountTarget` (line/category/cart/shipping), declarative `conditions: AttributeCondition[]`, `stackability`, usage limits (total + per-customer with tracking maps), 11 convenience rule-builder classes (`BuyOneGetOneFreeRule`, `HappyHour`, `SpendMoreSaveMore`, etc.).
**platform:** `Promotion` entity supports 5 types (`percentage, fixed_amount, buy_x_get_y, free_shipping, bundle`) — close parity on types, but:

- `PromotionCondition` is `{ type: string; value: unknown }` — coarse, not operator-based (`eq/gt/in` etc.), and `calculateDiscount()` never actually evaluates `conditions` (dead field)
- No `FreeGift` type
- No `TieredDiscount` type (only flat percentage/fixed)
- `stackable: boolean` is binary, not `NONE/STACKABLE/EXCLUSIVE` — can't express "exclusive with other promos but stackable with coupons"
- No multi-promotion resolver/stacking across a cart — each `Promotion` is evaluated independently by use cases
- Dead/legacy files present: `modules/promotion/domain/cart.ts`, `category.ts`, `discounts.ts` (all 0 bytes) and `coupon.ts` (Mongoose-style schema object, unused — real coupon logic lives in the separate `modules/coupon` module). These should be removed as part of any refactor.
  **Gaps:** tiered discounts, free-gift, true stacking resolution, declarative conditions actually wired into calculation.

### 3.4 Loyalty — `packages/loyalty-rule-engine` vs `modules/loyalty`

**rule-engine:** `RewardRuleDefinition` with 6 types (`PointsMultiplier, FixedPoints, TieredMultiplier, BonusPoints, CategoryMultiplier, RedemptionDiscount`), 5-tier progression (`Bronze→Diamond`) with `TierProgression` (upgraded/downgraded/maintained), `ExpirationPolicy` (none/fixed-date/rolling-days/end-of-year), per-program scoping.
**platform:** `LoyaltyProgram` entity has `EarnRule` (6 types: purchase/review/referral/birthday/signup/social_share — different axis, event-based not calculation-strategy-based) and `RedemptionRule`. Only `calculatePointsForPurchase()` is implemented; only the `purchase` earn rule type has calculation logic — review/referral/birthday/signup/social_share rules are defined but **never calculated**.
**Gaps:**

- No tier progression tracking/enum (Bronze/Silver/Gold/Platinum/Diamond) — no concept of tiers at all in the platform's loyalty entity
- No expiration policy on earned points
- No category-based point multipliers
- 5 of 6 `EarnRule` types have no calculation implementation (only `purchase` works)
- No declarative conditions for reward eligibility

### 3.5 Fraud — `packages/fraud-rule-engine` vs `modules/payment` (fraud sub-domain)

**rule-engine:** `RiskRuleDefinition` with 8 types (`Scoring, VelocityCheck, Blocklist, AVSCheck, CVVCheck, ManualReview, IPReputation, DeviceFingerprint`), `RiskLevel` (low/medium/high/critical), `ScreeningVerdict` (approved/review/blocked), full velocity-window and blocklist-attribute matching logic, AVS result enum.
**platform:** `fraudRepo.ts` has good **data models** (`FraudRule`, `FraudCheck`, `FraudBlacklist`) with `RuleType` (velocity/amount/location/device/pattern/blacklist/custom — 7 types, decent parity) and `RiskLevel` (low/medium/high/critical — matches!). `FraudCheck` even stores AVS/VPN/Tor/chargeback signals. **However:** this is purely a **persistence layer** — `fraudRepo.ts` has no calculation/scoring engine. There is no code that actually runs `conditions: Record<string, unknown>` against a transaction to compute `riskScore`; rules are stored but never _evaluated_. The "runFraudCheck" concept exists as a DB method name but the scoring math itself isn't implemented in the codebase you reviewed (repo/port layer only, `FraudRepository` port methods return `unknown`).
**Gaps:**

- No rule _evaluation_ engine — `conditions` are opaque JSON, never matched against a real transaction via typed operators
- No velocity-window calculator (time-boxed transaction counting)
- No blocklist-attribute generic matcher (attribute-driven, not hardcoded per type)
- No device-fingerprint trust scoring calculator
- `FraudRepository` port is fully untyped (`Promise<unknown>` everywhere) — should be tightened to match `fraudRepo.ts`'s real types

### 3.6 Returns — `packages/returns-rule-engine` vs `modules/returns`

**rule-engine:** `ReturnRuleDefinition` with 6 types (`ReturnWindow, RestockingFee, ShippingCost, AutoApprove, RefundMethod, ManualReview`), `ShippingCostMode` (free/customer-pays/split), auto-approve threshold, allowed refund methods, item-condition + return-reason restriction lists.
**platform:** `ReturnRequest` is a **state-machine entity** (`requested→approved→inTransit→received→inspected→completed`, with `cancelled/denied` terminal states) with `ReturnItem` tracking condition/reason/refund amount per line, `StoreCredit` entity. This is solid for _workflow_, but has **zero rule-based decisioning**:
**Gaps:**

- No return-window enforcement (days-since-purchase deadline check)
- No restocking-fee calculation (currently `refundAmount` is set manually per item, not computed)
- No shipping-cost allocation logic (free/customer-pays/split)
- No auto-approve threshold (`requiresInspection: boolean` is a static flag, not a computed decision)
- No refund-method eligibility rules
- No manual-review trigger conditions (only `requiresInspection` boolean, not condition-driven)

### 3.7 Shipping — `packages/shipping-rule-engine` vs `modules/shipping`

**rule-engine:** `ShippingRateDefinition` with 6 base types (`FlatRate, WeightBased, ZoneBased, DimensionalWeight, Tiered, FreeShipping`), `ServiceLevel` (5 levels incl. `SameDay`), `SurchargeType` (fuel/remote-area/residential/oversize/signature/insurance — 6 surcharge types with dedicated calculators), dimensional-weight divisor support.
**platform:** Has **3 separate rate concepts** which is actually richer in entity count but weaker in calculation: `ShippingRate` (5 calc types: flat/weight/price/quantity/distance — "distance" unused, no dimensional-weight), `ShippingMethod` (basic flat/weight/price-based + carrier/free/pickup), `ShippingZone` (geographic matching — good, has postal-code pattern matching that rule-engine doesn't even have).
**Gaps:**

- No surcharge system at all (fuel, remote-area, residential, oversize, signature, insurance) — real carriers apply these and platform has no fields for it
- No dimensional/volumetric weight calculation (`dimensionalFactor` divisor)
- No `SameDay` service level
- Two overlapping entities (`ShippingRate` + `ShippingMethod`) with duplicated calc-type logic instead of one canonical rate resolver — architectural debt
- No tiered shipping rates by weight/value bracket (rule-engine's `ShippingTier`)

### 3.8 Pricing — `packages/pricing-rule-engine` vs `modules/pricing`

**rule-engine:** `PriceRuleDefinition` with 6 types (`ListPrice, PercentageOff, FixedOff, TieredPrice, MarketSpecific, MAPEnforced`), `CustomerSegment` (5 segments incl. Wholesale/VIP/Employee), per-market pricing + currency conversion, MAP (minimum advertised price) compliance enforcement, locale-aware rounding.
**platform:** Actually has **two overlapping pricing-rule concepts** — `PriceRule` entity (5 types: fixed/percentage/tiered/volume/time_based) and a separate `pricingRule.ts` file defining a _different_, more elaborate `PricingRule` interface (7 types incl. `BUNDLE, DYNAMIC, CONTRACT, CURRENCY_CONVERSION`, plus `PricingResult` with `appliedRules[]` impact tracking — this is actually **closer** to rule-engine's sophistication than the `PriceRule` entity is). This duplication itself is a gap (two competing pricing-rule models in the same module).
**Gaps:**

- No MAP (minimum advertised price) enforcement type
- `CustomerSegment` exists in rule-engine (Wholesale/Retail/VIP/Employee) but platform's segmentation is via generic `customerGroupIds: string[]` — less structured, fine functionally but no built-in segment taxonomy
- Two parallel pricing-rule models (`PriceRule` entity vs `pricingRule.ts` `PricingRule` interface) should be reconciled — likely `pricingRule.ts`'s richer model should absorb/replace the entity, or vice-versa
- No locale-aware rounding modes (`PerLine` vs `PerInvoice`)

### 3.9 Compliance — `packages/compliance-rule-engine` vs `modules/compliance` / `modules/gdpr`

**rule-engine:** `RestrictionRuleDefinition` — **product/trade compliance**: `AgeGated, RestrictedIngredient, EmbargoedCountry, CustomsClassification, ExportControl, ProductBan, QuantityLimit` with `ComplianceVerdict` (permitted/restricted/prohibited/requires-review) and `ScreeningResult` (cleared/flagged/blocked).
**platform:** `modules/compliance` is entirely about **data-privacy/audit compliance** — `AuditLog`, `CcpaDataSubjectRequest`, `KeyRotationPolicy`. `modules/gdpr` similarly covers data-subject rights, consent, erasure.
**Gap: Complete absence of product/trade compliance domain.** There is no age-gating, no embargoed-country screening, no HS-code customs classification, no export-control/sanctioned-party screening, no per-jurisdiction product bans, anywhere in the platform. This is a **naming collision, not a functional overlap** — "compliance" means something entirely different in each codebase. If the platform needs to sell age-restricted, hazardous, or export-controlled goods, this entire domain needs to be built from scratch (possibly as a new module, e.g. `modules/tradeCompliance`, to avoid clashing with the existing GDPR-flavored `modules/compliance`).

### 3.10 Inventory Allocation — `packages/inventory-rule-engine` vs `modules/inventory`

**rule-engine:** `AllocationRuleDefinition` — **allocation decisioning**: `ChannelPriority, WarehouseRouting, SafetyStock, Backorder, PreOrder, RegionalAvailability, FirstAvailable` base types, `BackorderPolicy` (allowed/not-allowed/conditional), per-channel priority ordering, allowed-warehouse lists, restricted-region lists.
**platform:** `modules/inventory` is a **strong per-location stock ledger**: `InventoryItem`/`Inventory` aggregate with `restock/sell/reserve/releaseReservation/fulfillReservation/adjust`, low-stock/reorder thresholds, `InventoryTransfer` between locations, `StoreDispatch`. This is genuinely more mature than rule-engine's `InventoryItem` (which is just a flat allocation-request line, no lifecycle methods) **for stock ledger purposes**.
**Gaps (allocation decisioning only, not stock tracking):**

- No channel-priority allocation ordering when multiple channels compete for the same limited stock
- No warehouse-routing rule (nearest/best warehouse selection algorithm)
- No formal backorder policy enum (allowed/not-allowed/conditional) — likely handled ad hoc elsewhere or not at all
- No pre-order eligibility rules (`isPreOrderable`/`releaseDate` fields don't exist on `InventoryItem`)
- No regional-availability restriction list

---

## 4. Cross-Cutting Gaps (apply to all domains)

1. **No `AttributeCondition` / declarative eligibility system.** Every rule-engine package uses the same `{ attribute, operator: eq|neq|gt|gte|lt|lte|in, value }[]` shape and a shared matcher. The platform re-implements ad-hoc boolean checks per entity. **Recommendation:** build one shared `libs/rules/conditions.ts` with `AttributeCondition` + `matchesConditions()` and adopt it incrementally in promotion, pricing, loyalty, shipping.
2. **No rule resolver ("most specific wins").** rule-engine's `rates.ts` picks the best-matching definition when multiple could apply (e.g. UK VAT has ~6 candidate definitions for "food"; the one with the most matching conditions wins). Platform use cases fetch a single rate/rule by ID/simple filter — there's no generalized resolver.
3. **No stacking resolution.** `Stackability` (`None/Stackable/Exclusive`) as a first-class concept across multiple _simultaneously matched_ rules doesn't exist; platform's closest analogue is a single boolean on `Promotion`.
4. **No rounding-mode strategy.** rule-engine's `PerLine` vs `PerInvoice/PerCart/PerShipment` rounding with delta-correction (ensures sum-of-parts equals the rounded total) has no equivalent; platform likely rounds inconsistently line-by-line.
5. **No policy layer.** rule-engine's per-channel/region/jurisdiction `PolicyRegistry` (caps, defaults, allowed rule types) doesn't exist — platform's equivalent configuration is scattered (`organizationId`/`storeId` filters) without a unified policy abstraction.
6. **Money as a value object.** rule-engine has a dedicated `Money` type (cents + currency with safe arithmetic) used everywhere; platform uses plain `number` for prices/discounts, pushing currency-safety concerns elsewhere (`libs/`).
7. **No orchestrator/template-method for "calculate this whole cart/transaction."** Each platform use case handles one concern; there's no single entry point that runs resolver→eligibility→calculators→stacking→rounding for an entire transaction the way rule-engine's `engine/orchestrator.ts` does.
8. **Dead/legacy code found during this review** (should be cleaned up regardless of the rule-engine work): `modules/promotion/domain/cart.ts`, `category.ts`, `discounts.ts` (0 bytes), `modules/promotion/domain/coupon.ts` (unused Mongoose-style schema — real coupons live in `modules/coupon`).

---

## 5. Extension Plan (Phased, by ROI)

### Phase 1 — Shared Foundation (unblocks every domain)

1. `libs/rules/conditions.ts` — port `AttributeCondition` + `ConditionOperator` + generic matcher from rule-engine.
2. `libs/rules/money.ts` — evaluate replacing scattered `number` price fields with a shared `Money` value object (cents + currency), or at minimum a arithmetic helper module if a full type migration is too invasive.
3. `libs/rules/rounding.ts` — `RoundingMode` (`PerLine`/`PerTotal`) with delta-correction helper.
4. `libs/rules/stacking.ts` — generic `Stackability` resolver given a list of matched rule results.
5. `libs/rules/resolver.ts` — generic "most specific wins" resolver over any `{ conditions, effectiveFrom, effectiveTo }[]`.

### Phase 2 — Highest-ROI Domain Gaps (biggest functional/business impact)

1. **Tax exemptions** (net-new module `modules/taxExemption` or extend `modules/tax`) — B2B/nonprofit/government customers are common; missing this blocks legitimate sales.
2. **Fraud rule evaluation engine** — data model already exists (`fraudRepo.ts`); wire in condition-matching + velocity/blocklist/AVS calculators from `fraud-rule-engine` as the missing "evaluate" step. High security ROI.
3. **Returns rule engine** (return window, restocking fee, auto-approve threshold, shipping-cost allocation) — directly reduces manual CS workload; `ReturnRequest` state machine is a solid foundation to plug calculators into.
4. **Promotion stacking + tiered/free-gift types** — direct revenue/marketing impact; conditions field already exists but is dead — wiring it in is incremental, not a rewrite.

### Phase 3 — Medium-ROI Structural Fixes

1. Reconcile the two competing pricing-rule models (`modules/pricing/domain/entities/PriceRule.ts` vs `modules/pricing/domain/pricingRule.ts`) into one, adopting the richer `pricingRule.ts` shape (MAP enforcement, market/currency, `PricingResult.appliedRules[]` impact tracking) as the target.
2. Add shipping surcharges (fuel/remote-area/residential/oversize/signature/insurance) and dimensional-weight calculation to `modules/shipping`.
3. Add loyalty tier progression (`LoyaltyTier` enum + upgrade/downgrade logic) and point expiration policy; implement calculators for the 5 currently-dead `EarnRule` types.
4. Add inventory allocation rules (channel priority, warehouse routing, backorder policy, pre-order eligibility, regional availability) as a decisioning layer on top of the existing solid stock ledger.

### Phase 4 — New Domain (only if the business needs it)

1. **Trade/product compliance** (age-gating, embargoed countries, export control, customs HS codes, product bans, quantity limits) — build as a new module (e.g. `modules/tradeCompliance`) since `modules/compliance` is already taken by GDPR/privacy compliance. Only prioritize if the platform sells age-restricted, hazardous, or internationally-controlled goods.

### Cleanup (do anytime, low risk)

- Remove dead files: `modules/promotion/domain/cart.ts`, `category.ts`, `discounts.ts`, `coupon.ts`.
- Tighten `FraudRepository` port (`domain/repositories/FraudRepository.ts`) away from `Promise<unknown>` to the real types already defined in `fraudRepo.ts`.

---

## 6. Summary Table

| Domain               | Platform Module                                | rule-engine Package      | Verdict                                                                     |
| -------------------- | ---------------------------------------------- | ------------------------ | --------------------------------------------------------------------------- |
| Tax                  | `modules/tax`                                  | `tax-rule-engine`        | Platform: basic parity, missing base types/sourcing/schemes                 |
| Tax Exemption        | _(none)_                                       | `tax-exemption-engine`   | **Missing entirely**                                                        |
| Promotion            | `modules/promotion` (+ `modules/coupon`)       | `promotion-rule-engine`  | Platform: good type parity, no stacking/resolver, dead conditions field     |
| Loyalty              | `modules/loyalty`                              | `loyalty-rule-engine`    | Platform: earn-event model instead of calculation-strategy model, no tiers  |
| Fraud                | `modules/payment` (fraud sub-domain)           | `fraud-rule-engine`      | Platform: good data model, **no evaluation engine**                         |
| Returns              | `modules/returns`                              | `returns-rule-engine`    | Platform: excellent workflow/state-machine, **zero rule-based decisioning** |
| Shipping             | `modules/shipping`                             | `shipping-rule-engine`   | Platform: more entities but no surcharges/dim-weight, duplicated calc logic |
| Pricing              | `modules/pricing`                              | `pricing-rule-engine`    | Platform: two competing models, no MAP enforcement                          |
| Compliance (trade)   | _(none — `modules/compliance` = privacy only)_ | `compliance-rule-engine` | **Missing entirely** (naming collision with GDPR compliance)                |
| Inventory Allocation | `modules/inventory`                            | `inventory-rule-engine`  | Platform: superior stock ledger, **no allocation-decisioning layer**        |

**Overall:** the rule-engine packages are more mature specifically in _rule resolution/calculation_ mechanics; the platform is more mature in _persistence, workflow state machines, and multi-tenancy_. The two are complementary — the extension plan above focuses on porting the rule-engine's calculation patterns into the platform's existing, solid persistence/workflow layers rather than replacing them.
