# CommerceFull Module Alignment Gap Analysis

This document provides a comprehensive analysis of all modules in the CommerceFull platform, identifying misalignments between:
- **Routers** (API endpoints)
- **Controllers** (HTTP request handlers)
- **Use Cases** (Application/business logic)
- **Repositories** (Data access layer)
- **Migrations** (Database schema)

## Executive Summary

| Category | Current | Expected | Gap |
|----------|---------|----------|-----|
| **Modules with full DDD stack** | 12 | 38 | 26 modules need work |
| **Missing Routers** | 10 modules | 0 | Need HTTP interface |
| **Missing Controllers** | 10 modules | 0 | Need request handlers |
| **Use Cases needing migration** | ~80 | 0 | Controller logic → Use Cases |
| **Orphaned Repos** | 15 | 0 | Need wiring to use cases |
| **Missing Index Exports** | 18 | 0 | Need barrel exports |

---

## Module-by-Module Analysis

### Legend
- ✅ Complete and aligned
- ⚠️ Partial - needs enhancement
- ❌ Missing - needs creation
- 🔄 Needs refactoring

---

## 1. Analytics Module

**Current State:**
| Layer | Count | Status |
|-------|-------|--------|
| Routers | 1 | ✅ |
| Controllers | 1 | ✅ |
| Use Cases | 3 | ⚠️ |
| Repos | 4 | ✅ |

**Gaps Identified:**

| Gap | Description | Priority |
|-----|-------------|----------|
| Missing Use Cases | Need: GetDashboardMetrics, GetSalesAnalytics, GetCustomerAnalytics, GetProductPerformance, ExportReport | HIGH |
| Controller Logic | Business logic in controller needs extraction to use cases | MEDIUM |
| Missing Index | No barrel export for use cases | LOW |

**Required Changes:**
```
modules/analytics/
├── application/
│   └── useCases/
│       ├── GetDashboardMetrics.ts    ❌ CREATE
│       ├── GetSalesAnalytics.ts      ❌ CREATE
│       ├── GetCustomerAnalytics.ts   ❌ CREATE
│       ├── GetProductPerformance.ts  ❌ CREATE
│       ├── ExportReport.ts           ❌ CREATE
│       └── index.ts                  ❌ CREATE
└── interface/
    └── routers/
        └── analyticsRouter.ts        🔄 REFACTOR to use cases
```

---

## 2. Assortment Module (NEW)

**Current State:**
| Layer | Count | Status |
|-------|-------|--------|
| Routers | 0 | ❌ |
| Controllers | 0 | ❌ |
| Use Cases | 0 | ❌ |
| Repos | 1 | ✅ |

**Gaps Identified:**

| Gap | Description | Priority |
|-----|-------------|----------|
| Missing Router | No HTTP endpoints | HIGH |
| Missing Controller | No request handlers | HIGH |
| Missing Use Cases | No application logic | HIGH |
| Missing Domain | No entities/interfaces | MEDIUM |

**Required Changes:**
```
modules/assortment/
├── application/
│   └── useCases/
│       ├── CreateAssortment.ts       ❌ CREATE
│       ├── UpdateAssortment.ts       ❌ CREATE
│       ├── GetAssortment.ts          ❌ CREATE
│       ├── ListAssortments.ts        ❌ CREATE
│       ├── AddItemToAssortment.ts    ❌ CREATE
│       ├── RemoveItemFromAssortment.ts ❌ CREATE
│       ├── SetAssortmentScope.ts     ❌ CREATE
│       ├── GetVisibleProducts.ts     ❌ CREATE
│       └── index.ts                  ❌ CREATE
├── domain/
│   ├── entities/
│   │   └── Assortment.ts             ❌ CREATE
│   └── repositories/
│       └── AssortmentRepository.ts   ❌ CREATE
├── interface/
│   ├── controllers/
│   │   └── AssortmentController.ts   ❌ CREATE
│   └── routers/
│       └── assortmentRouter.ts       ❌ CREATE
└── repos/
    └── assortmentRepo.ts             ✅ EXISTS
```

---

## 3. B2B Module

**Current State:**
| Layer | Count | Status |
|-------|-------|--------|
| Routers | 2 | ✅ |
| Controllers | 2 | ✅ |
| Use Cases | 11 | ⚠️ |
| Repos | 5 | ⚠️ |

**Gaps Identified:**

