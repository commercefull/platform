# Dependency Register & Coupling Budget

> One row per cross-module edge. A new edge requires a register entry in the same PR — no entry, no merge.
>
> **Coupling budget**: no module may exceed 5 outbound ACL ports. `checkout` is near the ceiling; anything else approaching it signals a misplaced responsibility.
>
> **Cycles are hard errors**: all three known cycles are now broken — `checkout↔payment` (A7+D1), `checkout↔order` (A6), `checkout↔tax↔basket` (A1+A3+B5).

## Summary

| Consumer | Providers | Edges | Status |
|---|---|---|---|
| **checkout** | basket, coupon, inventory, order, payment, promotion, shipping, store, tax | **29** | ✅ Wave A complete (9 ACL ports, all edges resolved) |
| **identity** | customer, organization, store | **7** | ✅ Wave B3+D1 complete (customer+org+store repos all resolved) |
| **payment** | checkout, order | **5** | ✅ Wave D1 complete (OrderStatusSyncPort) |
| **product** | configuration, inventory, organization, store | **5** | ✅ Wave B2+B4+E complete (all edges resolved) |
| **store** | configuration, organization | **3** | ✅ Wave B4+E complete (all edges resolved) |
| **basket** | coupon | **2** | ✅ Wave B1 complete |
| **tax** | basket | **1** | ✅ Wave B5 complete |
| **inventory** | store | **1** | ✅ Wave B6 complete |
| **fulfillment** | order | **1** | ✅ Wave D2 complete (Published Language) |
| **pricing** | product, membership, loyalty | **4** | ✅ Wave C complete (3 ACL ports) |
| **Total** | | **0 active** | (was 58; Waves A–E resolved all edges via ACL ports + shared kernel + Published Language) |

## Edge Register

### checkout → basket (5 imports) — ✅ Wave A1

| # | File | Import | Pattern | Port | Status |
|---|---|---|---|---|---|
| 1 | `checkout/application/useCases/CreatePaymentIntent.ts` | `basket/domain/repositories/BasketRepository` | ACL | `BasketSnapshotPort` | ✅ Resolved (A1) |
| 2 | `checkout/application/useCases/InitiateCheckout.ts` | `basket/domain/repositories/BasketRepository` | ACL | `BasketSnapshotPort` | ✅ Resolved (A1) |
| 3 | `checkout/application/useCases/SetShippingAddress.ts` | `basket/domain/repositories/BasketRepository` | ACL | `BasketSnapshotPort` | ✅ Resolved (A1) |
| 4 | `checkout/interface/controllers/CheckoutController.ts` | `basket/infrastructure/repositories/BasketRepository` | ACL | `BasketSnapshotPort` | ✅ Resolved (A1) |
| 5 | `checkout/interface/graphql/resolvers.ts` | `basket/infrastructure/repositories/BasketRepository` | ACL | `BasketSnapshotPort` | ✅ Resolved (A1) |

### checkout → coupon (1 import) — ✅ Wave A2

| # | File | Import | Pattern | Port | Status |
|---|---|---|---|---|---|
| 6 | `checkout/application/useCases/ApplyCoupon.ts` | `coupon/infrastructure/repositories/CouponRepository` | ACL | `DiscountQuotePort` | ✅ Resolved (A2) |

### checkout → inventory (1 import) — ✅ Wave A9

| # | File | Import | Pattern | Port | Status |
|---|---|---|---|---|---|
| 7 | `checkout/interface/controllers/CheckoutController.ts` | `inventory/infrastructure/repositories/inventoryRepo` | ACL | `StockAvailabilityPort` | ✅ Resolved (A9) |

### checkout → order (10 imports) — ✅ Wave A6

