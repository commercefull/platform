# Event System

The platform uses a **durable event bus** with a transactional outbox pattern for cross-module communication. Events survive process crashes and are delivered at-least-once.

## Architecture

```
Business Operation (within DB transaction)
  │
  ├── Write business data (orders, products, etc.)
  ├── Write event to eventOutbox table (same transaction)
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

## Emit & Handle

### Direct emission (fire-and-forget)

```typescript
import { emitEvent } from '../../../libs/events';

// Emit — handler errors are logged but swallowed
emitEvent('order.created', { orderId, customerId, total });
```

### Transactional outbox (durable)

```typescript
import { writeToOutbox } from '../../../libs/events/outboxWriter';

// Inside a DB transaction — event survives crashes
await writeToOutbox(knex, {
  eventType: 'order.created',
  payload: { orderId, customerId, total },
}, trx);
```

### Register handlers

Handlers are registered in `libs/events/registerEventHandlers.ts` and gated by the module registry:

```typescript
import { registerHandler } from '../eventBus';

// Only registered if the 'notification' module is enabled
registerHandler('order.created', async data => {
  await sendOrderConfirmationEmail(data);
});
```

## Naming Convention

Events follow `domain.action`.

| Domain       | Events                                                                   |
| ------------ | ------------------------------------------------------------------------ |
| `order`      | created, paid, shipped, completed, cancelled, refunded, delivered        |
| `product`    | created, updated, deleted, published, unpublished, price_changed, viewed |
| `basket`     | created, item_added, item_removed, abandoned, converted_to_order         |
| `checkout`   | started, updated, completed, abandoned                                   |
| `customer`   | registered, verified, profile_updated, deactivated                       |
| `payment`    | initiated, completed, failed, refunded                                   |
| `inventory`  | stock_updated, low_stock, out_of_stock, reserved, released               |
| `review`     | created, approved, rejected                                              |
| `membership` | subscribed, renewed, cancelled, upgraded, downgraded                     |
| `loyalty`    | points_earned, points_redeemed, tier_changed                             |
| `subscription` | created, renewed, cancelled, upgraded, downgraded, payment_failed     |
| `identity` (SSO) | sso.login, sso.config_created, sso.config_updated, sso.config_deleted, sso.provider_activated, sso.provider_deactivated |
| `identity` (SCIM) | scim.user_provisioned, scim.user_deprovisioned, scim.user_updated |
| `tracking`   | config.created, config.updated, config.activated, config.disabled, event.processed, event.failed, event.consent_blocked, event.unmapped |
| `audit`      | log.recorded, chain.verified, chain.tampered                             |
| `integration` | created, updated, deleted, credential.saved, credential.rotated, subscription.created, subscription.updated, subscription.deleted, dispatch.started, dispatch.completed, dispatch.failed |
| `automation` | rule.created, rule.updated, rule.deleted, rule.activated, rule.deactivated, rule.triggered, execution.completed, execution.failed |
| `returns`    | request.created, request.approved, request.denied, request.cancelled, request.in_transit, request.received, request.inspected, request.completed, store_credit.issued, store_credit.adjusted |
| `theme`      | created, updated, deleted, activated, archived, assigned, unassigned, override.saved, override.deleted |
| `pagebuilder` | draft.created, draft.updated, draft.deleted, block.added, block.updated, block.removed, block.moved, draft.published, draft.unpublished, draft.previewed |
| `segment`    | created, updated, deleted, evaluated, member.added, member.removed, profile.computed |
| `marketplace` | vendor.created, vendor.updated, vendor.approved, vendor.suspended, commission_rule.created, commission_rule.updated, payout.created, payout.processed, payout.completed, payout.failed |

## Outbox Dispatcher

The dispatcher runs as a background worker started in `app.ts`:

- **Polling interval**: 2 seconds (configurable)
- **Claim strategy**: `FOR UPDATE SKIP LOCKED` (multi-node safe)
- **Max attempts**: 10 before dead-letter
- **Backoff**: Exponential, 2s base, 5min cap
- **Dead-letter replay**: `replayEvent(eventId)` and `replayAllDeadLetter()`
- **Stats**: `getOutboxStats()` returns pending, dispatched, failed, dead-letter counts
- **Cleanup**: `cleanupDispatchedEvents(olderThanDays)` removes successfully dispatched events

### Environment flags

| Flag | Effect |
|------|--------|
| `OUTBOX_DISABLED=1` | Skip dispatcher startup (unit tests, CI) |
| `CRON_DISABLED=1` | Skip scheduled jobs startup |

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
```

These are emitted through the event bus using the corresponding `product.created` identifier.
