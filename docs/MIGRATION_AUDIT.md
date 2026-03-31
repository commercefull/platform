# Migration Audit Report

> Cross-reference of all migration files against active infrastructure repository usage.
> Tables are classified as: **ACTIVE** (queried in repos), **UNUSED** (migration exists, no repo reference), or **DUPLICATE** (superseded by a newer migration).

---

## Summary

| Category | Count |
|---|---|
| Total migration files | ~290 |
| Active tables (referenced in repos) | ~145 |
| Unused / no repo reference | ~80 |
| Duplicate / superseded migrations | ~15 |
| Alter migrations (no new table) | ~25 |

---

## DUPLICATE / SUPERSEDED MIGRATIONS

These migrations create tables that were later recreated or replaced by newer migrations. The older ones are effectively dead weight.

| Migration File | Superseded By | Notes |
|---|---|---|
| `20240805001506_createB2bApprovalWorkflow.js` | `20241223000019_createB2bApprovalWorkflowTable.js` | Original B2B approval workflow, replaced by aligned DDD version |
| `20240805001507_createB2bApprovalWorkflowStep.js` | `20241223000019_createB2bApprovalWorkflowTable.js` | Same — step table folded into new migration |
| `20240805001508_createB2bApprovalRequest.js` | `20241223000020_createB2bApprovalRequestTable.js` | Replaced by marketplace-aligned version |
| `20240805001509_createB2bApprovalAction.js` | `20241223000021_createB2bApprovalActionTable.js` | Replaced by marketplace-aligned version |
| `20240805000526_createLoyaltyTierTable.js` | `20251223200009_createLoyaltyTierExtendedTable.js` | Extended version supersedes original |
| `20240805000529_createLoyaltyRewardTable.js` | `20251223200006_createLoyaltyRewardTable.js` | Recreated in Dec 2025 batch |
| `20240805000530_createLoyaltyRedemptionTable.js` | `20251223200007_createLoyaltyRedemptionTable.js` | Recreated in Dec 2025 batch |
| `20241219000007_createUser.js` | `20251223200010_createAdminUserTable.js` | Admin user table was renamed/restructured |
| `20241219000009_createAdminUserRole.js` | `20251223200010_createAdminUserTable.js` | Role assignment folded into admin user table |
| `20240805000442_createPayoutTable.js` | `20241223100017_createPayoutTable.js` | Payout table recreated for marketplace alignment |
| `20251220221601_setupBusiness.js` (if exists) | `20241220000001_createBusiness.js` | Setup scripts overlap with create migrations |


---

## ACTIVE TABLES (Referenced in Infrastructure Repositories)

These tables have confirmed SQL usage in at least one repository file.

### Analytics
| Table | Migration | Repo Reference |
|---|---|---|
| `analyticsSalesDaily` | `20240805001901_createAnalyticsSalesDaily.js` | `analyticsRepo.ts` |
| `analyticsProductPerformance` | `20240805001902_createAnalyticsProductPerformance.js` | `analyticsRepo.ts` |
| `analyticsCustomerCohort` | `20240805001903_createAnalyticsCustomerCohort.js` | `analyticsRepo.ts` |
| `analyticsSearchQuery` | `20240805001905_createAnalyticsSearchQuery.js` | `analyticsRepo.ts` |
| `analyticsReportEvent` | `20240805001906_createAnalyticsReportEvent.js` | `reportingRepo.ts` |
| `analyticsReportSnapshot` | `20240805001907_createAnalyticsReportSnapshot.js` | `reportingRepo.ts` |
| `analyticsReportDashboard` | `20240805001908_createAnalyticsReportDashboard.js` | `reportingRepo.ts`, `DashboardQueryRepository.ts` |

### Assortment
| Table | Migration | Repo Reference |
|---|---|---|
| `assortment` | `20241223100006_createAssortmentTable.js` | `assortmentRepo.ts` |
| `assortmentScope` | `20241223100007_createAssortmentScopeTable.js` | `assortmentRepo.ts` |
| `assortmentItem` | `20241223100008_createAssortmentItemTable.js` | `assortmentRepo.ts` |

### B2B
| Table | Migration | Repo Reference |
|---|---|---|
| `b2bCompany` | `20240805001501_createB2bCompany.js` | `companyRepo.ts` |
| `b2bCompanyUser` | `20240805001502_createB2bCompanyUser.js` | `companyRepo.ts` |
| `b2bCompanyAddress` | `20240805001503_createB2bCompanyAddress.js` | `companyRepo.ts` |
| `b2bQuote` | `20240805001504_createB2bQuote.js` | `quoteRepo.ts` |
| `b2bQuoteItem` | `20240805001505_createB2bQuoteItem.js` | `quoteRepo.ts` |
| `b2bApprovalWorkflow` | `20241223000019_createB2bApprovalWorkflowTable.js` | `approvalRepo.ts` |
| `b2bApprovalWorkflowStep` | `20241223000019_createB2bApprovalWorkflowTable.js` | `approvalRepo.ts` |
| `b2bApprovalRequest` | `20241223000020_createB2bApprovalRequestTable.js` | `approvalRepo.ts` |
| `b2bApprovalAction` | `20241223000021_createB2bApprovalActionTable.js` | `approvalRepo.ts` |
| `paymentTerms` | `20241223100018_createPaymentTermsTable.js` | `paymentTermsRepo.ts` |
| `taxExemption` | `20241223100019_createTaxExemptionTable.js` | `taxExemptionRepo.ts` |

### Basket
| Table | Migration | Repo Reference |
|---|---|---|
| `basket` | `20240805000480_createBasket.js` | `BasketRepository.ts` |
| `basketItem` | `20240805000702_createBasketItem.js` | `BasketRepository.ts` |
| `basketDiscount` | `20240805000703_createBasketDiscount.js` | `BasketRepository.ts` |
| `basketHistory` | `20240805000705_createBasketHistory.js` | `BasketRepository.ts` |
| `basketMerge` | `20240805000706_createBasketMerge.js` | `BasketRepository.ts` |
| `basketAnalytics` | `20240805000707_createBasketAnalytics.js` | `BasketRepository.ts` |

### Channel
| Table | Migration | Repo Reference |
|---|---|---|
| `channel` | `20241223000001_createChannelTable.js` | `ChannelRepository.ts` |
| `channelProduct` | `20241223000002_createChannelProductTable.js` | `ChannelRepository.ts` |

### Checkout
| Table | Migration | Repo Reference |
|---|---|---|
| `checkoutSession` | `20240805000804_createCheckoutSession.js` | `CheckoutRepository.ts` |

### Content
| Table | Migration | Repo Reference |
|---|---|---|
| `contentType` | `20240805000901_createContentType.js` | `contentRepo.ts` |
| `contentPage` | `20240805000909_createContentPage.js` | `contentRepo.ts` |
| `contentBlock` | `20240805000910_createContentBlock.js` | `contentRepo.ts` |
| `contentTemplate` | `20240805000905_createContentTemplate.js` | `contentRepo.ts` |
| `contentCategory` | `20240805000916_createContentCategory.js` | `contentCategoryRepo.ts` |
| `contentNavigation` | `20240805000914_createContentNavigation.js` | `contentNavigationRepo.ts` |
| `contentNavigationItem` | `20240805000915_createContentNavigationItem.js` | `contentNavigationRepo.ts` |
| `contentMedia` | `20240805000919_createContentMedia.js` | `contentMediaRepo.ts` |
| `contentMediaFolder` | `20240805000913_createContentMediaFolder.js` | `contentMediaRepo.ts` |
| `contentRedirect` | `20240805000922_createContentRedirect.js` | `contentRedirectRepo.ts` |

