# Order – Customer EARS Requirements

> **System**: CommerceFull – `order` module (customer-facing surface)
> **Actor**: Customer (authenticated end-user shopping the storefront / `/customer` API)
> **Date**: 2026-04-28
> **Source**: `docs/modules/order.md`, `modules/order/`, `modules/order/interface/routers/customerRouter.ts`, integration tests at `tests/integration/order/order.test.ts`

This spec is the canonical example for how to organise an EARS spec under `docs/specs/`. It covers everything a customer can do with the `order` module via the `/customer` API and via the storefront. Merchant- and admin-side requirements live in sibling files (`merchant.md`, `admin.md`) and are not duplicated here.

---

## Context

A customer interacts with the `order` module to place orders during checkout, view their own orders, and cancel orders that have not yet shipped. All requests are authenticated via the customer session / bearer token enforced by `isCustomerLoggedIn`. The customer sees only their own orders; cross-customer access must always return 404.

### Actors

| Actor    | Role                                                                                |
| -------- | ----------------------------------------------------------------------------------- |
| Customer | Authenticated end-user; places, views, and cancels their own orders                 |
| System   | Generates order numbers, computes totals, emits domain events, enforces transitions |

### Order status state machine (customer-visible subset)

Source of truth: `modules/order/domain/valueObjects/OrderStatus.ts` (`OrderStatusTransitions`).

| From              | To (allowed)                                                 |
| ----------------- | ------------------------------------------------------------ |
| `PENDING`         | `PROCESSING`, `PAYMENT_PENDING`, `CANCELLED`, `FAILED`       |
| `PAYMENT_PENDING` | `PENDING`, `PROCESSING`, `PAYMENT_FAILED`, `CANCELLED`       |
| `PROCESSING`      | `SHIPPED`, `ON_HOLD`, `BACKORDERED`, `CANCELLED`, `REFUNDED` |
| `SHIPPED`         | `DELIVERED`, `REFUNDED`                                      |
| `DELIVERED`       | `COMPLETED`, `REFUNDED`                                      |
| `COMPLETED`       | `REFUNDED`                                                   |
| `CANCELLED`       | _(terminal)_                                                 |
| `REFUNDED`        | _(terminal)_                                                 |

Customer self-cancel is allowed only while `canBeCancelled` is true on the `Order` entity, i.e. status ∈ {`PENDING`, `PROCESSING`, `PAYMENT_PENDING`} (see `Order.ts` getter).

### Policy defaults

| Policy                      | Default                                            |
| --------------------------- | -------------------------------------------------- |
| Customer self-cancel window | While `canBeCancelled` is true (pre-shipping)      |
| Default currency            | `USD` (used when `currencyCode` not provided)      |
| Billing address fallback    | Shipping address used when billing not provided    |
| Order source                | Provided by client; defaults set in `Order.create` |

---

## 1. Ubiquitous Requirements

These hold for every customer interaction with `order`, regardless of state or event.

1. The system shall associate every order with a `customerEmail`, a non-empty list of order items, a shipping address, a `currencyCode`, and an `orderNumber` generated on create.
2. The system shall enforce the `OrderStatusTransitions` table and reject any transition not listed.
3. The system shall persist an audit record of every status change via `OrderRepository.recordStatusChange`.
4. The system shall return all customer-facing fields in camelCase (e.g. `orderId`, `orderNumber`, `customerId`, `paymentStatus`, `totalAmount`) and shall never expose snake_case property names in API responses.
5. The system shall scope every `/customer/order*` query by the authenticated `customerId` and shall never return an order belonging to another customer.
6. The system shall return responses in the wrapper `{ success: boolean, data: ... }` for all `/customer/order*` endpoints.
7. The system shall require authentication on every `/customer/order*` route via `isCustomerLoggedIn` and respond with 401 when authentication is missing or invalid.

---

## 2. Event-Driven Requirements

### 2.1 Listing my orders

1. **When** the customer issues `GET /customer/order`, **the system shall** return the authenticated customer's orders as `{ success: true, data: <orders> }`, where each order includes at minimum `orderId`, `orderNumber`, `customerId`, `status`, `paymentStatus`, `fulfillmentStatus`, and `totalAmount`.

### 2.2 Viewing a single order

