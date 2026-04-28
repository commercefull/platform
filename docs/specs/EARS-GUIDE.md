# How to Write an EARS Specification

> **EARS** = Easy Approach to Requirements Syntax
> **Scope**: CommerceFull platform — all bounded contexts under `modules/`
> **Location**: All specs live under `docs/specs/[module]/[actor-or-feature].md`

---

## What is EARS?

EARS is a structured natural-language syntax for writing software requirements. It eliminates ambiguity by forcing every requirement into one of five sentence patterns. Each pattern maps to a specific type of system behaviour, making requirements easy to read, review, and trace to code.

The five patterns are:

| Pattern                | Trigger                | Template                                                 |
| ---------------------- | ---------------------- | -------------------------------------------------------- |
| **Ubiquitous**         | Always true            | `The system shall [action].`                             |
| **Event-Driven**       | Triggered by an event  | `When [event], the system shall [action].`               |
| **State-Driven**       | True while in a state  | `While [state], the system shall [action].`              |
| **Optional Feature**   | Feature flag or config | `Where [feature is enabled], the system shall [action].` |
| **Unwanted Behaviour** | Error or edge case     | `If [condition], then the system shall [action].`        |

A sixth pattern combines two or more of the above for complex rules:

| Pattern     | Template                                                 |
| ----------- | -------------------------------------------------------- |
| **Complex** | `When [event] while [state], the system shall [action].` |

---

## File Structure

Every EARS spec file follows this structure:

```
# [Module] – [Actor/Feature] EARS Requirements

> System, Actor, Date, Source

---

## Context
  - Narrative description of the actor's role
  - Actors table
  - Domain state machine (statuses + permitted transitions)
  - Policy defaults table (if applicable)

---

## 1. Ubiquitous Requirements
## 2. Event-Driven Requirements
## 3. State-Driven Requirements
## 4. Optional Feature Requirements
## 5. Unwanted Behaviour / Edge Cases
## 6. Complex Requirements
## 7. [Domain] Lifecycle Summary
## 8. Use Case Traceability        ← maps each requirement to its source file
```

---

## Section-by-Section Guide

### Header Block

```markdown
# [Module] – [Actor] EARS Requirements

> **System**: CommerceFull – [module name, e.g. `order`, `checkout`, `b2b`]
> **Actor**: [Primary actor — Customer, Merchant, Admin, B2B Buyer, System]
> **Date**: YYYY-MM-DD
> **Source**: `docs/modules/[module].md`, domain code in `modules/[module]/`
```

The `Source` field is critical — it links the spec to the module specification and the actual domain implementation it was derived from.

---

### Context Section

Before the numbered requirements, write a short prose section that:

1. Describes what the actor does and why
2. Lists all actors in a table with their roles
3. Shows the domain state machine as a table of permitted transitions
4. Lists any configurable policy defaults as a table

**Example — Actors table (order module):**

```markdown
| Actor     | Role                                                                |
| --------- | ------------------------------------------------------------------- |
| Customer  | Places orders via storefront / `/customer` API; views own orders    |
| Merchant  | Manages own-store orders via `/merchant` portal and `/business` API |
| Admin     | Cross-tenant order operations via `/admin` portal                   |
| B2B Buyer | Places quote-driven orders via `/b2b` portal                        |
| System    | Automated transitions (payment capture, fulfillment, refunds)       |
```

**Example — State transition table (`OrderStatus`):**

```markdown
| From            | To (allowed)                                       |
| --------------- | -------------------------------------------------- |
| PENDING         | PROCESSING, PAYMENT_PENDING, CANCELLED, FAILED     |
| PAYMENT_PENDING | PENDING, PROCESSING, PAYMENT_FAILED, CANCELLED     |
| PROCESSING      | SHIPPED, ON_HOLD, BACKORDERED, CANCELLED, REFUNDED |
| SHIPPED         | DELIVERED, REFUNDED                                |
| DELIVERED       | COMPLETED, REFUNDED                                |
| COMPLETED       | REFUNDED                                           |
| CANCELLED       | _(none)_                                           |
| REFUNDED        | _(none)_                                           |
```

**Example — Policy defaults table:**

```markdown
| Policy                       | Default                |
| ---------------------------- | ---------------------- |
| Customer self-cancel window  | Until status = SHIPPED |
| Refund window after delivery | 30 days                |
| Max abandoned-cart reminders | 3                      |
```

---

### 1. Ubiquitous Requirements

These are invariants — always true regardless of state or event. Use them for:

- Data integrity rules (every X must have a Y)
- Audit and logging rules
- Enforcement of the state machine
- Multi-tenancy / merchant isolation
- Money / currency invariants
- Soft-delete (`deletedAt`) rules

**Template:** `The system shall [action].`

