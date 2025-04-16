# Checkout Feature

The Checkout Feature is a core component of the CommerceFull platform that provides a comprehensive and flexible checkout process for e-commerce applications.

## Overview

This feature enables customers to complete the purchase process by converting a basket to an order. It handles shipping and billing addresses, shipping method selection, payment method selection, tax calculation, and order creation in a modular, extensible way.

## Key Components

### Data Models

- **CheckoutSession**: Core entity that tracks the checkout process (addresses, methods, amounts, status)
- **Address**: Structure for shipping and billing addresses
- **PaymentMethod**: Supported payment methods for completing transactions
- **ShippingMethod**: Available shipping options with pricing and delivery estimates

### Repository Layer

The repository layer (`repos/checkoutRepo.ts`) provides data access methods following the platform's standardized naming convention:
- Database columns use `snake_case` (e.g., `customer_id`, `shipping_amount`)
- TypeScript interfaces use `camelCase` (e.g., `customerId`, `shippingAmount`)
- Field mapping dictionaries translate between naming conventions
- Transformation functions convert database records to TypeScript objects

### Controllers

The controller layer handles HTTP requests and responses:
- `checkoutPublicController.ts`: Customer-facing checkout operations
- `checkoutController.ts`: Administrative checkout and order management operations

### Routes

- **Public Routes** (`router.ts`): Customer-facing endpoints for the checkout process
- **Admin Routes** (`routerAdmin.ts`): Administrative endpoints for checkout and order management

## API Endpoints

### Checkout Session Endpoints

- `POST /checkout/session`: Initialize a new checkout session from a basket
- `GET /checkout/session/:sessionId`: Get details of a specific checkout session
- `PUT /checkout/session/:sessionId/shipping-address`: Update shipping address
- `PUT /checkout/session/:sessionId/billing-address`: Update billing address
- `GET /checkout/shipping-methods`: Get available shipping methods
- `PUT /checkout/session/:sessionId/shipping-method`: Select shipping method
- `GET /checkout/payment-methods`: Get available payment methods
- `PUT /checkout/session/:sessionId/payment-method`: Select payment method
- `GET /checkout/session/:sessionId/calculate`: Calculate totals, taxes, etc.
- `POST /checkout/session/:sessionId/validate`: Validate checkout before completion
- `POST /checkout/session/:sessionId/complete`: Complete checkout and create order
- `POST /checkout/session/:sessionId/abandon`: Abandon checkout session

### Admin Order Endpoints

- `GET /admin/orders`: List all orders
- `GET /admin/orders/:id`: Get order details
- `PUT /admin/orders/:id/status`: Update order status
- `POST /admin/orders/:id/refund`: Process a refund
- `POST /admin/orders/:id/cancel`: Cancel an order

## Naming Convention

This feature follows the platform's standardized naming convention:

1. **Database Columns**: Use `snake_case` (e.g., `basket_id`, `shipping_method_id`, `tax_amount`)
2. **TypeScript Interfaces**: Use `camelCase` (e.g., `basketId`, `shippingMethodId`, `taxAmount`)
3. **Repository Methods**: Handle the translation between naming conventions using mapping dictionaries

Field mapping dictionaries in the repository define the mapping between database columns and TypeScript interface properties:

```typescript
const checkoutSessionFields: Record<string, string> = {
  id: 'id',
  customerId: 'customer_id',
  guestEmail: 'guest_email',
  basketId: 'basket_id',
  status: 'status',
  shippingMethodId: 'shipping_method_id',
  paymentMethodId: 'payment_method_id',
  paymentIntentId: 'payment_intent_id',
  subtotal: 'subtotal',
  taxAmount: 'tax_amount',
  shippingAmount: 'shipping_amount',
  discountAmount: 'discount_amount',
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

### Creating a Checkout Session

```typescript
// Initialize a checkout from a basket
const checkoutSession = await checkoutRepo.createCheckoutSession(
  basketId,
  customerId, // Optional, can be null for guest checkout
  guestEmail  // Optional, required for guest checkout
);
```

### Updating Shipping and Billing Addresses

```typescript
// Add shipping address to checkout
const updatedSession = await checkoutRepo.updateShippingAddress(
  sessionId,
  {
    firstName: 'Jane',
    lastName: 'Doe',
    addressLine1: '123 Main St',
    city: 'Portland',
    region: 'OR',
    postalCode: '97201',
    country: 'US',
    phone: '555-123-4567'
  }
);

// Add billing address (same or different from shipping)
await checkoutRepo.updateBillingAddress(sessionId, billingAddress);
```

### Selecting Shipping and Payment Methods

```typescript
// Get available shipping methods
const shippingMethods = await checkoutRepo.getShippingMethods();

// Select a shipping method
await checkoutRepo.selectShippingMethod(sessionId, shippingMethodId);

// Get available payment methods
const paymentMethods = await checkoutRepo.getPaymentMethods();

// Select a payment method
await checkoutRepo.selectPaymentMethod(sessionId, paymentMethodId);
```

### Calculating Taxes and Completing Checkout

```typescript
// Calculate taxes based on shipping address and basket contents
const sessionWithTaxes = await checkoutRepo.calculateTaxes(sessionId);

// Validate checkout before completion
const validation = await checkoutRepo.validateCheckout(sessionId);

if (validation.isValid) {
  // Complete checkout and create order
  const orderResult = await checkoutRepo.createOrder(sessionId);
  
  if (orderResult.success) {
    // Order created successfully
    const orderId = orderResult.orderId;
  }
}
```

## Integration with Other Features

The checkout feature integrates with several other platform features:

- **Basket**: Converts baskets to orders through the checkout process
- **Customer**: Links orders to customer accounts
- **Product**: Accesses product information for checkout items
- **Payment**: Processes payments for completed orders
- **Tax**: Calculates taxes based on customer location and products
- **Shipping**: Provides shipping options and rates for the order
- **Promotion**: Applies discounts and promotions to the checkout
- **Order**: Creates and manages orders from completed checkouts

## Best Practices

1. Always validate checkout sessions before attempting to complete them
2. Handle guest checkout and logged-in user checkout consistently
3. Implement proper error handling in the checkout flow
4. Store secure payment information according to PCI compliance standards
5. Use the repository's transformation functions to handle database record conversion
6. Follow the naming convention pattern for all database interactions

## Security Considerations

- Never store sensitive payment details directly in the database
- Always validate addresses before using them for tax or shipping calculations
- Implement proper session timeouts to clear abandoned checkouts
- Validate that the checkout session belongs to the authenticated user or guest
- Use secure payment processing services for handling payment information

## Database Schema

The checkout feature uses the following tables:

- `checkout_session`: Tracks the state of the checkout process
- `order`: Stores completed orders
- `order_item`: Contains line items from completed orders
- `order_address`: Stores shipping and billing addresses for orders
- `payment_method`: Available payment methods
- `shipping_method`: Available shipping methods