| Gap | Description | Priority |
|-----|-------------|----------|
| Missing Use Cases | Need: ManageCompanyCredit, ProcessInvoice, GetCompanyDashboard | HIGH |
| Missing Repos | Need: creditTransactionRepo (uses b2bCompanyCreditTransaction table) | HIGH |
| Controller Logic | Some logic not using use cases | MEDIUM |

**Required Changes:**
```
modules/b2b/
├── application/
│   └── useCases/
│       ├── company/
│       │   ├── ManageCompanyCredit.ts    ❌ CREATE
│       │   └── GetCompanyDashboard.ts    ❌ CREATE
│       ├── invoice/
│       │   ├── CreateInvoice.ts          ❌ CREATE
│       │   ├── ProcessInvoice.ts         ❌ CREATE
│       │   └── GetInvoices.ts            ❌ CREATE
│       └── index.ts                      🔄 UPDATE exports
└── repos/
    ├── creditTransactionRepo.ts          ❌ CREATE
    └── invoiceRepo.ts                    ❌ CREATE
```

---

## 4. Basket Module

**Current State:**
| Layer | Count | Status |
|-------|-------|--------|
| Routers | 1 | ✅ |
| Controllers | 1 | ✅ |
| Use Cases | 10 | ✅ |
| Repos | 2 | ✅ |

**Status:** ✅ Well-aligned

**Minor Gaps:**
- Missing: `MergeBaskets` use case for guest→customer conversion
- Missing: `SaveForLater` use case

---

## 5. Brand Module

**Current State:**
| Layer | Count | Status |
|-------|-------|--------|
| Routers | 0 | ❌ |
| Controllers | 0 | ❌ |
| Use Cases | 6 | ✅ |
| Repos | 1 | ⚠️ |

**Gaps Identified:**

| Gap | Description | Priority |
|-----|-------------|----------|
| Missing Router | No HTTP endpoints for brand management | HIGH |
| Missing Controller | No request handlers | HIGH |
| Repo needs enhancement | Missing: findBySlug, search, listWithProductCounts | MEDIUM |

**Required Changes:**
```
modules/brand/
├── interface/
│   ├── controllers/
│   │   └── BrandController.ts        ❌ CREATE
│   └── routers/
│       └── brandRouter.ts            ❌ CREATE
└── infrastructure/
    └── repositories/
        └── BrandRepository.ts        🔄 ENHANCE
```

---

## 6. Channel Module

**Current State:**
| Layer | Count | Status |
|-------|-------|--------|
| Routers | 0 | ❌ |
| Controllers | 0 | ❌ |
| Use Cases | 7 | ✅ |
| Repos | 1 | ⚠️ |

**Gaps Identified:**

| Gap | Description | Priority |
|-----|-------------|----------|
| Missing Router | No HTTP endpoints | HIGH |
| Missing Controller | No request handlers | HIGH |
| Missing Repo Methods | Need: assignProducts, assignWarehouses | MEDIUM |

**Required Changes:**
```
modules/channel/
├── interface/
│   ├── controllers/
│   │   └── ChannelController.ts      ❌ CREATE
│   └── routers/
│       └── channelRouter.ts          ❌ CREATE
└── infrastructure/
    └── repositories/
        └── ChannelRepository.ts      🔄 ENHANCE
```

---

## 7. Checkout Module

**Current State:**
| Layer | Count | Status |
|-------|-------|--------|
| Routers | 1 | ✅ |
| Controllers | 1 | ✅ |
| Use Cases | 10 | ✅ |
| Repos | 2 | ✅ |

**Status:** ✅ Well-aligned

**Minor Gaps:**
- Missing: `ValidateCheckout` use case for pre-submission validation
- Missing: `ApplyGiftCard` use case

---

## 8. Configuration Module

**Current State:**
| Layer | Count | Status |
|-------|-------|--------|
| Routers | 1 | ✅ |
| Controllers | 1 | ✅ |
| Use Cases | 5 | ✅ |
| Repos | 2 | ✅ |

**Status:** ✅ Well-aligned

---

## 9. Content Module

**Current State:**
| Layer | Count | Status |
|-------|-------|--------|
| Routers | 1 | ⚠️ |
| Controllers | 2 | ✅ |
| Use Cases | 21 | ✅ |
| Repos | 5 | ✅ |

**Gaps Identified:**