**Examples:**

```
The system shall associate every order with exactly one customer, one merchant (store), one currency, and at least one order item.

The system shall enforce the OrderStatusTransitions table and reject any transition not listed.

The system shall record the acting user's id (`createdBy` / `updatedBy`) and a timestamp (`createdAt` / `updatedAt`) for every persisted change.

The system shall scope every `/business` query by the authenticated merchant's id and never return rows belonging to another merchant.

The system shall use double-quoted camelCase identifiers in every SQL statement (e.g. `"orderId"`, `"createdAt"`).
```

**Tips:**

- Keep each requirement to a single, testable statement.
- Do not include conditions — if you need a condition, it belongs in section 2, 3, or 5.
- Derive these from domain entity invariants (`modules/[ctx]/domain/entities/`) and infrastructure repository contracts (`modules/[ctx]/infrastructure/repositories/`).

---

### 2. Event-Driven Requirements

Triggered by a user action or system event. Use them for:

- What happens when an actor calls a `/customer` or `/business` endpoint
- What the system does in response to a domain event published on the `eventBus`
- Automated chains (subscriber → use case → next event), wired in `libs/events/registerEventHandlers.ts`

**Template:** `When [event], the system shall [action].`

Group related events under numbered sub-sections (2.1, 2.2, etc.) named after the feature area.

**Examples:**

```
When the customer submits checkout via `POST /customer/order` and payment authorisation succeeds, the system shall create the order with status PROCESSING and publish `OrderCreated`.

When `OrderCreated` is published, the inventory subscriber shall reserve stock for each order item and publish `InventoryReserved`.

When the merchant marks an order as shipped via `PUT /business/orders/:id`, the system shall transition the status to SHIPPED, persist the tracking number, and publish `OrderShipped`.

When `PaymentFailed` is received from the payment gateway webhook, the system shall transition the order to PAYMENT_FAILED and release any inventory reservation.
```

**Tips:**

- Name the actor and the channel explicitly (`When the merchant calls PUT /business/orders/:id...`, `When the customer clicks "Place order" in the storefront...`).
- For automated chains, name the event and the subscriber (`When OrderCreated fires, the inventory subscriber shall...`).
- Derive from use case `execute()` methods in `modules/[ctx]/application/useCases/` and from event subscribers registered in `libs/events/registerEventHandlers.ts`.

---

### 3. State-Driven Requirements

True only while the system is in a particular state. Use them for:

- What actions are allowed or blocked in a given status
- Constraints that apply for the duration of a state

**Template:** `While [state], the system shall [action].`

**Examples:**

```
While an order is in PROCESSING status, the system shall allow the merchant to ship, hold, backorder, cancel, or refund it.

While an order is in SHIPPED status, the system shall prevent cancellation and allow only delivery confirmation or refund.

While an order is in CANCELLED or REFUNDED status, the system shall prevent all further status transitions.

While a basket is in EXPIRED status, the system shall prevent checkout and require the customer to start a new basket.
```

**Tips:**

- Derive directly from the `OrderStatusTransitions` map in `modules/order/domain/valueObjects/OrderStatus.ts` (or the equivalent value object for the module you are specifying).
- Pair each "shall allow" with a corresponding "shall prevent" for the same state.
- Be explicit about terminal states (`CANCELLED`, `REFUNDED`, `FAILED`).

---

### 4. Optional Feature Requirements

Conditional on a feature flag, configuration setting, merchant capability, or integration being enabled. Use them for:

- Notification channels (email, SMS, WhatsApp via `modules/notification`)
- Loyalty / membership benefits
- B2B-only flows (quotes, credit terms)
- Tax engines and shipping carriers
- Multi-currency / multi-locale behaviour
- Optional payment providers

**Template:** `Where [feature is enabled], the system shall [action].`

**Examples:**

```
Where customer email notifications are enabled, the system shall send an order confirmation email when an order transitions to PROCESSING.

Where loyalty is enabled for the merchant, the system shall award points equal to the order subtotal × the merchant's earn rate when an order transitions to COMPLETED.

Where the B2B module is enabled for the customer's company, the system shall allow checkout against an approved quote and apply negotiated pricing.

Where multi-currency is enabled, the system shall persist the order's `currency` and freeze exchange rates at the moment of order creation.
```

**Tips:**

- Use "Where" not "If" — "Where" implies a configuration / capability context, "If" implies a runtime condition.
- These map to merchant / store settings (`modules/configuration`, `modules/store`), feature flags, environment variables, or per-channel configuration.
- Derive from optional subscribers and conditional code paths in the codebase.

---

### 5. Unwanted Behaviour / Edge Cases

Defensive requirements — what the system must do when something goes wrong or a constraint is violated. Use them for:

- Invalid state transitions
- Stock conflicts / overselling
- Expired baskets, tokens, coupons
- Duplicate submissions / idempotency
- Cross-tenant access attempts
- Race conditions

**Template:** `If [condition], then the system shall [action].`

Group under named sub-sections (5.1, 5.2, etc.) by category.

**Examples:**

```
If the customer attempts to check out with a basket containing an item whose available stock is below the requested quantity, then the system shall reject the checkout with an `OUT_OF_STOCK` error and list the offending items.

If the merchant attempts to transition an order from CANCELLED to any other status, then the system shall reject the request with a `INVALID_STATUS_TRANSITION` error.

If a user authenticated as merchant A requests `GET /business/orders/:id` for an order belonging to merchant B, then the system shall return 404 (never 403, to avoid leaking existence).

If two concurrent `POST /customer/order` requests arrive with the same idempotency key, then the system shall accept the first and return the original order for the second.

If a coupon's `validUntil` is in the past at checkout time, then the system shall reject application with a `COUPON_EXPIRED` error.
```

**Tips:**

- Every "shall allow" in sections 2–3 should have a corresponding "If not..." in section 5.
- Derive from validation in use cases, value-object guards, and repository constraints. Where the codebase defines an error code (e.g. `OUT_OF_STOCK`, `INVALID_STATUS_TRANSITION`), name it in the requirement.
- Cover idempotency, expired tokens / coupons, race conditions, and cross-tenant guards.

---

### 6. Complex Requirements

Combine two or more patterns for rules that have both an event trigger and a state condition, or multiple simultaneous effects.

**Template:** `When [event] while [state], the system shall [action].`
Or: `When [event], the system shall simultaneously [action1], [action2], and [action3].`

**Examples:**

```
When the merchant issues a partial refund while the order is in DELIVERED status, the system shall create a refund record, decrement the order's outstanding refundable amount, retain DELIVERED status, and publish `OrderPartiallyRefunded`.

When the customer submits checkout and payment authorisation succeeds, the system shall simultaneously create the order in PROCESSING status, reserve inventory, mark the basket as CONVERTED, generate the order number, and publish `OrderCreated`.
```

**Tips:**

- Use these sparingly — only when a single pattern cannot capture the full rule.
- List all simultaneous effects explicitly.
- These often map directly to a use case's `execute()` method body (e.g. `CreateOrder.ts`).

---

### 7. Lifecycle Summary

End every spec with a visual state machine diagram and a policy defaults table.

**Diagram format (order example):**

```
PENDING ──► PAYMENT_PENDING ──► PROCESSING ──► SHIPPED ──► DELIVERED ──► COMPLETED
   │              │                  │             │            │            │
   ├──► CANCELLED │                  ├──► ON_HOLD  ├──► REFUNDED├──► REFUNDED├──► REFUNDED
   └──► FAILED    └──► PAYMENT_FAILED├──► BACKORDERED
                                      └──► CANCELLED
```

**Policy defaults table:**

```markdown
| Policy                       | Default                |
| ---------------------------- | ---------------------- |
| Customer self-cancel window  | Until status = SHIPPED |
| Refund window after delivery | 30 days                |
| Idempotency key TTL          | 24 hours               |
```

---

## Use Case Traceability (Required)

Every EARS spec must end with a **Section 8: Use Case Traceability** table that maps each event-driven requirement directly to the use case class that implements it, with a link to the source file under `modules/[ctx]/application/useCases/`.

**Format:**

```markdown
## 8. Use Case Traceability

| Requirement (summary)                 | Use Case                   | Source File                                               |
| ------------------------------------- | -------------------------- | --------------------------------------------------------- |
| Submit checkout → PROCESSING          | `CreateOrderUseCase`       | `modules/order/application/useCases/CreateOrder.ts`       |
| Mark shipped → SHIPPED                | `UpdateOrderStatusUseCase` | `modules/order/application/useCases/UpdateOrderStatus.ts` |
| Issue refund → OrderPartiallyRefunded | `CreateOrderRefundUseCase` | `modules/order/application/useCases/CreateOrderRefund.ts` |
```

**Rules:**

- Point directly to the source file — no intermediate documentation layer.
- For automated flows (subscriber-triggered use cases), add a short wiring diagram showing the event chain (publisher → `eventBus` event name → subscriber registered in `libs/events/registerEventHandlers.ts` → next use case).
- If a requirement is fulfilled by a controller in `modules/[ctx]/interface/controllers/` or by a `web/` portal controller (admin / merchant / b2b / storefront) rather than a dedicated use case, link to that controller file.
- Keep the summary column short — one line matching the requirement's trigger.

**Do not create separate use-case documentation files.** The spec + the source code are the two sources of truth. Any intermediate doc layer goes stale and creates confusion.

