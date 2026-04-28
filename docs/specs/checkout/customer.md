# Checkout – Customer EARS Requirements

> **System**: CommerceFull – `checkout` module (customer-facing surface)
> **Actor**: Customer (authenticated end-user, or guest with `guestEmail`)
> **Date**: 2026-04-28
> **Source**: `docs/modules/checkout.md`, `modules/checkout/`, `modules/checkout/interface/routers/checkoutRouter.ts`, integration tests at `tests/integration/checkout/checkout.test.ts`

`checkout` is the customer-side aggregate that converts a `basket` into a paid `order`. A `CheckoutSession` carries the items, addresses, shipping method, payment method, coupon, and computed totals while the customer prepares the purchase. The customer-side **"draft order"** is implemented as an `Order` row in `PAYMENT_PENDING` status — created when the customer requests a payment intent, promoted to `PROCESSING` on successful payment capture, or moved to `PAYMENT_FAILED` on failure. There is no `DRAFT` status on `Order` itself; `OrderStatus.PAYMENT_PENDING` plays that role.

---

## Context

A customer initiates a checkout from a non-empty `basket`, then progressively sets shipping address, billing address, shipping method, payment method, and (optionally) a coupon. When the session is *ready for payment*, the customer requests a payment intent — at that moment a draft `Order` is created in `PAYMENT_PENDING` and a gateway payment intent is opened. The customer authorises payment client-side; the gateway webhook then promotes the order to `PROCESSING` (success) or `PAYMENT_FAILED` (failure). `POST /complete` is an idempotent confirmation step that finalises the session once the order is paid. The session can also be abandoned, expire, or fail.

### Actors

| Actor    | Role                                                                                  |
| -------- | ------------------------------------------------------------------------------------- |
| Customer | Authenticated user owning the `basket`/`session`, or guest identified by `guestEmail` |
| System   | Validates basket, computes totals, transitions session state, emits domain events     |

### Checkout status state machine

Source of truth: `modules/checkout/domain/entities/CheckoutSession.ts`.

```ts
type CheckoutStatus =
  'active' | 'pending_payment' | 'processing' | 'completed' | 'abandoned' | 'expired' | 'failed';
type PaymentStatus =
  'pending' | 'authorized' | 'captured' | 'failed' | 'refunded';
```

