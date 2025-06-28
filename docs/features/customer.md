# Customer Feature

The Customer Feature is a core component of the CommerceFull platform that provides comprehensive customer management capabilities for e-commerce applications.

## Overview

This feature enables businesses to store and manage customer information, addresses, customer groups, and wishlists. It is designed to support both B2C and B2B use cases with a flexible data model and comprehensive API.

## Key Components

### Data Models

- **Customer**: Core entity that stores basic customer information (name, email, phone, etc.)
- **CustomerAddress**: Manages multiple addresses per customer (shipping, billing, etc.)
- **CustomerGroup**: Enables customer segmentation and group-based pricing
- **CustomerGroupMembership**: Maps customers to groups
- **CustomerWishlist**: Manages customer product wishlist functionality

### Repository Layer

The repository layer (`repos/customerRepo.ts`) provides data access methods following the platform's standardized naming convention:
- Database columns use `snake_case` (e.g., `first_name`, `is_active`)
- TypeScript interfaces use `camelCase` (e.g., `firstName`, `isActive`)
- Field mapping dictionaries translate between naming conventions
- Transformation functions convert database records to TypeScript objects

### Controllers

The controller layer (`controllers/customerController.ts`) handles HTTP requests and responses, interacting with the repository layer to perform CRUD operations on customer data.

### Routes

- **Public Routes** (`router.ts`): Customer-facing endpoints with limited functionality
- **Admin Routes** (`routerAdmin.ts`): Administrative endpoints with full management capabilities

## API Endpoints

### Customer Endpoints

- `GET /customers`: List all customers (paginated)
- `GET /customers/:id`: Get a specific customer by ID
- `POST /customers`: Create a new customer
- `PUT /customers/:id`: Update a customer
- `DELETE /customers/:id`: Delete a customer
- `GET /customers/search`: Search for customers by various criteria

### Customer Address Endpoints

- `GET /customers/:customerId/addresses`: List a customer's addresses
- `GET /customer-addresses/:id`: Get a specific address
- `POST /customers/:customerId/addresses`: Create a new address for a customer
- `PUT /customer-addresses/:id`: Update an address
- `DELETE /customer-addresses/:id`: Delete an address

### Customer Group Endpoints

- `GET /customer-groups`: List all customer groups
- `GET /customer-groups/:id`: Get a specific group
- `POST /customer-groups`: Create a new group
- `PUT /customer-groups/:id`: Update a group
- `DELETE /customer-groups/:id`: Delete a group
- `GET /customer-groups/:groupId/customers`: List customers in a group
- `POST /customers/:customerId/groups/:groupId`: Add a customer to a group
- `DELETE /customers/:customerId/groups/:groupId`: Remove a customer from a group

### Wishlist Endpoints

- `GET /customers/:customerId/wishlists`: List a customer's wishlists
- `GET /wishlists/:id`: Get a specific wishlist
- `POST /customers/:customerId/wishlists`: Create a new wishlist
- `PUT /wishlists/:id`: Update a wishlist
- `DELETE /wishlists/:id`: Delete a wishlist
- `POST /wishlists/:id/items`: Add an item to a wishlist
- `DELETE /wishlist-items/:id`: Remove an item from a wishlist

## Usage Examples

### Creating a Customer

```typescript
const newCustomer = await customerRepo.createCustomer({
  email: 'customer@example.com',
  firstName: 'John',
  lastName: 'Doe',
  phone: '555-123-4567',
  isActive: true,
  isVerified: false
});
```

### Updating a Customer

```typescript
const updatedCustomer = await customerRepo.updateCustomer(customerId, {
  firstName: 'Jane',
  lastName: 'Smith',
  phone: '555-987-6543'
});
```

### Adding a Customer to a Group

```typescript
const membership = await customerRepo.addCustomerToGroup({
  customerId: 'customer-uuid',
  groupId: 'group-uuid'
});
```

## Database Schema

The customer feature uses the following tables:

- `customer`: Core customer information
- `customer_address`: Customer address information
- `customer_group`: Customer group definitions
- `customer_group_membership`: Maps customers to groups
- `customer_wishlist`: Wishlist headers
- `customer_wishlist_item`: Individual wishlist items

## Naming Convention

This feature follows the platform's standardized naming convention:

1. **Database Columns**: Use `snake_case` (e.g., `first_name`, `postal_code`, `is_active`)
2. **TypeScript Interfaces**: Use `camelCase` (e.g., `firstName`, `postalCode`, `isActive`)
3. **Repository Methods**: Handle the translation between naming conventions

Field mapping dictionaries in the repository define the mapping between database columns and TypeScript interface properties.

## Integration Testing

The customer feature has comprehensive integration tests in `/tests/integration/customer/` that verify:

1. API endpoint functionality
2. Data transformation (snake_case to camelCase)
3. Data validation and error handling

## Unit Testing

Unit tests in `/tests/unit/customer/` verify the repository's functionality, including:

1. Proper SQL query construction with snake_case column names
2. Accurate transformation between database records and TypeScript objects
3. Type safety and null handling

## Security Considerations

- All endpoints require appropriate authentication
- Administrative endpoints require elevated permissions
- Input validation prevents data injection vulnerabilities
- PII (Personally Identifiable Information) is handled securely
