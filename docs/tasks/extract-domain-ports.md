# Task: Extract Domain Port Interfaces for Application-Layer Use Cases

> **Status**: Planned · **Priority**: Medium · **Effort**: Large (23 use cases, ~10 new interfaces, ~30 caller sites)
>
> **Origin**: P8 audit from the order/payment refactoring session (2026-08-21).
> **Prerequisite**: None — can be done independently of P1–P7.

---

## Problem

The domain layers of both `order` and `payment` modules are clean — no infrastructure imports leak into `domain/`. However, 23 application-layer use cases import concrete infrastructure repositories directly instead of depending on domain port interfaces. This violates the dependency rule `web → modules → libs` and prevents:

- Swapping persistence implementations (e.g., for testing or dual-hosting)
- Toggling modules independently
- Unit testing use cases without mocking concrete modules

---

## Current State

### Use cases that already use domain ports (good)

These use cases accept a repository **interface** via constructor injection:

| Module   | Use Case             | Port Interface       |
|----------|---------------------|----------------------|
| order    | `CreateOrder`       | `OrderRepository`    |
| order    | `CancelOrder`       | `OrderRepository`    |
| order    | `UpdateOrderStatus` | `OrderRepository`    |
| order    | `ProcessRefund`     | `OrderRepository`    |
| order    | `GetOrder`          | `OrderRepository`    |
| order    | `GetCustomerOrders` | `OrderRepository`    |
| order    | `ListOrders`        | `OrderRepository`    |
| payment  | `InitiatePayment`   | `PaymentRepository`  |
| payment  | `ProcessRefund`     | `PaymentRepository`  |
| payment  | `GetTransactions`   | `PaymentRepository`  |

### Use cases with direct infra imports (violations)

#### Order module (11 use cases)

| Use Case                    | Infra Repositories Imported                                                                                     |
|-----------------------------|-----------------------------------------------------------------------------------------------------------------|
| `AddOrderNote`              | `orderRepo`, `orderNoteRepo`                                                                                    |
| `CreateOrderRefund`         | `orderPaymentRepo`, `orderPaymentRefundRepo`                                                                    |
| `GetFulfillmentPackages`    | `orderFulfillmentPackageRepo`                                                                                   |
| `GetOrderDetails`           | `orderRepo`, `orderShippingRepo`, `orderShippingRateRepo`, `orderTaxRepo`, `orderDiscountRepo`, `orderPaymentRepo`, `orderPaymentRefundRepo` |
| `GetOrderRefunds`           | `orderPaymentRefundRepo`                                                                                        |
| `GetOrdersByStore`          | `OrderRepository` (infra impl, not the interface)                                                               |
| `ManageOrderFulfillments`   | `orderFulfillmentRepo`, `orderRepo`                                                                             |
| `ManageOrderNotes`          | `orderNoteRepo`                                                                                                 |
| `ManageStorefrontOrders`    | `OrderRepository` (infra impl), `orderReturnRepo`                                                               |
| `ManageStorefrontReturns`   | `OrderReturnRepo`                                                                                               |
| `TrackFulfillmentPackage`   | `orderFulfillmentPackageRepo`                                                                                   |

#### Payment module (12 use cases)

| Use Case                    | Infra Repositories Imported                                                                                     |
|-----------------------------|-----------------------------------------------------------------------------------------------------------------|
| `GeneratePaymentReport`     | `paymentReportRepo`                                                                                             |
| `GetPaymentBalance`         | `paymentBalanceRepo`                                                                                            |
| `GetPaymentBalances`        | `paymentBalanceRepo`                                                                                            |
| `ManagePaymentDisputes`     | `paymentDisputeRepo`                                                                                            |
| `ManagePaymentFees`         | `paymentFeeRepo`                                                                                                |
| `ManagePaymentGateways`     | `paymentRepo`                                                                                                   |
| `ManagePaymentReports`      | `paymentReportRepo`                                                                                             |
| `ManagePaymentSettings`     | `paymentSettingsRepo`                                                                                           |
| `ProcessPaymentWebhook`     | `paymentWebhookRepo`                                                                                            |
| `RecordPaymentDispute`      | `paymentDisputeRepo`, `paymentRepo`                                                                             |
| `RecordPaymentFee`          | `paymentFeeRepo`                                                                                                |
| `SaveStoredPaymentMethod`   | `storedPaymentMethodRepo`                                                                                       |

---

## Proposed Domain Port Interfaces

New interfaces to create in `domain/repositories/`:

### Order module