| Gap | Description | Priority |
|-----|-------------|----------|
| Missing Customer Router | Only has business router, need customer-facing | MEDIUM |
| Controller not using use cases | Direct repo calls in some methods | MEDIUM |

**Required Changes:**
```
modules/content/
└── interface/
    └── routers/
        └── contentCustomerRouter.ts  ❌ CREATE
```

---

## 10. Coupon Module

**Current State:**
| Layer | Count | Status |
|-------|-------|--------|
| Routers | 0 | ❌ |
| Controllers | 0 | ❌ |
| Use Cases | 5 | ✅ |
| Repos | 1 | ⚠️ |

**Gaps Identified:**

| Gap | Description | Priority |
|-----|-------------|----------|
| Missing Router | No HTTP endpoints | HIGH |
| Missing Controller | No request handlers | HIGH |
| Repo in wrong location | Should be in infrastructure/ | LOW |

**Required Changes:**
```
modules/coupon/
├── interface/
│   ├── controllers/
│   │   └── CouponController.ts       ❌ CREATE
│   └── routers/
│       └── couponRouter.ts           ❌ CREATE
└── infrastructure/
    └── repositories/
        └── CouponRepository.ts       ❌ CREATE (consolidate)
```

---

## 11. Customer Module

**Current State:**
| Layer | Count | Status |
|-------|-------|--------|
| Routers | 2 | ✅ |
| Controllers | 1 | ⚠️ |
| Use Cases | 10 | ⚠️ |
| Repos | 7 | ✅ |

**Gaps Identified:**

| Gap | Description | Priority |
|-----|-------------|----------|
| Use Cases in wrong location | Under `useCases/` not `application/useCases/` | MEDIUM |
| Missing Use Cases | Need: UpdateProfile, ChangePassword, ManageAddresses | HIGH |
| Controller logic | Business logic needs extraction | MEDIUM |

**Required Changes:**
```
modules/customer/
├── application/
│   └── useCases/
│       ├── UpdateCustomerProfile.ts  ❌ CREATE
│       ├── ChangePassword.ts         ❌ CREATE
│       ├── ManageAddresses.ts        ❌ CREATE
│       ├── GetCustomerOrders.ts      ❌ CREATE
│       └── index.ts                  ❌ CREATE
└── useCases/                         🔄 MOVE to application/useCases/
```

---

## 12. Fulfillment Module

**Current State:**
| Layer | Count | Status |
|-------|-------|--------|
| Routers | 0 | ❌ |
| Controllers | 0 | ❌ |
| Use Cases | 6 | ✅ |
| Repos | 2 | ✅ |

**Gaps Identified:**

| Gap | Description | Priority |
|-----|-------------|----------|
| Missing Router | No HTTP endpoints | HIGH |
| Missing Controller | No request handlers | HIGH |
| Missing Use Cases | Need: CancelFulfillment, SplitFulfillment, RetryFulfillment | MEDIUM |

**Required Changes:**
```
modules/fulfillment/
├── application/
│   └── useCases/
│       ├── CancelFulfillment.ts      ❌ CREATE
│       ├── SplitFulfillment.ts       ❌ CREATE
│       ├── RetryFulfillment.ts       ❌ CREATE
│       └── index.ts                  🔄 UPDATE
└── interface/
    ├── controllers/
    │   └── FulfillmentController.ts  ❌ CREATE
    └── routers/
        ├── fulfillmentBusinessRouter.ts  ❌ CREATE
        └── fulfillmentCustomerRouter.ts  ❌ CREATE
```

---

## 13. GDPR Module

**Current State:**
| Layer | Count | Status |
|-------|-------|--------|
| Routers | 2 | ✅ |
| Controllers | 1 | ✅ |
| Use Cases | 3 | ⚠️ |
| Repos | 2 | ✅ |

**Gaps Identified:**

| Gap | Description | Priority |
|-----|-------------|----------|
| Missing Use Cases | Need: GetConsentStatus, UpdateConsent, ProcessDeletionRequest | HIGH |
| Use Cases in wrong location | Not in application/useCases/ | MEDIUM |

---

## 14. Identity Module

**Current State:**
| Layer | Count | Status |
|-------|-------|--------|
| Routers | 3 | ✅ |
| Controllers | 3 | ✅ |
| Use Cases | 2 | ❌ |
| Repos | 6 | ✅ |

**Gaps Identified:**

