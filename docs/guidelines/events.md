# Event System

The platform uses a Node.js `EventEmitter`-based event bus (`libs/events/eventBus.ts`) for cross-module communication.

## Emit & Handle

```typescript
import { emitEvent } from '../../../libs/events';

// Emit
emitEvent('order.created', { orderId, customerId, total });

// Register (in libs/events/registerEventHandlers.ts)
registerHandler('order.created', async data => {
  await sendOrderConfirmationEmail(data);
  await updateInventory(data);
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
| `identity` (SSO) | sso.login, sso.config_created, sso.config_updated, sso.config_deleted, sso.provider_activated, sso.provider_deactivated |
| `identity` (SCIM) | scim.user_provisioned, scim.user_deprovisioned, scim.user_updated |
| `tracking`  | config.created, config.updated, config.activated, config.disabled, event.processed, event.failed, event.consent_blocked, event.unmapped |

## Analytics Handlers

Event handlers are registered in `boot/analyticsEventHandler.ts` and automatically track events for analytics dashboards.

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