### Customer
| Table | Migration | Repo Reference |
|---|---|---|
| `customer` | `20240805000201_createCustomer.js` | `customerRepo.ts`, `CustomerRepository.ts` |
| `customerAddress` | `20240805000205_createCustomerAddress.js` | `customerAddressRepo.ts` |
| `customerGroup` | `20240805000202_createCustomerGroup.js` | `customerGroupRepo.ts` |
| `customerGroupMembership` | `20240805000203_createCustomerGroupMembership.js` | `customerGroupMembershipRepo.ts` |
| `customerPasswordReset` | `20240805001050_createCustomerPasswordReset.js` | `customerRepo.ts` |
| `customerWishlist` | `20240805001026_createCustomerWishlist.js` | `customerRepo.ts` |
| `customerWishlistItem` | `20240805001027_createCustomerWishlistItem.js` | `customerRepo.ts` |
| `customerCurrencyPreference` | `20240805001055_createCustomerCurrencyPreference.js` | `customerCurrencyPreferenceRepo.ts` |
| `customerLoyaltyTransaction` | `20240805000722_createCustomerLoyaltyTransactionTable.js` | `customerLoyaltyTransactionRepo.ts` |
| `customerTaxExemption` | `20240805000509_createCustomerTaxExemptionTable.js` | `taxExemptionRepo.ts` |

### Fulfillment
| Table | Migration | Repo Reference |
|---|---|---|
| `fulfillment` | `20241223000004_createFulfillmentTable.js` | `FulfillmentRepository.ts` |
| `fulfillmentItem` | `20241223000005_createFulfillmentItemTable.js` | `FulfillmentRepository.ts` |
| `fulfillmentLocation` | `20241223100011_createFulfillmentLocationTable.js` | `fulfillmentLocationRepo.ts` |
| `fulfillmentStatusHistory` | `20240805000812_createFulfillmentStatusHistoryTable.js` | `fulfillmentStatusHistoryRepo.ts` |

### GDPR
| Table | Migration | Repo Reference |
|---|---|---|
| `gdprDataRequest` | `20240805001301_createGdprDataRequest.js` | `GdprRepository.ts` |

### Identity
| Table | Migration | Repo Reference |
|---|---|---|
| `identityCustomerSession` | `20240805000204_createIdentityCustomerSession.js` | `customerSessionRepo.ts` |
| `identityMerchantSession` | `20240805001208_createIdentityMerchantSession.js` | `merchantSessionRepo.ts` |
| `identityRefreshTokens` | `20240805000602_createIdentityAuthRefreshTokens.js` | `identityRefreshTokenRepo.ts` |
| `identityTokenBlacklist` | `20240805000601_createIdentityAuthTokenBlacklist.js` | `identityTokenBlacklistRepo.ts` |
| `identitySocialAccount` | `20240805000603_createIdentitySocialAccounts.js` | `socialAccountRepo.ts` |
| `adminUser` | `20251223200010_createAdminUserTable.js` | `AdminRepository.ts` |
| `userSession` | `20251223200011_createUserSessionTable.js` | `AdminRepository.ts` |
| `userStore` | `20260311224201_createUserStoreTable.js` | `UserStoreRepository.ts` |

### Inventory
| Table | Migration | Repo Reference |
|---|---|---|
| `inventoryLevel` | `20240805001029_createInventoryLevel.js` | `inventoryRepo.ts`, `InventoryRepository.ts` |
| `inventoryLocation` | `20240805000937_createInventoryLocation.js` | `inventoryRepo.ts` |
| `inventoryTransaction` | `20240805000940_createInventoryTransaction.js` | `inventoryRepo.ts` |
| `inventoryTransactionType` | `20240805000939_createInventoryTransactionType.js` | `inventoryRepo.ts` |
| `inventoryReservation` | `20241223000017_createInventoryAllocationTable.js` | `inventoryReservationRepo.ts` |
| `stockReservation` | `20240805001030_createStockReservation.js` | `stockReservationRepo.ts` |
| `storeDispatch` | `20260311224501_createStoreDispatchTable.js` | `StoreDispatchRepository.ts` |
| `storeDispatchItem` | `20260311224601_createStoreDispatchItemTable.js` | `StoreDispatchRepository.ts` |

### Localization
| Table | Migration | Repo Reference |
|---|---|---|
| `country` | `20240805000102_createCountry.js` | `countryRepo.ts` |
| `currency` | `20240805000101_createCurrency.js` | `currencyRepo.ts` (pricing) |
| `locale` | `20240805000103_createLocale.js` | `localeRepo.ts` |
| `categoryTranslation` | `20240805001306_createCategoryTranslation.js` | `translationRepo.ts` |
| `productTranslation` | `20240805001305_createProductTranslation.js` | `translationRepo.ts` |

### Loyalty
| Table | Migration | Repo Reference |
|---|---|---|
| `loyaltyTier` | `20251223200009_createLoyaltyTierExtendedTable.js` | `loyaltyRepo.ts` |
| `loyaltyPoints` | `20240805000527_createLoyaltyPointsTable.js` | `loyaltyRepo.ts` |
| `loyaltyTransaction` | `20240805000528_createLoyaltyTransactionTable.js` | `loyaltyRepo.ts` |
| `loyaltyReward` | `20251223200006_createLoyaltyRewardTable.js` | `loyaltyRepo.ts` |
| `loyaltyRedemption` | `20251223200007_createLoyaltyRedemptionTable.js` | `loyaltyRepo.ts` |

### Media
| Table | Migration | Repo Reference |
|---|---|---|
| `media` | `20241220000006_createMediaTable.js` | `mediaRepo.ts` |

### Membership
| Table | Migration | Repo Reference |
|---|---|---|
| `membershipPlan` | `20240805001034_createMembershipPlan.js` | `membershipPlanRepo.ts` |
| `membershipBenefit` | `20240805001035_createMembershipBenefit.js` | `membershipBenefitRepo.ts` |
| `membershipPlanBenefit` | `20240805001036_createMembershipPlanBenefit.js` | `membershipPlanBenefitRepo.ts` |
| `membershipSubscription` | `20240805001040_createMembershipSubscription.js` | `membershipSubscriptionRepo.ts` |
| `membershipPayment` | `20240805001041_createMembershipPayment.js` | `membershipPaymentRepo.ts` |
| `membershipStatusLog` | `20240805001045_createMembershipStatusLog.js` | `membershipRepo.ts` |

### Merchant
| Table | Migration | Repo Reference |
|---|---|---|
| `merchant` | `20240805000301_createMerchant.js` | `merchantRepo.ts` |
| `merchantAddress` | `20240805000302_createMerchantAddress.js` | `merchantRepo.ts` |
| `merchantPasswordReset` | `20240805001051_createMerchantPasswordReset.js` | `merchantRepo.ts` |
| `merchantPaymentInfo` | `20240805000304_createMerchantPaymentInfo.js` | `merchantRepo.ts` |
| `commissionPlan` | `20241223100015_createCommissionPlanTable.js` | `commissionPlanRepo.ts` |
| `payout` | `20241223100017_createPayoutTable.js` | `payoutRepo.ts` |

