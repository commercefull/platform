# Checkout × Order × Payment × Inventory — Implementation Tasks

> **Spec sources**:
> - `docs/specs/checkout/customer.md`
> - `docs/specs/order/customer.md`
> - `docs/specs/payment/customer.md`
> - `docs/specs/webhook/merchant.md`
>
> **Status**: 🚧 In progress

---

## Overview of All Gaps

Across all four specs, the following concrete gaps exist between the current codebase and the fully-specified flow:

| # | Gap | Spec ref |
|---|-----|----------|
| 1 | `CheckoutSession` entity has no `orderId` field — needed to link the session to its draft order | `checkout §2.7`, `payment §7` |
| 2 | `CheckoutRepository` has no `findByPaymentIntentId` method — needed by the webhook handler | `payment §7`, `checkout §2.9` |
| 3 | `CreatePaymentIntentUseCase` does not exist — route is missing | `checkout §2.7`, `order §2.3.A` |
| 4 | `CompleteCheckoutUseCase` has a `// TODO` placeholder — no idempotent finalization | `checkout §2.8` |
| 5 | `AbandonCheckoutUseCase` does not cancel the linked `PAYMENT_PENDING` order | `checkout §2.10` |
| 6 | No gateway webhook handler in `payment` — `UpdateOrderStatusUseCase` is never called | `payment §2.2–2.3`, `order §2.5` |
| 7 | Webhook route `POST /payment/webhook` is not registered in `boot/routes.ts` | `payment §6` |
| 8 | Inventory subscriber stubs in `registerEventHandlers.ts` are empty | `order §10`, `checkout §10` |
| 9 | Integration tests for checkout gaps are missing | `checkout §9` |
| 10 | Integration tests for order gaps are missing | `order §9` |
| 11 | Integration tests for payment webhook are missing | `payment §8` |
| 12 | Integration tests for outbound webhook delivery are missing | `webhook §7` |

Tasks are ordered by dependency. Complete them in sequence.

---

## Tasks

- [~] 1. Add `orderId` to `CheckoutSession` entity and persist it

  **What**: The session needs to store the `orderId` of the linked draft order so that `CompleteCheckoutUseCase` and the webhook handler can look it up without a separate query.

  **Acceptance criteria**:
  - Add `orderId?: string` to `CheckoutSessionProps` in `modules/checkout/domain/entities/CheckoutSession.ts`.
  - Add a getter `get orderId(): string | undefined`.
  - Extend `setPaymentIntent(intentId: string, orderId: string)` to also persist `orderId` on the session (or add a separate `setOrderId(orderId: string)` method).
  - Update `toJSON()` to include `orderId`.
  - Update `CheckoutRepo.save()` in `modules/checkout/infrastructure/repositories/CheckoutRepository.ts` to persist `orderId` to the `checkoutSession` table (add the column if it does not exist, or store it in the `metadata` JSONB column as a fallback).
  - Update `CheckoutRepo.mapToCheckoutSession()` to read `orderId` back from the row.

  **Files to modify**:
  - `modules/checkout/domain/entities/CheckoutSession.ts`
  - `modules/checkout/infrastructure/repositories/CheckoutRepository.ts`

  **References**: `payment/customer.md §7`, `checkout/customer.md §2.7 req 12 step 3`

---

- [~] 2. Add `findByPaymentIntentId` to `CheckoutRepository`

  **What**: The gateway webhook handler needs to look up a `CheckoutSession` by the gateway's payment intent id.

  **Acceptance criteria**:
  - Add `findByPaymentIntentId(paymentIntentId: string): Promise<CheckoutSession | null>` to the `CheckoutRepository` interface in `modules/checkout/domain/repositories/CheckoutRepository.ts`.
  - Implement it in `modules/checkout/infrastructure/repositories/CheckoutRepository.ts` with a SQL query against the `paymentIntentId` column (or `metadata` JSONB if stored there).
  - Return `null` when no session matches — never throw.

  **Files to modify**:
  - `modules/checkout/domain/repositories/CheckoutRepository.ts`
  - `modules/checkout/infrastructure/repositories/CheckoutRepository.ts`

  **References**: `payment/customer.md §7`, `payment/customer.md §2.2 step 5`, `payment/customer.md §2.3 step 5`

---

