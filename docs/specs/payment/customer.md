# Payment – Customer EARS Requirements

> **System**: CommerceFull – `payment` module (customer-facing surface + gateway webhook)
> **Actor**: Customer (authenticated end-user) and Gateway (external payment provider)
> **Date**: 2026-04-28
> **Source**: `docs/modules/payment.md`, `modules/payment/`, `modules/payment/interface/routers/`, integration tests at `tests/integration/payment/payment.test.ts`

The `payment` module owns gateway integration. It receives a payment intent request from `checkout`, communicates with the external gateway, and drives order and checkout session state transitions via the gateway webhook. It does **not** own order status — it calls `UpdateOrderStatusUseCase` from `modules/order/` to advance the order.

---

## Context

The customer-facing payment flow has two phases:

1. **Intent creation** — `checkout` calls `InitiatePaymentUseCase` to open a payment intent with the gateway and obtain a `transactionId` / `clientSecret`. The customer authorises payment client-side (e.g. Stripe.js).
2. **Outcome** — the gateway posts a webhook to `POST /payment/webhook`. The handler verifies the signature, updates the `PaymentTransaction`, calls `UpdateOrderStatusUseCase`, and advances the `CheckoutSession`.

The `payment` module also exposes stored payment methods and transaction history to authenticated customers.

### Actors

| Actor    | Role                                                                                  |
| -------- | ------------------------------------------------------------------------------------- |
| Customer | Authenticated user; views transactions, manages stored payment methods                |
| Gateway  | External payment provider (Stripe, etc.); posts signed webhook events                 |
| System   | Verifies signatures, transitions transaction/order/session state, emits domain events |

### Transaction status state machine

Source: `modules/payment/domain/valueObjects/PaymentStatus.ts` (`TransactionStatusTransitions`).

| From                                            | To (allowed)                                           |
| ----------------------------------------------- | ------------------------------------------------------ |
| `pending`                                       | `authorized`, `paid`, `failed`, `cancelled`, `expired` |
| `authorized`                                    | `paid`, `voided`, `failed`, `expired`                  |
| `paid`                                          | `partially_refunded`, `refunded`                       |
| `partially_refunded`                            | `refunded`                                             |
| `failed`                                        | `pending` (retry)                                      |
| `voided` / `refunded` / `cancelled` / `expired` | _(terminal)_                                           |

---

## 1. Ubiquitous Requirements

1. The system shall associate every `PaymentTransaction` with an `orderId`, an `amount`, a `currency`, a `gatewayId`, a `paymentMethodConfigId`, and a `status`.
2. The system shall enforce `TransactionStatusTransitions` and reject any transition not listed.
3. The system shall return all customer-facing fields in camelCase and never expose snake_case keys in API responses.
4. The system shall return responses in the wrapper `{ success: boolean, data: ... }` for all `/customer/payment*` endpoints.
5. The system shall require authentication on all `/customer/payment*` routes via `isCustomerLoggedIn`.
6. The system shall scope every `/customer/payment/transactions` query by the authenticated `customerId`.

---

## 2. Event-Driven Requirements

### 2.1 Initiating a payment intent (called from `checkout`)

1. **When** `InitiatePaymentUseCase` is invoked with a valid `orderId`, `amount`, `currency`, and `paymentMethodConfigId`, **the system shall**:
   1. Resolve the default gateway via `PaymentRepository.getDefaultGateway`.
   2. Create a `PaymentTransaction` in `PENDING` status.
   3. Persist the transaction.
   4. Emit `payment.received` with `{ transactionId, orderId, amount, currency }`.
   5. Return `{ transactionId, orderId, amount, currency, status: 'pending', createdAt }`.
2. **When** `InitiatePaymentUseCase` is invoked with `amount <= 0`, **the system shall** throw `'Amount must be greater than zero'`.
3. **When** no gateway is configured, **the system shall** throw `'No payment gateway configured'`.

