# Event System

The platform uses a **durable event bus** with a transactional outbox pattern for cross-module communication. Events survive process crashes and are delivered at-least-once.

## Architecture

```
Business Operation (within DB transaction)
  │
  ├── Write business data (orders, products, etc.)
  ├── Write event to platformEventOutbox table (same transaction)
  │
  ▼
Outbox Dispatcher (background worker)
  │
  ├── Claim pending events (FOR UPDATE SKIP LOCKED)
  ├── Dispatch to registered handlers
  ├── On success: mark as dispatched
  ├── On failure: retry with exponential backoff (2s base, 5min max)
  └── After 10 attempts: move to dead-letter queue
```

## Transport Providers

`eventBus.emit()` publishes through a pluggable transport selected by `EVENT_BUS_PROVIDER`. The transport is split into a **publisher** (producer side — `emit()`/`writeToOutbox`) and a **subscriber** (consumer side — receives payloads and feeds them to `eventBus.dispatch()`).

| Provider             | `EVENT_BUS_PROVIDER` | Required env vars                                              | Delivery                       |
| -------------------- | -------------------- | -------------------------------------------------------------- | ------------------------------ |
| In-process (default) | `memory`             | —                                                              | At-most-once, synchronous      |
| Postgres outbox      | `postgres`           | `POSTGRES_*`                                                   | At-least-once, DLQ, replay     |
| GCP Pub/Sub          | `gcp-pubsub`         | `GCP_PUBSUB_TOPIC`, `GCP_PUBSUB_SUBSCRIPTION`                  | At-least-once, topic DLQ       |
| AWS SQS              | `aws-sqs`            | `AWS_EVENT_QUEUE_URL`, `AWS_REGION`                            | At-least-once, queue DLQ       |
| Azure Service Bus    | `azure-servicebus`   | `AZURE_SERVICE_BUS_*` (connection string, topic, subscription) | At-least-once, dead-letter sub |

- Cloud SDKs (`@google-cloud/pubsub`, `@aws-sdk/client-sqs`, `@azure/service-bus`) are **optional peer dependencies**, lazy-imported only when the provider is configured. Install the one you need.
- `subscriber` is optional per-provider config: a publish-only node (e.g. a web tier) can set just the topic/ARN; a worker node also sets the subscription/queue to consume.
- The `postgres` provider writes every `emit()` to `platformEventOutbox` and the dispatcher drains it — use `writeToOutbox(tx, ...)` inside `withTransaction()` when the event must commit atomically with a business write.
- Provisioning each provider's topic/queue/DLQ is opt-in per cloud: `enable_pubsub` (GCP TF), `enable_servicebus` (Azure TF), `eventBusProvider` prop → `MessagingConstruct` (AWS CDK).

### Consumer topology

Subscribers are long-running receive loops (not cron) started at boot:
SQS long-polls, Pub/Sub streams, Service Bus holds an AMQP listener, the
postgres provider runs the outbox claim loop. `memory` needs no subscriber.

- **Same process (default)** — the web app consumes in-process. Fine for
  always-on deployments (VM, ECS, Cloud Run/Container Apps with
  `min_replicas >= 1`). Beware scale-to-zero: no replicas = no consumption.
- **Dedicated worker** — `worker.ts` runs only the event subscriber +
  scheduled jobs (no web stack). Deploy the same image with a different
  command: `yarn worker` (dev), `node worker.mjs` (prod — built by
  `yarn prd:build` alongside `app.mjs`), or `docker run <image> node ./worker.mjs`.
  Exposes `GET /health` on `PORT` (default 3001; `WORKER_NO_HTTP=1` disables).

## Emit & Handle

### Direct emission (fire-and-forget)

```typescript
import { eventBus } from '../../../libs/events/eventBus';

// Emit — publishes through the configured provider; memory handlers
// dispatch inline, durable providers write before dispatching.
await eventBus.emit('order.created', { orderId, customerId, total });
```

### Transactional outbox (durable)

```typescript
import { writeToOutbox } from '../../../libs/events/providers/postgres';

// Inside a DB transaction — event survives crashes
await writeToOutbox(
  knex,
  {
    eventType: 'order.created',
    payload: { orderId, customerId, total },
  },
  trx,
);
```

### Register handlers

Handlers are owned by each module in `modules/<name>/application/eventHandlers.ts` and wired in `boot/registerEventHandlers.ts`, gated by the module registry:

```typescript
import { eventBus } from '../../../libs/events/eventBus';

// Only registered if the module is enabled (shouldRegisterEvents)
export function registerNotificationEventHandlers(): void {
  eventBus.registerHandler('order.created', async payload => {
    await sendOrderConfirmationEmail(payload.data);
  });
}
```

````

## Naming Convention

Events follow `domain.action`.

