# CommerceFull EARS Specifications

> **Purpose**: Canonical requirements for all customer-facing, merchant-facing, and system-driven flows in CommerceFull, written in EARS (Easy Approach to Requirements Syntax).

---

## What is EARS?

EARS is a structured requirements syntax that eliminates ambiguity. Every requirement follows one of five patterns:

| Pattern | Template | Example |
|---------|----------|---------|
| **Ubiquitous** | The system shall... | The system shall return all fields in camelCase. |
| **Event-driven** | **When** \<trigger\>, **the system shall** \<response\>. | **When** the customer submits an order, **the system shall** emit `order.created`. |
| **State-driven** | **While** \<state\>, **the system shall** \<response\>. | **While** an order is `PENDING`, **the system shall** allow cancellation. |
| **Optional** | **Where** \<feature\>, **the system shall** \<response\>. | **Where** multi-currency is enabled, **the system shall** persist the order currency. |
| **Unwanted** | **If** \<condition\>, **then** \<response\>. | **If** the basket is empty, **then** reject with `'Cannot checkout with empty basket'`. |

See `docs/specs/EARS-GUIDE.md` for full syntax rules.

---

## Spec Organization

Each module has one or more spec files organized by actor:

```
docs/specs/
├── EARS-GUIDE.md              # Syntax reference
├── README.md                  # This file
├── checkout/
│   ├── customer.md            # Customer-facing checkout flow
│   └── tasks.md               # Implementation tasks for checkout × order × payment integration
├── order/
│   └── customer.md            # Customer-facing order operations
├── payment/
│   └── customer.md            # Customer transactions + gateway webhook (inbound)
└── webhook/
    └── merchant.md            # Merchant webhook endpoints (outbound event delivery)
```

### Naming Convention

- `customer.md` — requirements for the `/customer` API (authenticated end-user).
- `merchant.md` — requirements for the `/business` API (authenticated merchant).
- `admin.md` — requirements for the `/admin` portal (authenticated admin).
- `tasks.md` — implementation tasks derived from the spec (not EARS — just a checklist).

---

## Checkout → Order → Payment Flow

The canonical customer purchase flow spans three modules:

```
1. Customer initiates checkout from basket
   └─► checkout/customer.md §2.1

2. Customer sets addresses, shipping method, payment method, coupon
   └─► checkout/customer.md §2.3–2.6

3. Customer requests payment intent
   └─► checkout/customer.md §2.7 (🚧 Proposed)
        ├─► CreatePaymentIntentUseCase (checkout)
        │     ├─► CreateOrderUseCase (order) → Order in PAYMENT_PENDING
        │     └─► InitiatePaymentUseCase (payment) → PaymentTransaction in PENDING
        └─► Emit order.created, checkout.payment_initiated

4. Customer authorizes payment client-side (Stripe.js, etc.)

5. Gateway posts webhook to /payment/webhook
   └─► payment/customer.md §2.2–2.3 (🚧 Proposed)
        ├─► Verify signature
        ├─► transaction.markAsPaid() or transaction.fail()
        ├─► UpdateOrderStatusUseCase → Order PAYMENT_PENDING → PROCESSING | PAYMENT_FAILED
        ├─► session.markPaymentAuthorized() or session.markPaymentFailed()
        └─► Emit order.paid | order.payment_failed, checkout.payment_captured | checkout.failed

6. Customer confirms completion (idempotent)
   └─► checkout/customer.md §2.8
        └─► CompleteCheckoutUseCase → Session processing → completed
             └─► Emit checkout.completed

7. Merchant webhook endpoints receive all events
   └─► webhook/merchant.md §2.2
        └─► WebhookDispatchService forwards order.created, order.paid, checkout.completed, etc.
```

### Implementation Status

| Step | Status | Spec | Tasks |
|------|--------|------|-------|
| 1–2 | ✅ Implemented | `checkout/customer.md §2.1–2.6` | — |
| 3 | 🚧 Proposed | `checkout/customer.md §2.7` | `checkout/tasks.md` task 1 |
| 5 | 🚧 Proposed | `payment/customer.md §2.2–2.3` | `checkout/tasks.md` task 3 |
| 6 | ⚠️ Partial (TODO) | `checkout/customer.md §2.8` | `checkout/tasks.md` task 2 |
| 7 | ✅ Implemented | `webhook/merchant.md §2.2` | — |

---

## Cross-Module Boundaries

### Checkout ↔ Order

- **Boundary**: `CreatePaymentIntentUseCase` (checkout) calls `CreateOrderUseCase` (order) to create an `Order` in `PAYMENT_PENDING`.
- **Invariant**: There is **no `DRAFT` status on `Order`**. The customer-side "draft order" is `PAYMENT_PENDING`.
- **Spec refs**: `checkout/customer.md §10`, `order/customer.md §10`.

### Payment ↔ Order

- **Boundary**: The gateway webhook handler (payment) calls `UpdateOrderStatusUseCase` (order) to transition `PAYMENT_PENDING → PROCESSING | PAYMENT_FAILED`.
- **Invariant**: The `payment` module does not own order status — it only drives transitions via the order module's use case.
- **Spec refs**: `payment/customer.md §2.2–2.3`, `order/customer.md §2.5`.

### Payment ↔ Checkout

- **Boundary**: The gateway webhook handler (payment) calls `session.markPaymentAuthorized()` / `session.markPaymentFailed()` to advance the checkout session.
- **Invariant**: The `payment` module does not own checkout status — it mutates the session via its domain methods.
- **Spec refs**: `payment/customer.md §2.2–2.3`, `checkout/customer.md §2.9`.

### Inventory ↔ Order

- **Boundary**: An inventory subscriber on `order.created` / `order.cancelled` / `order.payment_failed` reserves / releases stock.
- **Invariant**: No inventory is **deducted** in `PAYMENT_PENDING` — only **reserved**. Reservations are released on cancellation or payment failure.
- **Spec refs**: `order/customer.md §10`, `checkout/tasks.md` task 4.

---

## Test Coverage

Every requirement in every spec must be backed by at least one integration test. The mapping is documented in each spec's §9 (or equivalent).

| Module | Test File | Coverage |
|--------|-----------|----------|
| `checkout` | `tests/integration/checkout/checkout.test.ts` | `checkout/customer.md §9` |
| `order` | `tests/integration/order/order.test.ts` | `order/customer.md §9` |
| `payment` | `tests/integration/payment/payment.test.ts` (🚧) | `payment/customer.md §8` |
| `webhook` | `tests/integration/webhook/webhook.test.ts` (🚧) | `webhook/merchant.md §7` |

---

## Implementation Roadmap

To complete the checkout → order → payment flow:

1. **Read** `docs/specs/checkout/tasks.md` — 5 tasks in dependency order.
2. **Implement** tasks 1–4 (use cases, webhook handler, inventory subscriber).
3. **Add** the integration tests listed in task 5.
4. **Verify** all requirements in `checkout/customer.md`, `order/customer.md`, and `payment/customer.md` are covered.

The `webhook` module requires no changes — it already dispatches all events.

---

## Further Reading

- [EARS-GUIDE.md](./EARS-GUIDE.md) — Full EARS syntax reference
- [checkout/customer.md](./checkout/customer.md) — Checkout flow requirements
- [order/customer.md](./order/customer.md) — Order lifecycle requirements
- [payment/customer.md](./payment/customer.md) — Payment and gateway webhook requirements
- [webhook/merchant.md](./webhook/merchant.md) — Outbound webhook delivery requirements
- [checkout/tasks.md](./checkout/tasks.md) — Implementation tasks for the full flow
