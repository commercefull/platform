# Basket Feature

The Basket Feature is a foundational component of the CommerceFull platform that manages shopping carts, providing a flexible and robust system for product collection before purchase.

## Overview

This feature enables customers to add products to a virtual basket, modify quantities, and prepare for checkout. It handles both guest and authenticated user baskets, manages expiration, and ensures proper data transformation between the database and application layers.

## Key Components

### Data Models

- **Basket**: The core entity that tracks products selected by users (items, totals, expiration)
- **BasketItem**: Individual product entries within a basket (product reference, quantity, price)

### Repository Layer

The repository layer (`basketRepo.ts`) provides data access methods following the platform's standardized naming convention:
- Database columns use `snake_case` (e.g., `customer_id`, `item_count`, `expires_at`)
- TypeScript interfaces use `camelCase` (e.g., `customerId`, `itemCount`, `expiresAt`)
- Field mapping dictionaries translate between naming conventions
- Transformation functions convert database records to TypeScript objects

### Controllers

The controller layer handles HTTP requests and responses:
- `basketController.ts`: Customer-facing basket operations
- `basketAdminController.ts`: Administrative basket management operations

### Routes

- **Public Routes** (`router.ts`): Customer-facing endpoints for basket operations
- **Admin Routes** (`routerAdmin.ts`): Administrative endpoints for basket management

## API Endpoints

### Basket Management Endpoints

- `POST /baskets`: Create a new basket
- `GET /baskets/:basketId`: Get basket by ID
- `GET /baskets/my-baskets`: Get all baskets for authenticated user
- `POST /baskets/:basketId/items`: Add item to basket
- `PUT /baskets/:basketId/items/:productId`: Update item quantity
- `DELETE /baskets/:basketId/items/:productId`: Remove item from basket
- `POST /baskets/:basketId/clear`: Clear all items from basket
- `DELETE /baskets/:basketId`: Delete basket
- `POST /baskets/merge`: Merge two baskets (e.g., guest basket to user basket)
- `PUT /baskets/:basketId/expiration`: Update basket expiration time

### Admin Basket Endpoints

- `GET /admin/baskets`: List all baskets with filtering and pagination
- `GET /admin/baskets/:basketId`: Get detailed basket information
- `POST /admin/baskets/cleanup-expired`: Mark expired baskets as abandoned
- `DELETE /admin/baskets/:basketId`: Force delete a basket

## Naming Convention

This feature follows the platform's standardized naming convention:

1. **Database Columns**: Use `snake_case` (e.g., `customer_id`, `item_count`, `expires_at`)
2. **TypeScript Interfaces**: Use `camelCase` (e.g., `customerId`, `itemCount`, `expiresAt`)
3. **Repository Methods**: Handle the translation between naming conventions using mapping dictionaries

Field mapping dictionaries in the repository define the mapping between database columns and TypeScript interface properties:

```typescript
const basketFields: Record<string, string> = {
  id: 'id',
  customerId: 'customer_id',
  status: 'status',
  subtotal: 'subtotal',
  itemCount: 'item_count',
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  expiresAt: 'expires_at'
  // ...and so on
};
```

Transformation functions convert between database records and TypeScript objects:

```typescript
// Transform a database record to a TypeScript object
function transformDbToTs<T>(dbRecord: any, fieldMap: Record<string, string>): T {
  if (!dbRecord) return null as any;
  
  const result: any = {};
  
  Object.entries(fieldMap).forEach(([tsKey, dbKey]) => {
    if (dbRecord[dbKey] !== undefined) {
      result[tsKey] = dbRecord[dbKey];
    }
  });
  
  return result as T;
}
```

## Usage Examples

### Creating a Basket

```typescript
// Create a basket for a guest user
const guestBasket = await basketRepo.createBasket({
  items: [
    {
      productId: 'product-123',
      quantity: 2,
      price: 29.99
    }
  ]
});

// Create a basket for an authenticated user
const userBasket = await basketRepo.createBasket({
  customerId: 'customer-456',
  items: [
    {
      productId: 'product-123',
      quantity: 1,
      price: 29.99
    },
    {
      productId: 'product-789',
      quantity: 3,
      price: 15.50
    }
  ]
});
```

### Managing Basket Items

```typescript
// Add an item to a basket
await basketRepo.addItemToBasket(basketId, {
  productId: 'product-123',
  quantity: 1,
  price: 29.99
});

// Update an item quantity
await basketRepo.updateItemQuantity(basketId, 'product-123', 3);

// Remove an item from a basket
await basketRepo.removeItemFromBasket(basketId, 'product-123');

// Clear all items from a basket
await basketRepo.clearBasket(basketId);
```

### Basket Operations

```typescript
// Find a basket by ID
const basket = await basketRepo.findBasketById(basketId);

// Find a basket by customer ID
const customerBaskets = await basketRepo.findBasketsByCustomerId(customerId);

// Merge two baskets (e.g., after user login)
await basketRepo.mergeBaskets(sourceBasketId, targetBasketId);

// Update basket expiration
await basketRepo.updateBasketExpiration(basketId, newExpiresAt);

// Clean up expired baskets
const abandonedCount = await basketRepo.cleanupExpiredBaskets();
```

## Integration with Other Features

The basket feature integrates with several other platform features:

- **Product**: Accesses product information for basket items
- **Customer**: Associates baskets with customer accounts
- **Checkout**: Converts baskets to checkout sessions and orders
- **Promotion**: Applies discounts and promotions to basket items
- **Inventory**: Checks product availability and reserves inventory during checkout

## Best Practices

1. Always validate product IDs and quantities when adding items to baskets
2. Use basket expiration to manage server resources effectively
3. Handle guest and authenticated user baskets consistently
4. Implement proper error handling for basket operations
5. Use the repository's transformation functions to handle database record conversion
6. Follow the naming convention pattern for all database interactions

## Security Considerations

- Validate that the basket belongs to the authenticated user
- Protect against cross-user basket access
- Validate product prices and quantities on all operations
- Implement proper session management for guest baskets
- Apply rate limiting to prevent abuse of basket endpoints

## Database Schema

The basket feature uses the following tables:

- `baskets`: Stores basket metadata (customer, status, totals, expiration)
- `basket_items`: Contains product items within baskets (product reference, quantity, price)

## Basket Lifecycle

1. **Creation**: A basket is created when a user adds their first item or explicitly creates a basket
2. **Active Period**: The basket remains active while the user shops, with an expiration time
3. **Checkout**: The basket is converted to a checkout session during the purchase process
4. **Conversion**: Upon successful checkout, the basket becomes an order and is marked as completed
5. **Expiration**: Baskets that aren't checked out expire after a set period and are marked as abandoned