### Notification
| Table | Migration | Repo Reference |
|---|---|---|
| `notification` | `20240805000391_createNotification.js` | `notificationRepo.ts` |
| `notificationDeliveryLog` | `20240805000392_createNotificationDeliveryLog.js` | `notificationDeliveryLogRepo.ts` |
| `notificationTemplate` | `20240805001202_createNotificationTemplate.js` | `notificationTemplateRepo.ts` |

### Order
| Table | Migration | Repo Reference |
|---|---|---|
| `order` | `20240805000490_createOrderTable.js` | `orderRepo.ts`, `OrderRepository.ts` |
| `orderItem` | `20240805000709_createOrderItemTable.js` | `orderItemRepo.ts` |
| `orderAddress` | `20240805000803_createOrderAddress.js` | `orderAddressRepo.ts` |
| `orderFulfillment` | `20240805000808_createOrderFulfillment.js` | `orderFulfillmentRepo.ts` |
| `orderStatusHistory` | `20240805000711_createOrderStatusHistoryTable.js` | `orderRepo.ts` |
| `orderReturn` | `20240805000821_createOrderReturnTable.js` | `orderReturnRepo.ts` |
| `orderAllocation` | `20241223100012_createOrderAllocationTable.js` | `orderAllocationRepo.ts` |
| `fulfillmentStatusHistory` | `20240805000812_createFulfillmentStatusHistoryTable.js` | `fulfillmentStatusHistoryRepo.ts` |

### Organization
| Table | Migration | Repo Reference |
|---|---|---|
| `organization` | `20241223100001_createOrganizationTable.js` | `organizationRepo.ts` |

### Payment
| Table | Migration | Repo Reference |
|---|---|---|
| `paymentGateway` | `20240805000432_createPaymentGatewayTable.js` | `paymentRepo.ts`, `PaymentRepository.ts` |
| `paymentMethod` | `20240805000805_createPaymentMethod.js` | `paymentRepo.ts` |
| `paymentMethodConfig` | `20240805000433_createPaymentMethodConfigTable.js` | `paymentRepo.ts` |
| `paymentTransaction` | `20240805000813_createPaymentTransactionTable.js` | `paymentRepo.ts` |
| `paymentRefund` | `20240805000814_createPaymentRefundTable.js` | `paymentRepo.ts` |
| `payoutItem` | `20240805000815_createPayoutItemTable.js` | `payoutItemRepo.ts` |
| `payoutSettings` | `20240805000441_createPayoutSettingsTable.js` | `payoutSettingsRepo.ts` |
| `subscriptionInvoice` | `20240805000820_createSubscriptionInvoiceTable.js` | `subscriptionInvoiceRepo.ts` |
| `fraudRule` | `20240805001809_createFraudRule.js` | `fraudRepo.ts` |
| `fraudCheck` | `20240805001810_createFraudCheck.js` | `fraudRepo.ts` |
| `fraudBlacklist` | `20240805001811_createFraudBlacklist.js` | `fraudRepo.ts` |

### Pricing
| Table | Migration | Repo Reference |
|---|---|---|
| `pricingRule` | `20240805000532_createPricingRuleTable.js` | `pricingRuleRepo.ts` |
| `ruleAdjustment` | `20240805000533_createRuleAdjustmentTable.js` | `ruleAdjustmentRepo.ts` |
| `ruleCondition` | `20240805000534_createRuleConditionTable.js` | `ruleConditionRepo.ts` |
| `tierPrice` | `20240805000535_createTierPriceTable.js` | `tierPriceRepo.ts` |
| `priceList` | `20240805000536_createPriceListTable.js` | `priceListRepo.ts` |
| `customerPrice` | `20240805000538_createCustomerPriceTable.js` | `customerPriceRepo.ts` |
| `storeCurrencySettings` | `20240805001053_createStoreCurrencySettings.js` | `storeCurrencySettingsRepo.ts` |
| `productCurrencyPrice` | `20240805001054_createProductCurrencyPrice.js` | `productCurrencyPriceRepo.ts` |
| `currencyExchangeRate` | `20240805000923_createCurrencyExchangeRate.js` | `currencyExchangeRateRepo.ts` |
| `priceAlert` | `20240805001708_createPriceAlert.js` | `alertRepo.ts` (support) |

### Product
| Table | Migration | Repo Reference |
|---|---|---|
| `product` | `20240805000468_createProduct.js` | `productRepo.ts`, `ProductRepository.ts` |
| `productVariant` | `20240805000472_createProductVariant.js` | `productVariantRepo.ts`, `ProductVariantRepository.ts` |
| `productVariantAttribute` | (via productVariant migration) | `productVariantRepo.ts` |
| `productImage` | `20240805000523_createProductImageTable.js` | `productImageRepo.ts` |
| `productMedia` | `20240805000901_createProductMediaTable.js` | `productMediaRepo.ts` |
| `productSeo` | `20240805000902_createProductSeoTable.js` | `productSeoRepo.ts` |
| `productDownload` | `20240805000903_createProductDownloadTable.js` | `productDownloadRepo.ts` |
| `productCategoryMap` | `20240805000904_createProductCategoryMap.js` | `categoryRepo.ts` |
| `productRelated` | `20240805001021_createProductRelatedTable.js` | `productRelationshipRepo.ts` |
| `productReview` | `20240805000907_createProductReviewTable.js` | `productReviewRepo.ts` |
| `productBundle` | `20240805001803_createProductBundle.js` | `bundleRepo.ts` |
| `bundleItem` | `20240805001804_createBundleItem.js` | `bundleRepo.ts` |
| `productAttribute` | `20240805000477_createProductAttributeTable.js` | `attributeRepo.ts`, `productAttributeRepo.ts` |
| `productAttributeGroup` | `20240805000476_createProductAttributeGroupTable.js` | `attributeGroupRepo.ts` |
| `productAttributeOption` | `20240805000481_createProductAttributeOptionTable.js` | `attributeOptionRepo.ts` |
| `productAttributeSet` | `20240805000478_createProductAttributeSetTable.js` | `ProductAttributeSetRepository.ts` |
| `productAttributeSetMapping` | `20240805000479_createProductAttributeSetMappingTable.js` | `ProductAttributeSetRepository.ts` |
| `productAttributeValue` | `20240805001013_createProductAttributeValue.js` | `DynamicAttributeRepository.ts` |
| `productAttributeValueMap` | `20240805001023_createProductAttributeValueMapTable.js` | `DynamicAttributeRepository.ts` |
| `productTranslation` | `20240805001305_createProductTranslation.js` | `translationRepo.ts` |

