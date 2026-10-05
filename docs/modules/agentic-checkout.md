# Agentic Checkout

> **Status**: Implemented (ACP core). `modules/agentic-checkout/` exposes Commercefull checkouts to AI agents and commerce surfaces via the Agentic Commerce Protocol (ACP). Feed generation, all five session endpoints, channel auth, idempotency, and delegated payment are live at `/acp`. Still deferred: UCP, MCP bindings, outbound order-status webhooks.

## Overview

Commerce surfaces are moving off the merchant's website: ChatGPT, Meta, and Google AI Mode all let a shopper complete a purchase without visiting the storefront. In every case the shape is the same:

1. The merchant publishes a **product feed** to the surface.
2. The surface calls the merchant's **checkout API** to quote price, tax, shipping, and availability.
3. Payment is collected on the surface and passed to the merchant as a **delegated token** (e.g. a Stripe Shared Payment Token) — the merchant never sees card data.
4. An order lands in the merchant's admin tagged with its channel. The merchant stays **merchant of record** and handles fulfillment, returns, and support.

This module implements the merchant side of that exchange. `modules/checkout` is already a headless state machine over REST with guest support, while `modules/store` owns the reusable sales-channel registry and store-channel assignments. This module is therefore a thin **protocol adapter**, not a second checkout or a duplicate channel registry.

### Standards this targets

| Standard        | Owner                    | Relevance                                                                                        |
| --------------- | ------------------------ | ------------------------------------------------------------------------------------------------ |
| ACP             | OpenAI + Stripe (+ Meta) | Primary target. Latest stable spec `2026-04-17`. Powers ChatGPT commerce; Meta co-authors it.    |
| UCP             | Google + Shopify         | Secondary. Native checkout = 3 REST endpoints similar to ACP sessions. Requires Google approval. |
| ACP MCP binding | ACP `2026-04-17`         | Exposes the same checkout endpoints as MCP tools for agent runtimes.                             |

