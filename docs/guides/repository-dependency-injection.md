# Architecture Migration Plan — UseCase Dependency Injection

> **Goal:** Eliminate application-layer imports of concrete repository implementations. UseCases must depend on domain repository interfaces (ports), with concrete implementations injected at the composition root (`wired.ts`).

---

## 1. Current State

### The Problem

The dependency-cruiser rule `application-no-infra-interface` explicitly **allows** application files to import from `infrastructure/repositories/`:

```js
// .dependency-cruiser.cjs — current rule (line 38-54)
{
  name: 'application-no-infra-interface',
  from: { path: 'modules/[^/]+/application/' },
  to: {
    path: 'modules/[^/]+/(infrastructure|interface)/',
    pathNot: [
      'modules/[^/]+/infrastructure/repositories/',  // ← THIS IS THE ACCEPTED VIOLATION
      // ...
    ],
  },
},
```

This was accepted previously but violates DDD dependency flow: **application → infrastructure** makes the use case aware of concrete implementation details.

### Scope of Violations

| Category | Count | Status |
|---|---|---|
| Non-wired useCase files importing from `infrastructure/repositories` | **99** | Violation — must fix |
| Test files importing from `infrastructure/repositories` | **82** | Violation — must fix |
| `wired.ts` files importing from `infrastructure/repositories` | **47** | Acceptable — composition root |
| UseCase files already importing from `domain/repositories` | **143** | Correct — no change needed |

### Modules Affected (22)

`content`, `coupon`, `customer`, `fulfillment`, `gdpr`, `identity`, `inventory`, `localization`, `loyalty`, `membership`, `notification`, `order`, `payment`, `promotion`, `reporting`, `shipping`, `store`, `subscription`, `supplier`, `support`, `tax`, `warehouse`

### Good News

- **All 22 affected modules already have `domain/repositories/` interfaces** — no new interfaces needed (in most cases)
- **143 useCase files already follow the correct pattern** — proven pattern exists
- **47 `wired.ts` files already act as composition roots** — injection point exists

### Two Violation Patterns

**Pattern A — Full violation** (e.g., `CreateCoupon.ts`):
```ts
// WRONG: imports concrete class from infrastructure
import { CouponRepository } from '../../infrastructure/repositories/CouponRepository';

export class CreateCouponUseCase {
  constructor(private readonly couponRepository: CouponRepository) {}
  //                     ^^^^^^^^^^^^^^^^ concrete class type
}
```

**Pattern B — Partial violation** (e.g., `GetOrderDetails.ts`):
```ts
// CORRECT: imports interface from domain
import { OrderRepository } from '../../domain/repositories/OrderRepository';
// WRONG: also imports concrete repo for some methods
import orderDataRepository from '../../infrastructure/repositories/OrderDataRepository';

export class GetOrderDetailsUseCase {
  constructor(private orderRepo: OrderRepository) {}  // interface — correct
  async execute() {
    // but also calls orderDataRepository directly — wrong
    const data = await orderDataRepository.findSomething();
  }
}
```

---

## 2. Target Architecture

### Dependency Flow

```
domain/repositories/        ← interfaces (ports)
    ↑
application/useCases/        ← depends on interfaces ONLY
    ↑
application/wired.ts         ← composition root: imports concrete impls, injects into useCases
    ↑
infrastructure/repositories/ ← concrete implementations
```

### Correct Pattern (already used by 143 files)

```ts
// modules/coupon/domain/repositories/CouponRepository.ts
export interface CouponRepository {
  findById(id: string): Promise<Coupon | null>;
  save(coupon: Coupon): Promise<Coupon>;
  // ...
}

// modules/coupon/application/useCases/CreateCoupon.ts  ← CORRECT
import { CouponRepository } from '../../domain/repositories/CouponRepository';

export class CreateCouponUseCase {
  constructor(private readonly couponRepository: CouponRepository) {}
  //                     ^^^^^^^^^^^^^^^^^^^^^^^^ interface type
}

// modules/coupon/application/wired.ts  ← CORRECT (composition root)
import CouponRepo from '../infrastructure/repositories/CouponRepository';
import { CreateCouponUseCase } from './useCases/CreateCoupon';

export const createCouponUseCase = new CreateCouponUseCase(CouponRepo);
//                                                     ^^^^^^^ concrete injected
```

### Rules