### Promotion
| Table | Migration | Repo Reference |
|---|---|---|
| `promotion` | `20240805000483_createPromotionTable.js` | `promotionRepo.ts` |
| `promotionRule` | `20240805000484_createPromotionRuleTable.js` | `promotionRepo.ts` |
| `promotionAction` | `20240805000485_createPromotionActionTable.js` | `promotionRepo.ts` |
| `promotionCoupon` | `20240805000488_createPromotionCouponTable.js` | `couponRepo.ts` |
| `promotionCouponUsage` | `20240805000710_createPromotionCouponUsageTable.js` | `couponRepo.ts` |
| `promotionUsage` | `20240805000709_createPromotionUsageTable.js` | `promotionRepo.ts` |
| `promotionGiftCard` | `20240805001801_createPromotionGiftCard.js` | `giftCardRepo.ts` |
| `promotionGiftCardTransaction` | `20240805001802_createPromotionGiftCardTransaction.js` | `giftCardRepo.ts` |
| `promotionProductDiscount` | `20240805000497_createPromotionProductDiscountTable.js` | `discountRepo.ts` |
| `promotionProductDiscountItem` | `20240805000498_createPromotionProductDiscountItemTable.js` | `discountRepo.ts` |
| `promotionProductDiscountCustomerGroup` | `20240805000499_createPromotionProductDiscountCustomerGroupTable.js` | `discountRepo.ts` |
| `cartPromotion` | `20240805000702_createCartPromotionTable.js` | `cartRepo.ts` |
| `categoryPromotion` | `20240805000494_createCategoryPromotionTable.js` | `categoryRepo.ts` (promotion) |

### Segment
| Table | Migration | Repo Reference |
|---|---|---|
| `segment` | `20241223000009_createSegmentTable.js` | `SegmentRepository.ts` |
| `segmentMember` | `20241223000010_createSegmentMemberTable.js` | `SegmentRepository.ts` |

### Shipping
| Table | Migration | Repo Reference |
|---|---|---|
| `shippingCarrier` | `20240805000947_createShippingCarrierTable.js` | `shippingCarrierRepo.ts` |
| `shippingMethod` | `20240805000948_createShippingMethodTable.js` | `shippingMethodRepo.ts` |
| `shippingZone` | `20240805000949_createShippingZoneTable.js` | `shippingZoneRepo.ts` |
| `shippingRate` | `20240805000950_createShippingRateTable.js` | `shippingRateRepo.ts` |
| `shippingPackagingType` | `20240805000951_createShippingPackagingTypeTable.js` | `packagingTypeRepo.ts` |

### Store
| Table | Migration | Repo Reference |
|---|---|---|
| `store` | `20241220000002_createStore.js` | `StoreRepo.ts` |
| `pickupLocation` | `20241223000028_createStorePickupLocationTable.js` | `pickupLocationRepo.ts` |

### Subscription
| Table | Migration | Repo Reference |
|---|---|---|
| `subscriptionProduct` | `20240805001601_createSubscriptionProduct.js` | `subscriptionRepo.ts` |
| `subscriptionPlan` | `20240805001602_createSubscriptionPlan.js` | `subscriptionRepo.ts` |
| `customerSubscription` | `20240805001603_createCustomerSubscription.js` | `subscriptionRepo.ts` |
| `subscriptionOrder` | `20240805001604_createSubscriptionOrder.js` | `subscriptionRepo.ts` |
| `subscriptionPause` | `20240805001605_createSubscriptionPause.js` | `subscriptionRepo.ts` |
| `dunningAttempt` | `20240805001606_createDunningAttempt.js` | `subscriptionRepo.ts` |

### Supplier
| Table | Migration | Repo Reference |
|---|---|---|
| `supplier` | `20240805000958_createSupplier.js` | `supplierRepo.ts` |
| `supplierAddress` | `20240805000959_createSupplierAddress.js` | `supplierAddressRepo.ts` |
| `supplierProduct` | `20240805001000_createSupplierProduct.js` | `supplierProductRepo.ts` |
| `supplierPurchaseOrder` | `20240805001001_createSupplierPurchaseOrder.js` | `purchaseOrderRepo.ts` |
| `supplierPurchaseOrderItem` | `20240805001002_createSupplierPurchaseOrderItem.js` | `purchaseOrderRepo.ts` |
| `supplierReceivingRecord` | `20240805001003_createSupplierReceivingRecord.js` | `receivingRecordRepo.ts` |
| `supplierReceivingItem` | `20240805001004_createSupplierReceivingItem.js` | `receivingItemRepo.ts` |

### Support
| Table | Migration | Repo Reference |
|---|---|---|
| `supportAgent` | `20240805001701_createSupportAgent.js` | `supportRepo.ts` |
| `supportTicket` | `20240805001702_createSupportTicket.js` | `supportRepo.ts` |
| `supportMessage` | `20240805001703_createSupportMessage.js` | `supportRepo.ts` |
| `supportAttachment` | `20240805001704_createSupportAttachment.js` | `supportRepo.ts` |
| `faqCategory` | `20240805001705_createFaqCategory.js` | `faqRepo.ts` |
| `faqArticle` | `20240805001706_createFaqArticle.js` | `faqRepo.ts` |
| `stockAlert` | `20240805001707_createStockAlert.js` | `alertRepo.ts` |

### Tax
| Table | Migration | Repo Reference |
|---|---|---|
| `taxCategory` | `20240805000503_createTaxCategoryTable.js` | `taxQueryRepo.ts` |
| `taxZone` | `20240805000504_createTaxZoneTable.js` | `taxZoneRepo.ts` |
| `taxRate` | `20240805000505_createTaxRateTable.js` | `taxRateRepo.ts` |
| `taxRule` | `20240805000506_createTaxRuleTable.js` | `taxRuleRepo.ts` |
| `taxSettings` | `20240805000507_createTaxSettingsTable.js` | `taxSettingsRepo.ts` |
| `taxCalculation` | `20240805000510_createTaxCalculationTable.js` | `taxCalculationRepo.ts` |
| `taxCalculationLine` | `20240805000516_createTaxCalculationLineTable.js` | `taxCalculationLineRepo.ts` |
| `taxCalculationApplied` | `20240805000517_createTaxCalculationAppliedTable.js` | `taxCalculationAppliedRepo.ts` |
| `taxReport` | `20240805000518_createTaxReportTable.js` | `taxReportRepo.ts` |
| `taxProviderLog` | `20240805000519_createTaxProviderLogTable.js` | `taxProviderLogRepo.ts` |
| `taxNexus` | `20240805000520_createTaxNexusTable.js` | `taxNexusRepo.ts` |
| `vatRegistration` | `20240805001303_createVatRegistration.js` | `vatRegistrationRepo.ts` |
| `vatValidationLog` | `20240805001304_createVatValidationLog.js` | `vatRegistrationRepo.ts` |

### Warehouse / Distribution
| Table | Migration | Repo Reference |
|---|---|---|
| `distributionWarehouse` | `20240805000934_createDistributionWarehouse.js` | `warehouseRepo.ts` |
| `inventoryMovement` | `20240805000945_createDistributionInventoryMovement.js` | `inventoryRepo.ts` |

### Webhook
| Table | Migration | Repo Reference |
|---|---|---|
| `webhookEndpoint` | `20241219000002_createWebhookEndpoint.js` | `WebhookRepository.ts` |
| `webhookDelivery` | `20241219000003_createWebhookDelivery.js` | `WebhookRepository.ts` |