| # | File | Import | Pattern | Port | Status |
|---|---|---|---|---|---|
| 8 | `checkout/application/useCases/AbandonCheckout.ts` | `order/domain/repositories/OrderRepository` | ACL | `OrderPlacementPort` | ✅ Resolved (A6) |
| 9 | `checkout/application/useCases/AbandonCheckout.ts` | `order/application/useCases/CancelOrder` | ACL | `OrderPlacementPort` | ✅ Resolved (A6) |
| 10 | `checkout/application/useCases/CompleteCheckout.ts` | `order/domain/repositories/OrderRepository` | ACL | `OrderPlacementPort` | ✅ Resolved (A6) |
| 11 | `checkout/application/useCases/CompleteCheckout.ts` | `order/domain/valueObjects/OrderStatus` | ACL | `OrderPlacementPort` | ✅ Resolved (A6, V0 type leak fixed) |
| 12 | `checkout/application/useCases/CompleteCheckout.ts` | `order/domain/valueObjects/PaymentStatus` | ACL | `OrderPlacementPort` | ✅ Resolved (A6, V0 type leak fixed) |
| 13 | `checkout/application/useCases/CreatePaymentIntent.ts` | `order/domain/repositories/OrderRepository` | ACL | `OrderPlacementPort` | ✅ Resolved (A6) |
| 14 | `checkout/application/useCases/CreatePaymentIntent.ts` | `order/application/useCases/CreateOrder` | ACL | `OrderPlacementPort` | ✅ Resolved (A6) |
| 15 | `checkout/application/useCases/CreatePaymentIntent.ts` | `order/domain/valueObjects/OrderStatus` | ACL | `OrderPlacementPort` | ✅ Resolved (A6, V0 type leak fixed) |
| 16 | `checkout/interface/controllers/CheckoutController.ts` | `order/infrastructure/repositories/OrderRepository` | ACL | `OrderPlacementPort` | ✅ Resolved (A6) |
| 17 | `checkout/interface/graphql/resolvers.ts` | `order/infrastructure/repositories/OrderRepository` | ACL | `OrderPlacementPort` | ✅ Resolved (A6) |

### checkout → payment (4 imports) — ✅ Wave A7

| # | File | Import | Pattern | Port | Status |
|---|---|---|---|---|---|
| 18 | `checkout/application/useCases/CreatePaymentIntent.ts` | `payment/domain/repositories/PaymentRepository` | ACL | `PaymentAuthorizationPort` | ✅ Resolved (A7) |
| 19 | `checkout/application/useCases/CreatePaymentIntent.ts` | `payment/application/useCases/InitiatePayment` | ACL | `PaymentAuthorizationPort` | ✅ Resolved (A7) |
| 20 | `checkout/interface/controllers/CheckoutController.ts` | `payment/infrastructure/repositories/PaymentRepository` | ACL | `PaymentAuthorizationPort` | ✅ Resolved (A7) |
| 21 | `checkout/interface/graphql/resolvers.ts` | `payment/infrastructure/repositories/PaymentRepository` | ACL | `PaymentAuthorizationPort` | ✅ Resolved (A7) |

### checkout → promotion (1 import) — ✅ Wave A5

| # | File | Import | Pattern | Port | Status |
|---|---|---|---|---|---|
| 22 | `checkout/application/useCases/SetShippingAddress.ts` | `promotion/application/services/PromotionEvaluationService` | ACL | `PromotionQuotePort` | ✅ Resolved (A5) |

### checkout → shipping (2 imports) — ✅ Wave A4

| # | File | Import | Pattern | Port | Status |
|---|---|---|---|---|---|
| 23 | `checkout/application/useCases/SetShippingMethod.ts` | `shipping/application/useCases/CalculateShippingRates` | ACL | `ShippingQuotePort` | ✅ Resolved (A4) |
| 24 | `checkout/interface/controllers/CheckoutController.ts` | `shipping/application/useCases/CalculateShippingRates` | ACL | `ShippingQuotePort` | ✅ Resolved (A4) |

### checkout → store (2 imports) — ✅ Wave A8