> **Note**: `InitiatePaymentUseCase` does not contact the external gateway directly — it creates the internal transaction record. The actual gateway API call (Stripe `paymentIntents.create`) is the responsibility of a `GatewayAdapterService` (to be added) that wraps the gateway SDK and returns the `clientSecret` / `redirectUrl` to `CreatePaymentIntentUseCase` in `checkout`.

### 2.2 Gateway webhook — payment captured (🚧 Proposed)

4. **When** the gateway posts `POST /payment/webhook` with event type `payment_intent.succeeded` (or equivalent), **the system shall**:
   1. Verify the HMAC-SHA256 signature using the configured `webhookSecret`; respond `400` on invalid signature.
   2. Look up the `PaymentTransaction` by `externalTransactionId` (the gateway's payment intent id).
   3. Call `transaction.markAsPaid(externalTransactionId, gatewayResponse)` — transitions `PENDING|AUTHORIZED → PAID`.
   4. Persist the transaction.
   5. Look up the `CheckoutSession` by `paymentIntentId` (add `findByPaymentIntentId` to `CheckoutRepository`).
   6. Call `UpdateOrderStatusUseCase` with `newStatus = OrderStatus.PROCESSING` for the linked order; also set `paymentStatus = 'paid'` on the order.
   7. Call `session.markPaymentAuthorized()` — transitions session `pending_payment → processing`.
   8. Persist the session.
   9. Emit `order.paid` with `{ orderId, orderNumber, customerId, totalAmount }`.
   10. Emit `checkout.payment_captured` with `{ checkoutId, orderId, paymentIntentId }`.
   11. Respond HTTP `200 { received: true }`.

### 2.3 Gateway webhook — payment failed (🚧 Proposed)

5. **When** the gateway posts `POST /payment/webhook` with event type `payment_intent.payment_failed` (or equivalent), **the system shall**:
   1. Verify the HMAC-SHA256 signature; respond `400` on invalid signature.
   2. Look up the `PaymentTransaction` by `externalTransactionId`.
   3. Call `transaction.fail(errorCode, errorMessage, gatewayResponse)` — transitions `PENDING|AUTHORIZED → FAILED`.
   4. Persist the transaction.
   5. Look up the `CheckoutSession` by `paymentIntentId`.
   6. Call `UpdateOrderStatusUseCase` with `newStatus = OrderStatus.PAYMENT_FAILED`.
   7. Call `session.markPaymentFailed()` — transitions session `pending_payment → failed`.
   8. Persist the session.
   9. Emit `order.payment_failed` with `{ orderId, orderNumber, customerId, reason }`.
   10. Emit `checkout.failed` with `{ checkoutId, orderId, reason }`.
   11. Respond HTTP `200 { received: true }`.

### 2.4 Customer transaction history

6. **When** the customer issues `GET /customer/payment/transactions`, **the system shall** return the authenticated customer's transactions scoped by `customerId`.
7. **When** the customer issues `GET /customer/payment/orders/:orderId`, **the system shall** return all transactions for that order (ownership check: the order must belong to the authenticated customer).

### 2.5 Stored payment methods

8. **When** the customer issues `GET /customer/payment-methods`, **the system shall** return all non-deleted stored payment methods for the authenticated customer.
9. **When** the customer issues `POST /customer/payment-methods`, **the system shall** create a stored method and enforce the single-default invariant (only one method per customer may have `isDefault = true`).
10. **When** the customer issues `POST /customer/payment-methods/:methodId/default`, **the system shall** set the specified method as default and clear `isDefault` on all others.
11. **When** the customer issues `DELETE /customer/payment-methods/:methodId`, **the system shall** soft-delete the method.

---

## 3. State-Driven Requirements

1. **While** a `PaymentTransaction` is in `PENDING` or `AUTHORIZED`, **the system shall** allow the gateway webhook to advance it to `PAID` or `FAILED`.
2. **While** a `PaymentTransaction` is in `PAID` or `PARTIALLY_REFUNDED`, **the system shall** allow refund processing.
3. **While** a `PaymentTransaction` is in any terminal state (`voided`, `refunded`, `cancelled`, `expired`), **the system shall** reject any further status transition.

---

## 4. Unwanted Behaviour / Edge Cases

### 4.1 Webhook security

1. **If** the webhook request arrives without a valid `X-Webhook-Signature` header, **then** the system shall respond `400 { error: 'Invalid signature' }` and take no action.
2. **If** the webhook `externalTransactionId` does not match any known `PaymentTransaction`, **then** the system shall respond `200 { received: true }` (idempotent — unknown events are silently acknowledged to prevent gateway retries).

### 4.2 Idempotency

3. **If** the gateway re-delivers a `payment_intent.succeeded` event for a transaction already in `PAID`, **then** the system shall respond `200 { received: true }` without re-emitting events or re-transitioning state.
4. **If** the gateway re-delivers a `payment_intent.payment_failed` event for a transaction already in `FAILED`, **then** the system shall respond `200 { received: true }` without re-emitting events.

### 4.3 Missing gateway

5. **If** `InitiatePaymentUseCase` is called and no default gateway is configured, **then** the system shall throw `'No payment gateway configured'` (surfaced as HTTP `503` by the checkout controller).

---

## 5. Complex Requirements

1. **When** the gateway webhook reports a successful capture **while** the linked `CheckoutSession` is `pending_payment`, **the system shall** simultaneously: mark the transaction `PAID`, transition the order `PAYMENT_PENDING → PROCESSING`, set `paymentStatus = 'paid'` on the order, transition the session `pending_payment → processing`, and emit `order.paid` + `checkout.payment_captured`.
2. **When** the gateway webhook reports a failure **while** the linked `CheckoutSession` is `pending_payment`, **the system shall** simultaneously: mark the transaction `FAILED`, transition the order `PAYMENT_PENDING → PAYMENT_FAILED`, transition the session `pending_payment → failed`, and emit `order.payment_failed` + `checkout.failed`.

---

## 6. Use Case Traceability

| #        | Requirement                 | Use Case / Handler                                           | Source File                                                                  |
| -------- | --------------------------- | ------------------------------------------------------------ | ---------------------------------------------------------------------------- |
| 2.1.1    | Initiate payment intent     | `InitiatePaymentUseCase`                                     | `modules/payment/application/useCases/InitiatePayment.ts`                    |
| 2.2.4    | Webhook — payment captured  | `handleGatewayWebhook` (🚧)                                  | `modules/payment/interface/controllers/webhookController.ts` _(to be added)_ |
| 2.3.5    | Webhook — payment failed    | `handleGatewayWebhook` (🚧)                                  | same                                                                         |
| 2.4.6    | List my transactions        | controller `getMyTransactions`                               | `modules/payment/interface/controllers/PaymentController.ts`                 |
| 2.5.8–11 | Stored payment methods CRUD | `storedPaymentMethodRepo` + `SaveStoredPaymentMethodUseCase` | `modules/payment/infrastructure/repositories/storedPaymentMethodRepo.ts`     |

### Controller wiring

| Endpoint                                           | Handler                                        |
| -------------------------------------------------- | ---------------------------------------------- |
| `POST /payment/webhook` (🚧)                       | `webhookController.handleGatewayWebhook`       |
| `GET /customer/payment/transactions`               | `PaymentController.getMyTransactions`          |
| `GET /customer/payment/orders/:orderId`            | `PaymentController.getTransactionByOrder`      |
| `GET /customer/payment-methods`                    | `paymentCustomerController.listStoredMethods`  |
| `POST /customer/payment-methods`                   | `paymentCustomerController.saveStoredMethod`   |
| `POST /customer/payment-methods/:methodId/default` | `paymentCustomerController.setDefaultMethod`   |
| `DELETE /customer/payment-methods/:methodId`       | `paymentCustomerController.deleteStoredMethod` |

The webhook route must be mounted **without** `isMerchantLoggedIn` or `isCustomerLoggedIn` — it is authenticated by signature verification only. Mount it at the root level in `boot/routes.ts` (e.g. `app.post('/payment/webhook', webhookController.handleGatewayWebhook)`).

### Event wiring

```
InitiatePaymentUseCase          ──► eventBus.emit('payment.received')

[gateway webhook — success]     ──► webhookController.handleGatewayWebhook
                                      ├─► transaction.markAsPaid()
                                      ├─► UpdateOrderStatusUseCase (→ PROCESSING)
                                      ├─► session.markPaymentAuthorized()
                                      ├─► eventBus.emit('order.paid')
                                      └─► eventBus.emit('checkout.payment_captured')

[gateway webhook — failure]     ──► webhookController.handleGatewayWebhook
                                      ├─► transaction.fail()
                                      ├─► UpdateOrderStatusUseCase (→ PAYMENT_FAILED)
                                      ├─► session.markPaymentFailed()
                                      ├─► eventBus.emit('order.payment_failed')
                                      └─► eventBus.emit('checkout.failed')
```

---

## 7. Infrastructure Gaps (🚧)

The following are required for the webhook handler to work but do not yet exist:

| Gap                                             | Location                                                                  | Notes                                                                                |
| ----------------------------------------------- | ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| `findByPaymentIntentId` on `CheckoutRepository` | `modules/checkout/domain/repositories/CheckoutRepository.ts` + infra impl | Needed to look up the session from the gateway's `paymentIntentId`                   |
| `webhookController.ts`                          | `modules/payment/interface/controllers/webhookController.ts`              | New file — handles `POST /payment/webhook`                                           |
| Webhook route (unauthenticated)                 | `boot/routes.ts`                                                          | `app.post('/payment/webhook', ...)` — no auth middleware                             |
| `GatewayAdapterService` (optional)              | `modules/payment/application/services/GatewayAdapterService.ts`           | Wraps Stripe SDK; returns `clientSecret` to `CreatePaymentIntentUseCase` in checkout |
| `orderId` field on `CheckoutSession`            | `CheckoutSession` entity + `CheckoutRepository` infra                     | Needed to look up the linked order from the session during webhook processing        |

---

## 8. API Test Coverage

Source: `tests/integration/payment/payment.test.ts` (to be created).

| Requirement | Test                                                                                                               |
| ----------- | ------------------------------------------------------------------------------------------------------------------ |
| 2.1.1       | `InitiatePaymentUseCase` creates a `PENDING` transaction and emits `payment.received`                              |
| 2.1.2       | `amount <= 0` throws the documented error                                                                          |
| 2.2.4       | Simulated webhook `payment_intent.succeeded` → transaction `PAID`, order `PROCESSING`, session `processing`        |
| 2.3.5       | Simulated webhook `payment_intent.payment_failed` → transaction `FAILED`, order `PAYMENT_FAILED`, session `failed` |
| 4.1.1       | Webhook with invalid signature → `400`                                                                             |
| 4.2.3       | Re-delivered success webhook on already-`PAID` transaction → `200`, no duplicate events                            |
| 4.2.4       | Re-delivered failure webhook on already-`FAILED` transaction → `200`, no duplicate events                          |
| 2.4.6       | `GET /customer/payment/transactions` returns only the authenticated customer's transactions                        |
| 2.5.9       | `POST /customer/payment-methods` enforces single-default invariant                                                 |

---

## 9. Related Specs

- **Checkout flow** — `docs/specs/checkout/customer.md`. `CreatePaymentIntentUseCase` in `checkout` calls `InitiatePaymentUseCase` here; the gateway webhook here drives checkout session state.
- **Order lifecycle** — `docs/specs/order/customer.md`. The webhook handler calls `UpdateOrderStatusUseCase` to advance the order.
- **Checkout × Order tasks** — `docs/specs/checkout/tasks.md` task 3 implements the webhook handler described in §2.2–2.3 above.