### Configuration / Platform
| Table | Migration | Repo Reference |
|---|---|---|
| `systemConfiguration` | `20241220000003_createSystemConfiguration.js` | `SystemConfigurationRepo.ts` |
| `business` | `20241220000001_createBusiness.js` | `BusinessRepo.ts` |


---

## UNUSED MIGRATIONS (No Repository Reference Found)

These migrations exist and create tables, but no infrastructure repository currently queries them. They fall into two categories: **planned but not yet implemented** (useful to keep) and **likely obsolete** (candidates for cleanup).

### Planned / Will Be Needed

These tables are architecturally sound and will be needed as the platform matures. Keep them.

| Migration File | Table | Module | Why It Will Be Needed |
|---|---|---|---|
| `20240805000427_createAnalyticsCustomerTable.js` | `analyticsCustomer` | Analytics | Customer behavior analytics — needed for customer cohort dashboards |
| `20240805001904_createAnalyticsChannelAttribution.js` | `analyticsChannelAttribution` | Analytics | Multi-channel attribution reporting — needed for marketing ROI |
| `20240805000429_createDistributionChannel.js` | `distributionChannel` | Distribution | Legacy distribution channel table — superseded by `channel` module but may still be referenced |
| `20240805000430_createDistributionChannelProduct.js` | `distributionChannelProduct` | Distribution | Same as above |
| `20240805000714_createStoredPaymentMethodTable.js` | `storedPaymentMethod` | Payment | Saved cards / payment methods for returning customers — needed for checkout |
| `20240805000715_createPaymentSubscriptionTable.js` | `paymentSubscription` | Payment | Links payment to subscription — needed when subscription billing is fully wired |
| `20240805000807_createPaymentDisputeTable.js` | `paymentDispute` | Payment | Stripe dispute/chargeback tracking — needed for payment operations |
| `20240805000809_createPaymentFeeTable.js` | `paymentFee` | Payment | Platform fee tracking per transaction — needed for marketplace financials |
| `20240805000444_createPaymentBalanceTable.js` | `paymentBalance` | Payment | Merchant balance ledger — needed for payout calculations |
| `20240805000446_createPaymentReportTable.js` | `paymentReport` | Payment | Payment reporting snapshots — needed for finance dashboards |
| `20240805000438_createPaymentWebhookTable.js` | `paymentWebhook` | Payment | Stripe webhook event log — needed for idempotent webhook processing |
| `20240805000435_createPaymentPlanTable.js` | `paymentPlan` | Payment | Installment/BNPL payment plans — needed for flexible checkout |
| `20240805000434_createPaymentSettingsTable.js` | `paymentSettings` | Payment | Per-merchant payment configuration — needed for multi-merchant setup |
| `20240805000809_createOrderFulfillmentItem.js` | `orderFulfillmentItem` | Order | Individual items per fulfillment — needed for partial fulfillment |
| `20240805000718_createOrderShippingRateTable.js` | `orderShippingRate` | Order | Shipping rate snapshot at order time — needed for order history accuracy |
| `20240805000710_createOrderShippingTable.js` | `orderShipping` | Order | Shipping details per order — needed for shipping management |
| `20240805000709_createOrderTaxTable.js` | `orderTax` | Order | Tax breakdown per order — needed for tax reporting |
| `20240805000710_createOrderDiscountTable.js` | `orderDiscount` | Order | Discount breakdown per order — needed for promotion analytics |
| `20240805000712_createOrderNoteTable.js` | `orderNote` | Order | Internal order notes — needed for customer service |
| `20240805000806_createOrderPayment.js` | `orderPayment` | Order | Payment record per order — needed for payment reconciliation |
| `20240805000807_createOrderPaymentRefund.js` | `orderPaymentRefund` | Order | Refund records — needed for returns/refunds flow |
| `20240805000822_createOrderReturnItemTable.js` | `orderReturnItem` | Order | Line items in a return — needed for partial returns |
| `20240805000950_createOrderFulfillmentPackageTable.js` | `orderFulfillmentPackage` | Order | Package tracking per fulfillment — needed for shipping labels |
| `20241219000006_createReportSchedule.js` | `reportSchedule` | Analytics | Scheduled report generation — needed for automated reporting |
| `20241219000007_createReportExecution.js` | `reportExecution` | Analytics | Report run history — needed for scheduled reports |
| `20241219000001_createAuditLog.js` | `auditLog` | Platform | Full audit trail — needed for compliance and admin oversight |
| `20241219000004_createPlatformConfig.js` | `platformConfig` | Platform | Platform-level configuration — needed for multi-store settings |
| `20241219000005_createApiKey.js` | `apiKey` | Platform | API key management — needed for external integrations |
| `20241219000008_createRole.js` | `role` | Identity | RBAC roles — needed for fine-grained admin permissions |
| `20241219000010_createMerchantSettings.js` | `merchantSettings` | Merchant | Per-merchant settings — needed for merchant customization |
| `20241219000011_createLanguage.js` | `language` | Localization | Language registry — needed for i18n management UI |
| `20240805000396_createCustomerEmailVerification.js` | `customerEmailVerification` | Customer | Email verification flow — needed for customer registration |
| `20240805000397_createMerchantEmailVerification.js` | `merchantEmailVerification` | Merchant | Email verification for merchants — needed for onboarding |
| `20240805000207_createCustomerActivity.js` | `customerActivity` | Customer | Customer activity log — needed for analytics and support |
| `20240805000208_createCustomerConsent.js` | `customerConsent` | Customer | GDPR consent tracking — needed for compliance |
| `20240805000209_createCustomerPreference.js` | `customerPreference` | Customer | Customer preferences — needed for personalization |
| `20240805000206_createCustomerContact.js` | `customerContact` | Customer | Additional contact info — needed for B2B and enterprise customers |
| `20240805000428_createCustomerNoteTable.js` | `customerNote` | Customer | CRM notes on customers — needed for support/sales teams |
| `20240805001302_createGdprCookieConsent.js` | `gdprCookieConsent` | GDPR | Cookie consent records — needed for GDPR compliance |
| `20240805001303_createVatRegistration.js` | `vatRegistration` | Tax | VAT registration per merchant — needed for EU tax compliance |
| `20240805001312_createVatOssReport.js` | `vatOssReport` | Tax | EU OSS VAT reporting — needed for EU merchants |
| `20240805001313_createVatOssReportLine.js` | `vatOssReportLine` | Tax | Line items for OSS report — needed alongside vatOssReport |
| `20240805000509_createCustomerTaxExemptionTable.js` | `customerTaxExemption` | Tax | Tax exemptions per customer — needed for B2B tax-exempt sales |
| `20240805000510_createCustomerGroupTaxOverrideTable.js` | `customerGroupTaxOverride` | Tax | Group-level tax overrides — needed for B2B pricing |
| `20240805000512_createProductTaxCategoryTable.js` | `productTaxCategory` | Tax | Product-to-tax-category mapping — needed for tax calculation |
| `20240805000513_createProductTaxExemptionTable.js` | `productTaxExemption` | Tax | Product-level tax exemptions — needed for tax calculation |
| `20240805001401_createMarketingEmailCampaign.js` | `marketingEmailCampaign` | Marketing | Email campaign management — needed for marketing module |
| `20240805001402_createMarketingEmailTemplate.js` | `marketingEmailTemplate` | Marketing | Email templates for campaigns — needed for marketing module |
| `20240805001403_createMarketingEmailCampaignRecipient.js` | `marketingEmailCampaignRecipient` | Marketing | Campaign recipients — needed for marketing module |
| `20240805001404_createMarketingEmailCampaignLink.js` | `marketingEmailCampaignLink` | Marketing | Link tracking in campaigns — needed for marketing analytics |
| `20240805001405_createMarketingAbandonedCart.js` | `marketingAbandonedCart` | Marketing | Abandoned cart tracking — needed for recovery emails |
| `20240805001406_createMarketingAbandonedCartEmail.js` | `marketingAbandonedCartEmail` | Marketing | Abandoned cart email log — needed for recovery flow |
| `20240805001407_createMarketingProductRecommendation.js` | `marketingProductRecommendation` | Marketing | Product recommendations — needed for personalization |
| `20240805001408_createCustomerProductView.js` | `customerProductView` | Marketing | Product view tracking — needed for recommendations and analytics |
| `20240805001409_createMarketingAffiliate.js` | `marketingAffiliate` | Marketing | Affiliate program — needed for referral/affiliate marketing |
| `20240805001410_createMarketingAffiliateLink.js` | `marketingAffiliateLink` | Marketing | Affiliate tracking links — needed for affiliate module |
| `20240805001411_createMarketingAffiliateCommission.js` | `marketingAffiliateCommission` | Marketing | Commission tracking — needed for affiliate payouts |
| `20240805001412_createMarketingAffiliatePayout.js` | `marketingAffiliatePayout` | Marketing | Affiliate payout records — needed for affiliate module |
| `20240805001413_createReferral.js` | `referral` | Marketing | Customer referral tracking — needed for referral programs |
| `20240805001414_createReferralReward.js` | `referralReward` | Marketing | Referral reward records — needed for referral programs |
| `20240805001510_createB2bCompanyCreditLimit.js` | `b2bCompanyCreditLimit` | B2B | Credit limit per company — needed for B2B credit management |
| `20240805001511_createB2bCompanyCreditTransaction.js` | `b2bCompanyCreditTransaction` | B2B | Credit transaction log — needed for B2B credit module |
| `20241223000022_createB2bPriceListTable.js` | `b2bPriceList` | B2B | B2B-specific price lists — needed for B2B pricing |
| `20241223000023_createB2bPriceListItemTable.js` | `b2bPriceListItem` | B2B | B2B price list items — needed for B2B pricing |
| `20241223000024_createB2bPurchaseOrderTable.js` | `b2bPurchaseOrder` | B2B | B2B purchase orders — needed for B2B procurement |
| `20241223000025_createB2bPurchaseOrderItemTable.js` | `b2bPurchaseOrderItem` | B2B | B2B PO line items — needed for B2B procurement |
| `20251223200012_createB2bUserTable.js` | `b2bUser` | B2B | B2B portal users — needed for B2B authentication |
| `20240805000422_createCustomerSegmentsTable.js` | `customerSegment` | Segment | Customer segments (legacy) — superseded by `segment` table but may still be needed |
| `20240805000423_createCustomerSegmentMembershipTable.js` | `customerSegmentMembership` | Segment | Segment membership (legacy) — same as above |
| `20240805000424_createCustomerLoyaltyProgramTable.js` | `customerLoyaltyProgram` | Loyalty | Loyalty program definition — needed for loyalty module |
| `20240805000425_createCustomerLoyaltyAccountTable.js` | `customerLoyaltyAccount` | Loyalty | Customer loyalty account — needed for loyalty module |
| `20251223200008_createLoyaltyPointsBatchTable.js` | `loyaltyPointsBatch` | Loyalty | Batch point operations — needed for bulk loyalty operations |
| `20240805001042_createMembershipGroup.js` | `membershipGroup` | Membership | Membership groups — needed for group membership features |
| `20240805001043_createMembershipGroupMember.js` | `membershipGroupMember` | Membership | Group members — needed for group membership |
| `20240805001044_createMembershipBenefitUsage.js` | `membershipBenefitUsage` | Membership | Benefit usage tracking — needed for benefit limits |
| `20240805001046_createMembershipDiscountCode.js` | `membershipDiscountCode` | Membership | Membership discount codes — needed for member discounts |
| `20240805001047_createMembershipDiscountCodeUsage.js` | `membershipDiscountCodeUsage` | Membership | Discount code usage — needed for member discounts |
| `20240805001037_createMembershipDiscountRule.js` | `membershipDiscountRule` | Membership | Discount rules for members — needed for member pricing |
| `20240805001038_createMembershipContentAccess.js` | `membershipContentAccess` | Membership | Content gating by membership — needed for premium content |
| `20240805000393_createNotificationEventLog.js` | `notificationEventLog` | Notification | Event-triggered notification log — needed for notification audit |
| `20240805000395_createNotificationWebhook.js` | `notificationWebhook` | Notification | Webhook-based notifications — needed for external integrations |
| `20240805001203_createNotificationCategory.js` | `notificationCategory` | Notification | Notification categories — needed for notification management |
| `20240805001204_createNotificationBatch.js` | `notificationBatch` | Notification | Batch notification sending — needed for bulk notifications |
| `20240805001205_createNotificationPreference.js` | `notificationPreference` | Notification | User notification preferences — needed for opt-out management |
| `20240805001206_createNotificationDevice.js` | `notificationDevice` | Notification | Push notification devices — needed for mobile push |
| `20240805001207_createNotificationUnsubscribe.js` | `notificationUnsubscribe` | Notification | Unsubscribe records — needed for email compliance |
| `20240805001309_createNotificationTemplateTranslation.js` | `notificationTemplateTranslation` | Notification | Translated notification templates — needed for i18n |
| `20240805000303_createMerchantContact.js` | `merchantContact` | Merchant | Merchant contact info — needed for merchant profiles |
| `20240805000305_createMerchantVerificationDocument.js` | `merchantVerificationDocument` | Merchant | KYC documents — needed for merchant onboarding |
| `20240805001100_createMerchantOrder.js` | `merchantOrder` | Merchant | Merchant-specific order view — needed for marketplace |
| `20240805001101_createMerchantShippingTemplate.js` | `merchantShippingTemplate` | Merchant | Merchant shipping templates — needed for merchant shipping setup |
| `20240805001102_createMerchantFollower.js` | `merchantFollower` | Merchant | Merchant followers — needed for marketplace social features |
| `20240805001103_createMerchantReview.js` | `merchantReview` | Merchant | Merchant reviews — needed for marketplace trust |
| `20240805001105_createMerchantBalance.js` | `merchantBalance` | Merchant | Merchant balance ledger — needed for marketplace payouts |
| `20240805001106_createMerchantTransaction.js` | `merchantTransaction` | Merchant | Merchant transaction log — needed for financial reconciliation |
| `20240805001107_createMerchantPayout.js` | `merchantPayout` | Merchant | Merchant payout records — needed for marketplace payouts |
| `20240805001108_createMerchantPayoutItem.js` | `merchantPayoutItem` | Merchant | Payout line items — needed for marketplace payouts |
| `20240805001109_createMerchantInvoice.js` | `merchantInvoice` | Merchant | Merchant invoices — needed for marketplace billing |
| `20240805001110_createMerchantTaxInfo.js` | `merchantTaxInfo` | Merchant | Merchant tax information — needed for tax compliance |
| `20241223000011_createMerchantSettlementTable.js` | `merchantSettlement` | Merchant | Settlement records — needed for marketplace financials |
| `20241223000012_createMerchantSettlementLineTable.js` | `merchantSettlementLine` | Merchant | Settlement line items — needed for marketplace financials |
| `20241223000013_createMerchantSettlementPayoutTable.js` | `merchantSettlementPayout` | Merchant | Settlement payouts — needed for marketplace financials |
| `20241223000014_createCommissionProfileTable.js` | `commissionProfile` | Merchant | Commission profiles — needed for marketplace commission rules |
| `20240805001057_createMerchantStore.js` | `merchantStore` | Merchant | Merchant store association — needed for multi-store marketplace |
| `20240805001058_createMerchantProduct.js` | `merchantProduct` | Merchant | Merchant product listings — needed for marketplace |
| `20240805001059_createMerchantProductVariant.js` | `merchantProductVariant` | Merchant | Merchant variant listings — needed for marketplace |
| `20240805000448_createProductBrandTable.js` | `productBrand` | Product | Product-to-brand mapping — needed for brand filtering |
| `20240805000455_createProductCategoryTable.js` | `productCategory` | Product | Product categories — needed for catalog navigation |
| `20240805000457_createProductTagTable.js` | `productTag` | Product | Product tags — needed for filtering and search |
| `20240805000459_createProductCollectionTable.js` | `productCollection` | Product | Product collections — needed for curated lists |
| `20240805000473_createProductListTable.js` | `productList` | Product | Custom product lists — needed for merchandising |
| `20240805001022_createProductListItemTable.js` | `productListItem` | Product | Items in product lists — needed for merchandising |
| `20240805000469_createProductQaTable.js` | `productQa` | Product | Product Q&A — needed for product pages |
| `20240805000470_createProductQaAnswerTable.js` | `productQaAnswer` | Product | Q&A answers — needed for product Q&A |
| `20240805000471_createProductQaVoteTable.js` | `productQaVote` | Product | Q&A votes — needed for product Q&A |
| `20240805000907_createProductReviewMediaTable.js` | `productReviewMedia` | Product | Review images/videos — needed for rich reviews |
| `20240805000909_createProductReviewVoteTable.js` | `productReviewVote` | Product | Review helpfulness votes — needed for review ranking |
| `20240805001028_createProductPrice.js` | `productPrice` | Product | Base product price table — needed for pricing |
| `20240805001015_createProductAttributeToGroup.js` | `productAttributeToGroup` | Product | Attribute-to-group mapping — needed for attribute management |
| `20240805001022_createProductToCategory.js` | `productToCategory` | Product | Product-category mapping — needed for catalog |
| `20240805001023_createProductToTag.js` | `productToTag` | Product | Product-tag mapping — needed for tagging |
| `20240805000904_createProductTagMap.js` | `productTagMap` | Product | Tag map (may overlap with productToTag) — review for deduplication |
| `20240805000905_createProductCollectionMap.js` | `productCollectionMap` | Product | Collection map — needed for collections |
| `20240805001306_createCategoryTranslation.js` | `categoryTranslation` | i18n | Category translations — needed for multilingual catalog |
| `20240805001307_createCollectionTranslation.js` | `collectionTranslation` | i18n | Collection translations — needed for multilingual catalog |
| `20240805001308_createContentPageTranslation.js` | `contentPageTranslation` | i18n | Content page translations — needed for multilingual CMS |
| `20240805001310_createAttributeTranslation.js` | `attributeTranslation` | i18n | Attribute translations — needed for multilingual attributes |
| `20240805001311_createAttributeOptionTranslation.js` | `attributeOptionTranslation` | i18n | Attribute option translations — needed for multilingual attributes |
| `20240805001314_createBrandTranslation.js` | `brandTranslation` | i18n | Brand translations — needed for multilingual brands |
| `20240805000924_createCurrencyExchangeRateHistory.js` | `currencyExchangeRateHistory` | Pricing | Exchange rate history — needed for historical pricing |
| `20240805000925_createCurrencyProvider.js` | `currencyProvider` | Pricing | Exchange rate providers — needed for auto rate updates |
| `20240805000102_createCurrencyRegion.js` | `currencyRegion` | Localization | Currency-region mapping — needed for regional pricing |
| `20240805000104_createCurrencyLocalization.js` | `currencyLocalization` | Localization | Currency display settings per locale — needed for i18n |
| `20240805000537_createCustomerPriceListTable.js` | `customerPriceList` | Pricing | Customer-specific price lists — needed for B2B pricing |
| `20241223100009_createPriceListScopeTable.js` | `priceListScope` | Pricing | Price list scope (store/channel) — needed for multi-store pricing |
| `20240805000501_createProductTieredPriceTable.js` | `productTieredPrice` | Pricing | Tiered pricing per product — needed for volume pricing |
| `20240805000934_createDistributionWarehouse.js` | `distributionWarehouse` | Warehouse | Warehouse management — needed for distribution |
| `20240805000935_createDistributionWarehouseZone.js` | `distributionWarehouseZone` | Warehouse | Warehouse zones — needed for warehouse management |
| `20240805000936_createDistributionWarehouseBin.js` | `distributionWarehouseBin` | Warehouse | Warehouse bins — needed for bin-level inventory |
| `20240805000941_createInventoryTransfer.js` | `inventoryTransfer` | Inventory | Inter-location transfers — needed for warehouse operations |
| `20240805000942_createInventoryTransferItem.js` | `inventoryTransferItem` | Inventory | Transfer line items — needed for inventory transfers |
| `20240805000943_createInventoryCount.js` | `inventoryCount` | Inventory | Stock count sessions — needed for cycle counting |
| `20240805000944_createInventoryCountItem.js` | `inventoryCountItem` | Inventory | Count line items — needed for cycle counting |
| `20240805001031_createInventoryLot.js` | `inventoryLot` | Inventory | Lot/batch tracking — needed for lot-controlled inventory |
| `20240805001032_createLowStockNotification.js` | `lowStockNotification` | Inventory | Low stock alerts — needed for reorder management |
| `20241223000015_createInventoryPoolTable.js` | `inventoryPool` | Inventory | Inventory pools — needed for multi-location allocation |
| `20241223000016_createInventoryPoolLocationTable.js` | `inventoryPoolLocation` | Inventory | Pool-location mapping — needed for inventory pools |
| `20241223000018_createInventoryReservationPoolTable.js` | `inventoryReservationPool` | Inventory | Reservation pools — needed for inventory allocation |
| `20241223000006_createFulfillmentPartnerTable.js` | `fulfillmentPartner` | Fulfillment | 3PL partners — needed for outsourced fulfillment |
| `20241223000007_createFulfillmentRuleTable.js` | `fulfillmentRule` | Fulfillment | Fulfillment routing rules — needed for smart fulfillment |
| `20241223100013_createFulfillmentNetworkRuleTable.js` | `fulfillmentNetworkRule` | Fulfillment | Network-level routing rules — needed for multi-warehouse fulfillment |
| `20240805001805_createDistributionPreOrder.js` | `distributionPreOrder` | Distribution | Pre-order management — needed for pre-launch products |
| `20240805001806_createDistributionPreOrderReservation.js` | `distributionPreOrderReservation` | Distribution | Pre-order reservations — needed for pre-order inventory |
| `20240805001807_createStoreLocation.js` | `storeLocation` | Store | Physical store locations — needed for omnichannel |
| `20240805001808_createDistributionPickupOrder.js` | `distributionPickupOrder` | Distribution | Click-and-collect orders — needed for BOPIS |
| `20240805001810_createDistributionFulfillmentPartner.js` | `distributionFulfillmentPartner` | Distribution | Distribution-level 3PL — needed for distribution module |
| `20240805001811_createDistributionRule.js` | `distributionRule` | Distribution | Distribution routing rules — needed for distribution module |
| `20240805001812_createDistributionOrderFulfillment.js` | `distributionOrderFulfillment` | Distribution | Distribution fulfillment records — needed for distribution module |
| `20241223000026_createStoreHierarchyTable.js` | `storeHierarchy` | Store | Store hierarchy (parent/child) — needed for multi-store |
| `20241223000027_createStoreSettingsTable.js` | `storeSettings` | Store | Per-store settings — needed for store customization |
| `20241223000029_createStoreDeliveryZoneTable.js` | `storeDeliveryZone` | Store | Store delivery zones — needed for local delivery |
| `20241223100002_createStoreChannelTable.js` | `storeChannel` | Store | Store-channel mapping — needed for omnichannel |
| `20241223100016_createSellerPolicyTable.js` | `sellerPolicy` | Merchant | Seller policies — needed for marketplace governance |
| `20251223200001_createOrganizationExtendedTable.js` | `organizationExtended` | Organization | Extended org fields — needed for enterprise org management |
| `20251223200002_createOrganizationMemberTable.js` | `organizationMember` | Organization | Org members — needed for org management |
| `20251223200003_createOrganizationSettingsTable.js` | `organizationSettings` | Organization | Org settings — needed for org management |
| `20251223200004_createAssortmentExtendedTable.js` | `assortmentExtended` | Assortment | Extended assortment fields — needed for advanced assortment |
| `20251223200005_createAssortmentRuleTable.js` | `assortmentRule` | Assortment | Assortment rules — needed for dynamic assortments |
| `20241223000003_createChannelWarehouseTable.js` | `channelWarehouse` | Channel | Channel-warehouse mapping — needed for channel inventory |
| `20240805000704_createBasketSavedItem.js` | `basketSavedItem` | Basket | Saved-for-later items — needed for wishlist-like basket feature |
| `20240805000702_createCartPromotionTable.js` | `cartPromotion` | Promotion | Cart-level promotions — needed for checkout discounts |
| `20240805000703_createCartPromotionItemTable.js` | `cartPromotionItem` | Promotion | Cart promotion line items — needed for promotion details |
| `20240805000491_createPromotionCouponBatchTable.js` | `promotionCouponBatch` | Promotion | Bulk coupon generation — needed for coupon campaigns |
| `20240805000490_createPromotionCouponRestrictionTable.js` | `promotionCouponRestriction` | Promotion | Coupon usage restrictions — needed for coupon rules |
| `20240805000500_createPromotionBuyXGetYDiscountTable.js` | `promotionBuyXGetYDiscount` | Promotion | BXGY promotions — needed for promotional mechanics |
| `20240805000495_createCategoryPromotionProductTable.js` | `categoryPromotionProduct` | Promotion | Products in category promotions — needed for category deals |
| `20240805002_createProductTypeTable.js` | `productType` | Product | Product type definitions — needed for product classification |
| `20240805000476_createProductAttributeGroupTable.js` | `productAttributeGroup` | Product | Attribute groups — needed for attribute organization |
| `20240805000902_createProductSeoTable.js` | `productSeo` | Product | Product SEO metadata — needed for SEO |