| Gap | Description | Priority |
|-----|-------------|----------|
| Missing Use Cases | Almost all logic in controllers | CRITICAL |
| Need Use Cases | Login, Logout, Register, ResetPassword, VerifyEmail, RefreshToken, RevokeToken | HIGH |

**Required Changes:**
```
modules/identity/
└── application/
    └── useCases/
        ├── customer/
        │   ├── LoginCustomer.ts          ❌ CREATE
        │   ├── RegisterCustomer.ts       ❌ CREATE
        │   ├── LogoutCustomer.ts         ❌ CREATE
        │   ├── ResetCustomerPassword.ts  ❌ CREATE
        │   └── VerifyCustomerEmail.ts    ❌ CREATE
        ├── merchant/
        │   ├── LoginMerchant.ts          ❌ CREATE
        │   ├── RegisterMerchant.ts       ❌ CREATE
        │   └── ResetMerchantPassword.ts  ❌ CREATE
        ├── token/
        │   ├── RefreshToken.ts           ❌ CREATE
        │   └── RevokeToken.ts            ❌ CREATE
        └── index.ts                      ❌ CREATE
```

---

## 15. Inventory Module

**Current State:**
| Layer | Count | Status |
|-------|-------|--------|
| Routers | 2 | ✅ |
| Controllers | 1 | ✅ |
| Use Cases | 14 | ✅ |
| Repos | 5 | ✅ |

**Status:** ✅ Well-aligned

**Minor Gaps:**
- Controller needs refactoring to use all new use cases
- Missing: `BulkAdjustStock` use case

---

## 16. Localization Module

**Current State:**
| Layer | Count | Status |
|-------|-------|--------|
| Routers | 2 | ✅ |
| Controllers | 2 | ✅ |
| Use Cases | 5 | ✅ |
| Repos | 3 | ✅ |

**Status:** ✅ Well-aligned

---

## 17. Loyalty Module

**Current State:**
| Layer | Count | Status |
|-------|-------|--------|
| Routers | 2 | ✅ |
| Controllers | 2 | ⚠️ |
| Use Cases | 4 | ⚠️ |
| Repos | 2 | ⚠️ |

**Gaps Identified:**

| Gap | Description | Priority |
|-----|-------------|----------|
| Missing Use Cases | Need: CreateLoyaltyProgram, UpdateLoyaltyProgram, GetPointsHistory, CalculateTier, RedeemReward | HIGH |
| Controller Logic | Business logic in controllers | MEDIUM |
| Missing Repo Methods | Need: tier management, reward management | MEDIUM |

**Required Changes:**
```
modules/loyalty/
├── application/
│   └── useCases/
│       ├── CreateLoyaltyProgram.ts   ❌ CREATE
│       ├── UpdateLoyaltyProgram.ts   ❌ CREATE
│       ├── GetPointsHistory.ts       ❌ CREATE
│       ├── CalculateTierStatus.ts    ❌ CREATE
│       ├── CreateReward.ts           ❌ CREATE
│       ├── RedeemReward.ts           ❌ CREATE
│       └── index.ts                  🔄 UPDATE
└── repos/
    ├── loyaltyTierRepo.ts            ❌ CREATE
    └── loyaltyRewardRepo.ts          ❌ CREATE
```

---

## 18. Marketing Module

**Current State:**
| Layer | Count | Status |
|-------|-------|--------|
| Routers | 2 | ✅ |
| Controllers | 2 | ✅ |
| Use Cases | 32 | ✅ |
| Repos | 4 | ⚠️ |

**Status:** ⚠️ Mostly aligned

**Minor Gaps:**
- Missing repo for `referral` table
- Some use cases not wired to controllers

---

## 19. Media Module

**Current State:**
| Layer | Count | Status |
|-------|-------|--------|
| Routers | 1 | ✅ |
| Controllers | 1 | ✅ |
| Use Cases | 5 | ✅ |
| Repos | 2 | ✅ |

**Status:** ✅ Well-aligned

---

## 20. Membership Module

**Current State:**
| Layer | Count | Status |
|-------|-------|--------|
| Routers | 2 | ✅ |
| Controllers | 2 | ⚠️ |
| Use Cases | 4 | ⚠️ |
| Repos | 7 | ✅ |

**Gaps Identified:**

| Gap | Description | Priority |
|-----|-------------|----------|
| Missing Use Cases | Need: UpgradeMembership, DowngradeMembership, CancelMembership, RenewMembership | HIGH |
| Controller Logic | Direct repo calls | MEDIUM |