2. **When** the customer issues `GET /customer/order/:orderId` for an order they own, **the system shall** return the order with its `items` array, where each item exposes `orderItemId`, `productId`, `productVariantId`, `unitPrice`, and quantity in camelCase.
3. **When** the customer issues `GET /customer/order/number/:orderNumber` for an order number they own, **the system shall** return the same order representation as `GET /customer/order/:orderId`.

### 2.3 Placing an order

An `Order` is created in **exactly two ways** for a customer:

#### 2.3.A Canonical flow — via `checkout` (🚧 Proposed)

4. **When** the customer issues `POST /customer/checkout/:checkoutId/payment-intent` (owned by the `checkout` module — see `docs/specs/checkout/customer.md` §2.7), **the system shall** invoke `CreateOrderUseCase` to create an `Order` with `status = PAYMENT_PENDING`, `paymentStatus = 'pending'`, copying items, addresses, shipping method, customer email, currency, and totals from the `CheckoutSession`, persist `orderId` on the session, and emit `order.created` with `{ orderId, orderNumber, customerId, totalAmount, currency }`.

This is the **only customer-facing path** that should produce an `Order` in production; the `Order` lives in `PAYMENT_PENDING` until the gateway webhook reports the outcome (§2.5).

#### 2.3.B Direct path — `POST /customer/order` (legacy / admin / API consumer)

5. **When** a request reaches `POST /customer/order` with at least one item, a `customerEmail`, and a `shippingAddress`, **the system shall**:
   1. generate a UUID `orderId` and an `orderNumber`,
   2. create the order with default initial `status`, `paymentStatus`, and `fulfillmentStatus` per `Order.create`,
   3. persist all order items, the shipping address, and the billing address (falling back to shipping when not provided),
   4. compute totals (`subtotal`, `discountTotal`, `taxTotal`, `shippingTotal`, `totalAmount`, `totalItems`, `totalQuantity`),
   5. emit `order.created` on the `eventBus` with `{ orderId, orderNumber, customerId, totalAmount, currency }`,
   6. respond with HTTP `201` and `{ success: true, data: { orderId, orderNumber, ... } }`.

   This endpoint bypasses `checkout` and is intended for direct API integrations, data import, and the existing integration tests in `tests/integration/order/order.test.ts`. Storefront UIs should use the canonical flow (2.3.A).

### 2.4 Cancelling my own order

6. **When** the customer issues `POST /customer/order/:orderId/cancel` for an order they own while `canBeCancelled` is true, **the system shall**:
   1. transition the order to `CANCELLED`,
   2. set `cancelledAt`,
   3. record the status change via `recordStatusChange`,
   4. emit `order.cancelled` on the `eventBus` with `{ orderId, orderNumber, customerId, reason, totalAmount }`,
   5. respond with HTTP `200` and `{ success: true, data: { orderId, orderNumber, status: 'cancelled', cancelledAt, reason } }`.

### 2.5 Payment outcome (system-driven, 🚧 Proposed)

Driven by the `payment` module's gateway webhook handler invoking `UpdateOrderStatusUseCase`, not by a customer endpoint.

7. **When** the gateway reports a successful capture for an order in `PAYMENT_PENDING`, **the system shall** transition the order `PAYMENT_PENDING → PROCESSING`, set `paymentStatus = 'paid'`, record the status change, and emit `order.paid` with `{ orderId, orderNumber, customerId, totalAmount }`.
8. **When** the gateway reports a payment failure for an order in `PAYMENT_PENDING`, **the system shall** transition the order `PAYMENT_PENDING → PAYMENT_FAILED`, record the status change, release any inventory reservation, and emit `order.payment_failed` with `{ orderId, orderNumber, customerId, reason }`. The customer may retry via a fresh `CheckoutSession` and a new payment intent.
9. **When** the customer retries payment, **the system shall** allow the transition `PAYMENT_FAILED → PAYMENT_PENDING` initiated by `payment` (per `OrderStatusTransitions`).

---

## 3. State-Driven Requirements

1. **While** an order is in `PENDING`, `PAYMENT_PENDING`, or `PROCESSING`, **the system shall** allow the customer to cancel it via `POST /customer/order/:orderId/cancel`.
2. **While** an order is in `SHIPPED`, `DELIVERED`, `COMPLETED`, `ON_HOLD`, `BACKORDERED`, `CANCELLED`, `REFUNDED`, `FAILED`, or `PAYMENT_FAILED`, **the system shall** prevent customer self-cancellation.
3. **While** an order is in `CANCELLED` or `REFUNDED`, **the system shall** prevent any further status transition initiated by the customer.