Permitted transitions (derived from the entity's mutator methods):

| From              | To (allowed)                                   | Trigger                                        |
| ----------------- | ---------------------------------------------- | ---------------------------------------------- |
| `active`          | `pending_payment`, `abandoned`, `expired`      | `POST /payment-intent` (Order created); abandon; TTL |
| `pending_payment` | `processing`, `failed`, `abandoned`            | gateway authorises / fails / customer abandons       |
| `processing`      | `completed`, `failed`                          | gateway captures (success) / capture fails           |
| `completed`       | _(terminal)_                                   |                                                |
| `abandoned`       | _(terminal)_                                   |                                                |
| `expired`         | _(terminal)_                                   |                                                |
| `failed`          | _(terminal — customer must initiate new session)_ |                                            |

### Policy defaults

Source: `CheckoutSession.create` (`@ modules/checkout/domain/entities/CheckoutSession.ts:47-68`).

| Policy                          | Default                                         |
| ------------------------------- | ----------------------------------------------- |
| Session TTL                     | 30 minutes from `createdAt` (extended on resume)|
| Default currency                | `USD` (overridable via `basket.currency`)       |
| Billing address fallback        | `sameAsShipping = true` by default              |
| Existing-session reuse          | `InitiateCheckout` returns the existing active session for the same `basketId` and extends its expiration |

---

## 1. Ubiquitous Requirements

1. The system shall associate every `CheckoutSession` with exactly one `basketId`, exactly one `currency`, a `status`, a `paymentStatus`, an `expiresAt`, and Money totals (`subtotal`, `taxAmount`, `shippingAmount`, `discountAmount`, `total`).
2. The system shall require a non-empty basket to start checkout (`InitiateCheckoutUseCase` rejects empty baskets).
3. The system shall return all customer-facing fields in camelCase (`checkoutId`, `basketId`, `taxAmount`, `shippingAmount`, `discountAmount`, `createdAt`, `updatedAt`) and shall never expose snake_case keys in API responses.
4. The system shall return responses in the wrapper `{ success: boolean, data: ... }` for every `/customer/checkout*` endpoint.
5. The system shall accept both authenticated customers (via session/bearer) and guests (via `guestEmail` supplied to `POST /customer/checkout`); cross-customer access of a session by id shall be rejected.
6. The system shall persist totals as `Money` value objects and shall use the basket's currency when initiating the session.
7. The system shall extend the session's `expiresAt` whenever the customer interacts with an `active` session via `InitiateCheckoutUseCase`.

---

## 2. Event-Driven Requirements

### 2.1 Initiating checkout

1. **When** the customer issues `POST /customer/checkout` with a `basketId` referring to a non-empty basket and no active session exists for that basket, **the system shall** create a new `CheckoutSession` with `status = 'active'`, `paymentStatus = 'pending'`, totals seeded from the basket subtotal, an `expiresAt` 30 minutes in the future, emit `checkout.started`, and respond with HTTP `201`.
2. **When** the customer issues `POST /customer/checkout` for a basket that already has an `active` session, **the system shall** return the existing session and extend its `expiresAt` (no new session created, no second `checkout.started` event).

### 2.2 Retrieving a session

3. **When** the customer issues `GET /customer/checkout/:checkoutId` for a session they own, **the system shall** return the full session representation including addresses, shipping/payment method, coupon, totals, and timestamps.

### 2.3 Setting addresses

4. **When** the customer issues `PUT /customer/checkout/:checkoutId/shipping-address` with a valid address while the session is `active`, **the system shall** persist the shipping address, default `billingAddress` to it when `sameAsShipping = true`, recompute taxes/shipping if applicable, and emit `checkout.shipping_address_set`.
5. **When** the customer issues `PUT /customer/checkout/:checkoutId/billing-address`, **the system shall** persist the billing address, set `sameAsShipping = false`, and emit `checkout.billing_address_set`.

### 2.4 Shipping method

6. **When** the customer issues `GET /customer/checkout/:checkoutId/shipping-methods`, **the system shall** return the list of shipping methods available for the session's shipping address.
7. **When** the customer issues `PUT /customer/checkout/:checkoutId/shipping-method` with a valid method id, **the system shall** persist `shippingMethodId` / `shippingMethodName`, recompute `shippingAmount` and `total`, and emit `checkout.shipping_method_set`.

### 2.5 Payment method

8. **When** the customer issues `GET /customer/checkout/payment-methods`, **the system shall** return available payment methods (no session required).
9. **When** the customer issues `PUT /customer/checkout/:checkoutId/payment-method`, **the system shall** persist `paymentMethodId` and emit `checkout.payment_method_set`.

### 2.6 Coupons

10. **When** the customer issues `POST /customer/checkout/:checkoutId/coupon` with a valid code, **the system shall** persist `couponCode`, recompute `discountAmount` and `total`, and emit `checkout.coupon_applied`.
11. **When** the customer issues `DELETE /customer/checkout/:checkoutId/coupon`, **the system shall** clear `couponCode`, recompute totals without the discount, and emit `checkout.coupon_removed`.

### 2.7 Payment-intent creation (🚧 Proposed)

> **Status**: Not implemented. `CompleteCheckoutUseCase` currently has a `// TODO: Integrate with order creation service` placeholder (`@modules/checkout/application/useCases/CompleteCheckout.ts:47`). The requirements below describe the agreed target flow.

12. **When** the customer issues `POST /customer/checkout/:checkoutId/payment-intent` while the session `isReadyForPayment` is true and no active payment intent exists, **the system shall**:
    1. invoke `CreateOrderUseCase` to create an `Order` with `status = PAYMENT_PENDING` and `paymentStatus = 'pending'`, copying items, addresses, shipping method, customer email, currency, and totals from the session,
    2. request a payment intent from the `payment` module using the order's total and the session's `paymentMethodId`,
    3. persist the resulting `orderId` and `paymentIntentId` on the session,
    4. transition the session `active → pending_payment`,
    5. emit `order.created` (downstream subscribers reserve inventory) and `checkout.payment_initiated`,
    6. respond with HTTP `201` and `{ orderId, orderNumber, paymentIntent: { id, clientSecret?|redirectUrl? }, status: 'payment_pending' }`.
13. **When** the customer issues `POST /customer/checkout/:checkoutId/payment-intent` while the session is already `pending_payment` for the same totals, **the system shall** return the existing `orderId` and `paymentIntent` idempotently (no second order, no duplicate `order.created`).

### 2.8 Completion (idempotent confirmation)

14. **When** the customer issues `POST /customer/checkout/:checkoutId/complete` after the gateway has confirmed payment (i.e. the linked order's `paymentStatus` is `paid` and `status` is `PROCESSING`), **the system shall** transition the session `processing → completed`, set `completedAt`, emit `checkout.completed` with `{ checkoutId, basketId, orderId, customerId, total }`, and respond with `{ orderId, checkoutId, total, currency, status: 'completed' }`.
15. **When** the customer issues `POST /customer/checkout/:checkoutId/complete` for an already-completed session, **the system shall** return the same response idempotently and shall not re-emit `checkout.completed`.

### 2.9 Payment outcome (webhook-driven, 🚧 Proposed)

> Driven by the gateway webhook handled in the `payment` module, not by a customer endpoint. Listed here because both session and order state advance together.

16. **When** the gateway reports a successful capture for the session's `paymentIntentId`, **the system shall** transition the linked order `PAYMENT_PENDING → PROCESSING` and set its `paymentStatus = 'paid'`, transition the session `pending_payment → processing`, emit `order.paid` and `checkout.payment_captured`.
17. **When** the gateway reports a payment failure, **the system shall** transition the linked order `PAYMENT_PENDING → PAYMENT_FAILED`, transition the session `pending_payment → failed`, emit `order.payment_failed` and `checkout.failed`. The customer may retry via a new `POST /payment-intent` from a new session.

### 2.10 Abandonment

18. **When** the customer issues `POST /customer/checkout/:checkoutId/abandon`, **the system shall** transition the session to `abandoned`, persist the change, and emit `checkout.abandoned` with `{ checkoutId, basketId, customerId }`. If a `PAYMENT_PENDING` order is linked, the system shall transition it to `CANCELLED` and release any inventory reservation.

---

## 3. State-Driven Requirements

1. **While** a session is `active`, **the system shall** allow address, shipping-method, payment-method, and coupon mutations.
2. **While** a session is `active` and `isReadyForPayment` (shipping address + shipping method + payment method present), **the system shall** allow `POST /customer/checkout/:checkoutId/payment-intent`.
3. **While** a session is in `pending_payment` (i.e. a `PAYMENT_PENDING` order is linked), **the system shall** prevent address / method / coupon mutations and shall prevent re-initiating checkout for the same basket.
4. **While** a session is in `processing`, **the system shall** allow only `POST /complete` (idempotent confirmation).
5. **While** a session is in any terminal state (`completed`, `abandoned`, `expired`, `failed`), **the system shall** prevent every mutation including `complete` and require the customer to initiate a new session.

---

## 4. Optional Feature Requirements

1. **Where** guest checkout is enabled, **the system shall** accept `POST /customer/checkout` with a `guestEmail` and no `customerId` and treat the resulting session as guest-owned (identified by basket + email).
2. **Where** multi-currency is enabled, **the system shall** initialise session Money totals using the basket's currency rather than the platform default.
3. **Where** the `notification` module is enabled, **the system shall** trigger a checkout-completion email when `checkout.completed` is emitted (handled by a notification subscriber, not by checkout itself).
4. **Where** an automatic abandonment job is enabled, **the system shall** mark sessions whose `expiresAt` is in the past as `expired` and emit `checkout.expired` (or the configured equivalent).

---

## 5. Unwanted Behaviour / Edge Cases

### 5.1 Authentication & ownership

1. **If** the customer issues `GET/PUT/POST/DELETE /customer/checkout/:checkoutId*` for a session they do not own, **then** the system shall respond with HTTP `404` (no leak of existence).
2. **If** an authenticated customer attempts to access a guest session created by a different `guestEmail`, **then** the system shall respond with HTTP `404`.

### 5.2 Initiation guards

3. **If** `POST /customer/checkout` is submitted with a non-existent `basketId`, **then** the system shall reject with `'Basket not found'` (HTTP `404`).
4. **If** `POST /customer/checkout` is submitted with an empty basket, **then** the system shall reject with `'Cannot checkout with empty basket'` (HTTP `400`).

### 5.3 Completion guards

5. **If** the customer attempts `POST /customer/checkout/:checkoutId/complete` while the session is not `isReadyForPayment` (missing shipping address or shipping method), **then** the system shall reject with `'Checkout is not ready for completion. Please ensure shipping address and method are set.'` (HTTP `400`).
6. **If** the customer attempts to complete a session in any non-`active` status, **then** the system shall reject with an invalid-state error.

### 5.4 Mutation guards on terminal sessions

7. **If** the customer attempts to mutate addresses, shipping/payment method, or coupons on a session in `completed`, `abandoned`, `expired`, or `failed`, **then** the system shall reject with an invalid-state error.

### 5.5 Idempotency on abandon

8. **If** the customer issues `POST /customer/checkout/:checkoutId/abandon` for a non-existent or already-abandoned session, **then** the system shall return `{ success: true, message: 'Checkout abandoned successfully' }` without erroring (idempotent — see `AbandonCheckoutUseCase`).

---

## 6. Complex Requirements

1. **When** the customer initiates checkout for a basket that has no active session, **the system shall** simultaneously: load the basket, create a `CheckoutSession` with `status = 'active'` and `paymentStatus = 'pending'`, seed totals from `basket.subtotal`, set `expiresAt` to `now + 30 min`, persist the session, and emit `checkout.started`.
2. **When** the customer completes a session **while** `isReadyForPayment` is true, **the system shall** simultaneously: transition status to `completed`, set `completedAt`, persist the session, and emit `checkout.completed` carrying the downstream `orderId`.

---

## 7. Lifecycle Summary

```
basket (non-empty)
   │
   ▼
POST /customer/checkout              ──► CheckoutSession  active
                                                            │
                            (set addresses / methods / coupon while active)
                                                            │
POST /customer/checkout/:id/payment-intent (🚧 Proposed)    │
                                                            ▼
                                            Order created in PAYMENT_PENDING
                                            Session  active ──► pending_payment
                                                            │
                                            [gateway webhook]
                                                            │
                          ┌─────────────────────────────────┴────────────────────────────────┐
                          ▼                                                                  ▼
     payment captured                                                            payment failed
     Order  PAYMENT_PENDING ──► PROCESSING                                      Order  PAYMENT_PENDING ──► PAYMENT_FAILED
     Session pending_payment ──► processing                                     Session pending_payment ──► failed
                          │
POST /customer/checkout/:id/complete (idempotent confirmation)
                          ▼
     Session  processing ──► completed   (terminal)

   POST /customer/checkout/:id/abandon  ──► Session abandoned (terminal); linked PAYMENT_PENDING order ──► CANCELLED
   TTL elapsed                          ──► Session expired   (terminal)
```

| Policy                          | Default                                         |
| ------------------------------- | ----------------------------------------------- |
| Session TTL                     | 30 minutes (extended on resume)                 |
| Default `sameAsShipping`        | `true`                                          |
| Default currency                | `USD` / `basket.currency`                       |

---

## 8. Use Case Traceability

| #     | Requirement (summary)                              | Use Case                       | Source File                                                              |
| ----- | -------------------------------------------------- | ------------------------------ | ------------------------------------------------------------------------ |
| 2.1.1 | Start session → `POST /customer/checkout`          | `InitiateCheckoutUseCase`      | `modules/checkout/application/useCases/InitiateCheckout.ts`              |
| 2.1.2 | Resume existing active session                     | `InitiateCheckoutUseCase`      | same — `findByBasketId` + `extendExpiration` branch                      |
| 2.2.3 | Get session by id                                  | controller `getCheckout`       | `modules/checkout/interface/controllers/CheckoutController.ts`           |
| 2.3.4 | Set shipping address                               | `SetShippingAddressUseCase`    | `modules/checkout/application/useCases/SetShippingAddress.ts`            |
| 2.3.5 | Set billing address                                | `SetBillingAddressUseCase`     | `modules/checkout/application/useCases/SetBillingAddress.ts`             |
| 2.4.7 | Set shipping method                                | `SetShippingMethodUseCase`     | `modules/checkout/application/useCases/SetShippingMethod.ts`             |
| 2.5.9 | Set payment method                                 | `SetPaymentMethodUseCase`      | `modules/checkout/application/useCases/SetPaymentMethod.ts`              |
| 2.6.10| Apply coupon                                       | `ApplyCouponUseCase`           | `modules/checkout/application/useCases/ApplyCoupon.ts`                   |
| 2.6.11| Remove coupon                                      | `RemoveCouponUseCase`          | `modules/checkout/application/useCases/RemoveCoupon.ts`                  |
| 2.7.12| 🚧 Create payment intent + draft order             | `CreatePaymentIntentUseCase` *(proposed)* | `modules/checkout/application/useCases/CreatePaymentIntent.ts` *(to be added)* — must invoke `CreateOrderUseCase` from `modules/order/application/useCases/CreateOrder.ts` |
| 2.8.14| Confirm completion (idempotent)                    | `CompleteCheckoutUseCase`      | `modules/checkout/application/useCases/CompleteCheckout.ts` (rewrite: replace TODO with idempotent finalization that asserts the linked order is `PROCESSING`) |
| 2.9.16| 🚧 Payment captured (webhook)                       | `payment` module webhook handler + `UpdateOrderStatusUseCase` | `modules/payment/...` *(handler)* + `modules/order/application/useCases/UpdateOrderStatus.ts` |
| 2.9.17| 🚧 Payment failed (webhook)                         | `payment` module webhook handler + `UpdateOrderStatusUseCase` | same                                                                     |
| 2.10.18| Abandon checkout                                  | `AbandonCheckoutUseCase`       | `modules/checkout/application/useCases/AbandonCheckout.ts` (extend to cancel linked `PAYMENT_PENDING` order) |

### Controller wiring

Routes mounted in `modules/checkout/interface/routers/checkoutRouter.ts` and registered under `/customer` in `boot/routes.ts`.

| Endpoint                                                      | Controller handler                          |
| ------------------------------------------------------------- | ------------------------------------------- |
| `POST /customer/checkout`                                     | `checkoutController.initiateCheckout`       |
| `GET /customer/checkout/payment-methods`                      | `checkoutController.getPaymentMethods`      |
| `GET /customer/checkout/:checkoutId`                          | `checkoutController.getCheckout`            |
| `PUT /customer/checkout/:checkoutId/shipping-address`         | `checkoutController.setShippingAddress`     |
| `PUT /customer/checkout/:checkoutId/billing-address`          | `checkoutController.setBillingAddress`      |
| `GET /customer/checkout/:checkoutId/shipping-methods`         | `checkoutController.getShippingMethods`     |
| `PUT /customer/checkout/:checkoutId/shipping-method`          | `checkoutController.setShippingMethod`      |
| `PUT /customer/checkout/:checkoutId/payment-method`           | `checkoutController.setPaymentMethod`       |
| `POST /customer/checkout/:checkoutId/coupon`                  | `checkoutController.applyCoupon`            |
| `DELETE /customer/checkout/:checkoutId/coupon`                | `checkoutController.removeCoupon`           |
| `POST /customer/checkout/:checkoutId/payment-intent` (🚧)     | `checkoutController.createPaymentIntent` *(to be added)* |
| `POST /customer/checkout/:checkoutId/complete`                | `checkoutController.completeCheckout`       |
| `POST /customer/checkout/:checkoutId/abandon`                 | `checkoutController.abandonCheckout`        |

### Event wiring

```
POST /customer/checkout                       ──► InitiateCheckoutUseCase    ──► eventBus.emit('checkout.started')
PUT  .../shipping-address|billing-address     ──► Set*AddressUseCase         ──► eventBus.emit('checkout.*_address_set')
PUT  .../shipping-method|payment-method       ──► Set*MethodUseCase          ──► eventBus.emit('checkout.*_method_set')
POST .../coupon  /  DELETE .../coupon         ──► Apply/RemoveCouponUseCase  ──► eventBus.emit('checkout.coupon_*')
POST .../payment-intent (🚧)                   ──► CreatePaymentIntentUseCase
                                                  ├─► CreateOrderUseCase  ──► eventBus.emit('order.created')
                                                  ├─► payment module      ──► payment intent id + client secret
                                                  └─► eventBus.emit('checkout.payment_initiated')

[gateway webhook]                             ──► payment module handler
                                                  ├─► UpdateOrderStatusUseCase (PAYMENT_PENDING ──► PROCESSING | PAYMENT_FAILED)
                                                  ├─► eventBus.emit('order.paid' | 'order.payment_failed')
                                                  └─► eventBus.emit('checkout.payment_captured' | 'checkout.failed')

POST .../complete                             ──► CompleteCheckoutUseCase   ──► eventBus.emit('checkout.completed')
                                                  (asserts order is PROCESSING; idempotent)

POST .../abandon                              ──► AbandonCheckoutUseCase    ──► eventBus.emit('checkout.abandoned')
                                                  (cancels linked PAYMENT_PENDING order, if any)
```

Subscribers are registered in `libs/events/registerEventHandlers.ts`. The `POST /payment-intent → CreateOrderUseCase` call is the **single entry point** for `Order` creation in the customer flow; `POST /complete` and the gateway webhook only transition existing orders. See `docs/specs/order/customer.md` §2.3 and §10.

---

## 9. API Test Coverage

Source: `tests/integration/checkout/checkout.test.ts`.

| Requirement | Test (describe → it)                                                                              |
| ----------- | ------------------------------------------------------------------------------------------------- |
| 1.3 (camelCase only)   | `Checkout Session API` → `should create a checkout session with camelCase properties`     |
| 1.3 / 2.2.3            | `Checkout Session API` → `should get a checkout session by ID with camelCase properties`  |
| 2.1.1                  | `Checkout Session API` → `should create a checkout session with camelCase properties` (covers initial 201) |
| 5.2.4 (empty basket)   | _missing_ — see gaps                                                                              |
| 5.2.3 (basket not found) | _missing_ — see gaps                                                                            |

### Required additional tests (gaps)

- **2.1.2** — Re-initiating with the same `basketId` returns the existing session (no new id, `expiresAt` extended).
- **2.3.4 / 2.3.5** — Set shipping/billing address persists on subsequent `GET`.
- **2.4.6 / 2.4.7** — List shipping methods, then set one; assert `shippingAmount` updates.
- **2.6.10 / 2.6.11** — Apply / remove coupon assert `discountAmount` and `total` recompute.
- **2.7.12 / 5.3.5** — Complete a fully-prepared session (200 + `orderId`); attempt to complete an unprepared session (400 with the literal error message).
- **2.8.13 / 5.5.8** — Abandon active session (idempotency on second call).
- **3.3 / 5.4.7** — Mutating a `completed`/`abandoned` session is rejected.
- **5.1.1** — Cross-customer 404 on `GET /customer/checkout/:id`.
- **5.2.3 / 5.2.4** — Initiate with non-existent basket id and empty basket return the documented errors.
- **Event-emission spies** — Confirm `checkout.started`, `checkout.payment_initiated`, `checkout.payment_captured`, `checkout.failed`, `checkout.completed`, `checkout.abandoned` payloads.
- **2.7.12 / 2.7.13 (🚧)** — `POST /payment-intent` creates an `Order` in `PAYMENT_PENDING` and a payment intent; second call with same session/totals is idempotent (same `orderId`).
- **2.9.16 / 2.9.17 (🚧)** — Simulated webhook for paid → order moves to `PROCESSING`, session to `processing`. Simulated webhook for failure → order moves to `PAYMENT_FAILED`, session to `failed`.
- **2.10.18** — Abandoning a `pending_payment` session cancels the linked `PAYMENT_PENDING` order and releases the inventory reservation.

When adding new requirements to sections 2–6, add a row to the table above and a corresponding `it(...)` block in `checkout.test.ts`. Cross-reference the requirement number in the test name (e.g. `it('REQ 2.1.2 — resumes existing active session', ...)`).

---

## 10. Related Specs

- **Pre-checkout cart** (items only, no addresses or totals) — `basket` module. See `docs/specs/basket/customer.md` (to be added).
- **Order placement & lifecycle** (post-checkout) — `order` module. See `docs/specs/order/customer.md`. `POST /customer/checkout/:id/payment-intent` is the only customer path into `Order` creation; the linked order then progresses via the gateway webhook.
- **Promotions / coupons** — `coupon` and `promotion` modules govern coupon validation; `checkout` only stores the applied code and the recomputed `discountAmount`.
- **Payment** — `payment` module owns gateway integration; `checkout` stores `paymentMethodId` and `paymentIntentId` but does not authorise/capture itself.

### Boundary with `order`

There is **no `DRAFT` status on `Order`**. The customer-side **"draft order"** is an `Order` row in `PAYMENT_PENDING` status, created by `CreatePaymentIntentUseCase` (🚧 proposed) when the customer requests a payment intent. The gateway webhook then promotes it to `PROCESSING` (paid) or `PAYMENT_FAILED` (failed); abandonment cancels it.

Key invariants of this boundary:

- **One `Order` per successful payment intent.** Re-posting `/payment-intent` on the same `pending_payment` session is idempotent.
- **The `Order` row exists in the database during `PAYMENT_PENDING`** so reconciliation works even if the customer drops the session before the webhook arrives.
- **No inventory is deducted in `PAYMENT_PENDING`** — only reserved (handled by an inventory subscriber on `order.created`). Reservations are released on `order.cancelled` / `order.payment_failed`.
- **`POST /complete` does not create the order** — it only confirms the session once payment has captured. Today's `CompleteCheckoutUseCase` TODO must be replaced accordingly.

If longer-lived saved carts become a product requirement (TTL > 30 minutes, multiple named saved sessions per customer), extend `CheckoutSession` (configurable TTL, optional `name`, `GET /customer/checkout` list endpoint) rather than introducing a parallel concept on `order`.