| Domain            | Events                                                                                                                                                                                       |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `order`           | created, paid, shipped, completed, cancelled, refunded, delivered                                                                                                                            |
| `product`         | created, updated, deleted, published, unpublished, price_changed, viewed                                                                                                                     |
| `basket`          | created, item_added, item_removed, abandoned, converted_to_order                                                                                                                             |
| `checkout`        | started, updated, completed, abandoned                                                                                                                                                       |
| `customer`        | registered, verified, profile_updated, deactivated                                                                                                                                           |
| `payment`         | initiated, completed, failed, refunded                                                                                                                                                       |
| `inventory`       | stock_updated, low_stock, out_of_stock, reserved, released                                                                                                                                   |
| `review`          | created, approved, rejected                                                                                                                                                                  |
| `membership`      | subscribed, renewed, cancelled, upgraded, downgraded                                                                                                                                         |
| `loyalty`         | points_earned, points_redeemed, tier_changed                                                                                                                                                 |
| `subscription`    | created, renewed, cancelled, upgraded, downgraded, payment_failed                                                                                                                            |
| `identity` (SSO)  | sso.login, sso.config_created, sso.config_updated, sso.config_deleted, sso.provider_activated, sso.provider_deactivated                                                                      |
| `identity` (SCIM) | scim.user_provisioned, scim.user_deprovisioned, scim.user_updated                                                                                                                            |
| `tracking`        | config.created, config.updated, config.activated, config.disabled, event.processed, event.failed, event.consent_blocked, event.unmapped                                                      |
| `audit`           | log.recorded, chain.verified, chain.tampered                                                                                                                                                 |
| `integration`     | created, updated, deleted, credential.saved, credential.rotated, subscription.created, subscription.updated, subscription.deleted, dispatch.started, dispatch.completed, dispatch.failed     |
| `automation`      | rule.created, rule.updated, rule.deleted, rule.activated, rule.deactivated, rule.triggered, execution.completed, execution.failed                                                            |
| `returns`         | request.created, request.approved, request.denied, request.cancelled, request.in_transit, request.received, request.inspected, request.completed, store_credit.issued, store_credit.adjusted |
| `theme`           | created, updated, deleted, activated, archived, assigned, unassigned, override.saved, override.deleted                                                                                       |
| `pagebuilder`     | draft.created, draft.updated, draft.deleted, block.added, block.updated, block.removed, block.moved, draft.published, draft.unpublished, draft.previewed                                     |
| `segment`         | created, updated, deleted, evaluated, member.added, member.removed, profile.computed                                                                                                         |
| `marketplace`     | vendor.created, vendor.updated, vendor.approved, vendor.suspended, commission_rule.created, commission_rule.updated, payout.created, payout.processed, payout.completed, payout.failed       |

## Postgres Provider (outbox)

The outbox stack lives entirely under `libs/events/providers/postgres/` and
only runs when `EVENT_BUS_PROVIDER=postgres`:

- `outboxWriter.ts` — `emit()` row insert + `writeToOutbox(tx)` for
  transactional writes
- `outboxDispatcher.ts` — the subscriber: claim-based polling loop started
  by `startEventSubscriber()` in `app.ts`/`worker.ts`
- `index.ts` — provider surface (transport + `writeToOutbox` + DLQ admin API)

Dispatcher details:

- **Polling interval**: 2 seconds (configurable)
- **Claim strategy**: `FOR UPDATE SKIP LOCKED` (multi-node safe)
- **Max attempts**: 10 before dead-letter
- **Backoff**: Exponential, 2s base, 5min cap
- **Dead-letter replay**: `replayEvent(eventId)` and `replayAllDeadLetter()`
- **Stats**: `getOutboxStats()` returns pending, dispatched, failed, dead-letter counts
- **Cleanup**: `cleanupProcessedEvents(olderThanDays)` removes successfully dispatched events

### Environment flags

| Flag                | Effect                                                    |
| ------------------- | --------------------------------------------------------- |
| `EVENT_BUS_PROVIDER` | Transport provider (see above; default `memory`)         |
| `OUTBOX_DISABLED=1` | Legacy alias — forces the `memory` provider (overrides `EVENT_BUS_PROVIDER`) |
| `CRON_DISABLED=1`   | Skip scheduled jobs startup                               |

## Analytics Handlers

Event handlers are registered in `boot/analyticsEventHandler.ts` and automatically track events for analytics dashboards. Each handler is gated by `moduleRegistry.shouldRegisterEvents(module)`.

## Domain Events (inside modules)

Modules also expose their own domain event classes under `modules/[mod]/domain/events/`:

```typescript
export class ProductCreatedEvent {
  constructor(
    public readonly productId: string,
    public readonly name: string,
    public readonly timestamp: Date = new Date(),
  ) {}
}
````

These are emitted through the event bus using the corresponding `product.created` identifier.
