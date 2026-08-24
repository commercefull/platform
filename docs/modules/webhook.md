# Webhook Module

## Overview

The Webhook module manages webhook endpoint registrations and event delivery. It listens to the platform eventBus and dispatches matching events to registered endpoints with HMAC-SHA256 signature verification, retry logic with exponential backoff, and delivery tracking. Supports exact event matching, wildcard (`*`), and category-level matching (e.g., `product.*`).

---

## Use Cases

| ID | Use Case | Actor | Purpose |
|---|---|---|---|
| UC-WHK-001 | Register Webhook | Merchant/Admin | Register a new webhook endpoint with URL, events, headers, and retry policy |
| UC-WHK-002 | Unregister Webhook | Merchant/Admin | Remove a webhook endpoint registration by ID |
| UC-WHK-003 | List Webhooks | Merchant/Admin | List webhook endpoints with optional filtering by organization, active status, and pagination |
| UC-WHK-004 | Get Webhook | Merchant/Admin | Retrieve a single webhook endpoint by ID (secret stripped from response) |
| UC-WHK-005 | Update Webhook | Merchant/Admin | Update a webhook endpoint's name, URL, events, active status, headers, or retry policy |
| UC-WHK-006 | Get Webhook Deliveries | Merchant/Admin | List delivery records for a webhook endpoint with filtering by status, event type, and pagination |
| UC-WHK-007 | Get Available Events | Merchant/Admin | List all subscribable event types and wildcard patterns |
| UC-WHK-008 | Test Webhook | Merchant/Admin | Send a test event to a webhook endpoint and return the response status and duration |
| UC-WHK-009 | Dispatch Events | System | Listen to eventBus `*` events and deliver to matching active endpoints with retry tracking |

### API Endpoints

| ID | Method | Endpoint |
|---|---|---|
| UC-WHK-001 | POST | `/business/webhooks` |
| UC-WHK-002 | DELETE | `/business/webhooks/:webhookEndpointId` |
| UC-WHK-003 | GET | `/business/webhooks` |
| UC-WHK-004 | GET | `/business/webhooks/:webhookEndpointId` |
| UC-WHK-005 | PUT | `/business/webhooks/:webhookEndpointId` |
| UC-WHK-006 | GET | `/business/webhooks/:webhookEndpointId/deliveries` |
| UC-WHK-007 | GET | `/business/webhooks/events` |
| UC-WHK-008 | POST | `/business/webhooks/:webhookEndpointId/test` |

### GraphQL Endpoints

| ID | Type | Field | Description |
|---|---|---|---|
| UC-WHK-001 | Mutation | `registerWebhook` | Register a webhook via GraphQL |
| UC-WHK-002 | Mutation | `unregisterWebhook` | Unregister a webhook via GraphQL |
| UC-WHK-003 | Query | `webhooks` | List webhooks via GraphQL |

---

## Domain Errors

| Error Class | Code | Status | Description |
|---|---|---|---|
| `WebhookNotFoundError` | `webhook.not_found` | 404 | Webhook not found |
| `WebhookEndpointNotFoundError` | `webhook.endpoint_not_found` | 404 | Webhook endpoint not found |
| `WebhookDeliveryNotFoundError` | `webhook.delivery_not_found` | 404 | Webhook delivery not found |
| `WebhookEndpointAlreadyExistsError` | `webhook.endpoint_already_exists` | 409 | Webhook endpoint already exists |
| `InvalidWebhookUrlError` | `webhook.invalid_url` | 400 | Invalid webhook URL |
| `FailedToDeliverWebhookError` | `webhook.delivery_failed` | 500 | Failed to deliver webhook |
| `WebhookValidationError` | `webhook.validation_error` | 400 | General validation error |
| `FailedToCreateWebhookEndpointError` | `webhook.endpoint_creation_failed` | 500 | Failed to create webhook endpoint |

---

## Events Emitted

The webhook module does not emit domain events. It consumes events from the platform eventBus via `eventBus.on('*', ...)` and dispatches them to registered endpoints.

---

## Domain Entities

- **`WebhookEndpointEntity`** — Aggregate root for a registered webhook endpoint. Properties: URL, secret (auto-generated), events list, active status, custom headers, retry policy (maxRetries, retryIntervalMs, backoffMultiplier). Domain methods: `activate`, `deactivate`, `updateEvents`, `updateUrl`, `updateName`, `updateHeaders`, `regenerateSecret`, `subscribesToEvent`.
- **`WebhookDeliveryEntity`** — Delivery attempt record. Tracks status (pending/success/failed/retrying), attempts, response status/body, error message, duration, and next retry time. Domain methods: `recordSuccess`, `recordFailure`.

## Domain Value Objects

- **`WebhookEventType`** — Defines `SYNC_RELEVANT_EVENTS` (29 event types across product, order, inventory, customer, payment, fulfillment categories) and `WebhookEventCategory` constants.

## Application Services

- **`WebhookDispatchService`** — Listens to eventBus `*` events, finds matching endpoints, creates delivery records, attempts HTTP POST with HMAC-SHA256 signature, tracks results, and processes pending retries every 30 seconds with exponential backoff.

## Repository Ports

- **`WebhookRepositoryInterface`** — `createEndpoint`, `findEndpointById`, `findEndpointsByEvent`, `findEndpoints`, `updateEndpoint`, `deleteEndpoint`, `createDelivery`, `findDeliveryById`, `findDeliveries`, `updateDelivery`, `findPendingRetries`

## Provider Contract

`index.ts` exports:
- Repository port: `WebhookRepositoryInterface`
- Domain errors: all error classes listed above

> **Note**: Use cases are not exported from `index.ts` yet. They are available via individual use case files.

---

## Owned Tables

| Table | Purpose |
|---|---|
| `webhookEndpoint` | Webhook endpoint registrations |
| `webhookDelivery` | Webhook delivery attempt records |

---

## Integration Test Coverage

| Use Case | Test File | Status |
|---|---|---|
| UC-WHK-001 | — | ❌ |
| UC-WHK-002 | — | ❌ |
| UC-WHK-003 | — | ❌ |
| UC-WHK-004 | — | ❌ |
| UC-WHK-005 | — | ❌ |
| UC-WHK-006 | — | ❌ |
| UC-WHK-007 | — | ❌ |
| UC-WHK-008 | — | ❌ |
| UC-WHK-009 | — | ❌ |

> **Note**: No integration tests exist yet for this module.

---

<!-- GENERATED:ENDPOINTS:START -->

| Method | Endpoint | Controller | Description |
|---|---|---|---|
| GET | `/business/webhooks/events` | `getAvailableEvents` | List subscribable event types |
| GET | `/business/webhooks` | `listWebhooks` | List webhook endpoints |
| POST | `/business/webhooks` | `registerWebhook` | Register a new webhook endpoint |
| GET | `/business/webhooks/:webhookEndpointId` | `getWebhook` | Get a single webhook endpoint |
| PUT | `/business/webhooks/:webhookEndpointId` | `updateWebhook` | Update a webhook endpoint |
| DELETE | `/business/webhooks/:webhookEndpointId` | `unregisterWebhook` | Delete a webhook endpoint |
| GET | `/business/webhooks/:webhookEndpointId/deliveries` | `getDeliveries` | List deliveries for a webhook |
| POST | `/business/webhooks/:webhookEndpointId/test` | `testWebhook` | Send a test event to a webhook |

<!-- GENERATED:ENDPOINTS:END -->
