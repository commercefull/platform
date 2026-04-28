# Webhook – Merchant EARS Requirements

> **System**: CommerceFull – `webhook` module (outbound event delivery to merchant-registered endpoints)
> **Actor**: Merchant (authenticated business user managing webhook endpoints) and System (dispatching platform events)
> **Date**: 2026-04-28
> **Source**: `modules/webhook/`, `modules/webhook/application/services/WebhookDispatchService.ts`, `libs/events/registerEventHandlers.ts`

---

## Terminology Clarification

This spec covers **two distinct webhook concepts** that must not be confused:

| Concept | Direction | Owner | Spec |
|---------|-----------|-------|------|
| **Outbound webhook** | Platform → Merchant endpoint | `webhook` module | **This file** |
| **Inbound gateway webhook** | Payment gateway → Platform | `payment` module | `docs/specs/payment/customer.md §2.2–2.3` |

The `webhook` module dispatches platform domain events (e.g. `order.created`, `order.paid`) to merchant-registered HTTP endpoints. It is **not** the handler for Stripe/gateway callbacks — that lives in `modules/payment/interface/controllers/webhookController.ts` (to be added per `docs/specs/checkout/tasks.md` task 3).

---

## Context

Merchants register HTTP endpoints via the `/business/webhooks` API. The `WebhookDispatchService` listens to the platform `eventBus` and, for every event, queries registered endpoints that subscribe to that event type, then POSTs the payload with an HMAC-SHA256 signature. Failed deliveries are retried with exponential backoff up to `maxRetries`.

### Actors

| Actor | Role |
|-------|------|
| Merchant | Registers, updates, and deactivates webhook endpoints; views delivery history |
| System | Dispatches events to registered endpoints; retries failures; tracks delivery status |

### Delivery status state machine

Source: `modules/webhook/domain/entities/WebhookDelivery.ts`.

| From | To | Trigger |
|------|----|---------|
| `pending` | `success` | HTTP 2xx response received |
| `pending` | `retrying` | Non-2xx or network error, attempts < maxRetries |
| `pending` | `failed` | Non-2xx or network error, attempts ≥ maxRetries |
| `retrying` | `success` | Retry succeeds |
| `retrying` | `failed` | Retry exhausted |
| `success` / `failed` | _(terminal)_ | |

---

## 1. Ubiquitous Requirements

1. The system shall associate every `WebhookEndpoint` with a `url`, a non-empty `events` list, an auto-generated HMAC `secret`, an `isActive` flag, and a `retryPolicy` (`maxRetries`, `retryIntervalMs`, `backoffMultiplier`).
2. The system shall sign every outbound payload with `HMAC-SHA256` using the endpoint's `secret` and include the signature in the `X-Webhook-Signature` header.
3. The system shall include `X-Webhook-Event`, `X-Webhook-Delivery-Id`, and `X-Webhook-Timestamp` headers on every delivery.
4. The system shall return all merchant-facing fields in camelCase and never expose snake_case keys in API responses.
5. The system shall return responses in the wrapper `{ success: boolean, data: ... }` for all `/business/webhooks*` endpoints.
6. The system shall require authentication on all `/business/webhooks*` routes via `isMerchantLoggedIn`.
7. The system shall never expose the endpoint `secret` in list or get responses — only return it once at registration time.

---

## 2. Event-Driven Requirements

### 2.1 Registering an endpoint

1. **When** the merchant issues `POST /business/webhooks` with a valid `name`, `url`, and `events` array, **the system shall** create a `WebhookEndpoint` with `isActive = true`, generate a random 32-byte hex `secret`, apply default retry policy (`maxRetries: 5`, `retryIntervalMs: 5000`, `backoffMultiplier: 2`), persist the endpoint, and respond HTTP `201` with the full endpoint including the `secret` (only time it is returned).
2. **When** the merchant issues `POST /business/webhooks` with an empty `events` array, **the system shall** reject with a validation error.

### 2.2 Dispatching an event