---

## How to Derive Requirements from Code

EARS specs for CommerceFull are always grounded in the actual implementation. Follow this process:

### Step 1 — Read the module specification

Start with `docs/modules/[module].md`. This gives you the actor goals, the high-level capabilities, and the public API surface (`/customer` and `/business` endpoints).

### Step 2 — Read the domain entities

Open the entities (e.g. `modules/order/domain/entities/Order.ts`). Each public method (`confirm()`, `cancel()`, `ship()`, `refund()`) maps to an event-driven requirement. Each invariant guard maps to an unwanted behaviour requirement.

### Step 3 — Read the domain value objects

Open the status value objects (e.g. `modules/order/domain/valueObjects/OrderStatus.ts`). The `*Transitions` map is the source of truth for state-driven requirements. `Money`, `PaymentStatus`, `FulfillmentStatus`, etc. carry additional invariants for ubiquitous requirements.

### Step 4 — Read the domain services and policies

Open any service / policy files under `modules/[ctx]/domain/services/`. Each guard or policy decision branch maps to an unwanted behaviour requirement. Each default config value maps to a policy default in the lifecycle summary.

### Step 5 — Read the use cases

Open the use case files under `modules/[ctx]/application/useCases/`. The `execute()` method body maps to event-driven and complex requirements. The validation block maps to unwanted behaviour requirements.

### Step 6 — Read the interface layer and web controllers

Open the routers and controllers under `modules/[ctx]/interface/` for HTTP API requirements (`/customer`, `/business`). Open the matching `web/admin/`, `web/merchant/`, `web/b2b/`, or storefront controllers for portal-driven requirements — remember `web/` calls use cases directly, not over HTTP.

### Step 7 — Read the event subscribers

Open `libs/events/registerEventHandlers.ts` and the individual handler files. Each subscriber maps to an automated event-driven requirement (e.g. `When OrderCreated fires, the inventory subscriber shall reserve stock`).

---

## Naming and Location Conventions

| What            | Convention                            | Example                                            |
| --------------- | ------------------------------------- | -------------------------------------------------- |
| Spec file       | `docs/specs/[module]/[actor].md`      | `docs/specs/order/merchant.md`                     |
| Section headers | `## N. [Pattern Name] Requirements`   | `## 2. Event-Driven Requirements`                  |
| Sub-sections    | `### N.M [Feature Area]`              | `### 2.3 Refunds`                                  |
| Status names    | SCREAMING_SNAKE_CASE in backticks     | `` `PROCESSING` ``, `` `SHIPPED` ``                |
| Event names     | PascalCase in backticks               | `` `OrderCreated` ``, `` `PaymentFailed` ``        |
| Use case names  | PascalCase + `UseCase` suffix         | `` `CreateOrderUseCase` ``                         |
| Endpoints       | Method + path in backticks            | `` `POST /customer/order` ``                       |
| Code references | Inline code with module-relative path | `modules/order/domain/valueObjects/OrderStatus.ts` |
| Policy values   | Exact numbers from configuration      | 30 days, 3 reminders                               |
| DB identifiers  | camelCase, double-quoted in SQL       | `` `"orderId"` ``, `` `"createdAt"` ``             |

---

## Quality Checklist

Before committing a spec, verify:

- [ ] Every requirement uses exactly one EARS pattern (or the complex combination)
- [ ] Every "shall allow" in sections 2–3 has a corresponding "If not..." in section 5
- [ ] All status names match the actual enum values in `modules/[ctx]/domain/valueObjects/`
- [ ] All policy defaults match the configuration values in code (no invented numbers)
- [ ] The state transition table matches the `*Transitions` map in the status value object
- [ ] All endpoint paths match real routes registered in `boot/routes.ts` and the module's `interface/routers/`
- [ ] Cross-tenant isolation is covered (no `/business` endpoint leaks across merchants)
- [ ] Every published event name matches the constant defined alongside the publisher
- [ ] The `Source` header links to the correct module spec and module path
- [ ] The lifecycle summary diagram is consistent with the transition table
- [ ] No business logic is invented — every rule traces to code or to `docs/modules/[module].md`

---

## Reference Material

| Resource                  | Path                                                              |
| ------------------------- | ----------------------------------------------------------------- |
| Architecture overview     | `ARCHITECTURE.md`                                                 |
| Agent / contributor guide | `AGENTS.md`                                                       |
| Module specifications     | `docs/modules/`                                                   |
| Engineering standards     | `docs/standards/`                                                 |
| Module source             | `modules/[module]/{domain,application,infrastructure,interface}/` |
| Event wiring              | `libs/events/registerEventHandlers.ts`                            |
| Route mounting            | `boot/routes.ts`                                                  |
