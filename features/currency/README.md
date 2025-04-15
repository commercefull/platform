# Currency Feature

The Currency Feature is a core component of the CommerceFull platform that provides comprehensive currency management capabilities for multi-currency e-commerce applications.

## Overview

This feature enables businesses to support multiple currencies, regional settings, custom exchange rates, and advanced price rules for international sales. It provides a flexible foundation for showing prices in local currencies and handling multi-currency checkout processes.

## Key Components

### Data Models

- **Currency**: Core entity that stores currency information (code, name, symbol, etc.)
- **CurrencyRegion**: Maps regions/countries to their default currencies
- **CurrencyPriceRule**: Defines rules for currency conversion and price adjustments

### Repository Layer

The repository layer (`repos/currencyRepo.ts`) provides data access methods following the platform's standardized naming convention:
- Database columns use `snake_case` (e.g., `decimal_places`, `is_active`)
- TypeScript interfaces use `camelCase` (e.g., `decimalPlaces`, `isActive`)
- Field mapping dictionaries translate between naming conventions
- Transformation functions convert database records to TypeScript objects

### Controllers

The controller layer handles HTTP requests and responses, interacting with the repository layer to perform operations on currency data:
- `currencyPublicController.ts`: Customer-facing currency operations
- `currencyAdminController.ts`: Administrative currency management operations

### Routes

- **Public Routes** (`router.ts`): Customer-facing endpoints for currency display and conversion
- **Admin Routes** (`routerAdmin.ts`): Administrative endpoints for currency management

## API Endpoints

### Currency Endpoints

- `GET /currencies`: List all available currencies
- `GET /default-currency`: Get the store's default currency
- `GET /suggested-currency`: Get suggested currency based on geo-location
- `GET /regions/:regionCode/currency`: Get default currency for a specific region
- `POST /convert`: Convert price from one currency to another
- `POST /batch-convert`: Convert multiple prices in a single request

### Admin Currency Endpoints

- `GET /admin/currencies`: List all currencies (including inactive)
- `GET /admin/currencies/:code`: Get details for a specific currency
- `POST /admin/currencies`: Create a new currency
- `PUT /admin/currencies/:code`: Update currency information
- `DELETE /admin/currencies/:code`: Delete a currency
- `POST /admin/currencies/update-rates`: Update exchange rates
- `GET /admin/currency-regions`: List region-currency mappings
- `POST /admin/currency-regions`: Create region-currency mapping
- `PUT /admin/currency-regions/:regionCode`: Update region-currency mapping
- `GET /admin/currency-price-rules`: List price rules
- `POST /admin/currency-price-rules`: Create a new price rule
- `PUT /admin/currency-price-rules/:id`: Update a price rule
- `DELETE /admin/currency-price-rules/:id`: Delete a price rule

## Usage Examples

### Converting a Price

```typescript
// Get currencies
const fromCurrency = await currencyRepo.getCurrencyByCode('USD');
const toCurrency = await currencyRepo.getCurrencyByCode('EUR');

// Convert price
const priceInUSD = 19.99;
const priceInEUR = priceInUSD * toCurrency.exchangeRate / fromCurrency.exchangeRate;
```

### Formatting a Currency Amount

```typescript
import { formatCurrency } from '../domain/currency';

const currency = await currencyRepo.getCurrencyByCode('USD');
const formattedPrice = formatCurrency(19.99, currency);
// Returns "$19.99"
```

## Database Schema

The currency feature uses the following tables:

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

## Integration

The currency feature integrates with several other platform features:

- **Product**: For displaying prices in multiple currencies
- **Checkout**: For handling multi-currency checkout processes
- **Order**: For storing order amounts in both store and customer currencies
- **Payment**: For converting amounts during payment processing

## Best Practices

1. Always use the repository's transformation functions to handle database record conversion
2. Never hard-code currency codes or exchange rates in application logic
3. Use the formatCurrency helper function for consistent display formatting
4. Check for currency availability before performing conversions
