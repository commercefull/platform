# Order Feature in the Commerce Platform

The order feature provides comprehensive order management capabilities for the e-commerce platform. It follows a modular architecture pattern consistent with other platform features (like payment and product) and integrates with multiple other systems for a complete order lifecycle.

## Core Architecture

### 1. Data Models & Repositories
- **Order Repository**: A unified repository that manages:
  - **Orders**: Core order information, status, and totals
  - **Order Items**: Individual items within an order
  - **Order History**: Tracking status changes and events

The repository follows the platform's standardized database naming convention, using `snake_case` for database columns while maintaining `camelCase` for TypeScript interfaces with explicit mapping between them.

### 2. Controllers
- **Order Controller**: Handles both customer-facing and admin operations:
  - Creating orders
  - Viewing order details
  - Managing order status
  - Cancellation and refund workflows

### 3. Routers
- **Customer Router**: Customer-facing endpoints for order management
- **Admin Router**: Protected routes for administrative control

## Database Structure & Naming Convention

The order feature's database follows the platform's standardized approach:

### Database Columns (snake_case)
```sql
-- Example of column naming in the database
order_number
customer_id
payment_status
fulfillment_status
shipping_address_id
total_amount
```

### TypeScript Interfaces (camelCase)
```typescript
// Example of property naming in TypeScript interfaces
interface Order {
  orderNumber: string;
  customerId: string;
  paymentStatus: PaymentStatus;
  fulfillmentStatus: FulfillmentStatus;
  shippingAddressId: string;
  totalAmount: number;
}
```

### Field Mapping Implementation
The repository implements explicit mapping between database columns and TypeScript properties:

1. **Mapping Dictionaries**:
   ```typescript
   const dbToTsMapping: Record<string, string> = {
     order_number: 'orderNumber',
     customer_id: 'customerId',
     // ...other mappings
   };
   ```

2. **Transformation Methods**:
   ```typescript
   // Convert database column to TypeScript property
   private dbToTs(columnName: string): string { /* ... */ }
   
   // Convert TypeScript property to database column
   private tsToDb(propertyName: string): string { /* ... */ }
   ```

3. **Query Generation**:
   ```typescript
   // Generate SQL with proper field mapping
   private generateSelectFields(): string { /* ... */ }
   ```

## Key Workflows

### Order Creation
1. Customer completes checkout process
2. Order data is assembled and validated
3. Order is created with initial 'pending' status
4. Order items are created for each basket item
5. Order number is generated and returned to customer

### Order Processing
1. Admin reviews new orders
2. Updates order status as it progresses
3. Manages fulfillment, shipping, and delivery tracking
4. Records status changes in history tables

### Order Cancellation
1. Customer or admin may initiate cancellation
2. System validates if order is eligible for cancellation
3. Status updated to 'cancelled'
4. Inventory is updated if necessary
5. Refund process initiated if payment was already processed

## Integration Points

The order feature integrates with several other platform components:

- **Checkout**: For order creation and payment processing
- **Customer**: For associating orders with customer accounts
- **Product**: For inventory management and product information
- **Payment**: For processing payments and refunds
- **Shipping**: For fulfillment and delivery tracking

## Recent Changes

The order feature repositories and controllers have been updated to align with the platform's standardized naming convention:

1. **Database Structure**: Uses snake_case for column names (e.g., `order_number`, `customer_id`)
2. **TypeScript Interfaces**: Uses camelCase for property names (e.g., `orderNumber`, `customerId`)
3. **Explicit Mapping**: Added mapping dictionaries and helper methods to transform between naming conventions
4. **Controller Updates**: Updated all controllers to use the camelCase properties when working with order data

This standardization creates consistency across the entire platform and better aligns with TypeScript/JavaScript best practices while maintaining proper SQL conventions for the database schema.