---

## 21. Merchant Module

**Current State:**
| Layer | Count | Status |
|-------|-------|--------|
| Routers | 2 | ✅ |
| Controllers | 2 | ✅ |
| Use Cases | 6 | ⚠️ |
| Repos | 3 | ✅ |

**Gaps Identified:**

| Gap | Description | Priority |
|-----|-------------|----------|
| Missing Use Cases | Need: UpdateMerchant, GetMerchant, ListMerchants, OnboardMerchant, GetMerchantAnalytics | HIGH |
| Missing Repo Methods | Need: verification document management | MEDIUM |

---

## 22. Notification Module

**Current State:**
| Layer | Count | Status |
|-------|-------|--------|
| Routers | 1 | ⚠️ |
| Controllers | 1 | ⚠️ |
| Use Cases | 4 | ⚠️ |
| Repos | 4 | ✅ |

**Gaps Identified:**

| Gap | Description | Priority |
|-----|-------------|----------|
| Missing Customer Router | Only business router exists | HIGH |
| Missing Use Cases | Need: SendEmail, SendSMS, SendPushNotification, CreateTemplate, SetPreferences | HIGH |
| Controller Logic | Direct service calls | MEDIUM |

---

## 23. Order Module

**Current State:**
| Layer | Count | Status |
|-------|-------|--------|
| Routers | 3 | ⚠️ |
| Controllers | 2 | ✅ |
| Use Cases | 7 | ⚠️ |
| Repos | 9 | ✅ |

**Gaps Identified:**

| Gap | Description | Priority |
|-----|-------------|----------|
| Extra Router | OrderRouter is a domain service, not HTTP router | LOW |
| Missing Use Cases | Need: CancelOrder, RefundOrder, SplitOrder, GetOrderHistory, ReorderFromOrder | HIGH |
| Controller Logic | Some business logic in controllers | MEDIUM |

---

## 24. Organization Module (NEW)

**Current State:**
| Layer | Count | Status |
|-------|-------|--------|
| Routers | 0 | ❌ |
| Controllers | 0 | ❌ |
| Use Cases | 0 | ❌ |
| Repos | 1 | ✅ |

**Gaps Identified:**

| Gap | Description | Priority |
|-----|-------------|----------|
| Missing All Layers | Only repo exists | HIGH |

**Required Changes:**
```
modules/organization/
├── application/
│   └── useCases/
│       ├── CreateOrganization.ts     ❌ CREATE
│       ├── UpdateOrganization.ts     ❌ CREATE
│       ├── GetOrganization.ts        ❌ CREATE
│       ├── ListOrganizations.ts      ❌ CREATE
│       ├── GetOrganizationStores.ts  ❌ CREATE
│       └── index.ts                  ❌ CREATE
├── domain/
│   ├── entities/
│   │   └── Organization.ts           ❌ CREATE
│   └── repositories/
│       └── OrganizationRepository.ts ❌ CREATE
└── interface/
    ├── controllers/
    │   └── OrganizationController.ts ❌ CREATE
    └── routers/
        └── organizationRouter.ts     ❌ CREATE
```

---

## 25. Payment Module

**Current State:**
| Layer | Count | Status |
|-------|-------|--------|
| Routers | 2 | ✅ |
| Controllers | 2 | ✅ |
| Use Cases | 10 | ✅ |
| Repos | 9 | ⚠️ |

**Gaps Identified:**

| Gap | Description | Priority |
|-----|-------------|----------|
| Duplicate Repo | paymentRepo.ts and paymentRepoUpdated.ts | MEDIUM |
| Missing Use Cases | Need: DeletePaymentMethod, SetDefaultPaymentMethod | LOW |

---

## 26. Pricing Module

**Current State:**
| Layer | Count | Status |
|-------|-------|--------|
| Routers | 1 | ⚠️ |
| Controllers | 2 | ⚠️ |
| Use Cases | 4 | ⚠️ |
| Repos | 12 | ✅ |

**Gaps Identified:**

| Gap | Description | Priority |
|-----|-------------|----------|
| Missing Customer Router | Only business router | HIGH |
| Missing Use Cases | Need: GetPriceForCustomer, ApplyVolumeDiscount, GetB2BPricing, UpdatePriceList | HIGH |
| Controller Logic | Heavy business logic in controllers | MEDIUM |

---

## 27. Product Module