1. **UseCase files** (`application/useCases/*.ts`, excluding `wired.ts`) — may ONLY import from `domain/repositories/`
2. **wired.ts files** (`application/wired.ts`, `application/useCases/wired.ts`) — MAY import from `infrastructure/repositories/` (composition root)
3. **Test files** — may import from `domain/repositories/` and create mock implementations; may NOT import from `infrastructure/repositories/`
4. **boot/** — may import from anywhere (exempt from all rules, already configured)

---

## 3. Migration Strategy

### Phase 0: Add the dependency-cruiser rule (with baseline)

Add the new rule but use a baseline file to suppress existing violations. This prevents new violations while we migrate.

```js
// .dependency-cruiser.cjs — new rule
{
  name: 'application-no-infra-repos',
  severity: 'error',
  comment: 'Application layer (except wired.ts composition roots) must not import from infrastructure/repositories — use domain/repositories interfaces',
  from: {
    path: 'modules/[^/]+/application/',
    pathNot: [
      'modules/[^/]+/application/wired\\.ts$',
      'modules/[^/]+/application/useCases/wired\\.ts$',
    ],
  },
  to: {
    path: 'modules/[^/]+/infrastructure/repositories/',
  },
},
```

Generate baseline: `dependency-cruiser . --output-type baseline > .dependency-cruiser-known-violations.json`

CI runs with `--ignore-known` (suppresses existing) until migration is complete.

### Phase 1: Migrate low-complexity modules (Pattern A only)

These modules have simple violations — useCase imports concrete repo, constructor takes concrete type. Just change the import path and constructor type.

**Modules (estimated 1-2 files each):**
- `coupon` (2 files: CreateCoupon, ValidateCoupon)
- `fulfillment` (1 file: ManageOperations)
- `gdpr` (1 file: ManageGdpr)
- `loyalty` (1 file: ManageLoyalty)
- `membership` (2 files: ManageMembership, ManageMembershipPrograms)
- `localization` (1 file: ManageLocalization)
- `store` (1 file: ManageStoresAdmin)

**Steps per file:**
1. Change import from `../../infrastructure/repositories/X` to `../../domain/repositories/X`
2. Change constructor parameter type to the interface
3. If the interface name differs from the concrete name, rename the import
4. Verify the concrete implementation satisfies the interface (may need to add `implements` to the concrete class)
5. Update the `wired.ts` to pass the concrete instance (it likely already does)
6. Run tests for the module

### Phase 2: Migrate high-volume modules (Pattern A)

**Modules with many violating files:**
- `notification` (13 files)
- `promotion` (11 files)
- `shipping` (11 files)
- `payment` (13 files)
- `reporting` (7 files)
- `tax` (5 files)
- `order` (11 files — mixed Pattern A and B)
- `subscription` (4 files)
- `customer` (3 files)
- `identity` (3 files)
- `inventory` (2 files)
- `content` (4 files)
- `supplier` (2 files)
- `support` (2 files)
- `warehouse` (2 files)

### Phase 3: Fix Pattern B violations (dual-import files)

23 files import from BOTH `domain/repositories` and `infrastructure/repositories`. These need:
1. Identify what the infrastructure import is used for
2. If the method exists on the domain interface → change the call to use the injected interface
3. If the method does NOT exist on the domain interface → add it to the interface, then implement it on the concrete class
4. Remove the infrastructure import

**Affected modules:** `order` (11 files), `payment` (12 files)

### Phase 4: Fix test files (82 files)

Tests currently import concrete repos from `infrastructure/repositories`. Change to:
1. Import the domain interface
2. Create mock implementations that satisfy the interface
3. Inject the mock into the useCase under test

### Phase 5: Remove baseline and enforce

1. Delete `.dependency-cruiser-known-violations.json`
2. Remove `--ignore-known` from CI
3. The new `application-no-infra-repos` rule now blocks all future violations
4. Run full `yarn lint` and `yarn test` to verify

---

## 4. Module Priority Order

Ordered by complexity (lowest first) and risk:

| Priority | Module | Files | Pattern | Notes |
|---|---|---|---|---|
| 1 | `coupon` | 2 | A | Domain interface exists, simple |
| 2 | `fulfillment` | 1 | A | Only ManageOperations (others already correct) |
| 3 | `gdpr` | 1 | A | Single file |
| 4 | `loyalty` | 1 | A | Single file |
| 5 | `localization` | 1 | A | Single file |
| 6 | `membership` | 2 | A | Two files |
| 7 | `store` | 1 | A | Single file |
| 8 | `warehouse` | 2 | A | Two files |
| 9 | `supplier` | 2 | A | Two files |
| 10 | `support` | 2 | A | Two files |
| 11 | `content` | 4 | A | Four files |
| 12 | `customer` | 3 | A | Three files |
| 13 | `identity` | 3 | A | Three files |
| 14 | `inventory` | 2 | A | Two files |
| 15 | `subscription` | 4 | A | Four files |
| 16 | `tax` | 5 | A | Five files |
| 17 | `reporting` | 7 | A | Seven files |
| 18 | `notification` | 13 | A | Thirteen files — bulk |
| 19 | `promotion` | 11 | A | Eleven files — bulk |
| 20 | `shipping` | 11 | A | Eleven files — bulk |
| 21 | `payment` | 13 | A+B | Mixed patterns — needs interface additions |
| 22 | `order` | 11 | A+B | Mixed patterns — needs interface additions |

---

## 5. Per-File Migration Checklist

For each violating useCase file:

```
[ ] 1. Read the file, identify the infrastructure import(s)
[ ] 2. Read the corresponding domain/repositories/ interface
[ ] 3. Verify all methods called on the repo exist on the interface
      - If YES → change import path, change constructor type
      - If NO → add missing methods to the domain interface
[ ] 4. Update the concrete implementation to implement the interface
      (add `implements XRepository` if not already present)
[ ] 5. Change the import in the useCase file
[ ] 6. Change the constructor parameter type to the interface
[ ] 7. Remove any direct infrastructure imports/calls
[ ] 8. Run the module's unit tests
[ ] 9. If tests import from infrastructure → update test to use mock
[ ] 10. Run yarn lint:errors for the module
```

---

## 6. Dependency-Cruiser Rule Changes

### Remove the accepted violation

In `.dependency-cruiser.cjs`, the `application-no-infra-interface` rule currently has:
```js
pathNot: [
  'modules/[^/]+/infrastructure/repositories/',  // REMOVE THIS LINE
]
```

### Add a specific rule for wired.ts exemption

```js
{
  name: 'application-no-infra-repos',
  severity: 'error',
  comment: 'Application layer must not import from infrastructure/repositories — use domain/repositories interfaces. wired.ts files are exempt as composition roots.',
  from: {
    path: 'modules/[^/]+/application/',
    pathNot: [
      'modules/[^/]+/application/wired\\.ts$',
      'modules/[^/]+/application/useCases/wired\\.ts$',
    ],
  },
  to: {
    path: 'modules/[^/]+/infrastructure/repositories/',
  },
},
```

### Keep the existing rule for other infra imports

The `application-no-infra-interface` rule still blocks imports to `infrastructure/` (non-repository) and `interface/` — just remove the `infrastructure/repositories/` exemption from `pathNot`.

---

## 7. Documentation Updates

### docs/guidelines/modules-ddd.md

Add a section on dependency injection:

```markdown
## Repository Dependency Injection

UseCases MUST depend on domain repository interfaces, not concrete implementations.

### Correct

```ts
// domain/repositories/CouponRepository.ts — interface (port)
export interface CouponRepository { ... }

// application/useCases/CreateCoupon.ts — depends on interface
import { CouponRepository } from '../../domain/repositories/CouponRepository';
export class CreateCouponUseCase {
  constructor(private readonly repo: CouponRepository) {}
}

// application/wired.ts — composition root, imports concrete impl
import CouponRepo from '../infrastructure/repositories/CouponRepository';
export const createCoupon = new CreateCouponUseCase(CouponRepo);
```

### Wrong

```ts
// application/useCases/CreateCoupon.ts — imports concrete impl
import { CouponRepository } from '../../infrastructure/repositories/CouponRepository';
//                                                    ^^^^^^^^^^^^^^^^ VIOLATION
```

### Rule

The dependency-cruiser rule `application-no-infra-repos` enforces this at build time.
Only `wired.ts` files may import from `infrastructure/repositories/`.
```

### docs/guidelines/module-integration.md

Update to reference the injection pattern for ACL adapters.

### AGENTS.md

Add to working principles:
```
- **UseCases depend on domain interfaces only** — never import from infrastructure/repositories in useCase files; injection happens in wired.ts
```

---

## 8. Risk Mitigation

| Risk | Mitigation |
|---|---|
| Interface mismatch — concrete class doesn't implement interface | Add `implements` to concrete classes; fix missing methods |
| Method signature differences | Align interface and concrete method signatures during migration |
| Test breakage | Update tests module-by-module; run tests after each module |
| Circular dependencies | Dependency-cruiser catches these; fix as they arise |
| Large PR size | Migrate in batches by module priority; one PR per phase or per module group |

---

## 9. Verification

After each phase:
```bash
yarn lint:errors          # ESLint passes
yarn test:unit            # All unit tests pass
yarn deps:check           # Dependency-cruiser passes (with baseline)
```

After Phase 5 (final):
```bash
yarn lint                 # Full lint (tsc + eslint + dependency-cruiser)
yarn test:unit            # All unit tests pass
yarn test:all             # All tests pass
# No baseline file — all violations must be zero
```
