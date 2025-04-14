# Merchant Feature

The Merchant feature provides comprehensive functionality for managing merchants within the CommerceFull platform. This README outlines the feature architecture, components, naming conventions, and implementation details.

## Architecture

The Merchant feature follows the standard CommerceFull platform architecture with clear separation of concerns:

- **Repository Layer**: Handles data access and database operations
- **Controller Layer**: Processes business logic and request handling
- **Router Layer**: Defines API endpoints and routing

## Components

### Repository

The `MerchantRepo` class (`repos/merchantRepo.ts`) provides data access methods for merchant-related operations:

- **Core Entities**:
  - `Merchant`: The primary merchant entity
  - `MerchantAddress`: Addresses associated with merchants
  - `MerchantPaymentInfo`: Payment details for merchants

- **Key Operations**:
  - CRUD operations for merchants, addresses, and payment information
  - Specialized queries (find by email, status, etc.)
  - Relationship management between entities

### Controllers

The `MerchantController` class (`controllers/merchantController.ts`) handles business logic and request processing:

- **Public Operations**: Limited merchant information access for storefront
- **Admin Operations**: Complete merchant management functionality
- **Input Validation**: Ensures data integrity and security
- **Error Handling**: Provides consistent error responses

### Routers

The feature exposes two distinct router sets:

- **Public Router** (`router.ts`): Limited access for storefront displays
  - Retrieves only active merchants
  - Returns restricted merchant information
  
- **Admin Router** (`routerAdmin.ts`): Complete management capabilities
  - Full CRUD operations for merchants
  - Address and payment information management
  - Merchant activation/deactivation

## Data Model

The merchant feature includes several related database tables:

- `merchant`: Core merchant information
- `merchant_address`: Associated addresses (billing, shipping, etc.)
- `merchant_payment_info`: Payment processing details

## Naming Conventions

The merchant feature follows the platform's standardized naming convention:

- **Database**: Uses `snake_case` for all table and column names
  - Examples: `merchant_id`, `address_line1`, `is_primary`

- **TypeScript**: Uses `camelCase` for all interface properties
  - Examples: `merchantId`, `addressLine1`, `isPrimary`

The repository layer handles the conversion between these naming conventions, ensuring consistency throughout the application while maintaining clean database design.

## Implementation Details

### Field Mapping

The repository includes explicit mapping dictionaries that translate between TypeScript camelCase and database snake_case:

```typescript
const merchantFields = {
  id: 'id',
  name: 'name',
  // ...
  logoUrl: 'logo_url',
  // ...
  createdAt: 'created_at',
  updatedAt: 'updated_at'
};
```

### Data Transformation

Transformation functions convert database records to TypeScript objects and vice versa:

```typescript
function transformMerchantFromDb(dbRecord: Record<string, any>): Merchant {
  return {
    id: dbRecord.id,
    // ...
    logoUrl: dbRecord.logo_url,
    // ...
    createdAt: dbRecord.created_at,
    updatedAt: dbRecord.updated_at
  };
}
```

## Usage Examples

### Creating a Merchant

```typescript
const merchantRepo = new MerchantRepo();
const newMerchant = await merchantRepo.create({
  name: 'Example Merchant',
  email: 'merchant@example.com',
  status: 'active',
  // other merchant properties...
});
```

### Retrieving Merchant Addresses

```typescript
const merchantRepo = new MerchantRepo();
const addresses = await merchantRepo.findAddressesByMerchantId('merchant-id-123');
```

## Related Features

The merchant feature integrates with several other platform features:

- **Product**: Merchants can have associated products
- **Order**: Orders may reference the merchant who fulfilled them
- **Payment**: Payment processing includes merchant-specific settings
- **Store**: Merchants can have their own storefront configurations

## Testing

Integration tests for the merchant feature can be found in the `tests/integration/merchant` directory.