---

## 4. Optional Feature Requirements

1. **Where** multi-currency is enabled and the request supplies `currencyCode`, **the system shall** persist the order using that currency and freeze unit prices using `Money.create(amount, currency)`.
2. **Where** gift wrapping is enabled, **the system shall** persist `hasGiftWrapping`, `giftMessage`, and `isGift` on the order when supplied at creation time.
3. **Where** customer email notifications are enabled (handled by the `notification` module), **the system shall** dispatch an order-confirmation email when `order.created` is emitted.
4. **Where** the `referralSource`, `ipAddress`, or `userAgent` fields are supplied at creation, **the system shall** persist them for analytics without exposing them on the customer response.

---

## 5. Unwanted Behaviour / Edge Cases

### 5.1 Authentication & authorisation

1. **If** any `/customer/order*` request arrives without a valid customer session / bearer token, **then** the system shall respond with HTTP `401`.
2. **If** the customer issues `GET /customer/order/:orderId` for an order belonging to another customer (or a non-existent id), **then** the system shall respond with HTTP `404` and shall never disclose existence.
3. **If** the customer issues `POST /customer/order/:orderId/cancel` for an order belonging to another customer, **then** the system shall reject with the `'You do not have permission to cancel this order'` error surfaced as HTTP `403` (or `404` if existence cannot be confirmed).

### 5.2 Order creation validation

4. **If** `POST /customer/order` is submitted with an empty `items` array, **then** the system shall reject with `'Order must contain at least one item'`.
5. **If** `POST /customer/order` is submitted without `customerEmail`, **then** the system shall reject with `'Customer email is required'`.
6. **If** `POST /customer/order` is submitted without `shippingAddress`, **then** the system shall reject with `'Shipping address is required'`.

### 5.3 Cancellation guards

7. **If** the customer attempts to cancel an order that has progressed past `canBeCancelled` (i.e. `SHIPPED`, `DELIVERED`, `COMPLETED`, `CANCELLED`, `REFUNDED`, etc.), **then** the system shall reject with `Order cannot be cancelled. Current status: <status>`.
8. **If** the customer attempts to cancel a non-existent order, **then** the system shall reject with `'Order not found'` (HTTP `404`).

### 5.4 State-machine guards

9. **If** any status update would violate `OrderStatusTransitions`, **then** the system shall reject with `Cannot transition order from <current> to <next>`, surfaced as HTTP `400`.

---

## 6. Complex Requirements

1. **When** the canonical flow is invoked (§2.3.A) **while** the `CheckoutSession` is `active` and `isReadyForPayment`, **the system shall** simultaneously: generate `orderId` and `orderNumber`, create order items priced via `Money`, copy shipping and billing addresses from the session, compute totals, save the aggregate in `PAYMENT_PENDING`, and emit `order.created`.
2. **When** `POST /customer/order` is invoked directly (§2.3.B) with valid items, addresses, and email, **the system shall** simultaneously: generate `orderId` and `orderNumber`, create order items, persist addresses, compute totals, save the aggregate, and emit `order.created`.
3. **When** the customer cancels an order **while** the order is in `PENDING`, `PAYMENT_PENDING`, or `PROCESSING`, **the system shall** simultaneously: transition status to `CANCELLED`, set `cancelledAt`, record the status change for audit, and emit `order.cancelled`.

---

## 7. Lifecycle Summary

```
Canonical (🚧 Proposed):                              Direct (§2.3.B):
POST /customer/checkout/:id/payment-intent             POST /customer/order
                  │                                                  │
                  ▼                                                  ▼
          PAYMENT_PENDING                                          PENDING
                  │                                                  │
  [gateway webhook]                                                  │
                  ├── paid       ──► PROCESSING                    ├──► PROCESSING
                  ├── fails      ──► PAYMENT_FAILED                ├──► PAYMENT_PENDING (→ webhook)
                  └── retry      PAYMENT_FAILED ──► PAYMENT_PENDING
                                                                     └──► CANCELLED / FAILED

PROCESSING ──► ON_HOLD / BACKORDERED ──► PROCESSING
PROCESSING ──► SHIPPED ──► DELIVERED ──► COMPLETED ──► REFUNDED (terminal)
any of {SHIPPED, DELIVERED, COMPLETED}                  ──► REFUNDED (terminal)

Customer self-cancel allowed while status ∈ {PENDING, PAYMENT_PENDING, PROCESSING} ──► CANCELLED (terminal)
```