- [ ] 3. Implement `CreatePaymentIntentUseCase` and wire the route

  **What**: Create `modules/checkout/application/useCases/CreatePaymentIntent.ts` and add `POST /customer/checkout/:checkoutId/payment-intent`.

  **Acceptance criteria** (from `checkout/customer.md §2.7`):

  **Happy path** (session `active` + `isReadyForPayment`):
  1. Load the session; throw `'Checkout session not found'` if missing.
  2. If the session is already `pending_payment` and `session.paymentIntentId` is set, return `{ orderId: session.orderId, orderNumber, paymentIntent: { id: session.paymentIntentId }, status: 'payment_pending' }` immediately — **no second order, no duplicate events** (idempotent).
  3. If the session is not `isReadyForPayment`, throw `'Session is not ready for payment. Please set shipping address, shipping method, and payment method.'` (HTTP `400`).
  4. Call `CreateOrderUseCase` with `status = OrderStatus.PAYMENT_PENDING`, copying `customerId`, `customerEmail` (from `guestEmail` or customer record), items from the basket (load via `BasketRepository`), shipping/billing addresses, shipping method, currency, and totals from the session.
  5. Call `InitiatePaymentUseCase` with `orderId`, `amount = session.total.amount`, `currency`, and `paymentMethodConfigId = session.paymentMethodId`.
  6. Call `session.setPaymentIntent(transactionId, orderId)` — transitions `active → pending_payment` and stores both ids.
  7. Persist the session via `checkoutRepository.save(session)`.
  8. Emit `checkout.payment_initiated` via `eventBus` with `{ checkoutId, orderId, paymentIntentId: transactionId, total: session.total.amount }`. (`order.created` is already emitted inside `CreateOrderUseCase`.)
  9. Respond HTTP `201` with `{ orderId, orderNumber, paymentIntent: { id: transactionId }, status: 'payment_pending' }`.

  **Error cases**:
  - Session not found → `404`.
  - Session not `isReadyForPayment` → `400` with the literal message above.
  - No gateway configured (`InitiatePaymentUseCase` throws) → `503`.

  **Files to create / modify**:
  - `modules/checkout/application/useCases/CreatePaymentIntent.ts` ← **new**
  - `modules/checkout/application/useCases/index.ts` ← add `export * from './CreatePaymentIntent'`
  - `modules/checkout/interface/controllers/CheckoutController.ts` ← add `createPaymentIntent` handler
  - `modules/checkout/interface/routers/checkoutRouter.ts` ← add `router.post('/checkout/:checkoutId/payment-intent', checkoutController.createPaymentIntent)`

  **References**: `checkout/customer.md §2.7 req 12–13`, `order/customer.md §2.3.A req 4`, `payment/customer.md §2.1`

---

- [ ] 4. Rewrite `CompleteCheckoutUseCase` with idempotent finalization

  **What**: Replace the `// TODO: Integrate with order creation service` placeholder in `modules/checkout/application/useCases/CompleteCheckout.ts`.

  **Acceptance criteria** (from `checkout/customer.md §2.8`):
  1. Load the session; throw `'Checkout session not found'` if missing.
  2. If `session.status === 'completed'`, return `{ orderId: session.orderId, checkoutId, total, currency, status: 'completed' }` immediately — **do not re-emit `checkout.completed`**.
  3. If `session.status !== 'processing'`, throw `'Cannot complete checkout: payment has not been confirmed yet'` (HTTP `400`).
  4. Load the linked order via `session.orderId`; if not found throw `'Linked order not found'`.
  5. Assert `order.status === OrderStatus.PROCESSING` and `order.paymentStatus === PaymentStatus.PAID`; if not, throw `'Cannot complete checkout: payment has not been confirmed yet'` (HTTP `400`).
  6. Call `session.complete()` — transitions `processing → completed`, sets `completedAt`.
  7. Persist the session.
  8. Emit `checkout.completed` with `{ checkoutId: session.id, basketId: session.basketId, orderId: session.orderId, customerId: session.customerId, total: session.total.amount }`.
  9. Return `{ orderId: session.orderId, checkoutId: session.id, total: session.total.amount, currency: session.total.currency, status: 'completed' }`.

  **Note**: `session.complete()` currently requires `paymentStatus === 'captured' | 'authorized'`. The webhook handler (task 6) calls `session.markPaymentAuthorized()` which sets `paymentStatus = 'authorized'` and `status = 'processing'` — so by the time `POST /complete` is called, both conditions are met.

  **Files to modify**:
  - `modules/checkout/application/useCases/CompleteCheckout.ts` ← rewrite

  **References**: `checkout/customer.md §2.8 req 14–15`

