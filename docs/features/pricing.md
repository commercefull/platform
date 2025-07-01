# Pricing Feature

The Pricing Feature is a core component of the CommerceFull platform that provides comprehensive pricing and currency management capabilities for multi-currency e-commerce applications.

## Overview

This feature enables businesses to implement complex pricing strategies, support multiple currencies, manage regional pricing, and handle currency conversions. The pricing feature has been expanded to incorporate all currency functionality (previously in a separate feature) to provide a unified approach to pricing across the platform.

## Key Components

### Data Models

#### Pricing Models
- **PricingRule**: Core entity that defines pricing rules based on various conditions
- **TierPrice**: Quantity-based pricing structure (e.g., bulk discounts)
- **CustomerPrice**: Custom pricing for specific customers or segments
- **PriceList**: Collection of customer-specific prices

#### Currency Models
- **Currency**: Core entity that stores currency information (code, name, symbol, etc.)
- **CurrencyRegion**: Maps regions/countries to their default currencies
- **CurrencyPriceRule**: Defines rules for currency conversion and price adjustments

### Repository Layer

The repository layer follows the platform's standardized naming convention:
- Database columns use `snake_case` (e.g., `decimal_places`, `is_active`)
- TypeScript interfaces use `camelCase` (e.g., `decimalPlaces`, `isActive`)
- Field mapping dictionaries translate between naming conventions
- Transformation functions convert database records to TypeScript objects

#### Main Repositories
- `pricingRuleRepo.ts`: Base repository for all pricing rules
- `tierPriceRepo.ts`: Manages quantity-based pricing
- `customerPriceRepo.ts`: Handles customer-specific pricing
- `priceListRepo.ts`: Manages collections of customer prices
- `currencyRepo.ts`: Manages currencies and currency regions
- `currencyPriceRuleRepo.ts`: Handles currency-specific pricing rules

### Services

- **pricingService.ts**: Core service providing pricing calculation, currency conversion, and price formatting

### Controllers

- **pricingController.ts**: Handles core pricing management operations
- **pricingCustomerController.ts**: Customer-facing pricing and currency operations
- **pricingMerchantController.ts**: Merchant-facing pricing and currency management operations

### Routes

- **Public Routes** (`pricingCustomerRouter.ts`): Customer-facing endpoints for pricing and currency
- **Merchant Routes** (`pricingMerchantRouter.ts`): Merchant-facing endpoints for pricing and currency management

## API Endpoints

### Customer Pricing Endpoints

- `GET /currencies`: List all available currencies
- `GET /default-currency`: Get the store's default currency
- `GET /suggested-currency`: Get suggested currency based on geo-location
- `GET /regions/:regionCode/currency`: Get default currency for a specific region
- `POST /convert`: Convert price from one currency to another
- `POST /batch-convert`: Convert multiple prices in a single request

### Merchant Pricing Endpoints

#### Core Pricing
- `GET /rules`: List all pricing rules
- `GET /rules/:id`: Get details for a specific pricing rule
- `POST /rules`: Create a new pricing rule
- `PUT /rules/:id`: Update pricing rule
- `DELETE /rules/:id`: Delete a pricing rule

#### Tier Pricing
- `GET /tier-prices`: List all tier prices
- `GET /tier-prices/:id`: Get details for a specific tier price
- `POST /tier-prices`: Create a new tier price
- `PUT /tier-prices/:id`: Update tier price
- `DELETE /tier-prices/:id`: Delete a tier price

#### Customer Price Lists
- `GET /price-lists`: List all price lists
- `GET /price-lists/:id`: Get details for a specific price list
- `POST /price-lists`: Create a new price list
- `PUT /price-lists/:id`: Update a price list
- `DELETE /price-lists/:id`: Delete a price list
- `POST /price-lists/:priceListId/prices`: Add a price to a price list

#### Currency Management
- `GET /currencies`: List all currencies
- `GET /currencies/:code`: Get details for a specific currency
- `POST /currencies`: Create or update a currency
- `DELETE /currencies/:code`: Delete a currency
- `POST /currencies/update-exchange-rates`: Update exchange rates