| Policy                      | Default                                               |
| --------------------------- | ----------------------------------------------------- |
| Customer self-cancel window | While status ∈ {PENDING, PAYMENT_PENDING, PROCESSING} |
| Default currency            | `USD`                                                 |
| Billing address fallback    | Shipping address                                      |

---

## 8. Use Case Traceability

Every event-driven and complex requirement above is implemented by exactly one use case (or by the customer controller delegating to it).

| #       | Requirement (summary)                                           | Use Case                                                                     | Source File                                                                                                                                    |
| ------- | --------------------------------------------------------------- | ---------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| 2.1.1   | List my orders → `GET /customer/order`                          | `GetCustomerOrdersUseCase`                                                   | `modules/order/application/useCases/GetCustomerOrders.ts`                                                                                      |
| 2.2.2   | View one of my orders → `GET /customer/order/:id`               | `GetOrderUseCase`                                                            | `modules/order/application/useCases/GetOrder.ts`                                                                                               |
| 2.2.3   | View order by number → `GET /customer/order/number/:n`          | `GetOrderUseCase`                                                            | `modules/order/application/useCases/GetOrder.ts`                                                                                               |
| 2.3.A.4 | 🚧 Canonical: payment-intent creates order in `PAYMENT_PENDING` | `CreateOrderUseCase` (invoked by `CreatePaymentIntentUseCase` in `checkout`) | `modules/order/application/useCases/CreateOrder.ts` (called from `modules/checkout/application/useCases/CreatePaymentIntent.ts` — to be added) |
| 2.3.B.5 | Direct: `POST /customer/order`                                  | `CreateOrderUseCase`                                                         | `modules/order/application/useCases/CreateOrder.ts`                                                                                            |
| 2.4.6   | Cancel my order → `POST /customer/order/:id/cancel`             | `CancelOrderUseCase`                                                         | `modules/order/application/useCases/CancelOrder.ts`                                                                                            |
| 2.5.7   | 🚧 Payment captured → `PROCESSING`                              | `UpdateOrderStatusUseCase` (invoked by `payment` webhook handler)            | `modules/order/application/useCases/UpdateOrderStatus.ts`                                                                                      |
| 2.5.8   | 🚧 Payment failed → `PAYMENT_FAILED`                            | `UpdateOrderStatusUseCase` (invoked by `payment` webhook handler)            | same                                                                                                                                           |
| 2.5.9   | 🚧 Payment retry → `PAYMENT_FAILED → PAYMENT_PENDING`           | `UpdateOrderStatusUseCase` (invoked by `payment`)                            | same                                                                                                                                           |
| 6.2     | Status-change audit on cancel                                   | `CancelOrderUseCase` + `OrderRepository.recordStatusChange`                  | `modules/order/application/useCases/CancelOrder.ts`                                                                                            |

### Controller wiring

| Endpoint                                  | Controller handler                                                                               |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `GET /customer/order`                     | `orderController.getMyOrders` (`modules/order/interface/controllers/OrderCustomerController.ts`) |
| `GET /customer/order/number/:orderNumber` | `orderController.getOrderByNumber`                                                               |
| `GET /customer/order/:orderId`            | `orderController.getOrder`                                                                       |
| `POST /customer/order`                    | `orderController.createOrder`                                                                    |
| `POST /customer/order/:orderId/cancel`    | `orderController.cancelOrder`                                                                    |

Routes are mounted in `modules/order/interface/routers/customerRouter.ts` and registered in `boot/routes.ts` under the `/customer` prefix.

### Event wiring

```
POST /customer/order  ──► CreateOrderUseCase  ──► eventBus.emit('order.created')
                                                       │
                                                       ├─► [optional] notification subscriber → confirmation email
                                                       ├─► [optional] inventory subscriber    → reserve stock
                                                       └─► [optional] analytics subscriber    → record creation

POST /customer/order/:id/cancel ──► CancelOrderUseCase ──► eventBus.emit('order.cancelled')
                                                                 │
                                                                 ├─► [optional] inventory subscriber → release reservation
                                                                 └─► [optional] notification subscriber → cancellation email
```

Subscribers are registered in `libs/events/registerEventHandlers.ts`.

---

## 9. API Test Coverage

Every requirement in this spec must be backed by at least one integration test in `tests/integration/order/order.test.ts`. The mapping below is the contract: a requirement without a test is incomplete, and a test without a requirement is unreviewable.