| # | File | Import | Pattern | Port | Status |
|---|---|---|---|---|---|
| 25 | `checkout/application/useCases/CheckLocalDeliveryEligibility.ts` | `store/infrastructure/repositories/StoreRepo` | ACL | `StoreFulfillmentPort` | ✅ Resolved (A8) |
| 26 | `checkout/interface/controllers/CheckoutController.ts` | `store/infrastructure/repositories/pickupLocationRepo` | ACL | `StoreFulfillmentPort` | ✅ Resolved (A8) |

### checkout → tax (3 imports) — ✅ Wave A3

| # | File | Import | Pattern | Port | Status |
|---|---|---|---|---|---|
| 27 | `checkout/application/useCases/SetShippingAddress.ts` | `tax/application/useCases/CalculateOrderTax` | ACL | `TaxQuotePort` | ✅ Resolved (A3) |
| 28 | `checkout/application/useCases/SetShippingAddress.ts` | `tax/infrastructure/repositories/taxSettingsRepo` | ACL | `TaxQuotePort` | ✅ Resolved (A3) |
| 29 | `checkout/infrastructure/repositories/CheckoutRepository.ts` | `tax/application/useCases/CalculateOrderTax` | ACL | `TaxQuotePort` | ✅ Resolved (A3) |

### basket → coupon (2 imports) — Wave B1

| # | File | Import | Pattern | Port | Status |
|---|---|---|---|---|---|
| 30 | `basket/application/useCases/ApplyCoupon.ts` | `coupon/infrastructure/repositories/CouponRepository` | ACL | `DiscountQuotePort` | ✅ Resolved (B1) |
| 31 | `basket/interface/controllers/BasketController.ts` | `coupon/infrastructure/repositories/CouponRepository` | ACL | `DiscountQuotePort` | ✅ Resolved (B1) |

### identity → customer (3 imports) — Wave B3

| # | File | Import | Pattern | Port | Status |
|---|---|---|---|---|---|
| 32 | `identity/interface/controllers/identityBusinessController.ts` | `customer/infrastructure/repositories/customerRepo` | ACL | `CredentialSubjectPort` | ✅ Resolved (B3) |
| 33 | `identity/interface/controllers/identityCustomerController.ts` | `customer/infrastructure/repositories/customerRepo` | ACL | `CredentialSubjectPort` | ✅ Resolved (B3) |
| 34 | `identity/interface/controllers/identitySocialController.ts` | `customer/infrastructure/repositories/customerRepo` | ACL | `CredentialSubjectPort` | ✅ Resolved (B3) |

### identity → organization (2 imports) — Wave B3/B4

| # | File | Import | Pattern | Port | Status |
|---|---|---|---|---|---|
| 35 | `identity/interface/controllers/identityBusinessController.ts` | `organization/infrastructure/repositories/organizationRepo` | ACL | `CredentialSubjectPort` | ✅ Resolved (B3) |
| 36 | `identity/interface/controllers/identitySocialController.ts` | `organization/infrastructure/repositories/organizationRepo` | ACL | `CredentialSubjectPort` | ✅ Resolved (B3) |

### identity → store (2 imports) — ✅ Wave E1

| # | File | Import | Pattern | Port | Status |
|---|---|---|---|---|---|
| 37 | `identity/application/useCases/store/AssignUserToStore.ts` | `store/domain/repositories/StoreRepository` | ACL | `StoreLookupPort` | ✅ Resolved (E1) |
| 38 | `identity/interface/controllers/UserStoreController.ts` | `store/domain/repositories/StoreRepository` | ACL | `StoreLookupPort` | ✅ Resolved (E1) |

### payment → checkout (1 import) — Wave D1

| # | File | Import | Pattern | Port | Status |
|---|---|---|---|---|---|
| 39 | `payment/interface/controllers/webhookController.ts` | `checkout/infrastructure/repositories/CheckoutRepository` | Published Language (interim ACL) | `OrderStatusSyncPort` | ✅ Resolved (D1) |

### payment → order (4 imports) — Wave D1