Surfaces churn (OpenAI's Instant Checkout UI was retired March 2026 while the spec kept shipping), so the module is organized around **protocols**, not vendors: channel config is data, not code.

---

## Architecture

```
modules/agentic-checkout/
├── interface/
│   ├── routers/agenticCheckoutRouter.ts      # POST /acp/checkout_sessions etc.
│   ├── controllers/AgenticCheckoutController.ts
│   └── middleware/channelAuth.ts             # Bearer key + Signature/Timestamp verification
├── application/
│   ├── useCases/                             # CreateChannelSession, GetChannelSession,
│   │                                         # UpdateChannelSession, CompleteChannelSession,
│   │                                         # CancelChannelSession, GenerateProductFeed
│   ├── ports/                                # ACL ports owned by this module
│   │   ├── ChannelResolverPort.ts            # → integration credentials → channel context
│   │   ├── ChannelCatalogPort.ts             # → assortment ResolveStoreCatalog
│   │   ├── ChannelCheckoutPort.ts            # → basket + checkout use cases
│   │   └── DelegatedPaymentPort.ts           # → payment ChargeDelegatedPayment
│   └── services/
│       └── CheckoutSessionTranslator.ts      # ACP schema ↔ internal checkout state
├── infrastructure/
│   ├── repositories/                         # ChannelSessionRepository, IdempotencyRepository impls
│   ├── acl/                                  # IntegrationChannelResolverAdapter,
│   │                                         # AssortmentChannelCatalogAdapter,
│   │                                         # CheckoutChannelAdapter,
│   │                                         # PaymentDelegatedPaymentAdapter
│   └── compositionRoot.ts                    # wires adapters to ports
└── domain/
    ├── entities/
    │   ├── ChannelSession.ts                 # session ↔ checkoutId + basketId + storeId,
    │   │                                     # buyer, fulfillmentDetails, attribution, status
    │   └── IdempotencyRecord.ts              # key → request hash + stored response
    ├── repositories/                         # ChannelSessionRepository, IdempotencyRepository (ports)
    └── errors/AgenticCheckoutErrors.ts
```

Idempotency is enforced by `interface/middleware/idempotency.ts` (persisted `IdempotencyRecord` with 409 in-flight / 422 payload-conflict semantics) rather than a separate service; feed serialization lives inside `GenerateProductFeed` (ACP `openapi.feed.yaml` shape).

- **`modules/store` owns channels**: each agentic surface is an organization-owned `salesChannel` of type `agentic`, assigned to one or more stores through `storeSalesChannel`. The integration config carries both `storeId` and `salesChannelId`. Stores retain their physical/digital/hybrid fulfillment modality, and a single store may support ChatGPT, Meta, Google, website, and POS channels concurrently.
- **`modules/integration` keeps its job**: per-org channel connection config and encrypted credentials (API keys, signing secrets, PSP tokens) live there as `provider: 'acp' | 'ucp' | 'meta'` integrations, each pointing at the store that represents the surface. This module reads them; it does not duplicate credential storage.
- **`modules/webhook` keeps its job**: outbound `order.*` / `fulfillment.*` notifications to the surface reuse the existing HMAC + retry + delivery-tracking pipeline.
- No business logic is duplicated — all price/tax/inventory/order behavior stays in the owning modules, reached through the ports above.

---

## API Surface (ACP `2026-04-17`)

Mounted public but authenticated at `/acp` (the merchant publishes this base URL in its ACP profile). Not under `/customer` — that surface is user-authenticated; this is machine-to-machine.

| ACP Operation             | Method | Endpoint                              | Purpose                                                                             |
| ------------------------- | ------ | ------------------------------------- | ----------------------------------------------------------------------------------- |
| `createCheckoutSession`   | POST   | `/acp/checkout_sessions`              | Create session from `{items, buyer?, fulfillment_details?, affiliate_attribution?}` |
| `getCheckoutSession`      | GET    | `/acp/checkout_sessions/:id`          | Return authoritative cart state                                                     |
| `updateCheckoutSession`   | POST   | `/acp/checkout_sessions/:id`          | Apply items/address/fulfillment-option changes                                      |
| `completeCheckoutSession` | POST   | `/acp/checkout_sessions/:id/complete` | Apply `payment_data`, create order                                                  |
| `cancelCheckoutSession`   | POST   | `/acp/checkout_sessions/:id/cancel`   | Cancel session, release stock                                                       |

### ACP spec coverage

The `2026-04-17` release ships six OpenAPI specs. Full coverage map:

| Spec file                               | What it defines                                | Module piece                                                              |
| --------------------------------------- | ---------------------------------------------- | ------------------------------------------------------------------------- |
| `openapi.agentic_checkout.yaml`         | The five session endpoints above               | `AgenticCheckoutController` + session use cases                           |
| `openapi.feed.yaml`                     | Product feed schema + delivery                 | `GenerateProductFeed` + `infrastructure/feeds/` serializers               |
| `openapi.agentic_checkout_webhook.yaml` | Order-status webhooks merchant → surface       | `modules/webhook` dispatch with ACP payload shape                         |
| `openapi.delegate_payment.yaml`         | Delegated payment token exchange               | `DelegatedPaymentPort` → `payment` (Stripe SPT)                           |
| `openapi.delegate_authentication.yaml`  | Buyer identity / account linking (OAuth-style) | Optional phase — answers guest→customer linking via `identity`/`customer` |
| `openapi.cart.yaml`                     | Shared cart capability                         | Optional — only needed by surfaces that render a persistent cart          |

Session responses must also carry `protocol` (version) and `capabilities` objects — the module should declare supported capabilities explicitly rather than hard-code, since the spec negotiates per agent.

### Request/response contract

All endpoints accept `Authorization`, `Request-Id`, `Signature`, `Timestamp`, `API-Version` headers; all POSTs **require `Idempotency-Key`**. Responses echo `Idempotency-Key` and `Request-Id`, and set `Idempotent-Replayed: true` on replays.

```jsonc
// POST /acp/checkout_sessions  → 201
{ "items": [{ "id": "item_123", "quantity": 1 }],
  "fulfillment_details": { "email": "t@example.com",
    "address": { "line_one": "...", "city": "...", "country": "US", "postal_code": "94102" } } }

// POST /acp/checkout_sessions/{id}/complete  → 200
{ "buyer": { "first_name": "John", "last_name": "Smith", "email": "john@mail.com" },
  "payment_data": { "handler_id": "stripe",
    "instrument": { "type": "card",
      "credential": { "type": "spt", "token": "spt_123" } } } }
```

### Status mapping

| Internal `CheckoutStatus`       | ACP `CheckoutSession.status` |
| ------------------------------- | ---------------------------- |
| `active` (fields missing)       | `not_ready_for_payment`      |
| `active` (`isReadyForPayment`)  | `ready_for_payment`          |
| `pending_payment`, `processing` | `complete_in_progress`       |
| `completed`                     | `completed`                  |
| `abandoned`                     | `canceled`                   |
| expired session                 | `expired`                    |

---

## Use-Case Mapping

| ACP Operation                | Commercefull modules used                                                                                                                                                                                                                                                                                 |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Create session               | `basket` `GetOrCreateBasket` + `AddItem` × n (channel basket, `sessionId = acp:<session>`) → `checkout` `InitiateCheckout` with `guestEmail` from `fulfillment_details` → `inventory` availability check per item                                                                                         |
| Get session                  | `checkout` `ManageCheckoutSession.findById` → `CheckoutSessionTranslator` renders ACP `CheckoutSession` schema                                                                                                                                                                                            |
| Update session               | `checkout` `SetShippingAddress` / `SetFulfillmentMethod` / `GetFulfillmentOptions` / `SetShippingMethod` / `ApplyCoupon` — totals recalculated by `tax`, `shipping`, `promotion`, `pricing` as today                                                                                                      |
| Complete                     | delegated credential → session metadata → `checkout` `CreatePaymentIntent` (fraud screening + transaction record) → `payment` `ChargeDelegatedPayment` (routes token via `FailoverRoutingEngine`, marks transaction + order paid) → `CompleteCheckout` → `order` created with `storeId = <channel store>` |
| Cancel                       | `checkout` `AbandonCheckout` → basket released, `inventory` reservations expire as today                                                                                                                                                                                                                  |
| Order status back to surface | `order`/`fulfillment` events → `webhook` module (or `integration` dispatcher) → surface's Orders webhook per `openapi.agentic_checkout_webhook.yaml`                                                                                                                                                      |

Orders already carry `storeId` and `channelId` (both filterable in the business API): `storeId` links the order to the store representing the surface, `channelId` tags it with the surface identifier. `ChannelAttribution` records the _agent/surface_ detail (`affiliate_attribution` first/last touch) alongside it.

---

## Implemented Pieces

| Piece                    | Implementation                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Inbound machine auth** | `interface/middleware/channelAuth.ts` — `Authorization: Bearer` key resolves an `integration` credential (decrypted via `CredentialCrypto`, timing-safe compare) to `{integrationId, organizationId, storeId, surface}`; `Signature`/`Timestamp` HMAC-SHA256 over the raw body when a `webhookSecret` is configured (5-minute freshness window).                                                                                                                                                                                                                                                                                                                                                                                                                         |
| **Idempotency**          | `interface/middleware/idempotency.ts` + `IdempotencyRecord` — `Idempotency-Key` required on POSTs, replayed responses echo the stored body, `422` on payload conflict. `CompleteCheckout` remains idempotent internally; `CompleteChannelSession` also short-circuits on `status: 'completed'`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| **Delegated payment**    | `attachDelegatedPayment` stores `{provider, credentialType, token}` on checkout session metadata → `CreatePaymentIntent` forwards it to `InitiatePayment`. `CompleteChannelSession` then calls `DelegatedPaymentPort` → payment's **`ChargeDelegatedPayment`** use case, which routes the token through `RoutePayment`/`FailoverRoutingEngine` (`paymentMethodToken`), marks the transaction paid, marks the order processing+paid, and emits `order.paid` + `checkout.payment_captured` — the same events the PSP webhook path emits. `StripeAdapter.initiatePayment` now sends `payment_method` + `confirm=true` when a token is present. On failure the transaction is marked `failed`, the channel session reverts to `active` (retryable), and a `402` is returned. |
| **Product feed**         | `GenerateProductFeed` resolves the channel store's assortment via `ResolveStoreCatalog` + product hydration, serializing the ACP feed schema (`id`, `title`, `link`, `image_link`, `price`, `availability`). Served at `GET /acp/feed` under channel auth.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| **Session registry**     | `agenticCheckoutSession` table mapping session id → `integrationId`/`organizationId`/`storeId`/`basketId`/`checkoutId`/`orderId` + buyer, fulfillmentDetails, attribution, status. `agenticCheckoutIdempotencyRecord` for idempotency.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| **Module wiring**        | `manifest.ts` (`name: 'agentic-checkout'`, `requirement: 'optional'`, `dependsOn: ['basket', 'checkout', 'store', 'payment', 'integration', 'assortment']`), registered in `boot/moduleManifests.ts`; router mounted at `/acp` in `boot/routes.ts` with `channelAuth` + `idempotency` middleware. `app.ts` skips JSON parsing for `/acp` so `httpRaw` can preserve the body for signature verification. `libs/errorMiddleware` treats `/acp/` as an API path (RFC 7807 problem+json).                                                                                                                                                                                                                                                                                    |

## What Reuses As-Is

- The entire checkout use-case set (initiate → addresses → fulfillment → payment → complete), including guest checkout and idempotent `CompleteCheckout`.
- `modules/store` — organization sales channels and store assignments, store hierarchy for shared/dedicated inventory, and store-scoped currencies.
- `modules/webhook` — HMAC signing, retry policy with backoff, `FOR UPDATE SKIP LOCKED` claim-based delivery.
- `modules/integration` — encrypted credential storage and per-org provider config for channel secrets.
- `modules/payment` — `FailoverRoutingEngine` + `GatewayAdapterRegistry` give delegated-token support a place to live per gateway.
- `order.storeId` / `order.channelId`, `audit`, and `tracking` for channel attribution and observability.
- Fraud screening (`FraudScreeningPort`) already runs inside `CreatePaymentIntent`, so channel orders are screened identically to storefront orders.

---

## Flow Diagram

```
Surface (ChatGPT/Meta/Google)          Commercefull
─────────────────────────────          ─────────────
feed pull/push        ◄────  GenerateProductFeed (catalog + price + inventory)

POST /acp/checkout_sessions ────► basket.GetOrCreate + AddItem × n
                                 checkout.InitiateCheckout
                            ◄──── { session_id, totals, fulfillment_options }

POST /acp/checkout_sessions/:id ──► SetShippingAddress → GetFulfillmentOptions
  (address / option changes)       → SetShippingMethod   (+ tax/promotion reprice)
                            ◄──── updated authoritative totals

POST .../complete ──────────────► delegated credential → session metadata
  { payment_data.credential }      → CreatePaymentIntent (fraud + transaction)
                                   → ChargeDelegatedPayment (RoutePayment → PSP)
                                   → CompleteCheckout → order (storeId='meta-store')
                            ◄──── { status: 'completed', order }

order.shipped / refunded ───────► eventBus → webhook module → surface Orders API
```

## Events Emitted / Consumed

| Event                                                                                                      | Direction | Purpose                                 |
| ---------------------------------------------------------------------------------------------------------- | --------- | --------------------------------------- |
| `checkout.completed`, `checkout.payment_*`                                                                 | consumed  | attribution + channel session lifecycle |
| `order.paid` / `order.shipped` / `order.refunded` / `order.status_changed`                                 | consumed  | outbound status webhooks to the surface |
| `fulfillment.shipped` / `fulfillment.delivered`                                                            | consumed  | tracking push to surface                |
| `agenticCheckout.session_created` / `agenticCheckout.session_completed` / `agenticCheckout.session_failed` | emitted   | analytics + audit per channel           |

## Phasing

1. ~~**Feeds first**~~ ✅ — `GET /acp/feed` resolves the channel store's assortment into the ACP feed schema.
2. ~~**ACP checkout endpoints + Stripe SPT**~~ ✅ — the five session endpoints, idempotency, channel auth, delegated payment (`ChargeDelegatedPayment` + Stripe SPT token confirmation).
3. **Outbound order webhooks** — ACP `agentic_checkout_webhook` payload shapes through `modules/webhook`. _Not yet implemented._
4. **UCP native path** — same session model, different schema; approval-gated. _Not yet implemented._
5. **MCP binding** — expose the endpoints as MCP tools once core ACP is stable. _Not yet implemented._
6. **Meta** — when/if partner access is granted; ACP-first means this may already be covered.

## Non-Goals

- No storefront UI changes; the surface owns the UX.
- No new payment provider onboarding flow in phase 1 (delegated tokens arrive pre-authorized by the surface's PSP relationship).
- Not a marketplace — no vendor/commission logic (that stays in `modules/marketplace`).

## Open Questions

- Per-surface assortment/price scoping maps naturally onto the store model (dedicated vs. shared catalog/inventory via store hierarchy) — confirm whether surfaces ever need a subset that the store's own assortment can't express.
- Guest order → customer account linking: ACP's `delegate_authentication` spec defines account linking — implement it rather than inventing shadow-customer logic. Until then, orders attach to `guestEmail` like storefront guest checkout.
- Refund initiation direction: ACP pushes refunds merchant→surface; surface-initiated refund requests would need an inbound `POST /acp/orders/:id/refunds`-style endpoint later.

<!-- GENERATED:ENDPOINTS:START -->

| Method | Endpoint                          | Controller                              | Description |
| ------ | --------------------------------- | --------------------------------------- | ----------- |
| POST   | `/checkout_sessions`              | `asyncHandler(createCheckoutSession)`   | —           |
| GET    | `/checkout_sessions/:id`          | `asyncHandler(getCheckoutSession)`      | —           |
| POST   | `/checkout_sessions/:id`          | `asyncHandler(updateCheckoutSession)`   | —           |
| POST   | `/checkout_sessions/:id/cancel`   | `asyncHandler(cancelCheckoutSession)`   | —           |
| POST   | `/checkout_sessions/:id/complete` | `asyncHandler(completeCheckoutSession)` | —           |
| GET    | `/feed`                           | `asyncHandler(getProductFeed)`          | —           |

<!-- GENERATED:ENDPOINTS:END -->