**Current State:**
| Layer | Count | Status |
|-------|-------|--------|
| Routers | 3 | ✅ |
| Controllers | 7 | ✅ |
| Use Cases | 14 | ⚠️ |
| Repos | 21 | ✅ |

**Gaps Identified:**

| Gap | Description | Priority |
|-----|-------------|----------|
| Missing Use Cases | Need: BulkUpdateProducts, ImportProducts, ExportProducts, CloneProduct | HIGH |
| Use Case Index | Missing barrel export | LOW |

---

## 28. Promotion Module

**Current State:**
| Layer | Count | Status |
|-------|-------|--------|
| Routers | 2 | ✅ |
| Controllers | 7 | ⚠️ |
| Use Cases | 12 | ⚠️ |
| Repos | 7 | ✅ |

**Gaps Identified:**

| Gap | Description | Priority |
|-----|-------------|----------|
| Too Many Controllers | Should consolidate | MEDIUM |
| Missing Use Cases | Need: ValidatePromotion, CalculateDiscount, GetActivePromotions | HIGH |
| Controller Logic | Heavy business logic | MEDIUM |

---

## 29. Segment Module

**Current State:**
| Layer | Count | Status |
|-------|-------|--------|
| Routers | 0 | ❌ |
| Controllers | 0 | ❌ |
| Use Cases | 4 | ✅ |
| Repos | 1 | ⚠️ |

**Gaps Identified:**

| Gap | Description | Priority |
|-----|-------------|----------|
| Missing Router | No HTTP endpoints | HIGH |
| Missing Controller | No request handlers | HIGH |

**Required Changes:**
```
modules/segment/
└── interface/
    ├── controllers/
    │   └── SegmentController.ts      ❌ CREATE
    └── routers/
        └── segmentRouter.ts          ❌ CREATE
```

---

## 30. Shipping Module

**Current State:**
| Layer | Count | Status |
|-------|-------|--------|
| Routers | 2 | ✅ |
| Controllers | 1 | ⚠️ |
| Use Cases | 7 | ✅ |
| Repos | 6 | ✅ |

**Gaps Identified:**

| Gap | Description | Priority |
|-----|-------------|----------|
| Missing Controller | Need separate business/customer controllers | MEDIUM |
| Controller Logic | Some business logic not in use cases | MEDIUM |

---

## 31. Store Module

**Current State:**
| Layer | Count | Status |
|-------|-------|--------|
| Routers | 1 | ⚠️ |
| Controllers | 1 | ✅ |
| Use Cases | 8 | ✅ |
| Repos | 3 | ✅ |

**Gaps Identified:**

| Gap | Description | Priority |
|-----|-------------|----------|
| Missing Customer Router | Only has one router | MEDIUM |
| Missing Use Cases | Need: DeleteStore, ActivateStore, DeactivateStore, GetStoreAnalytics | MEDIUM |

---

## 32. Subscription Module

**Current State:**
| Layer | Count | Status |
|-------|-------|--------|
| Routers | 2 | ✅ |
| Controllers | 2 | ⚠️ |
| Use Cases | 3 | ❌ |
| Repos | 1 | ⚠️ |

**Gaps Identified:**

| Gap | Description | Priority |
|-----|-------------|----------|
| Missing Use Cases | Need: CreateSubscription, CancelSubscription, PauseSubscription, ResumeSubscription, ChangeSubscriptionPlan, ProcessRenewal | CRITICAL |
| Controller Logic | All business logic in controllers | HIGH |
| Missing Repos | Need: subscriptionPlanRepo, subscriptionInvoiceRepo | HIGH |

---

## 33. Supplier Module

**Current State:**
| Layer | Count | Status |
|-------|-------|--------|
| Routers | 1 | ⚠️ |
| Controllers | 3 | ✅ |
| Use Cases | 4 | ⚠️ |
| Repos | 6 | ✅ |

**Gaps Identified:**

| Gap | Description | Priority |
|-----|-------------|----------|
| Missing Use Cases | Need: UpdateSupplier, GetSupplier, ListSuppliers, ApproveSupplier, SuspendSupplier, ConfigureDropship | HIGH |
| Missing Customer Router | Only business router | MEDIUM |

---

## 34. Support Module

**Current State:**
| Layer | Count | Status |
|-------|-------|--------|
| Routers | 2 | ✅ |
| Controllers | 2 | ✅ |
| Use Cases | 6 | ✅ |
| Repos | 3 | ⚠️ |

