# Current Tax Feature Implementation

Based on the repository code and the readme documentation, the current tax feature implements a relatively straightforward taxation system with the following components:

## Core Data Models

### TaxRate
- Defines tax percentages based on geographic locations
- Supports targeting by country, region/state, and postal code
- Includes priority settings to determine application order
- Has status flags (active/inactive) for easy enabling/disabling
- Supports optional product category targeting

### TaxCategory
- Classifies products for different tax treatments
- Provides a code field for integration with external systems
- Allows grouping products that should receive the same tax treatment

### TaxExemption
- Tracks customers who are exempt from taxes
- Stores certificate numbers and optional certificate images
- Includes expiration dates and status tracking
- Simple boolean exemption (either fully exempt or not)

## Current Functionality

### Tax Rate Management
- CRUD operations for creating, reading, updating, and deleting tax rates
- Filter tax rates by country, region, and active status
- Prevent deletion of tax rates currently in use by orders

### Tax Category Management
- Organize products into different tax categories
- Assign categories to products to determine applicable tax rates
- Ensure categories cannot be deleted if in use by products

### Tax Exemption Handling
- Track tax-exempt customers (businesses, non-profits, etc.)
- Store expiration dates for exemptions
- Simple exemption checking during tax calculation

### Tax Calculation
- **Basic line item calculation** that:
  - Checks for customer exemptions first
  - Looks up product tax category
  - Finds matching tax rates based on shipping address (country, region, postal code)
  - Applies the rates in priority order
  - Returns tax amount and breakdown

- **Basket-level tax calculation** that:
  - Processes each line item individually
  - Aggregates tax totals and breakdowns
  - Returns tax information for the entire basket

## Implementation Limitations

The current implementation has some limitations:

1. **Simple Geographic Targeting**
   - Location matching is based on direct equality rather than hierarchical relationships
   - No proper zone-based taxation model

2. **Basic Exemption Model**
   - Customers are either fully exempt or fully taxable
   - No partial exemptions or category-specific exemptions

3. **Limited Calculation Methods**
   - Only supports basic percentage-based taxes
   - No compound tax support (tax-on-tax)
   - No special rules like thresholds or maximum amounts

4. **No Merchant-specific Settings**
   - Lacks configuration options for price display, calculation methods, etc.
   - No concept of tax inclusion in prices

5. **Limited Reporting**
   - No structured tax calculation logging for reporting purposes
   - No tax filing support or jurisdiction-based reporting