| # | File | Import | Pattern | Port | Status |
|---|---|---|---|---|---|
| 40 | `payment/interface/controllers/webhookController.ts` | `order/infrastructure/repositories/OrderRepository` | Published Language (interim ACL) | `OrderStatusSyncPort` | ✅ Resolved (D1) |
| 41 | `payment/interface/controllers/webhookController.ts` | `order/application/useCases/UpdateOrderStatus` | Published Language (interim ACL) | `OrderStatusSyncPort` | ✅ Resolved (D1) |
| 42 | `payment/interface/controllers/webhookController.ts` | `order/domain/valueObjects/OrderStatus` | Published Language (interim ACL) | `OrderStatusSyncPort` | ✅ Resolved (D1) |
| 43 | `payment/interface/controllers/webhookController.ts` | `order/domain/valueObjects/PaymentStatus` | Published Language (interim ACL) | `OrderStatusSyncPort` | ✅ Resolved (D1) |

### pricing → product (2 imports) — Wave C1

| # | File | Import | Pattern | Port | Status |
|---|---|---|---|---|---|
| 44 | `pricing/services/pricingService.ts` | `product/infrastructure/repositories/productRepo` | ACL | `ProductPriceDataPort` | ✅ Resolved (C1) |
| 45 | `pricing/services/pricingService.ts` | `product/infrastructure/repositories/productVariantRepo` | ACL | `ProductPriceDataPort` | ✅ Resolved (C1) |

### pricing → membership (1 import) — Wave C2

| # | File | Import | Pattern | Port | Status |
|---|---|---|---|---|---|
| 46 | `pricing/services/pricingService.ts` | `membership/infrastructure/repositories/membershipRepo` | ACL | `MembershipBenefitsPort` | ✅ Resolved (C2) |

### pricing → loyalty (1 import) — Wave C3

| # | File | Import | Pattern | Port | Status |
|---|---|---|---|---|---|
| 47 | `pricing/services/pricingService.ts` | `loyalty/infrastructure/repositories/loyaltyRepo` | ACL | `LoyaltyBalancePort` | ✅ Resolved (C3) |

### product → configuration (2 imports) — ✅ Wave E2

| # | File | Import | Pattern | Port | Status |
|---|---|---|---|---|---|
| 48 | `product/application/useCases/ListProductsForContext.ts` | `configuration/domain/repositories/SystemConfigurationRepository` | ACL | `SystemConfigPort` | ✅ Resolved (E2) |
| 49 | `product/application/useCases/ListProductsForContext.ts` | `configuration/domain/entities/SystemConfiguration` | ACL | `SystemConfigPort` | ✅ Resolved (E2) |

### product → inventory (1 import) — Wave B2

| # | File | Import | Pattern | Port | Status |
|---|---|---|---|---|---|
| 50 | `product/interface/controllers/ProductCustomerController.ts` | `inventory/infrastructure/repositories/inventoryRepo` | ACL | `StockAvailabilityPort` | ✅ Resolved (B2) |

### product → organization (1 import) — Wave B4

| # | File | Import | Pattern | Port | Status |
|---|---|---|---|---|---|
| 51 | `product/application/useCases/ListProductsForContext.ts` | `organization/infrastructure/repositories/organizationRepo` | ACL | `OrganizationLookupPort` | ✅ Resolved (B4) |

### product → store (1 import) — ✅ Wave E3

| # | File | Import | Pattern | Port | Status |
|---|---|---|---|---|---|
| 52 | `product/application/useCases/ListProductsForContext.ts` | `store/domain/repositories/StoreRepository` | ACL | `StoreLookupPort` | ✅ Resolved (E3) |

### store → configuration (2 imports) — ✅ Wave E4

| # | File | Import | Pattern | Port | Status |
|---|---|---|---|---|---|
| 53 | `store/application/useCases/CreateStore.ts` | `configuration/domain/repositories/SystemConfigurationRepository` | ACL | `SystemConfigPort` | ✅ Resolved (E4) |
| 54 | `store/interface/http/StoreController.ts` | `configuration/infrastructure/repositories/SystemConfigurationRepo` | ACL | `SystemConfigPort` | ✅ Resolved (E4) |

### store → organization (1 import) — Wave B4