#### Currency Regions
- `GET /currency-regions`: List region-currency mappings
- `GET /currency-regions/:id`: Get details for a specific region
- `POST /currency-regions`: Create a region-currency mapping
- `PUT /currency-regions/:id`: Update a region-currency mapping
- `DELETE /currency-regions/:id`: Delete a region-currency mapping

#### Currency Price Rules
- `GET /currency-price-rules`: List price rules
- `GET /currency-price-rules/:id`: Get details for a specific price rule
- `POST /currency-price-rules`: Create a new price rule
- `PUT /currency-price-rules/:id`: Update a price rule
- `DELETE /currency-price-rules/:id`: Delete a price rule

## Usage Examples

### Basic Price Calculation

```typescript
// Get pricing rule
const rule = await pricingRuleRepo.getById(ruleId);

// Apply rule to base price
const basePrice = 29.99;
const calculatedPrice = pricingService.calculatePrice(basePrice, rule, customer);
```

### Converting a Price Between Currencies

```typescript
// Convert price using pricing service
const { convertedPrice, exchangeRate, appliedRules } = await pricingService.convertPrice(
  19.99,        // amount
  'USD',        // fromCurrency
  'EUR'         // toCurrency
);

// Format the converted price
const formattedPrice = await pricingService.formatPrice(convertedPrice, 'EUR');
```

### Getting Customer-Specific Price

```typescript
// Get customer price from price list
const customerPrice = await customerPriceRepo.getPrice(
  productId,
  customerId,
  priceListId
);

// Fall back to standard price if no customer price found
const finalPrice = customerPrice ? customerPrice.price : product.price;
```

## Database Schema

The pricing feature uses the following tables:

- `pricing_rule`: Core pricing rule definitions
- `tier_price`: Quantity-based pricing
- `customer_price`: Customer-specific pricing
- `price_list`: Collections of customer prices
- `currency`: Core currency information
- `currency_region`: Region-to-currency mappings
- `currency_price_rule`: Price conversion and adjustment rules

## Naming Convention

This feature follows the platform's standardized naming convention:

1. **Database Columns**: Use `snake_case` (e.g., `decimal_places`, `symbol_position`, `is_default`)
2. **TypeScript Interfaces**: Use `camelCase` (e.g., `decimalPlaces`, `symbolPosition`, `isDefault`)
3. **Repository Methods**: Handle the translation between naming conventions

Field mapping dictionaries in the repository define the mapping between database columns and TypeScript interface properties:

```typescript
const currencyFields: Record<string, string> = {
  code: 'code',
  name: 'name',
  symbol: 'symbol',
  decimals: 'decimal_places',
  isDefault: 'is_default',
  isActive: 'is_active',
  // ...
};
```

## Migration from Currency Feature

The currency functionality has been migrated from the standalone Currency Feature to the Pricing Feature to provide a more cohesive pricing and currency management solution. Key changes include:

1. Repository migration:
   - `currencyRepo.ts` and `currencyPriceRuleRepo.ts` have been moved to the pricing feature
   - Methods have been updated to follow the pricing feature's patterns
   - Field mappings ensure database columns use `snake_case` while TypeScript interfaces use `camelCase`

2. Controller migration:
   - Currency controllers have been integrated into `pricingCustomerController.ts` and `pricingMerchantController.ts`
   - Endpoints maintain backward compatibility

3. Router changes:
   - Currency routes are now part of the pricing routers
   - URL paths remain consistent to maintain compatibility

4. Service integration:
   - Currency functionality is accessible through the `pricingService`
   - Methods for currency conversion and formatting are available

## Integration

The pricing feature integrates with several other platform features:

- **Product**: For displaying and calculating product prices
- **Checkout**: For final price calculation during checkout
- **Order**: For storing order amounts with applied pricing rules
- **Payment**: For handling price conversions during payment
- **Tax**: For calculating prices inclusive or exclusive of tax

## Best Practices

1. Always use the pricing service for price calculations to ensure all rules are applied
2. Never hard-code currency codes or exchange rates in application logic
3. Use the provided formatting functions for consistent price display
4. When implementing custom pricing logic, extend the pricing rule system rather than creating separate solutions
5. Use the repository's transformation functions to handle database record conversion
6. Check for currency availability before performing conversions
