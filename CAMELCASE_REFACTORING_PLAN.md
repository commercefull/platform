# CamelCase Refactoring Plan

## Overview

This document outlines the plan to refactor all database migrations to use `camelCase` for table and column names, reverting the recent shift to `snake_case`. This change will align the project with the initial architectural decision and ensure a consistent naming strategy across the entire platform.

## Target State

- **Migration Engine**: Knex
- **File Naming**: Timestamp with camelCase (e.g., `20240805000201_createCustomer.js`)
- **Database Naming**: `camelCase` for all tables and columns (e.g., `customerId`, `firstName`, `createdAt`).

## Refactoring Strategy

The refactoring process will be executed in the following steps:

1.  **Identify All `snake_case` Migrations**: Systematically scan all files in the `migrations_knex` directory to identify every instance of `snake_case` in table names, column names, and other database identifiers.
2.  **Generate a File-by-File Plan**: For each identified file, document the specific changes required to convert all `snake_case` identifiers to `camelCase`.
3.  **Execute the Refactoring**: Apply the changes to each file, ensuring that all table and column names are updated consistently.
4.  **Test and Verify**: After refactoring, run the entire migration sequence on a test database to ensure that the schema is created correctly and that all relationships are intact.

## Files to Refactor

The following is a comprehensive list of all migration files that require refactoring. For each file, the table and column names that must be converted from `snake_case` to `camelCase` are listed.

### Merchant Migrations

- **`20240805000930_createMerchantContact.js`**
  - Table: `merchant_contact` → `merchantContact`
  - Columns: `merchant_id` → `merchantId`, `first_name` → `firstName`, `last_name` → `lastName`, `job_title` → `jobTitle`, `is_primary` → `isPrimary`, `created_at` → `createdAt`, `updated_at` → `updatedAt`
- **`20240805001101_createMerchantShippingTemplate.js`**
  - Enum: `merchant_shipping_template_rules_type` → `merchantShippingTemplateRulesType`
  - Index: `merchant_shipping_template_default_idx` → `merchantShippingTemplateDefaultIdx`
- **`20240805001109_createMerchantInvoice.js`**
  - Enum: `merchant_invoice_status` → `merchantInvoiceStatus`

### Shipping and Currency Migrations

- **`20240805000956_seedShippingRates.js`**
  - Tables: `shipping_zone` → `shippingZone`, `shipping_method` → `shippingMethod`, `shipping_rate` → `shippingRate`
  - Columns: `zone_id` → `zoneId`, `method_id` → `methodId`, `is_active` → `isActive`, `rate_type` → `rateType`, `base_rate` → `baseRate`, `per_item_rate` → `perItemRate`
- **`20240805000923_createCurrencyExchangeRate.js`**
  - Table: `currency_exchange_rate` → `currencyExchangeRate`
- **`20240805000924_createCurrencyExchangeRateHistory.js`**
  - Table: `currency_exchange_rate_history` → `currencyExchangeRateHistory`
- **`20240805000925_createCurrencyProvider.js`**
  - Table: `currency_provider` → `currencyProvider`

### Product and Inventory Migrations

- **`20240805001010_createProductCategory.js`**
  - Table: `product_category` → `productCategory`
- **`20240805001011_createProductBrand.js`**
  - Table: `product_brand` → `productBrand`
- **`20240805001012_createProductAttribute.js`**
  - Table: `product_attribute` → `productAttribute`
- **`20240805001013_createProductAttributeValue.js`**
  - Table: `product_attribute_value` → `productAttributeValue`
- **`20240805001027_createPriceList.js`**
  - Table: `price_list` → `priceList`
  - Columns: `is_active` → `isActive`, `customer_group` → `customerGroup`, `valid_from` → `validFrom`, `valid_to` → `validTo`, `currency_code` → `currencyCode`, `price_type` → `priceType`, `base_on` → `baseOn`, `percentage_value` → `percentageValue`, `min_quantity` → `minQuantity`, `created_at` → `createdAt`, `updated_at` → `updatedAt`, `created_by` → `createdBy`

This list represents a starting point. A complete, automated scan will be performed to ensure no files are missed.

## Implementation Steps

1.  **Backup Existing Migrations**: Before starting, create a complete backup of the `migrations_knex` directory.
2.  **Automated Scripting**: Develop a script to automate the renaming process to minimize manual errors.
3.  **Manual Review**: After running the script, manually review each changed file to ensure correctness.
4.  **Testing**: Execute the full migration suite on a clean database to verify that the schema is correctly created and all data relationships are preserved.

By following this plan, we will successfully align the entire database schema with the `camelCase` naming convention, improving consistency and maintainability across the project.