The system works adequately for basic domestic taxation but would require significant enhancements (like the ones we've implemented) to support more complex tax scenarios, especially for global ecommerce operations.

---

# Enhanced Tax System

We've implemented a comprehensive tax system that addresses the limitations of the current implementation and provides a robust foundation for global ecommerce taxation. This enhanced system is designed to be flexible, accurate, and compliant with various tax regulations around the world.

## New Database Schema

The enhanced tax system is built on a more sophisticated database schema:

### Core Tables
- **tax_category**: Defines product tax classifications with default indicators and sorting
- **tax_zone**: Geographic tax jurisdictions with support for countries, states, postal codes, and cities
- **tax_rate**: Links tax categories to zones with various calculation options
- **tax_rule**: Conditional tax rules based on customer groups, amounts, etc.
- **tax_settings**: Merchant-specific tax configuration options

### Customer Exemption Tables
- **customer_tax_exemption**: Enhanced exemption tracking with verification status
- **customer_tax_exemption_category**: Category-specific tax exemptions
- **customer_group_tax_override**: Group-level tax overrides and exemptions

### Product Tax Tables
- **product_tax_category**: Assigns tax categories to products and variants
- **product_tax_exemption**: Product-specific tax exemptions by zone

### Reporting Tables
- **tax_calculation**: Records all tax calculations performed
- **tax_calculation_line**: Itemized tax breakdown for orders
- **tax_calculation_applied**: Granular record of each tax rate applied
- **tax_report**: Configuration for tax reports and filings
- **tax_nexus**: Tracks merchant tax obligations in different jurisdictions

## Enhanced Functionality

### Advanced Geographic Targeting
- **Zone-based Taxation**: Hierarchical location matching (postal code > city > state > country)
- **Array-based Matching**: Efficient matching using PostgreSQL array operators
- **Jurisdiction Hierarchy**: Support for country, state, county, city, and special district taxes

### Comprehensive Exemption Model
- **Multi-level Exemptions**: Support for business, government, nonprofit, education, etc.
- **Category-specific Exemptions**: Exemptions that apply only to certain product categories
- **Verification Workflow**: Track verification status, documents, and approval history

### Sophisticated Calculation Methods
- **Multiple Calculation Methods**: Unit-based, row-based, and total-based calculations
- **Compound Taxes**: Support for tax-on-tax calculations with priority ordering
- **Fixed and Percentage Taxes**: Support for both percentage-based and fixed amount taxes
- **Thresholds and Maximums**: Apply tax rules based on minimum or maximum amounts

### Merchant Configuration
- **Display Options**: Control how taxes are displayed to customers
- **Calculation Preferences**: Configure how and when taxes are calculated
- **Tax Provider Integration**: Support for external tax services like Avalara or TaxJar

### Comprehensive Reporting
- **Tax Calculation Logging**: Detailed records of all tax calculations for auditing
- **Jurisdiction Reporting**: Generate reports by tax jurisdiction
- **Filing Support**: Data preparation for tax filing requirements

## Implementation Details

### Tax Zone Matching
The implementation uses PostgreSQL's GIN indexes and array operators for efficient zone matching, with a cascading approach to find the most specific match:

```typescript
// Try to match with postal code (most specific)
if (address.postalCode) {
  const postalCodeMatch = await queryOne<TaxZone>(
    `SELECT * FROM "public"."tax_zone"
    WHERE "isActive" = TRUE
    AND "countries" @> ARRAY[$1]::varchar(2)[]
    AND ($2 IS NULL OR "states" @> ARRAY[$2]::varchar(10)[])
    AND "postcodes" @> ARRAY[$3]::text[]
    ORDER BY "isDefault" DESC
    LIMIT 1`,
    [address.country, address.region || null, address.postalCode]
  );
  
  if (postalCodeMatch) {
    return postalCodeMatch;
  }
}
```

### Enhanced Tax Calculation
The new `calculateComplexTax` method provides a comprehensive solution:

```typescript
// Process all items
for (const item of items) {
  // Get product tax category with fallback to default
  const product = await this.getProductWithTaxInfo(item.productId);
  const taxCategoryId = item.taxCategoryId || product.taxCategoryId || settings.defaultTaxCategory;
  
  // Get all applicable tax rates
  const taxRates = await this.getTaxRatesForZoneAndCategory(
    taxZone.id,
    taxCategoryId
  );
  
  // Calculate taxes with proper sorting and compounding
  const sortedRates = taxRates.sort((a, b) => a.priority - b.priority);
  
  for (const rate of sortedRates) {
    // Apply calculation method, handle compound taxes, etc.
  }
}
```

### Integration with Basket System
The tax system integrates with the basket feature to provide accurate tax calculations during checkout:

```typescript
// In basketRepo.ts (conceptual)
const taxResult = await this.taxRepo.calculateComplexTax(
  items,
  shippingAddress,
  billingAddress,
  subtotal,
  shippingAmount,
  customerId,
  merchantId
);
```

## Benefits

1. **Global Tax Compliance**: Support for complex international tax requirements
2. **Accurate Calculations**: Precise tax calculations based on location, product type, and customer status
3. **Flexible Configuration**: Adaptable to various business models and regional requirements
4. **Detailed Reporting**: Comprehensive data for tax filings and audits
5. **Modern Architecture**: Designed with scalability and performance in mind