---

- [ ] 5. Extend `AbandonCheckoutUseCase` to cancel the linked order

  **What**: When a `pending_payment` session is abandoned, the linked `PAYMENT_PENDING` order must be cancelled and inventory reservations released.

  **Acceptance criteria** (from `checkout/customer.md §2.10 req 18`):
  1. Load the session (existing logic — if not found, return idempotent success).
  2. If `session.status === 'pending_payment'` and `session.orderId` is set:
     a. Call `CancelOrderUseCase` with `orderId = session.orderId` and `reason = 'Checkout abandoned by customer'`.
     b. `CancelOrderUseCase` already emits `order.cancelled` — the inventory subscriber (task 8) will release reservations in response to that event.
  3. Call `session.abandon()` and persist.
  4. Emit `checkout.abandoned` with `{ checkoutId, basketId, customerId }`.
  5. Return `{ message: 'Checkout abandoned successfully', checkoutId }`.

  **Files to modify**:
  - `modules/checkout/application/useCases/AbandonCheckout.ts` ← extend

  **References**: `checkout/customer.md §2.10 req 18`, `order/customer.md §2.4`

---

- [ ] 6. Implement the gateway webhook handler in `payment`

  **What**: Create `modules/payment/interface/controllers/webhookController.ts` that handles inbound gateway events and drives order + session state transitions.

  **Acceptance criteria** (from `payment/customer.md §2.2–2.3`):

  **Shared pre-processing** (both success and failure):
  1. Read the raw request body as a string (must be raw bytes for HMAC verification — use `express.raw()` middleware on this route).
  2. Compute `HMAC-SHA256(body, webhookSecret)` and compare to the `X-Webhook-Signature` header (or `Stripe-Signature` for Stripe). Respond `400 { error: 'Invalid signature' }` on mismatch.
  3. Parse the body as JSON and extract `eventType` and `externalTransactionId` (the gateway's payment intent id).
  4. Look up the `PaymentTransaction` by `externalTransactionId` via `PaymentRepo.findTransactionByExternalId(externalTransactionId)`. If not found, respond `200 { received: true }` (unknown event — silently acknowledge).

  **On `payment_intent.succeeded`** (or Stripe `payment_intent.succeeded`):
  5. If `transaction.status === 'paid'`, respond `200 { received: true }` immediately (idempotent — already processed).
  6. Call `transaction.markAsPaid(externalTransactionId, gatewayResponse)` — transitions `PENDING|AUTHORIZED → PAID`.
  7. Persist the transaction via `PaymentRepo.saveTransaction(transaction)`.
  8. Look up the `CheckoutSession` by `paymentIntentId` via `CheckoutRepo.findByPaymentIntentId(externalTransactionId)`.
  9. If a session is found:
     a. Call `UpdateOrderStatusUseCase` with `orderId = session.orderId`, `newStatus = OrderStatus.PROCESSING`.
     b. Load the order and call `order.updatePaymentStatus(PaymentStatus.PAID)`; save the order.
     c. Call `session.markPaymentAuthorized()` — transitions `pending_payment → processing`.
     d. Persist the session.
  10. Emit `order.paid` with `{ orderId: session.orderId, orderNumber, customerId: session.customerId, totalAmount }`.
  11. Emit `checkout.payment_captured` with `{ checkoutId: session.id, orderId: session.orderId, paymentIntentId: externalTransactionId }`.
  12. Respond `200 { received: true }`.

  **On `payment_intent.payment_failed`** (or Stripe `payment_intent.payment_failed`):
  5. If `transaction.status === 'failed'`, respond `200 { received: true }` immediately (idempotent).
  6. Call `transaction.fail(errorCode, errorMessage, gatewayResponse)` — transitions `PENDING|AUTHORIZED → FAILED`.
  7. Persist the transaction.
  8. Look up the `CheckoutSession` by `paymentIntentId`.
  9. If a session is found:
     a. Call `UpdateOrderStatusUseCase` with `orderId = session.orderId`, `newStatus = OrderStatus.PAYMENT_FAILED`.
     b. Call `session.markPaymentFailed()` — transitions `pending_payment → failed`.
     c. Persist the session.
  10. Emit `order.payment_failed` with `{ orderId: session.orderId, orderNumber, customerId: session.customerId, reason: errorMessage }`.
  11. Emit `checkout.failed` with `{ checkoutId: session.id, orderId: session.orderId, reason: errorMessage }`.
  12. Respond `200 { received: true }`.

  **Files to create / modify**:
  - `modules/payment/interface/controllers/webhookController.ts` ← **new**

  **References**: `payment/customer.md §2.2–2.3`, `checkout/customer.md §2.9`, `order/customer.md §2.5`

---

- [ ] 7. Register the gateway webhook route in `boot/routes.ts`

  **What**: Mount `POST /payment/webhook` **without** any auth middleware — it is authenticated by HMAC signature only.

  **Acceptance criteria**:
  - Add `import * as webhookController from '../modules/payment/interface/controllers/webhookController'` to `boot/routes.ts`.
  - Register `app.post('/payment/webhook', express.raw({ type: 'application/json' }), webhookController.handleGatewayWebhook)` **before** the `/customer` and `/business` route arrays so it is not caught by auth middleware.
  - Confirm the route is not wrapped in `isMerchantLoggedIn` or `isCustomerLoggedIn`.

  **Files to modify**:
  - `boot/routes.ts`

  **References**: `payment/customer.md §6` (controller wiring note)

---

- [ ] 8. Implement inventory subscriber for `order.created` / `order.cancelled` / `order.payment_failed`

  **What**: Fill in the stub handlers in `libs/events/registerEventHandlers.ts` to honour the reservation invariants.

  **Acceptance criteria** (from `order/customer.md §10`):

  **`order.created`** → reserve stock:
  - The event payload contains `{ orderId, orderNumber, customerId, totalAmount, currency }`.
  - Load the full order via `OrderRepo.findById(orderId)` to get the items.
  - For each `OrderItem`, call `inventoryReservationRepo.create({ orderId, productVariantId: item.productVariantId || item.productId, locationId: <default location>, quantity: item.quantity })`.
  - To find the `locationId`, call `InventoryRepo.checkProductAvailability(item.productId, item.productVariantId, item.quantity)` and use the first location with sufficient stock.
  - If a reservation cannot be created (insufficient stock), emit `inventory.reservation_failed` with `{ orderId, productId: item.productId, productVariantId: item.productVariantId, requested: item.quantity }` — **do not throw** (the order is already persisted).

  **`order.cancelled`** → release reservations:
  - Call `inventoryReservationRepo.releaseByOrder(orderId)` — releases all `reserved` reservations for the order in a single query.

  **`order.payment_failed`** → release reservations:
  - Same as `order.cancelled`: call `inventoryReservationRepo.releaseByOrder(orderId)`.

  **Files to modify**:
  - `libs/events/registerEventHandlers.ts` ← fill in `registerOrderEventHandlers` stubs; add `order.payment_failed` handler

  **Note**: `inventoryReservationRepo` already has `create`, `releaseByOrder`, and `findByOrder` — no new repo methods are needed. `InventoryRepo.checkProductAvailability` is also already implemented.

  **References**: `order/customer.md §10`, `checkout/customer.md §10`

---

- [ ] 9. Add missing integration tests — checkout

  **What**: Add all gap tests from `checkout/customer.md §9` to `tests/integration/checkout/checkout.test.ts`.

  Each `it(...)` must include the requirement number in its description (e.g. `it('REQ 2.1.2 — resumes existing active session', ...)`).

  **Tests to add**:

  | Req | Description |
  |-----|-------------|
  | 2.1.2 | Re-initiating with the same `basketId` returns the existing session (same `checkoutId`), `expiresAt` is extended |
  | 2.3.4 | Set shipping address → subsequent `GET` returns the address |
  | 2.3.5 | Set billing address → subsequent `GET` returns the address, `sameAsShipping = false` |
  | 2.4.6 | `GET /shipping-methods` returns a non-empty array when shipping address is set |
  | 2.4.7 | Set shipping method → `shippingAmount` and `total` update on subsequent `GET` |
  | 2.6.10 | Apply coupon → `discountAmount > 0`, `total` decreases |
  | 2.6.11 | Remove coupon → `discountAmount = 0`, `total` restores |
  | 2.7.12 | `POST /payment-intent` on a ready session → HTTP `201`, `orderId` present, order exists in `PAYMENT_PENDING` |
  | 2.7.13 | Second `POST /payment-intent` on same `pending_payment` session → same `orderId` returned (idempotent) |
  | 2.8.14 | `POST /complete` after webhook confirms payment → HTTP `200`, `status: 'completed'`, `orderId` matches |
  | 2.8.15 | `POST /complete` on already-completed session → same response, `checkout.completed` not re-emitted |
  | 2.9.16 | Simulated webhook `payment_intent.succeeded` → order `PROCESSING`, session `processing` |
  | 2.9.17 | Simulated webhook `payment_intent.payment_failed` → order `PAYMENT_FAILED`, session `failed` |
  | 2.10.18 | `POST /abandon` on `pending_payment` session → session `abandoned`, linked order `CANCELLED` |
  | 3.3 / 5.4.7 | Mutating address on `completed` session → invalid-state error |
  | 5.1.1 | `GET /customer/checkout/:id` for another customer's session → `404` |
  | 5.2.3 | `POST /customer/checkout` with non-existent `basketId` → `404` |
  | 5.2.4 | `POST /customer/checkout` with empty basket → `400` with `'Cannot checkout with empty basket'` |
  | 5.3.5 | `POST /complete` on session missing shipping address → `400` with the literal error message |
  | Event spies | `checkout.started`, `checkout.payment_initiated`, `checkout.payment_captured`, `checkout.failed`, `checkout.completed`, `checkout.abandoned` — assert payload shape matches spec |

  **Files to modify**:
  - `tests/integration/checkout/checkout.test.ts`

  **References**: `checkout/customer.md §9`

---

- [ ] 10. Add missing integration tests — order

  **What**: Add all gap tests from `order/customer.md §9` to `tests/integration/order/order.test.ts`.

  **Tests to add**:

  | Req | Description |
  |-----|-------------|
  | 5.2.4 | `POST /customer/order` with empty `items` → `400` with `'Order must contain at least one item'` |
  | 5.2.5 | `POST /customer/order` without `customerEmail` → `400` with `'Customer email is required'` |
  | 5.2.6 | `POST /customer/order` without `shippingAddress` → `400` with `'Shipping address is required'` |
  | 5.3.7 | Cancel a `SHIPPED` order → `400` with `'Order cannot be cancelled. Current status: shipped'` |
  | 5.3.8 | Cancel non-existent `orderId` → `404` with `'Order not found'` |
  | 2.3.4 (event) | `POST /customer/order` → `order.created` emitted with `{ orderId, orderNumber, customerId, totalAmount, currency }` |
  | 2.4.5 (event) | `POST /customer/order/:id/cancel` → `order.cancelled` emitted with `{ orderId, orderNumber, customerId, reason, totalAmount }` |
  | 4.1 | `POST /customer/order` with `currencyCode = 'EUR'` → order persisted with `currencyCode = 'EUR'` |
  | 4.2 | `POST /customer/order` with `hasGiftWrapping = true`, `giftMessage`, `isGift = true` → persisted correctly |

  **Files to modify**:
  - `tests/integration/order/order.test.ts`

  **References**: `order/customer.md §9`

---

- [ ] 11. Add missing integration tests — payment webhook

  **What**: Create `tests/integration/payment/payment.test.ts` covering the gateway webhook handler and stored payment methods.

  **Tests to add**:

  | Req | Description |
  |-----|-------------|
  | 2.1.1 | `InitiatePaymentUseCase` creates a `PENDING` transaction and emits `payment.received` |
  | 2.1.2 | `amount <= 0` throws `'Amount must be greater than zero'` |
  | 2.2.4 | `POST /payment/webhook` with `payment_intent.succeeded` → transaction `PAID`, order `PROCESSING`, session `processing`, `order.paid` + `checkout.payment_captured` emitted |
  | 2.3.5 | `POST /payment/webhook` with `payment_intent.payment_failed` → transaction `FAILED`, order `PAYMENT_FAILED`, session `failed`, `order.payment_failed` + `checkout.failed` emitted |
  | 4.1.1 | Webhook with invalid `X-Webhook-Signature` → `400 { error: 'Invalid signature' }` |
  | 4.2.3 | Re-delivered `payment_intent.succeeded` for already-`PAID` transaction → `200 { received: true }`, no duplicate events |
  | 4.2.4 | Re-delivered `payment_intent.payment_failed` for already-`FAILED` transaction → `200 { received: true }`, no duplicate events |
  | 4.1.2 | Unknown `externalTransactionId` → `200 { received: true }`, no state changes |
  | 2.4.6 | `GET /customer/payment/transactions` returns only the authenticated customer's transactions |
  | 2.5.9 | `POST /customer/payment-methods` with `isDefault = true` clears `isDefault` on all other methods |

  **Files to create**:
  - `tests/integration/payment/payment.test.ts` ← **new**

  **References**: `payment/customer.md §8`

---

- [ ] 12. Add missing integration tests — outbound webhook delivery

  **What**: Create `tests/integration/webhook/webhook.test.ts` covering the `WebhookDispatchService` and endpoint management.

  **Tests to add**:

  | Req | Description |
  |-----|-------------|
  | 2.1.1 | `POST /business/webhooks` creates endpoint, response includes `secret` |
  | 2.1.2 | `POST /business/webhooks` with empty `events` → validation error |
  | 2.2.3 | Emitting `order.created` on `eventBus` → delivery record created for a subscribed endpoint |
  | 2.2.4 | Mock endpoint returns `200` → delivery marked `success` |
  | 2.2.5 | Mock endpoint returns `500` → delivery marked `retrying`, `nextRetryAt` is set |
  | 2.2.6 | Delivery exhausts `maxRetries` → delivery marked `failed` |
  | 2.4.11 | `GET /business/webhooks` returns only the authenticated merchant's endpoints |
  | 4.4 | `GET /business/webhooks/:id` response does not include `secret` field |
  | 4.3 | `GET /business/webhooks/unknown-id` → `404` |
  | 2.5.13 | `POST /business/webhooks/:id/test` → returns `{ statusCode, durationMs }` |

  **Files to create**:
  - `tests/integration/webhook/webhook.test.ts` ← **new**

  **References**: `webhook/merchant.md §7`

---

## Dependency Order

```
Task 1  (orderId on CheckoutSession)
  └─► Task 2  (findByPaymentIntentId on CheckoutRepository)
        └─► Task 3  (CreatePaymentIntentUseCase + route)
              └─► Task 4  (CompleteCheckoutUseCase rewrite)
              └─► Task 5  (AbandonCheckoutUseCase — cancel linked order)
              └─► Task 6  (gateway webhook handler)
                    └─► Task 7  (register webhook route in boot/routes.ts)
                          └─► Task 8  (inventory subscriber)
                                └─► Task 9   (checkout integration tests)
                                └─► Task 10  (order integration tests)
                                └─► Task 11  (payment integration tests)
                                └─► Task 12  (webhook integration tests)
```

Tasks 4, 5, and 6 can be worked in parallel once tasks 1–3 are done.
Tasks 9–12 can be worked in parallel once tasks 1–8 are done.

---

## Cross-References

| Task | Checkout spec | Order spec | Payment spec | Webhook spec |
|------|--------------|------------|--------------|--------------|
| 1 | §2.7 req 12 step 3 | — | §7 (orderId gap) | — |
| 2 | §2.9 req 16–17 | — | §7 (findByPaymentIntentId gap) | — |
| 3 | §2.7 req 12–13, §8 row 2.7.12 | §2.3.A req 4, §8 row 2.3.A.4 | §2.1 req 1–3 | — |
| 4 | §2.8 req 14–15, §8 row 2.8.14 | — | — | — |
| 5 | §2.10 req 18 | §2.4 | — | — |
| 6 | §2.9 req 16–17, §8 rows 2.9.16–17 | §2.5 req 7–9 | §2.2–2.3 req 4–5, §5 complex req 1–2 | §5 (events dispatched automatically) |
| 7 | — | — | §6 (controller wiring) | — |
| 8 | §10 boundary note | §10 key invariants | — | — |
| 9 | §9 gaps | — | — | — |
| 10 | — | §9 gaps | — | — |
| 11 | — | — | §8 gaps | — |
| 12 | — | — | — | §7 gaps |
