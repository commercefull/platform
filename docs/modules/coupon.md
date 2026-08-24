# Coupon Module

## Overview

The Coupon module manages discount codes and promotional rules. It supports percentage, fixed amount, and free shipping discounts with usage limits, customer usage limits, validity windows, product/category applicability rules, and redemption tracking.

---

## Use Cases

| ID | Use Case | Actor | Purpose |
|---|---|---|---|
| UC-CPN-001 | Create Coupon | Merchant/Admin | Create a new coupon with code, discount type, value, usage rules, and applicability constraints |
| UC-CPN-002 | Validate Coupon | Customer/Guest | Validate a coupon code against order value, items, and customer eligibility; returns discount amount |
| UC-CPN-003 | Apply Coupon | Customer/Guest | Apply a coupon to a basket, calculating the discount and recording usage |
| UC-CPN-004 | Redeem Coupon | System | Finalize coupon redemption when an order is placed; creates redemption record and increments usage count |
| UC-CPN-005 | Get Coupon | Merchant/Admin | Retrieve a specific coupon by ID |
| UC-CPN-006 | List Coupons | Merchant/Admin | List coupons with filtering by active status, type, usage type, and pagination |
| UC-CPN-007 | Delete Coupon | Merchant/Admin | Delete a coupon by ID |

### API Endpoints

| ID | Method | Endpoint |
|---|---|---|
| UC-CPN-001 | POST | `/business/coupons` |
| UC-CPN-002 | POST | `/business/coupons/validate` |
| UC-CPN-002 | GET | `/business/coupons/validate/:code` |
| UC-CPN-003 | POST | `/business/coupons/apply` |
| UC-CPN-004 | POST | `/business/coupons/redeem` |
| UC-CPN-005 | GET | `/business/coupons/:couponId` |
| UC-CPN-006 | GET | `/business/coupons` |
| UC-CPN-007 | DELETE | `/business/coupons/:couponId` |

### Customer API Endpoints

| ID | Method | Endpoint |
|---|---|---|
| UC-CPN-002 | POST | `/customer/coupons/validate` |
| UC-CPN-002 | GET | `/customer/coupons/validate/:code` |
| UC-CPN-003 | POST | `/customer/coupons/apply` |

---

## Domain Errors

| Error Class | Code | Status | Description |
|---|---|---|---|
| `CouponNotFoundError` | `coupon.not_found` | 404 | Coupon ID not found |
| `CouponCodeNotFoundError` | `coupon.code_not_found` | 404 | Coupon code not found |
| `CouponNotActiveError` | `coupon.not_active` | 400 | Coupon is not active |
| `CouponExpiredError` | `coupon.expired` | 400 | Coupon has expired |
| `CouponUsageLimitReachedError` | `coupon.usage_limit_reached` | 400 | Coupon usage limit reached |
| `CouponMinOrderNotMetError` | `coupon.min_order_not_met` | 400 | Order total below minimum required |
| `CouponMaxUsagePerCustomerReachedError` | `coupon.max_usage_per_customer_reached` | 400 | Customer has reached usage limit |
| `CouponCodeAlreadyExistsError` | `coupon.code_already_exists` | 409 | Coupon code already exists |
| `CouponValidationError` | `coupon.validation_error` | 400 | General validation error |
| `FailedToRecordCouponUsageError` | `coupon.usage_record_failed` | 500 | Failed to record coupon usage |

---

## Events Emitted

| Event | Trigger | Payload |
|---|---|---|
| `promotion.coupon_redeemed` | Coupon redeemed at checkout | couponId, couponCode, orderId, customerId, discountAmount |

---

## Domain Entities

- **`Coupon`** — Aggregate root with discount type (`percentage`, `fixed_amount`, `free_shipping`), usage rules (single/multi/unlimited), validity windows, product/category applicability, conditions, and usage tracking. Domain methods include `calculateDiscount`, `recordUsage`, `canBeApplied`, and update methods for basic info, discount, usage rules, validity, and applicability.

## Repository Ports

- **`CouponRepository`** — `findById`, `findByCode`, `findAll`, `save`, `delete`, `recordUsage`, `createRedemption`, `incrementUsageCount`, `getUsageHistory`, `getCustomerUsageCount`, `getActiveCoupons`, `validateCouponCode`

## Provider Contract

`index.ts` exports:
- Use cases: `CreateCouponUseCase`, `ValidateCouponUseCase`, `ApplyCouponUseCase`, `RedeemCouponUseCase`
- Repository port: `CouponRepository`
- Domain errors: all error classes listed above

---

## Owned Tables

| Table | Purpose |
|---|---|
| `promotionCoupon` | Coupon definitions |
| `promotionCouponUsage` | Coupon usage/redemption records |

---

## Integration Test Coverage

| Use Case | Test File | Status |
|---|---|---|
| UC-CPN-001 | — | ❌ |
| UC-CPN-002 | — | ❌ |
| UC-CPN-003 | — | ❌ |
| UC-CPN-004 | — | ❌ |
| UC-CPN-005 | — | ❌ |
| UC-CPN-006 | — | ❌ |
| UC-CPN-007 | — | ❌ |

> **Note**: No integration tests exist yet for this module. Unit tests exist for `ValidateCoupon` use case.

---

## Unit Test Coverage

| Use Case | Test File | Status |
|---|---|---|
| UC-CPN-002 | `coupon/application/useCases/ValidateCoupon.test.ts` | ✅ |
| Coupon Entity | `coupon/domain/entities/Coupon.test.ts` | ✅ |

---

<!-- GENERATED:ENDPOINTS:START -->

| Method | Endpoint | Controller | Description |
|---|---|---|---|
| GET | `/business/coupons` | `listCoupons` | List coupons with filtering and pagination |
| POST | `/business/coupons` | `createCoupon` | Create a new coupon |
| POST | `/business/coupons/validate` | `validateCoupon` | Validate a coupon code |
| GET | `/business/coupons/validate/:code` | `validateCoupon` | Validate a coupon by code |
| POST | `/business/coupons/apply` | `applyCoupon` | Apply coupon to basket |
| POST | `/business/coupons/redeem` | `redeemCoupon` | Redeem coupon for an order |
| GET | `/business/coupons/:couponId` | `getCoupon` | Get coupon by ID |
| DELETE | `/business/coupons/:couponId` | `deleteCoupon` | Delete coupon |
| POST | `/customer/coupons/validate` | `validateCoupon` | Validate coupon (customer) |
| GET | `/customer/coupons/validate/:code` | `validateCoupon` | Validate coupon by code (customer) |
| POST | `/customer/coupons/apply` | `applyCoupon` | Apply coupon (customer) |

<!-- GENERATED:ENDPOINTS:END -->
