# Payment Feature in the Commerce Platform

The payment feature provides comprehensive payment processing capabilities for the e-commerce platform. It follows a modular architecture pattern consistent with other platform features and integrates with multiple payment gateways and methods.

## Core Architecture

### 1. Data Models & Repositories
- **Payment Repository**: A unified repository that manages:
  - **Payment Gateways**: Configurations for payment providers (Stripe, PayPal, etc.)
  - **Payment Method Configs**: Settings for payment methods (credit card, PayPal, etc.)
  - **Payment Transactions**: Records of payment transactions and their statuses
  - **Payment Refunds**: Tracking of refund requests and processing

The repository follows the platform's standardized database naming convention, using `snake_case` for database columns while maintaining `camelCase` for TypeScript interfaces with explicit mapping between them.

### 2. Controllers
- **Payment Admin Controller**: Admin-facing operations for:
  - Gateway management (per merchant)
  - Payment method configuration
  - Transaction oversight
  - Refund processing
- **Payment Public Controller**: Customer-facing operations for:
  - Viewing available payment methods
  - Managing transactions
  - Viewing transaction history
  - Requesting refunds

### 3. Routers
- **Storefront Router (`router.ts`)**: Exposes customer-facing endpoints:
  - `/payment-methods`: Lists available payment methods
  - `/customers/:customerId/transactions`: Customer transaction history
  - `/transactions/:transactionId`: Transaction details
  - `/transactions/:transactionId/refunds`: Refund management
  
- **Admin Router (`routerAdmin.ts`)**: Provides merchant administration endpoints:
  - `/merchants/:merchantId/gateways`: Gateway management
  - `/merchants/:merchantId/method-configs`: Payment method configuration
  - `/transactions/:id`: Transaction management
  - `/refunds/:id`: Refund processing

## Key Workflows

### Payment Configuration
1. **Gateway Configuration**:
   - Merchant sets up payment gateway credentials (API keys, endpoints)
   - Configures supported payment methods per gateway
   - Customizes checkout settings
   - Sets processing fees and currency handling

2. **Payment Method Configuration**:
   - Enables/disables specific payment methods
   - Sets method-specific rules (minimum/maximum amounts)
   - Configures display order and payment icons
   - Sets country and currency restrictions

### Payment Processing
1. **Transaction Management**:
   - Supports multiple transaction statuses (pending, authorized, paid, etc.)
   - Handles payment method details and validation
   - Manages capture process and timestamps
   - Tracks transaction metadata and errors

2. **Refunds & Voids**:
   - Full or partial refund processing
   - Refund reason tracking
   - Multiple refund statuses (pending, processing, completed, failed)
   - Automatic tracking of refunded amounts per transaction

### Customer Experience
1. **Payment Method Selection**:
   - Filtered display of available payment methods
   - Support for payment method-specific requirements
   - Clear presentation of payment options based on merchant configuration

2. **Transaction History**:
   - Customer can view their transaction history
   - Access detailed information about specific transactions
   - View refund status for transactions
   - Request refunds when applicable

## Technical Implementation

### Database Structure
- **payment_gateway**: Stores gateway configurations per merchant
- **payment_method_config**: Defines available payment methods and their settings
- **payment_transaction**: Records all payment transactions and their status
- **payment_refund**: Tracks refund requests and processing

### Security Features
- PCI compliance through tokenization
- Sensitive data encryption (API keys, secrets)
- Proper handling of payment credentials
- Soft deletion pattern for all records

### Integration Points
- Connects with order management for payment status updates
- Works with merchant settings for payment configuration
- Links to customer profiles for transaction history

### Error Handling
- Structured error responses for failed payments
- Validation of refund requests against transaction state
- Clear error messages for both customers and administrators

## Future Enhancements
- Subscription management capabilities
- Enhanced fraud detection mechanisms
- Additional payment method integrations
- Multi-currency support improvements