# Regional Commerce Rollout — Status

**Status date:** 2026-10-02  
**Overall status:** Complete — the platform now supports the target multi-country, multi-channel commerce setup end to end, verified against a seeded enterprise configuration.

## What the platform supports

A single organization can now operate:

- **Multiple regional stores** — several US stores, a UK store, and multiple EU stores, each configured as physical, digital, or hybrid.
- **Multiple sales channels per store** — website, Facebook Shop, Google Shopping, POS, API integrations, and agentic commerce surfaces, each with its own settings and store assignments.
- **Channel-aware commerce** — prices, promotions, coupons, memberships, assortments, collections, content, and themes can all be targeted per store and per sales channel.
- **Regional pricing and currencies** — USD for US stores, GBP for the UK store, EUR for EU stores, with secondary currency support.
- **Flexible fulfillment** — store-linked warehouses for physical goods, unlimited or non-inventory-tracked digital goods, and backorderable products.
- **Regional tax handling** — US destination sales tax with nexus gating and exemptions, UK/EU VAT with inclusive pricing, and B2B reverse charge for VAT-registered buyers.
- **Localized experiences** — per-store and per-channel locales, translated page slugs and content, and channel-specific themes.
- **Reliable checkout** — prices, promotions, tax, and inventory are re-verified authoritatively at the payment step, with safe retry behavior throughout.

## Delivered capabilities

### Multi-store, multi-channel foundation

- Stores are owned by the organization and carry their own currency, locale, tax display mode (tax-exclusive for US, tax-inclusive for UK/EU), warehouses, and fulfillment modality.
- Sales channels are defined once per organization and assigned to stores. Every basket, order, subscription, and analytics event records which store and channel it came through.
- The storefront, customer APIs, business APIs, and agentic surfaces all resolve the same store/channel context, so behavior is consistent across every entry point.
- An admin UI manages channels per store, plus dedicated business APIs for organization-wide channel management.

### Channel-aware merchandising

- **Assortments**: each store controls which products, collections, and categories it sells, optionally scoped to a specific channel. Storefront listings, search, product pages, basket validation, feeds, and agentic sessions all enforce the same sellability rules.
- **Collections**: per-store and per-channel publication with independent merchandising order; unpublished-scope collections stay globally visible.
- **Content and page builder**: pages, navigation, and content blocks can be scoped to stores and channels; publication state is managed per store/channel/locale; translated slugs resolve per locale; channel-level theme overrides apply before store and default themes.

### Pricing, promotions, and benefits

- Pricing rules evaluate store, channel, country, currency, cart total, item quantity, product category, customer group, and customer tier — with an admin editor to manage them.
- Promotions can be conditioned on store, channel, country, and currency. Coupons linked to a promotion inherit its targeting; membership benefits can be scoped to stores, channels, countries, and currencies.
- Loyalty points can be redeemed directly in checkout: the reward is applied to the session total, points are debited once when payment is initiated, and restored if the order is cancelled.
- Prices are never trusted from the client — every basket line is re-quoted authoritatively at the payment step, and the customer-facing response flags when a price changed so a confirmation can be shown before charging.

### Inventory and fulfillment

- Variants carry an explicit inventory policy: **tracked**, **unlimited** (digital goods remain purchasable at zero stock), or **backorderable** (sells below zero). Admins can set the policy per variant in the product editor.
- Physical stock is reserved at checkout against the store's best-stocked warehouse location, held under an atomic lock that prevents overselling under concurrent checkout, and released automatically on abandonment, payment failure, cancellation, or expiry.
- Reservations link back to individual order lines, and retries can never double-reserve or leak stock.
- Digital-only orders skip fulfillment entirely; pickup checks skip digital and unlimited items.
- Availability shown to customers comes from the inventory module rather than stale catalog projections.

### Tax and compliance

- **US**: destination sales tax with organization-configured nexus — states without nexus coverage quote no tax; category exemptions, partial exemptions, and shipping taxability are supported.
- **UK/EU**: VAT with tax-inclusive display, per-country customer VAT ID format validation, and seller VAT registrations.
- **B2B reverse charge**: a validated EU VAT ID on an eligible cross-border order zeroes the tax and marks the order as reverse charge — the customer self-accounts VAT. Orders and checkout responses carry the VAT number and flag.
- Zone resolution prefers the most specific matching tax zone, fixing a real bug where a broad rateless zone could silently zero a quote.