---

### Likely Obsolete / Review for Removal

These tables appear to be superseded, redundant, or from an earlier design that was replaced.

| Migration File | Table | Reason |
|---|---|---|
| `20240805000002_createProductTypeTable.js` | `productType` | Very early migration (timestamp `000002`), likely a placeholder. Verify if `productType` is still the intended table name vs the later `20241219000007_createUser.js` era tables |
| `20240805000429_createDistributionChannel.js` | `distributionChannel` | Superseded by the `channel` module (`20241223000001_createChannelTable.js`). The `channel` table is what repos use. |
| `20240805000430_createDistributionChannelProduct.js` | `distributionChannelProduct` | Same — superseded by `channelProduct` |
| `20240805000907_seedContentTemplates.js` | (seed, not table) | This is a seed file in the migrations folder — should be moved to `seeds/` |
| `20251220221602_setupBusiness.js` | (alter/setup) | Overlaps with `20241220000001_createBusiness.js` — verify it doesn't recreate the table |
| `20251220221603_setupProduct.js` | (alter/setup) | Overlaps with `20240805000468_createProduct.js` — verify it doesn't recreate the table |
| `20240805000800_createOrderAddress.js` (if duplicate) | `orderAddress` | Check if `20240805000803_createOrderAddress.js` is the canonical one |