**Status:** ⚠️ Mostly aligned

**Minor Gaps:**
- Missing: `EscalateTicket`, `ResolveTicket`, `AssignTicket` use cases
- Missing: FAQ management use cases

---

## 35. Tax Module

**Current State:**
| Layer | Count | Status |
|-------|-------|--------|
| Routers | 2 | ✅ |
| Controllers | 2 | ⚠️ |
| Use Cases | 4 | ⚠️ |
| Repos | 14 | ✅ |

**Gaps Identified:**

| Gap | Description | Priority |
|-----|-------------|----------|
| Missing Use Cases | Need: UpdateTaxRate, DeleteTaxRate, CreateTaxZone, SetTaxExemption, ValidateTaxId | HIGH |
| Controller Logic | Business logic in controllers | MEDIUM |

---

## 36. Warehouse Module

**Current State:**
| Layer | Count | Status |
|-------|-------|--------|
| Routers | 2 | ✅ |
| Controllers | 2 | ✅ |
| Use Cases | 9 | ✅ |
| Repos | 1 | ⚠️ |

**Gaps Identified:**

| Gap | Description | Priority |
|-----|-------------|----------|
| Missing Repo | Need: warehouseZoneRepo, warehouseBinRepo | HIGH |
| Controller Logic | Not fully using use cases | MEDIUM |

---

## Priority Implementation Order

### Phase 1: Critical Missing Infrastructure (Week 1-2)

| Module | Task | Priority |
|--------|------|----------|
| **Identity** | Create all authentication use cases | CRITICAL |
| **Subscription** | Create subscription management use cases | CRITICAL |
| **Organization** | Create full stack (router, controller, use cases) | HIGH |
| **Assortment** | Create full stack (router, controller, use cases) | HIGH |
| **Segment** | Create router and controller | HIGH |

### Phase 2: High Priority Gaps (Week 3-4)

| Module | Task | Priority |
|--------|------|----------|
| **Brand** | Create router and controller | HIGH |
| **Channel** | Create router and controller | HIGH |
| **Coupon** | Create router and controller | HIGH |
| **Fulfillment** | Create router and controller | HIGH |
| **Notification** | Create customer router, add use cases | HIGH |

### Phase 3: Medium Priority Enhancements (Week 5-6)

| Module | Task | Priority |
|--------|------|----------|
| **Customer** | Move use cases, add missing | MEDIUM |
| **Loyalty** | Add missing use cases and repos | MEDIUM |
| **Membership** | Add missing use cases | MEDIUM |
| **Merchant** | Add missing use cases | MEDIUM |
| **Pricing** | Add customer router, use cases | MEDIUM |

### Phase 4: Controller Refactoring (Week 7-8)

| Module | Task | Priority |
|--------|------|----------|
| **All modules** | Extract business logic to use cases | MEDIUM |
| **Promotion** | Consolidate controllers | MEDIUM |
| **Analytics** | Add use cases, refactor controller | MEDIUM |

---

## Standard Module Structure

All modules should follow this DDD-aligned structure:

```
modules/<module>/
├── application/
│   └── useCases/
│       ├── <UseCase1>.ts
│       ├── <UseCase2>.ts
│       └── index.ts              # Barrel export
├── domain/
│   ├── entities/
│   │   └── <Entity>.ts
│   ├── repositories/
│   │   └── <Entity>Repository.ts # Interface
│   ├── services/
│   │   └── <DomainService>.ts
│   └── events/
│       └── <Module>Events.ts
├── infrastructure/
│   └── repositories/
│       └── <Entity>Repository.ts # Implementation
├── interface/
│   ├── controllers/
│   │   ├── <Module>BusinessController.ts
│   │   └── <Module>CustomerController.ts
│   └── routers/
│       ├── <module>BusinessRouter.ts
│       └── <module>CustomerRouter.ts
└── repos/                        # Legacy (migrate to infrastructure/)
    └── <entity>Repo.ts
```

---

## Summary Statistics

| Category | Count |
|----------|-------|
| **Modules requiring new routers** | 10 |
| **Modules requiring new controllers** | 10 |
| **Use cases to create** | ~75 |
| **Use cases to migrate** | ~40 |
| **Repos to create** | ~15 |
| **Index exports to create** | ~20 |

---

*Document Version: 1.0*
*Last Updated: December 23, 2024*
*Author: CommerceFull Platform Team*