| # | File | Import | Pattern | Port | Status |
|---|---|---|---|---|---|
| 55 | `store/application/useCases/CreateStore.ts` | `organization/infrastructure/repositories/organizationRepo` | ACL | `OrganizationLookupPort` | ✅ Resolved (B4) |

### tax → basket (1 import) — Wave B5

| # | File | Import | Pattern | Port | Status |
|---|---|---|---|---|---|
| 56 | `tax/interface/controllers/taxCustomerController.ts` | `basket/infrastructure/repositories/BasketRepository` | ACL | `TaxableBasketPort` | ✅ Resolved (B5) |

### inventory → store (1 import) — Wave B6

| # | File | Import | Pattern | Port | Status |
|---|---|---|---|---|---|
| 57 | `inventory/interface/controllers/inventoryController.ts` | `store/infrastructure/repositories/pickupLocationRepo` | ACL | `PickupLocationPort` | ✅ Resolved (B6) |

### fulfillment → order (1 import) — Wave D2

| # | File | Import | Pattern | Port | Status |
|---|---|---|---|---|---|
| 58 | `fulfillment/application/services/FulfillmentPlanner.ts` | `order/domain/services/OrderRouter` | Published Language | `OrderRouter` (public API) | ✅ Resolved (D2) |

## Resolved Edges (removed by shared kernel promotion)

| # | Former edge | Resolution | Date |
|---|---|---|---|
| — | `checkout → basket` (Money import × 4 files) | **Shared Kernel**: `Money` promoted to `libs/money.ts` | 2026-08-20 |
| — | `tax → basket` (Money import × 1 file) | **Shared Kernel**: `Money` promoted to `libs/money.ts` | 2026-08-20 |

## Resolved Edges (removed by ACL port + adapter)

