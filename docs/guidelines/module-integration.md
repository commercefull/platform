# Module Integration Guidelines

> The three sanctioned cross-module integration patterns and ACL conventions.
> Source: §5 of the gap analysis. These rules exist **before** Phase 2 starts applying them.

## 1. The Three Sanctioned Integration Patterns

Every cross-module edge must be classified as exactly one of these. Anything else is a violation.

| Pattern | When to use | Mechanism |
|---|---|---|
| **Shared Kernel** | Truly universal, stable, dependency-free primitives | Promote to `libs/`. Deliberately tiny — additions require review. Candidates: `Money`, `Address`, `Currency`, pagination types, ID types. |
| **Anti-Corruption Layer** | Consumer needs a synchronous answer or action from another module | Consumer-owned **port** + provider-facing **adapter** that translates. Detailed below. |
| **Published Language** | Consumer reacts to something that happened; no return value needed | Domain event on the event bus with a versioned, documented payload. Preferred once the durable outbox exists. |

**Rule of thumb**: if the consumer needs an *answer*, use an ACL. If it needs to *know*, use an event. If it is a *value type with no behaviour or dependencies*, use the shared kernel.

## 2. ACL Structure and Conventions

An ACL has exactly three parts. The port is owned by the **consumer**, never the provider — this is what keeps the dependency one-directional.

```
modules/<consumer>/
  application/ports/<Capability>Port.ts       # interface + consumer-vocabulary DTOs
  infrastructure/acl/<Provider><Capability>Adapter.ts  # implements port, translates
  infrastructure/acl/<Provider><Capability>Adapter.contract.test.ts
```

### Rules

1. **The port speaks the consumer's language.** `checkout` asks for a `DiscountQuote`, not a `Coupon`. If the port signature mentions a provider concept, the ACL has failed.

2. **Only the adapter may import the provider**, and only from the provider's public `modules/<provider>/index.ts` — never a deep path, never `infrastructure/`.

3. **The adapter translates, it does not delegate.** A one-line pass-through that returns the provider's own type is not an ACL; it is a re-export with extra steps.

4. **The adapter owns failure translation.** Provider exceptions become the consumer's typed errors. Provider unavailability becomes an explicit, documented outcome of the port — never a swallowed `catch`.

5. **Wiring happens only at the composition root** (`boot/container.ts`). Use cases receive ports via constructor injection; they never construct adapters.

6. **Every adapter has a contract test** asserting the translation both ways, including the failure paths. This is what makes the provider safe to refactor.

7. **Optional providers degrade, they do not crash.** For toggleable modules (B2B, marketplace), the port must define a documented fallback so a disabled provider is a defined state, not an exception.

### Reference implementations

- `modules/payment/application/services/GatewayAdapter.ts` — correct ACL against an external system (Stripe).
- `modules/media/infrastructure/services/StorageServiceFactory.ts` — correct adapter/factory pair for S3.

## 3. Shared Kernel Promotion Criteria

To promote a type to `libs/`:

- No dependencies
- No I/O
- No module-specific business rules
- Stable API
- Agreed by both contexts

**Do promote**: `Money` (merge `basket/domain/valueObjects/Money` → `libs/money.ts` with existing `libs/amount.ts`), `Address` (geographic value type only).

**Do NOT promote**: `OrderStatus`, `PaymentStatus` — these are `order`'s domain concepts and belong behind an ACL.

## 4. Dependency Register & Coupling Budget

- Create `docs/architecture/dependency-register.md`: one row per cross-module edge — consumer, provider, pattern, port name, owner, contract test path.
- **A new cross-module edge requires a register entry in the same PR.** No entry, no merge.
- **Coupling budget**: no module may exceed **5 outbound ACL ports**. `checkout` will legitimately be near the ceiling; anything else approaching it signals a misplaced responsibility.
- Generate a module dependency graph in CI and **fail the build on a new edge** that is not in the register.
- Flag cycles as hard errors.

## 5. ACLs for External Systems

The same discipline applies outward:

- External adapters (Stripe, S3, Mailjet, Redis) follow the same port + adapter + contract test pattern.
- The port is always consumer-owned; the adapter is the only place that knows the external SDK.
- This is what "Isolated Module Sandbox" means in practice: a module can be extracted to its own process because all its dependencies are behind ports.

## 6. Priority Order

1. **Shared kernel first** (cheapest — removes edges with no ACL needed).
2. **`checkout` decomposition** (~35 edges, the single biggest win).
3. **High fan-in providers** (`coupon`, `organization` — most-depended-upon).
4. **`pricing` god service** (monetary correctness).
5. **Replace with events** where no synchronous answer is needed (deferrable to Phase 4 durable outbox).