| Interface                      | File                          | Methods                                                        |
|-------------------------------|-------------------------------|----------------------------------------------------------------|
| `OrderNoteRepository`         | `OrderNoteRepository.ts`      | `findByOrder(orderId)`, `create(params)`                       |
| `OrderPaymentRepository`      | `OrderPaymentRepository.ts`   | `findById(id)`, `findByOrder(orderId)`                         |
| `OrderPaymentRefundRepository`| `OrderPaymentRefundRepository.ts` | `findByOrder(orderId)`, `create(params)`                   |
| `OrderShippingRepository`     | `OrderShippingRepository.ts`  | `findByOrder(orderId)`                                         |
| `OrderShippingRateRepository` | `OrderShippingRateRepository.ts` | `findByOrder(orderId)`                                      |
| `OrderTaxRepository`          | `OrderTaxRepository.ts`       | `findByOrder(orderId)`                                         |
| `OrderDiscountRepository`     | `OrderDiscountRepository.ts`  | `findByOrder(orderId)`                                         |
| `OrderFulfillmentRepository`  | `OrderFulfillmentRepository.ts` | `findByStatus(status, limit, offset)`                        |
| `OrderFulfillmentPackageRepository` | `OrderFulfillmentPackageRepository.ts` | `findByOrder(orderId)`, `create(params)`, `updateTracking(id, params)` |
| `OrderReturnRepository`       | `OrderReturnRepository.ts`    | `findByOrder(orderId)`, `create(params)`                       |

### Payment module

| Interface                      | File                          | Methods                                                        |
|-------------------------------|-------------------------------|----------------------------------------------------------------|
| `PaymentDisputeRepository`    | `PaymentDisputeRepository.ts` | `findAll(status, limit)`, `findById(id)`, `create(params)`, `updateStatus(id, status, resolvedAt)` |
| `PaymentFeeRepository`        | `PaymentFeeRepository.ts`     | `findAll(limit)`, `findByTransaction(txId)`, `create(params)`  |
| `PaymentSettingsRepository`   | `PaymentSettingsRepository.ts`| `findAll()`, `findByMerchant(orgId)`, `upsert(params)`         |
| `PaymentReportRepository`     | `PaymentReportRepository.ts`  | `findAll(limit)`, `findById(id)`, `create(params)`             |
| `PaymentBalanceRepository`    | `PaymentBalanceRepository.ts` | `findAll()`, `findByMerchant(orgId)`                           |
| `PaymentWebhookRepository`    | `PaymentWebhookRepository.ts` | `create(params)`                                               |
| `StoredPaymentMethodRepository`| `StoredPaymentMethodRepository.ts` | `findByCustomer(customerId)`, `create(params)`            |
| `PaymentGatewayRepository`    | `PaymentGatewayRepository.ts` | `findAll(orgId)`, `findById(id)`, `create(params)`, `update(id, updates)`, `delete(id)`, `findAllMethodConfigs(orgId)` |

> **Note**: `PaymentGatewayRepository` could also be added to the existing `PaymentRepository` interface instead of creating a separate one, depending on preference.

---

## Implementation Plan

### Step 1: Create domain port interfaces
- Create all new interfaces in `modules/{order,payment}/domain/repositories/`
- Keep method signatures minimal — only what use cases actually call
- Export from barrel files (`index.ts`)

### Step 2: Make infrastructure repositories implement the ports
- Add `implements` clause to concrete repo classes
- No logic changes needed — just type conformance

### Step 3: Refactor use cases to accept interfaces via constructor injection
- Replace `import orderNoteRepo from '../../infrastructure/...'` with `import { OrderNoteRepository } from '../../domain/repositories/...'`
- Change constructors to accept the interface as a parameter
- Use default parameter values for backward compatibility where the infra repo is the only implementation:
  ```typescript
  constructor(
    private readonly noteRepo: OrderNoteRepository = orderNoteRepo,
  ) {}
  ```

### Step 4: Update all callers
- **Controllers** (`interface/controllers/`): Pass concrete repo instances when constructing use cases
- **Admin panel** (`web/admin/controllers/`): Same
- **Hub controllers** (`web/hub/controllers/`): Same
- **Tests**: Mock the interface instead of the concrete module

### Step 5: Verify
- `npx tsc --noEmit` passes
- `yarn test:unit` passes
- `yarn lint:errors` passes
- No remaining `from.*infrastructure/repositories` imports in `application/` layer

---

## Suggested Execution Order

1. **Order module first** — more use cases but the `OrderRepository` pattern is already established
2. **Payment module second** — similar pattern, fewer dependencies

Within each module, work bottom-up:
1. Create all port interfaces
2. Implement on concrete repos
3. Refactor use cases one by one
4. Update callers in a single pass at the end

---

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Breaking callers that construct use cases with no args | Use default parameter values pointing to the concrete repo |
| Infra repo types don't match interface exactly | Add adapter methods or adjust interface to match current signatures |
| Large diff in a single PR | Split into two PRs (order, payment) or further by use case group |
| Test breakage | Mock interfaces in unit tests; integration tests use real repos |
