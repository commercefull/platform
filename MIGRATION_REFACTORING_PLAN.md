# Migration Refactoring Plan

## Overview

This document outlines the comprehensive plan for refactoring all migrations in the CommerceFull platform to:
1. Use Knex instead of node-pg-migrate
2. Convert from snake_case to camelCase naming for both files and database schema
3. Follow the structure and conventions found in the clinic-organize project

## Current State

- **Migration Engine**: node-pg-migrate
- **File Naming**: Timestamp with snake_case (e.g., `1737393012101_currency_base.js`)
- **Database Naming**: snake_case for tables and columns (e.g., `customer_id`, `first_name`)
- **Code Structure**: Uses `exports.shorthands` and `exports.up/down` with `pgm` parameter

## Target State

- **Migration Engine**: Knex
- **File Naming**: Timestamp with camelCase (e.g., `20241219154942_authToken.js`)
- **Database Naming**: camelCase for tables and columns (e.g., `userId`, `firstName`)
- **Code Structure**: Uses `exports.up/down` with `knex` parameter and returns promises
- **One Migration Per File**: Each migration file should contain operations for only one logical database object (unlike some current files that contain multiple migrations)

## Migration Strategy

### 1. File Renaming and Splitting Pattern

Each migration file will be renamed following this pattern:
- Original: `1737393012101_currency_base.js`
- New: `20240805000101_currencyBase.js`

The timestamp conversion will preserve the chronological order by:
1. Using the first 8 digits for the date (YYYYMMDD)
2. Using the last 6 digits for time (HHMMSS)
3. Converting snake_case to camelCase for the descriptive part

### 2. Migration File Splitting

Many existing migration files contain operations for multiple database objects. These need to be split into separate files, each handling exactly one logical database object:

- **Example Split**: A file like `1737393012393_auth_email_verification.js` that creates both `customer_email_verification` and `merchant_email_verification` tables should be split into:
  - `20240805000393_customerEmailVerification.js` - For customer email verification only
  - `20240805000394_merchantEmailVerification.js` - For merchant email verification only

- **Timestamp Sequencing**: When splitting files, use sequential timestamps to maintain order
  - Increment the last digits of the timestamp by 1 for each split file
  - Ensure the files are executed in the correct order

### 3. Schema Naming Conversion

All database objects will be converted from snake_case to camelCase:

| Current (snake_case) | New (camelCase) |
|---------------------|-----------------|
| currency | currency |
| customer_id | customerId |
| first_name | firstName |
| created_at | createdAt |
| is_active | isActive |
| email_verified | emailVerified |

### 4. Code Transformation

Each migration file will be transformed from:

```javascript
// Current: node-pg-migrate
exports.shorthands = undefined;

exports.up = function(knex) {
  return knex.schema.createTable('customer_email_verification', t => {
    t.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.uuid('customer_id').references('customer.id').onUpdate('CASCADE').onDelete('CASCADE').notNullable();
    t.timestamp('expires_at').notNullable();
    t.boolean('is_used').notNullable().defaultTo(false);
    t.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('customer_email_verification');
};
```

To:

```javascript
// New: Knex
exports.up = function(knex) {
  return knex.schema.createTable('customerEmailVerification', t => {
    t.uuid('customerEmailVerificationId').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.uuid('customerId').references('customer.id').onUpdate('CASCADE').onDelete('CASCADE').notNullable();
    t.timestamp('expiresAt').notNullable();
    t.boolean('isUsed').notNullable().defaultTo(false);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('customerEmailVerification');
};
```

## File-by-File Migration Plan

Below is the detailed mapping for each migration file in the CommerceFull platform:

| Current Filename | New Filename | Tables to Convert |
|-----------------|--------------|------------------|
| 1737240713161_uuid_extension.js | 20240805000001_uuidExtension.js | N/A (Raw SQL) |
| 1737277931023_session.js | 20240805000002_session.js | session |
| 1737393012101_currency_base.js | 20240805000101_currencyBase.js | currency |
| 1737393012102_currency_localization.js | 20240805000102_currencyLocalization.js | currency_localization |
| 1737393012105_customer_base.js | 20240805000105_customerBase.js | customer |
| 1737393012110_customer_addresses.js | 20240805000110_customerAddresses.js | customer_address |
| 1737393012111_customer_activity.js | 20240805000111_customerActivity.js | customer_activity, customer_session |
| 1737393012291_admin.js | 20240805000291_admin.js | admin, admin_role |
| 1737393012292_auth_tokens.js | 20240805000292_authTokens.js | auth_token, token_blacklist, refresh_token |
| 1737393012300_basket.js | 20240805000300_basket.js | basket |
| 1737393012301_basket_items.js | 20240805000301_basketItems.js | basket_item |
| 1737393012302_basket_discounts.js | 20240805000302_basketDiscounts.js | basket_discount |
| 1737393012303_basket_history_and_analytics.js | 20240805000303_basketHistoryAndAnalytics.js | basket_history, basket_analytics |
| 1737393012310_checkout_order.js | 20240805000310_checkoutOrder.js | checkout_session, checkout_order |
| 1737393012311_checkout_addresses.js | 20240805000311_checkoutAddresses.js | checkout_address |
| 1737393012312_checkout_payments.js | 20240805000312_checkoutPayments.js | checkout_payment |
| 1737393012313_checkout_fulfillment.js | 20240805000313_checkoutFulfillment.js | checkout_fulfillment |
| 1737393012320_content_types.js | 20240805000320_contentTypes.js | content_type |
| 1737393012321_content_templates.js | 20240805000321_contentTemplates.js | content_template |
| 1737393012322_content_pages.js | 20240805000322_contentPages.js | content_page, content_block |
| 1737393012323_content_media_folder.js | 20240805000323_contentMediaFolder.js | content_media_folder |
| 1737393012323_content_navigation.js | 20240805000324_contentNavigation.js | content_navigation, content_navigation_item |
| 1737393012324_content_media_redirects.js | 20240805000325_contentMediaRedirects.js | content_media, content_redirect |
| 1737393012331_currency_exchange_rates.js | 20240805000331_currencyExchangeRates.js | currency_exchange_rate |
| 1737393012340_merchant_base.js | 20240805000340_merchantBase.js | merchant |
| 1737393012350_distribution_warehouses.js | 20240805000350_distributionWarehouses.js | distribution_warehouse, distribution_warehouse_address |
| 1737393012351_distribution_inventory_movement.js | 20240805000351_distributionInventoryMovement.js | distribution_inventory, distribution_inventory_movement |
| 1737393012352_distribution_shipping_methods.js | 20240805000352_distributionShippingMethods.js | distribution_shipping_method, distribution_shipping_zone |
| 1737393012353_distribution_supply_chain.js | 20240805000353_distributionSupplyChain.js | distribution_supplier, distribution_supplier_product |
| 1737393012360_inventory_products.js | 20240805000360_inventoryProducts.js | inventory_product, inventory_product_category |
| 1737393012361_inventory_product_core.js | 20240805000361_inventoryProductCore.js | inventory_product_attribute, inventory_product_variant |
| 1737393012362_inventory_pricing_stock.js | 20240805000362_inventoryPricingStock.js | inventory_pricing, inventory_stock |
| 1737393012370_membership_plans.js | 20240805000370_membershipPlans.js | membership_plan, membership_tier, membership_benefit |
| 1737393012371_membership_subscribers.js | 20240805000371_membershipSubscribers.js | membership_subscriber, membership_transaction |
| 1737393012381_auth_password_reset.js | 20240805000381_authPasswordReset.js | auth_password_reset |
| 1737393012381_currency_store_settings.js | 20240805000382_currencyStoreSettings.js | currency_store_setting |
| 1737393012381_merchant_store.js | 20240805000383_merchantStore.js | merchant_store, merchant_store_setting |
| 1737393012382_merchant_financials.js | 20240805000384_merchantFinancials.js | merchant_financial, merchant_transaction |
| 1737393012390_notification_base.js | 20240805000390_notificationBase.js | notification_template, notification_channel |
| 1737393012391_notification_preferences.js | 20240805000391_notificationPreferences.js | notification_preference |
| 1737393012392_notification_logs.js | 20240805000392_notificationLogs.js | notification_log, notification_delivery |
| 1737393012393_auth_email_verification.js | 20240805000393_customerEmailVerification.js | customer_email_verification |
| | 20240805000394_merchantEmailVerification.js | merchant_email_verification |
| 1737393012400_order_core.js | 20240805000400_orderCore.js | order, order_item |
| 1737393012401_order_payment.js | 20240805000401_orderPayment.js | order_payment, payment_transaction |
| 1737393012402_order_fulfillment.js | 20240805000402_orderFulfillment.js | order_fulfillment, order_shipment |
| 1737393012410_customer_segments_loyalty.js | 20240805000410_customerSegmentsLoyalty.js | customer_segment, customer_loyalty |
| 1738301234567_channels.js | 20240805000411_channels.js | channel, channel_integration |
| 1744274544000_payment.js | 20240805000412_payment.js | payment, payment_method |
| 1744274544001_payment_payouts.js | 20240805000413_paymentPayouts.js | payment_payout, payout_transaction |
| 1744274970000_product_core.js | 20240805000414_productCore.js | product, product_variant |
| 1744274970001_product_categories.js | 20240805000415_productCategories.js | product_category, category_relationship |
| 1744274970002_product_relationships.js | 20240805000416_productRelationships.js | product_relationship, product_collection |
| 1744274970003_product_attributes.js | 20240805000417_productAttributes.js | product_attribute, product_attribute_value |
| 1744276504000_promotion_core.js | 20240805000418_promotionCore.js | promotion, promotion_rule |
| 1744276504001_promotion_coupon.js | 20240805000419_promotionCoupon.js | promotion_coupon |
| 1744276504002_promotion_cart_category.js | 20240805000420_promotionCartCategory.js | cart_promotion, category_promotion |
| 1744276504003_promotion_discount.js | 20240805000421_promotionDiscount.js | promotion_discount |
| 1744277022000_tax_core.js | 20240805000422_taxCore.js | tax_rate, tax_category |
| 1744277022001_tax_exemptions.js | 20240805000423_taxExemptions.js | tax_exemption |
| 1744277022002_tax_reporting.js | 20240805000424_taxReporting.js | tax_report, tax_transaction |
| 1744887496000_product_variants.js | 20240805000425_productVariants.js | product_variant_attribute |
| 1744887496001_product_images.js | 20240805000426_productImages.js | product_image |
| 1744887496010_loyalty_core.js | 20240805000427_loyaltyCore.js | loyalty_program, loyalty_reward |
| 1744887496020_pricing_core.js | 20240805000428_pricingCore.js | pricing_rule, pricing_tier |

