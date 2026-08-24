# Module → Tables Mapping

> **Authoritative source** for which module owns each database table.
> Used by the migration naming convention (`docs/guidelines/migrations.md`) and
> module stability checklist (`docs/guidelines/module-stability-checklist.md`).
>
> When adding a new table, update this file AND the "Owned Tables" section in
> the corresponding `docs/modules/<module>.md`.

## Convention

- Each table has exactly **one owning module** — the module whose domain logic
  writes to it.
- Other modules may **read** owned tables via ACL ports or query repositories,
  but must not write to them directly.
- The owning module's name is used as the prefix in new migration filenames:
  `YYYYMMDDHHMMSS_<module>_<action><TableName>.js`

## Mapping

| Module          | Owned Tables                                                                                                                                                                                                                                                                                                                                                         |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| analytics       | `analyticsCustomer`, `analyticsSalesDaily`, `analyticsProductPerformance`, `analyticsCustomerCohort`, `analyticsSearchQuery`, `analyticsReportEvent`, `analyticsReportSnapshot`, `analyticsReportDashboard`                                                                                                                                                        |
| basket          | `basket`, `basketItem`, `basketDiscount`, `basketHistory`, `basketMerge`, `basketAnalytics`                                                                                                                                                                                                                                                                         |
| checkout        | `checkoutSession`                                                                                                                                                                                                                                                                                                                                                    |
| configuration   | `systemConfiguration`                                                                                                                                                                                                                                                                                                                                                |
| content         | `contentType`, `contentBlockType`, `contentTemplate`, `contentPage`, `contentPageVersion`, `contentMediaFolder`, `contentMedia`, `contentMediaUsage`, `contentNavigation`, `contentNavigationItem`, `contentCategory`, `contentCategorization`, `contentRedirect`, `contentBlock`                                                                                  |
| coupon          | `promotionCoupon`, `promotionCouponUsage`                                                                                                                                                                                                                                                                                                                           |
| customer        | `customer`, `customerGroup`, `customerGroupMembership`, `customerAddress`, `customerNote`, `customerWishlist`, `customerWishlistItem`, `customerLoyaltyTransaction`, `customerCurrencyPreference`, `customerPasswordReset`, `customerSubscription`                                                                                                                  |
| fulfillment     | `fulfillment`, `fulfillmentItem`, `fulfillmentPartner`, `fulfillmentRule`, `fulfillmentLocation`, `fulfillmentNetworkRule`, `fulfillmentStatusHistory`                                                                                                                                                                                                              |
| gdpr            | `gdprDataRequest`, `gdprCookieConsent`                                                                                                                                                                                                                                                                                                                               |
| identity        | `identityCustomerSession`, `identityAuthTokenBlacklist`, `identityAuthRefreshTokens`, `identitySocialAccounts`, `identityOrganizationSession`, `identityAdminUser`, `identityUserSession`, `organizationPasswordReset`, `role`                                                                                                                                     |
| inventory       | `inventoryLocation`, `inventoryTransactionType`, `inventoryTransaction`, `inventoryLevel`, `inventoryStockReservation`, `inventoryStockAlert`, `inventoryPool`, `inventoryPoolLocation`, `inventoryAllocation`, `inventoryReservationPool`, `orderAllocation`                                                                                                     |
| localization    | `currency`, `country`, `currencyRegion`, `locale`, `language`, `currencyExchangeRate`, `productTranslation`, `productCategoryTranslation` (as `localizationCategoryTranslation`), `localizationCollectionTranslation`, `contentPageTranslation`, `notificationTemplateTranslation`, `productAttributeTranslation`, `productAttributeOptionTranslation`             |
| loyalty         | `loyaltyTier`, `loyaltyTierExtended`, `loyaltyPoints`, `loyaltyTransaction`, `loyaltyReward`, `loyaltyRedemption`                                                                                                                                                                                                                                                   |
| media           | `media`                                                                                                                                                                                                                                                                                                                                                              |
| membership      | `membershipPlan`, `membershipBenefit`, `membershipPlanBenefit`, `membershipSubscription`, `membershipPayment`                                                                                                                                                                                                                                                       |
| notification    | `notification`, `notificationDeliveryLog`, `notificationEventLog`, `notificationWebhook`, `notificationTemplate`, `notificationCategory`, `notificationBatch`, `notificationPreference`, `notificationDevice`, `notificationUnsubscribe`                                                                                                                          |
| order           | `order`, `orderItem`, `orderTax`, `orderDiscount`, `orderShipping`, `orderShippingRate`, `orderStatusHistory`, `orderNote`, `orderAddress`, `orderPayment`, `orderPaymentRefund`, `orderPaymentHistory`, `orderFulfillment`, `orderFulfillmentItem`, `orderFulfillmentPackage`, `orderFulfillmentHistory`, `orderReturn`, `orderReturnItem`                        |
| organization    | `organization`, `organizationAddress`, `organizationPaymentInfo`, `organizationApiKey`, `organizationExtended`, `organizationTable` (as `organization` duplicate), `business`                                                                                                                                                                                     |
| payment         | `paymentGateway`, `paymentMethodConfig`, `paymentSettings`, `paymentPlan`, `paymentWebhook`, `paymentPayout`, `paymentPayoutSettings`, `paymentPayoutItem`, `paymentBalance`, `paymentReport`, `paymentDispute`, `paymentFee`, `paymentTransaction`, `paymentRefund`, `paymentMethod`, `storedPaymentMethod`, `paymentSubscription`, `paymentTerms`, `subscriptionInvoice`, `payout` |
| pricing         | `pricingRule`, `pricingRuleAdjustment`, `pricingRuleCondition`, `productTierPrice`, `pricingPriceList`, `pricingPriceListScope`, `pricingCommissionPlan`, `pricingSellerPolicy`, `customerPriceList`, `customerPrice`, `productPrice`, `productCurrencyPrice`                                                                                                     |
| product         | `product`, `productType`, `productVariant`, `productAttributeGroup`, `productAttribute`, `productAttributeSet`, `productAttributeSetMapping`, `productAttributeOption`, `productAttributeValue`, `productAttributeValueMap`, `productAttributeToGroup`, `productCategory`, `productCategoryMap`, `productTag`, `productCollection`, `productCollectionMap`, `productQa`, `productQaAnswer`, `productQaVote`, `productImage`, `productMedia`, `productSeo`, `productDownload`, `productReview`, `productReviewMedia`, `productReviewVote`, `productRelated`, `productList`, `productListItem`, `productToCategory`, `productBundle`, `productBundleItem`, `configurableProduct` |
| promotion       | `promotion`, `promotionRule`, `promotionAction`, `promotionCategory`, `promotionProductDiscount`, `promotionProductDiscountItem`, `promotionProductDiscountCustomerGroup`, `promotionGiftCard`, `promotionGiftCardTransaction`                                                                                                                                     |
| reporting       | `reportingReportSchedule`, `reportingReportExecution`                                                                                                                                                                                                                                                                                                               |
| shipping        | `shippingCarrier`, `shippingMethod`, `shippingZone`, `shippingRate`, `shippingPackagingType`, `shippingLabel`                                                                                                                                                                                                                                                       |
| store           | `store`, `storeCurrencySettings`, `storeLocation`, `storeUser`, `storeDispatch`, `storeDispatchItem`, `storePickupLocation`, `storeHierarchy`, `storeSettings`                                                                                                                                                                                                      |
| subscription    | `subscriptionProduct`, `subscriptionPlan`, `subscriptionOrder`, `subscriptionPause`, `subscriptionDunningAttempt`                                                                                                                                                                                                                                                   |
| supplier        | `supplier`, `supplierAddress`, `supplierProduct`, `supplierPurchaseOrder`, `supplierPurchaseOrderItem`, `supplierReceivingRecord`, `supplierReceivingItem`                                                                                                                                                                                                          |
| support         | `supportAgent`, `supportTicket`, `supportMessage`, `supportAttachment`, `supportFaqCategory`, `supportFaqArticle`, `supportPriceAlert`                                                                                                                                                                                                                             |
| tax             | `taxCategory`, `taxZone`, `taxRate`, `taxRule`, `taxSettings`, `taxCalculation`, `taxCalculationLine`, `taxCalculationApplied`, `taxReport`, `taxProviderLog`, `taxNexus`, `taxVatRegistration`, `taxVatValidationLog`, `taxExemption`, `customerTaxExemption`                                                                                                     |
| warehouse       | `distributionWarehouse`, `distributionWarehouseBin`, `distributionWarehouseZone`, `warehouseReceiving`, `warehousePickPack`                                                                                                                                                                                                                                         |
| webhook         | `webhookEndpoint`, `webhookDelivery`                                                                                                                                                                                                                                                                                                                                |

## Cross-Module Tables

Some tables are shared across modules. The owning module is responsible for
schema; other modules read via ACL ports.

| Table                  | Owner Module    | Read By                           |
| ---------------------- | --------------- | --------------------------------- |
| `orderAllocation`      | inventory       | order                             |
| `customerTaxExemption` | tax             | customer                          |
| `promotionCart`        | promotion       | basket (via promotion ACL)        |
| `productTranslation`   | localization    | product (via localization ACL)    |
| `session`              | identity        | all (via session middleware)      |

## Notes

- **Legacy migrations** (filenames dated `2024*`–`2025*`) do not include the
  module prefix. They are grandfathered — do not rename them.
- **New migrations** must follow `YYYYMMDDHHMMSS_<module>_<action><TableName>.js`.
- When in doubt about which module owns a table, check the repository that
  writes to it — the module containing that repository is the owner.
