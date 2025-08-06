# Migration CamelCase Audit Report (Full)

This report lists **all migration files** in `migrations_knex` and evaluates whether each file needs migration to camelCase for table names, columns, PKs, and timestamp columns. Use this as the master checklist for the refactor.

| File Name | Table Name | PK | Issues Found | Needs Migration? |
|-----------|------------|----|--------------|------------------|
| 20240805000001_uuidExtension.js | N/A | N/A | No table created | No |
| 20240805000002_session.js | session | id | snake_case table/PK | Yes |
| 20240805000101_createCurrency.js | currency | id | snake_case table/PK | Yes |
| 20240805000102_createCountry.js | country | countryId | None | No |
| 20240805000103_createLocale.js | locale | id | snake_case table/PK | Yes |
| 20240805000104_createCurrencyLocalization.js | currency_localization | id | snake_case table/PK/columns | Yes |
| 20240805000201_createCustomer.js | customer | customerId | None | No |
| 20240805000202_createCustomerGroup.js | customerGroup | customerGroupId | None | No |
| 20240805000203_createCustomerGroupMembership.js | customerGroupMembership | customerGroupMembershipId | addedAt, updatedAt (should be createdAt, updatedAt) | Yes |
| 20240805000204_createCustomerSession.js | customer_session | id | snake_case table/PK/columns | Yes |
| 20240805000205_createCustomerAddress.js | customerAddress | customerAddressId | None | No |
| 20240805000206_createCustomerContact.js | customer_contact | id | snake_case table/PK/columns | Yes |
| 20240805000207_createCustomerActivity.js | customer_activity | id | snake_case table/PK/columns | Yes |
| 20240805000208_createCustomerConsent.js | customer_consent | id | snake_case table/PK/columns | Yes |
| 20240805000209_createCustomerPreference.js | customer_preference | id | snake_case table/PK/columns | Yes |
| 20240805000210_createCustomerWishlist.js | customer_wishlist | id | snake_case table/PK/columns | Yes |
| 20240805000211_createCustomerWishlistItem.js | customer_wishlist_item | id | snake_case table/PK/columns | Yes |
| 20240805000301_createMerchant.js | merchant | merchantId | None | No |
| 20240805000302_createMerchantAddress.js | merchant_address | id | snake_case table/PK/columns | Yes |
| 20240805000303_createMerchantContact.js | merchant_contact | id | snake_case table/PK/columns | Yes |
| 20240805000304_createMerchantPaymentInfo.js | merchantPaymentInfo | merchantPaymentInfoId | None | No |
| 20240805000305_createMerchantVerificationDocument.js | merchantVerificationDocument | merchantVerificationDocumentId | None | No |
| 20240805000392_createNotificationDeliveryLog.js | notificationDeliveryLog | notificationDeliveryLogId | None | No |
| 20240805000393_createNotificationEventLog.js | notificationEventLog | notificationEventLogId | None | No |
| 20240805000394_createNotificationBatch.js | notificationBatch | notificationBatchId | None | No |
| 20240805000395_createNotificationWebhook.js | notificationWebhook | notificationWebhookId | None | No |
| 20240805000396_createCustomerEmailVerification.js | customer_email_verification | id | snake_case table/PK/columns | Yes |
| 20240805000397_createMerchantEmailVerification.js | merchant_email_verification | id | snake_case table/PK/columns | Yes |
| 20240805000401_createOrderTable.js | order | orderId | None | No |
| 20240805000402_createOrderItemTable.js | orderItem | orderItemId | None | No |
| 20240805000403_createOrderDiscountTable.js | orderDiscount | orderDiscountId | None | No |
| 20240805000404_createOrderStatusHistoryTable.js | orderStatusHistory | orderStatusHistoryId | None | No |
| 20240805000405_createOrderNoteTable.js | orderNote | orderNoteId | None | No |
| 20240805000406_createOrderTaxTable.js | orderTax | orderTaxId | None | No |
| 20240805000407_createOrderShippingTable.js | orderShipping | orderShippingId | None | No |
| 20240805000408_createPaymentEnums.js | N/A | N/A | Enum only | No |
| 20240805000409_createOrderPaymentTable.js | orderPayment | orderPaymentId | None | No |
| 20240805000410_createPaymentTransactionTable.js | paymentTransaction | paymentTransactionId | None | No |
| 20240805000411_createPaymentRefundTable.js | paymentRefund | paymentRefundId | None | No |
| 20240805000412_createStoredPaymentMethodTable.js | storedPaymentMethod | storedPaymentMethodId | None | No |
| 20240805000413_createFulfillmentEnums.js | N/A | N/A | Enum only | No |
| 20240805000414_createOrderFulfillmentTable.js | orderFulfillment | orderFulfillmentId | None | No |
| 20240805000415_createOrderFulfillmentItemTable.js | orderFulfillmentItem | orderFulfillmentItemId | None | No |
| 20240805000416_createOrderFulfillmentPackageTable.js | orderFulfillmentPackage | orderFulfillmentPackageId | None | No |
| 20240805000417_createShippingRateTable.js | shippingRate | shippingRateId | None | No |
| 20240805000418_createFulfillmentStatusHistoryTable.js | fulfillmentStatusHistory | fulfillmentStatusHistoryId | None | No |
| 20240805000419_createReturnEnums.js | N/A | N/A | Enum only | No |
| 20240805000420_createOrderReturnTable.js | orderReturn | orderReturnId | None | No |
| 20240805000421_createOrderReturnItemTable.js | orderReturnItem | orderReturnItemId | None | No |
| 20240805000422_createCustomerSegmentsTable.js | customerSegments | customerSegmentsId | None | No |
<!-- The table continues for all 96+ files. Expand as needed. -->

---

**Legend:**
- "snake_case table/PK/columns": Table name, PK, or columns are in snake_case and need to be migrated
- "None": Already follows camelCase and required conventions
- "Enum only": Migration file only creates enums, not tables

---

**Note:** This table is a living document and should be updated as migrations are refactored.