### Localization

- Stores and channel assignments carry a default locale (`en-US`, `en-GB`, `de-DE`, `fr-FR` seeded); German and French storefront translations are at full key parity with English.
- Translated page slugs resolve correctly per locale.

### Subscriptions and memberships

- Subscription checkout runs through the same store/channel/tax/pricing context as regular checkout, including VAT handling and reverse charge, instead of skipping tax.
- Membership tiers and benefits apply in checkout with channel/store scoping.

### Analytics and reporting

- Every analytics event, daily sales rollup, and product performance rollup carries structured sales-channel attribution, filterable through the business reporting APIs.
- Rollup upserts merge correctly even when organization or variant keys are absent — a real double-counting bug was found and fixed.

### Agentic commerce

- Agentic integrations (e.g., ChatGPT) reference a store plus a sales channel, so agent orders get correct attribution, catalog scoping, pricing, and inventory without requiring a separate store per surface.

### Checkout reliability

- Payment retries resume on the already-created order instead of duplicating it; payment intents dedupe per order; coupon redemptions, loyalty debits, stock reservations, and webhook deliveries are all idempotent.
- Verified live: 10 parallel reservations against 5 units yield exactly 5 reservations and zero oversell.

## Seeded enterprise configuration

The platform ships a representative enterprise seed exercising the full setup:

- **Stores**: US New York (hybrid), US California (physical), US digital, UK (hybrid), Germany (hybrid), France (hybrid).
- **Channels**: website (default storefront), Facebook Shop, Google Shopping, POS for physical stores, agentic commerce.
- **Currencies**: USD/GBP/EUR defaults with secondary memberships.
- **Warehouses**: regional fulfillment centers for physical/hybrid stores; the digital store intentionally has none.
- **Tax**: NY/CA destination sales tax, Delaware zero-tax, UK/DE/FR VAT rates, US-state and EU-country nexus records, DE/FR/OSS/GB VAT registrations.
- **Offers**: scoped promotions for US Facebook (USD), UK website (GBP), and EU Google Shopping (EUR).

## Verification

| Check                | Result                                                                |
| -------------------- | --------------------------------------------------------------------- |
| Unit tests           | 756 suites / 5,020 tests pass                                         |
| Integration tests    | 176 suites / 2,248 tests pass on a freshly seeded scratch database    |
| Storefront tests     | 8 suites / 161 tests pass                                             |
| Lint & architecture  | 0 errors — typecheck, ESLint, dependency rules, SQL schema all clean  |
| Migration smoke test | 296 migrations + full seed suite applied cleanly; 290 tables verified |
| Production build     | Bundles emit cleanly                                                  |

Schema consistency: all channel-related columns and foreign keys are declared
in each table's original `CREATE TABLE` migration (the platform is
pre-production, so no ALTER-based upgrade path is required), keeping the
initial schema readable and the migration history linear.

## Remaining work

Items deliberately left for follow-up, none blocking the rollout:

- **Tax depth**: replace representative seed rates with a maintained provider; US tax holidays; OSS/IOSS threshold enforcement; VIES live VAT validation; invoice rendering with VAT lines.
- **Pricing precedence**: deterministic ordering across base, currency, channel, customer, tier, membership, loyalty, and promotion adjustments.
- **Discount interaction**: prevent double-discounting between pricing benefits and checkout promotions; persist benefit attribution on order discounts.
- **Admin surfaces**: dedicated channel list/edit views (beyond per-store assignment), regional store setup wizard, pagebuilder channel/locale fields, richer report views.
- **Testing**: mixed physical/digital baskets with split fulfillment, cross-organization authorization rejection, multi-basket-per-customer coverage, seeded end-to-end browse-to-order flows, DE/FR storefront resolution.
- **Agentic checkout**: outbound order/fulfillment status webhooks, full inventory-parity, and UCP/MCP protocol bindings if still in scope.
- **Loyalty**: program-level scoping beyond the current program-agnostic points model.
- **Final review**: architecture and security review of the complete diff before production release.