3. **When** the platform `eventBus` emits any event, **the system shall** query all active endpoints whose `events` list includes the event type (exact match, wildcard `*`, or category wildcard `product.*`), create a `WebhookDelivery` record in `pending` status for each matching endpoint, and attempt delivery asynchronously (fire-and-forget from the event handler's perspective).
4. **When** a delivery attempt receives an HTTP `2xx` response within 30 seconds, **the system shall** mark the delivery `success`, record `responseStatus`, `responseBody` (truncated to 4096 chars), and `duration`.
5. **When** a delivery attempt receives a non-2xx response or a network error and `attempts < maxRetries`, **the system shall** mark the delivery `retrying` and set `nextRetryAt = now + retryIntervalMs * backoffMultiplier^(attempts-1)`.
6. **When** a delivery attempt fails and `attempts >= maxRetries`, **the system shall** mark the delivery `failed` and set `nextRetryAt = null`.

### 2.3 Retry processing

7. **When** the retry loop runs (every 30 seconds), **the system shall** query all deliveries in `retrying` status where `nextRetryAt <= now` and re-attempt delivery for each.
8. **When** the retry loop finds a delivery whose endpoint is no longer active, **the system shall** mark the delivery `failed` with `errorMessage = 'Endpoint no longer active'` without attempting delivery.

### 2.4 Managing endpoints

9. **When** the merchant issues `PUT /business/webhooks/:webhookEndpointId`, **the system shall** update the allowed fields (`name`, `url`, `events`, `isActive`, `headers`, `retryPolicy`) and persist the changes.
10. **When** the merchant issues `DELETE /business/webhooks/:webhookEndpointId`, **the system shall** deactivate (or hard-delete) the endpoint and stop future deliveries to it.
11. **When** the merchant issues `GET /business/webhooks`, **the system shall** return all endpoints for the authenticated merchant (scoped by `merchantId`).
12. **When** the merchant issues `GET /business/webhooks/:webhookEndpointId/deliveries`, **the system shall** return the delivery history for that endpoint with optional filters (`status`, `eventType`).

### 2.5 Test delivery

13. **When** the merchant issues `POST /business/webhooks/:webhookEndpointId/test`, **the system shall** send a `webhook.test` event payload to the endpoint URL and return `{ statusCode, durationMs, responseBody }` synchronously (no retry, no delivery record).

---

## 3. State-Driven Requirements

1. **While** an endpoint is `isActive = true`, **the system shall** include it in dispatch queries and retry processing.
2. **While** an endpoint is `isActive = false`, **the system shall** skip it in dispatch queries and mark any pending retries for it as `failed`.
3. **While** a delivery is in `retrying` status, **the system shall** not allow manual re-trigger — the retry loop handles it automatically.

---

## 4. Unwanted Behaviour / Edge Cases

### 4.1 Delivery timeouts

1. **If** the endpoint does not respond within 30 seconds, **then** the system shall abort the request and record the delivery as a failure with `errorMessage = 'Network error'` (or the abort error message).

### 4.2 No matching endpoints

2. **If** an event is emitted and no active endpoint subscribes to it, **then** the system shall take no action (no delivery records created).

### 4.3 Endpoint not found

3. **If** the merchant issues `GET/PUT/DELETE /business/webhooks/:webhookEndpointId` for an endpoint that does not exist, **then** the system shall respond `404`.

### 4.4 Secret exposure

4. **If** the merchant issues `GET /business/webhooks` or `GET /business/webhooks/:id`, **then** the system shall **not** include the `secret` field in the response.

---

## 5. Checkout / Order / Payment Integration

The `webhook` module is the **outbound fan-out layer** — it forwards platform events to merchant endpoints. The events it dispatches that are critical to the checkout → order → payment flow are:

| Event | Emitted by | Dispatched to merchant endpoints |
|-------|-----------|----------------------------------|
| `order.created` | `CreateOrderUseCase` | ✅ |
| `order.paid` | `payment` webhook handler (🚧) | ✅ |
| `order.payment_failed` | `payment` webhook handler (🚧) | ✅ |
| `order.cancelled` | `CancelOrderUseCase` | ✅ |
| `checkout.payment_captured` | `payment` webhook handler (🚧) | ✅ |
| `checkout.failed` | `payment` webhook handler (🚧) | ✅ |
| `checkout.completed` | `CompleteCheckoutUseCase` | ✅ |

The `WebhookDispatchService` already listens to `eventBus.on('*', ...)` so all of the above are automatically forwarded once the emitting use cases / handlers are implemented (see `docs/specs/checkout/tasks.md`).

**No changes to the `webhook` module are required** to support the checkout flow — the dispatch infrastructure is already in place. The gaps are all in `checkout`, `payment`, and `inventory` (see `docs/specs/checkout/tasks.md`).

---

## 6. Use Case Traceability

| # | Requirement | Use Case / Service | Source File |
|---|-------------|-------------------|-------------|
| 2.1.1 | Register endpoint | `RegisterWebhookUseCase` | `modules/webhook/application/useCases/RegisterWebhook.ts` |
| 2.2.3–6 | Dispatch event | `WebhookDispatchService.handleEvent` | `modules/webhook/application/services/WebhookDispatchService.ts` |
| 2.3.7–8 | Retry processing | `WebhookDispatchService.processRetries` | same |
| 2.4.9 | Update endpoint | `WebhookBusinessController.updateWebhook` | `modules/webhook/interface/controllers/WebhookBusinessController.ts` |
| 2.4.10 | Delete endpoint | `UnregisterWebhookUseCase` | `modules/webhook/application/useCases/UnregisterWebhook.ts` |
| 2.4.11 | List endpoints | `ListWebhooksUseCase` | `modules/webhook/application/useCases/ListWebhooks.ts` |
| 2.4.12 | Delivery history | `WebhookBusinessController.getDeliveries` | `modules/webhook/interface/controllers/WebhookBusinessController.ts` |
| 2.5.13 | Test delivery | `WebhookBusinessController.testWebhook` | same |

### Controller wiring

| Endpoint | Handler |
|----------|---------|
| `POST /business/webhooks` | `WebhookBusinessController.registerWebhook` |
| `GET /business/webhooks` | `WebhookBusinessController.listWebhooks` |
| `GET /business/webhooks/events` | `WebhookBusinessController.getAvailableEvents` |
| `GET /business/webhooks/:id` | `WebhookBusinessController.getWebhook` |
| `PUT /business/webhooks/:id` | `WebhookBusinessController.updateWebhook` |
| `DELETE /business/webhooks/:id` | `WebhookBusinessController.unregisterWebhook` |
| `GET /business/webhooks/:id/deliveries` | `WebhookBusinessController.getDeliveries` |
| `POST /business/webhooks/:id/test` | `WebhookBusinessController.testWebhook` |

---

## 7. API Test Coverage

Source: `tests/integration/webhook/webhook.test.ts` (to be created).

| Requirement | Test |
|-------------|------|
| 2.1.1 | `POST /business/webhooks` creates endpoint, returns `secret` once |
| 2.1.2 | Empty `events` array is rejected |
| 2.2.3 | Emitting `order.created` dispatches to a subscribed endpoint |
| 2.2.4 | 2xx response marks delivery `success` |
| 2.2.5 | Non-2xx response marks delivery `retrying` with correct `nextRetryAt` |
| 2.2.6 | Exhausted retries mark delivery `failed` |
| 2.4.11 | `GET /business/webhooks` returns only the authenticated merchant's endpoints |
| 4.4 | `GET /business/webhooks/:id` does not include `secret` |
| 4.3 | `GET /business/webhooks/unknown-id` returns `404` |
| 2.5.13 | `POST /business/webhooks/:id/test` returns `statusCode` and `durationMs` |

---

## 8. Related Specs

- **Inbound gateway webhook** (Stripe → Platform) — `docs/specs/payment/customer.md §2.2–2.3`. This is a completely separate concern handled by `modules/payment/interface/controllers/webhookController.ts`.
- **Checkout × Order tasks** — `docs/specs/checkout/tasks.md`. Once tasks 1–4 are implemented, the events they emit (`order.paid`, `order.payment_failed`, `checkout.payment_captured`, `checkout.failed`) will automatically be forwarded to merchant endpoints by the existing `WebhookDispatchService`.