| Requirement                             | Test (describe → it)                                                                                               |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| 1.4 (camelCase only)                    | `Admin Order Operations` → `should get all orders (admin)` (covers same response shape used by customer endpoints) |
| 1.5 / 5.1.2 (cross-customer 404)        | `Customer Order Operations` → `should prevent customers from accessing orders that are not theirs`                 |
| 1.7 / 5.1.1 (auth required)             | `Authorization Tests` → `should require authentication for customer orders`, `should reject invalid tokens`        |
| 2.1.1 (list my orders)                  | `Customer Order Operations` → `should get customer orders`                                                         |
| 2.2.2 (view my order + camelCase items) | `Customer Order Operations` → `should get order details for customer`                                              |
| 2.2.3 (lookup by number)                | `Order Lookup by Number (UC-ORD-003)` → `should get order by order number (customer)`                              |
| 2.3.4 (create order, 201)               | `Order Creation Flow` → `should create a new order`                                                                |
| 2.4.5 / 3.1 (self-cancel allowed)       | `Customer Order Operations` → `should allow customers to cancel their order`                                       |
| 5.4.9 (invalid transition rejected)     | `Admin Order Operations` → `should update an order status (admin)` (asserts 400 branch on illegal transition)      |

### Required additional tests (gaps)

The following requirements are **not yet covered** by `order.test.ts`. Add tests before merging changes that touch these paths:

- **5.2.4 / 5.2.5 / 5.2.6** — Validation errors for `POST /customer/order` (empty items, missing email, missing shipping address). Add an `Order Creation Validation` describe block.
- **5.3.7** — Customer cancel attempt on a `SHIPPED` order returns the `Order cannot be cancelled` error.
- **5.3.8** — Customer cancel of non-existent `orderId` returns 404.
- **2.3.4 (event emission)** — Assert that `order.created` is emitted with the documented payload (use a test event-bus spy, not an HTTP probe).
- **2.4.5 (event emission)** — Assert that `order.cancelled` is emitted on successful self-cancel.
- **4.x** — Optional-feature smoke tests: order creation with `currencyCode = 'EUR'`, with `hasGiftWrapping`/`giftMessage`/`isGift`, and with `referralSource`/`ipAddress`/`userAgent`.

When adding new requirements to sections 2–6, add a row to the table above and a corresponding `it(...)` block in `order.test.ts`. Cross-reference the requirement number in the test name (e.g. `it('REQ 2.3.4 — places an order with valid input', ...)`) to keep the link explicit.

---

## 10. Related Specs and Boundary with `checkout` / `payment`

- **Pre-checkout cart** (items only, no addresses or totals) is owned by `basket`. See `docs/specs/basket/customer.md` (to be added).
- **Customer-facing checkout flow** is owned by `checkout`. See `docs/specs/checkout/customer.md`.
- **Payment authorisation and capture** are owned by `payment`. The gateway webhook handler in `payment` invokes `UpdateOrderStatusUseCase` to drive the transitions in §2.5.
- **Quote-driven orders** (B2B negotiated pricing) are owned by `b2b`. See `docs/specs/b2b/buyer.md` (to be added).

### "Draft order" terminology

There is **no `DRAFT` status on `Order`**. The customer-side **"draft order"** is an `Order` row in `PAYMENT_PENDING` status:

- **Created** by `CreatePaymentIntentUseCase` in `checkout` (🚧 proposed) when the customer requests a payment intent at the end of the checkout flow.
- **Promoted** to `PROCESSING` by the gateway webhook on successful capture (§2.5.7).
- **Failed** to `PAYMENT_FAILED` (recoverable) on capture failure (§2.5.8).
- **Cancelled** by `CancelOrderUseCase` (customer self-cancel §2.4 or session abandonment).

Key invariants:

- The `Order` row exists in the database during `PAYMENT_PENDING` so reconciliation works even if the customer drops the session before the webhook arrives.
- No inventory is **deducted** in `PAYMENT_PENDING` — only **reserved** (handled by an inventory subscriber on `order.created`). Reservations are released on `order.cancelled` / `order.payment_failed`.
- `POST /customer/order` (§2.3.B) is preserved as a non-checkout escape hatch but is not the canonical customer path.

An earlier draft of this spec proposed a separate `DRAFT` status on `Order`; it was removed because `OrderStatus.PAYMENT_PENDING` already covers exactly this role.