## Implementation Steps

1. **Migration File Analysis**
   - Identify all migration files that contain multiple database objects
   - Plan the logical splitting of these files to ensure one migration per file
   - Create a comprehensive list of all required new migration files

2. **Dependencies Installation**
   - Ensure Knex is installed: `npm install knex --save`
   - Configure Knex with PostgreSQL: `npm install pg --save`
   - Create a knexfile.js in the root directory

2. **For Each Migration File**
   - Create new file with the renamed pattern
   - Convert code structure from node-pg-migrate to Knex
   - Convert all table and column names from snake_case to camelCase
   - Convert references, indexes, and constraints to match new naming
   - Ensure all operations are properly chained with Promises

3. **Special Considerations**
   - Raw SQL statements need to be carefully converted
   - Complex operations like indexes with conditions need special attention
   - Ensure reference integrity with foreign keys
   - Handle type conversions appropriately
   - When splitting migrations, ensure that dependencies between tables are maintained
   - For migrations that modify existing tables with multiple operations, split operations into logical units

4. **Testing and Verification**
   - Create a test database to verify migrations
   - Ensure all tables, columns, and relationships are correctly created
   - Validate that all constraints and indexes work as expected

## Database Schema Changes

All database object names will follow these conversion rules:

1. **Table Names**: Convert from snake_case to camelCase
   - Example: `customer_address` → `customerAddress`

2. **Column Names**: Convert from snake_case to camelCase
   - Example: `first_name` → `firstName`
   - Example: `is_default` → `isDefault`

3. **Primary Keys**: Keep as-is if already using camelCase (like `id`), otherwise convert
   - Example: `customer_id` → `customerId`

4. **Foreign Keys**: Convert both column and reference names
   - Example: `customer_id REFERENCES customer(id)` → `customerId REFERENCES customer(id)`

5. **Indexes**: Convert both index names and referenced columns
   - Example: `idx_customer_email` → `idxCustomerEmail`
   - Referenced columns follow camelCase conversion

6. **Constraints**: Convert constraint names and columns
   - Example: `uq_customer_email` → `uqCustomerEmail`

## Implementation Timeline

1. **Phase 1: Preparation** (1 day)
   - Install dependencies
   - Set up Knex configuration
   - Create backup of existing migration files

2. **Phase 2: Core Migrations** (2 days)
   - Convert foundational migrations (UUID, session, currency, customer)
   - Test and verify core schema integrity

3. **Phase 3: Feature Migrations** (3-5 days)
   - Convert feature-specific migrations (basket, checkout, content, etc.)
   - Group by related features for systematic testing

4. **Phase 4: Testing & Verification** (1-2 days)
   - Run complete migration sequence on test database
   - Compare schema with original to ensure equivalence
   - Fix any issues or inconsistencies

5. **Phase 5: Deployment** (1 day)
   - Prepare deployment plan
   - Execute migration transition in production

## Conclusion

This refactoring plan provides a comprehensive approach to migrate from node-pg-migrate with snake_case conventions to Knex with camelCase conventions. The plan preserves the chronological order of migrations and ensures that the resulting database schema will match the camelCase convention as required, while maintaining data integrity and functionality.