| # | Former edge | Resolution | Date |
|---|---|---|---|
| 1–5 | `checkout → basket` (5 imports) | **ACL**: `BasketSnapshotPort` + `BasketBasketSnapshotAdapter` | 2026-08-20 |
| 6 | `checkout → coupon` (1 import) | **ACL**: `DiscountQuotePort` + `CouponDiscountQuoteAdapter` | 2026-08-20 |
| 7 | `checkout → inventory` (1 import) | **ACL**: `StockAvailabilityPort` + `InventoryStockAvailabilityAdapter` | 2026-08-20 |
| 8–17 | `checkout → order` (10 imports) | **ACL**: `OrderPlacementPort` + `OrderOrderPlacementAdapter` (V0 type leak fixed) | 2026-08-20 |
| 18–21 | `checkout → payment` (4 imports) | **ACL**: `PaymentAuthorizationPort` + `PaymentPaymentAuthorizationAdapter` | 2026-08-20 |
| 22 | `checkout → promotion` (1 import) | **ACL**: `PromotionQuotePort` + `PromotionPromotionQuoteAdapter` | 2026-08-20 |
| 23–24 | `checkout → shipping` (2 imports) | **ACL**: `ShippingQuotePort` + `ShippingShippingQuoteAdapter` | 2026-08-20 |
| 25–26 | `checkout → store` (2 imports) | **ACL**: `StoreFulfillmentPort` + `StoreStoreFulfillmentAdapter` | 2026-08-20 |
| 27–29 | `checkout → tax` (3 imports) | **ACL**: `TaxQuotePort` + `TaxTaxQuoteAdapter` | 2026-08-20 |
| 30, 31 | `basket → coupon` (2 imports) | **ACL**: `DiscountQuotePort` + `CouponDiscountQuoteAdapter` | 2026-08-20 |
| 32, 33, 34 | `identity → customer` (3 imports) | **ACL**: `CredentialSubjectPort` + `CustomerCredentialSubjectAdapter` | 2026-08-20 |
| 35, 36 | `identity → organization` (2 imports) | **ACL**: `CredentialSubjectPort` + `OrganizationCredentialSubjectAdapter` | 2026-08-20 |
| 50 | `product → inventory` (1 import) | **ACL**: `StockAvailabilityPort` + `InventoryStockAvailabilityAdapter` | 2026-08-20 |
| 51 | `product → organization` (1 import) | **ACL**: `OrganizationLookupPort` + `OrganizationLookupAdapter` (product) | 2026-08-20 |
| 55 | `store → organization` (1 import) | **ACL**: `OrganizationLookupPort` + `OrganizationLookupAdapter` (store) | 2026-08-20 |
| 56 | `tax → basket` (1 import) | **ACL**: `TaxableBasketPort` + `BasketTaxableBasketAdapter` | 2026-08-20 |
| 57 | `inventory → store` (1 import) | **ACL**: `PickupLocationPort` + `StorePickupLocationAdapter` | 2026-08-20 |
| 44, 45 | `pricing → product` (2 imports) | **ACL**: `ProductPriceDataPort` + `ProductPriceDataAdapter` | 2026-08-21 |
| 46 | `pricing → membership` (1 import) | **ACL**: `MembershipBenefitsPort` + `MembershipBenefitsAdapter` | 2026-08-21 |
| 47 | `pricing → loyalty` (1 import) | **ACL**: `LoyaltyBalancePort` + `LoyaltyBalanceAdapter` | 2026-08-21 |
| 39 | `payment → checkout` (1 import) | **ACL (interim)**: `OrderStatusSyncPort` + `CheckoutOrderStatusSyncAdapter` | 2026-08-21 |
| 40–43 | `payment → order` (4 imports) | **ACL (interim)**: `OrderStatusSyncPort` + `CheckoutOrderStatusSyncAdapter` | 2026-08-21 |
| 58 | `fulfillment → order` (1 import) | **Published Language**: `OrderRouter` exported from `order/index.ts` | 2026-08-21 |
| 37, 38 | `identity → store` (2 imports) | **ACL**: `StoreLookupPort` + `StoreLookupAdapter` (identity) | 2026-08-21 |
| 48, 49 | `product → configuration` (2 imports) | **ACL**: `SystemConfigPort` + `SystemConfigAdapter` (product) | 2026-08-21 |
| 52 | `product → store` (1 import) | **ACL**: `StoreLookupPort` + `StoreLookupAdapter` (product) | 2026-08-21 |
| 53, 54 | `store → configuration` (2 imports) | **ACL**: `SystemConfigPort` + `SystemConfigAdapter` (store) | 2026-08-21 |

## Cycle Detection

| Cycle | Edges | Resolution plan |
|---|---|---|
| `checkout ↔ payment` | checkout→payment (4) + payment→checkout (1) | ✅ Wave A7: checkout→payment resolved. ✅ Wave D1: payment→checkout resolved. Cycle broken. |
| `checkout ↔ order` | checkout→order (10) + order→checkout (0) | ✅ Wave A6: `OrderPlacementPort` resolves checkout→order. No cycle exists. |
| `checkout ↔ tax ↔ basket` | checkout→tax (3) + tax→basket (1) + checkout→basket (5) | ✅ Wave A3: checkout→tax resolved. ✅ Wave A1: checkout→basket resolved. ✅ Wave B5: tax→basket resolved. Triangle fully broken. |

---

**Last updated**: 2026-08-21
**Edge count**: 0 active (down from 58 after Waves A–E)
**Resolved by Wave A**: 29 edges (checkout ACL ports — 9 port interfaces, 9 adapters)
**Resolved by Wave B**: 14 edges (basket, identity×5, product×2, store, tax, inventory)
**Resolved by Wave C**: 4 edges (pricing→product×2, pricing→membership, pricing→loyalty)
**Resolved by Wave D**: 7 edges (payment→checkout, payment→order×4, fulfillment→order)
**Resolved by Wave E**: 7 edges (identity→store×2, product→configuration×2, product→store, store→configuration×2)
**Resolved by shared kernel**: 5 edges (Money promotion to libs/)
**Target**: ✅ Achieved — 0 active edges without a register entry; all edges behind ACL ports or replaced by events