---

## RECOMMENDATIONS

1. ✅ **Move `20240805000907_seedContentTemplates.js` to `seeds/`** — done, moved to `seeds/20240805000900_seedContentTemplates.js`.

2. ✅ **Duplicate B2B approval migrations** — `20240805001506-1509` series deleted. `20241223000019-0021` are canonical.

3. ✅ **Duplicate loyalty migrations** — `20240805000526/529/530` deleted. `20251223200006/007/009` are canonical.

4. ✅ **Duplicate payout migration** — `20240805000442` deleted. `20241223100017` is canonical.

5. ✅ **Marketing module repos built** — `modules/marketing/infrastructure/repositories/` created with: `emailCampaignRepo`, `emailTemplateRepo`, `campaignRecipientRepo`, `abandonedCartRepo`, `productRecommendationRepo`, `affiliateRepo`, `referralRepo`. Covers all 14 marketing migrations.

6. ✅ **Notification module completed** — 8 missing repos added: `notificationPreferenceRepo`, `notificationDeviceRepo`, `notificationCategoryRepo`, `notificationBatchRepo`, `notificationUnsubscribeRepo`, `notificationWebhookRepo`, `notificationEventLogRepo`, `notificationTemplateTranslationRepo`.

7. ✅ **Merchant financial repos built** — `merchantBalanceRepo`, `merchantTransactionRepo`, `merchantSettlementRepo`, `merchantInvoiceRepo` added to `modules/merchant/infrastructure/repositories/`.

8. ✅ **Fulfillment/distribution repos built** — `fulfillmentPartnerRepo`, `fulfillmentRuleRepo`, `fulfillmentNetworkRuleRepo` added to `modules/fulfillment/infrastructure/repositories/`. Pre-order and pickup order repos remain as future work when those flows are implemented.

9. ✅ **`productToTag` duplicate removed** — `20240805001023_createProductToTag.js` deleted. `productTagMap` is canonical per the Table enum.

---

*Generated: March 2026 | Based on cross-referencing `migrations/` against `modules/*/infrastructure/repositories/` and `modules/*/repos/`*
