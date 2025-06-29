# Loyalty Feature

The Loyalty feature provides a comprehensive customer rewards system for the CommerceFull platform, enabling businesses to reward customers with points for purchases and other actions, which can be redeemed for discounts and other benefits.

## Architecture

The Loyalty feature follows the standard CommerceFull platform architecture with clear separation of concerns:

- **Repository Layer**: Handles data access and database operations
- **Controller Layer**: Processes business logic and request handling
- **Router Layer**: Defines API endpoints and routing

## Core Concepts

### Loyalty Tiers

The loyalty system uses a tiered approach where customers progress through different levels based on their lifetime points:

- **Bronze**: Entry level tier
- **Silver**: Mid-level tier
- **Gold**: High-level tier
- **Platinum**: Premium tier
- **Custom**: Configurable special tiers

Each tier has a points threshold and a multiplier that increases the rate at which customers earn points.

### Points System

Points are awarded for various customer actions:

- **Purchases**: Points based on order amount (default: 1 point per $1)
- **Reviews**: Points for leaving product reviews
- **Referrals**: Points for referring new customers
- **Signup**: Welcome points for new account creation
- **Special Events**: Points for birthdays, anniversaries, etc.

Points can be manually adjusted by administrators as needed.

### Rewards

Customers can redeem their points for various rewards:

- **Discounts**: Fixed amount or percentage off
- **Free Shipping**: Complimentary shipping on orders
- **Product Rewards**: Specific products available for redemption
- **Special Offers**: Custom rewards configurable by administrators

## Components

### Repository

The `LoyaltyRepo` class (`repos/loyaltyRepo.ts`) provides data access methods for loyalty-related operations:

- **Core Entities**:
  - `LoyaltyTier`: Defines the different loyalty levels
  - `LoyaltyPoints`: Tracks customer point balances
  - `LoyaltyTransaction`: Records point earning and redemption history
  - `LoyaltyReward`: Defines rewards that can be redeemed
  - `LoyaltyRedemption`: Tracks customer reward redemptions

- **Key Operations**:
  - Tier management (CRUD operations)
  - Point calculation and tracking
  - Transaction recording
  - Reward management and redemption
  - Customer status tracking

### Controllers

The loyalty feature has two controllers:

1. **LoyaltyController** (`controllers/loyaltyController.ts`)
   - Administrative operations for managing the loyalty program
   - Full CRUD operations for tiers and rewards
   - Customer point adjustments and transaction viewing
   - Order processing for points

2. **LoyaltyPublicController** (`controllers/loyaltyPublicController.ts`)
   - Customer-facing operations
   - View loyalty status and points
   - Browse available rewards
   - Redeem points for rewards
   - View transaction history

### Routers

The feature exposes two distinct router sets:

- **Admin Router** (`routerAdmin.ts`)
  - Complete loyalty program management
  - Customer point administration
  - Reward configuration
  - Redemption management
  
- **Customer Router** (`router.ts`)
  - Customer point balance and tier information
  - Available rewards browsing
  - Point redemption
  - Transaction history viewing

## Data Model

The loyalty feature includes several related database tables:

- `loyalty_tier`: Defines the loyalty program tiers
- `loyalty_points`: Tracks customer point balances
- `loyalty_transaction`: Records all point activities
- `loyalty_reward`: Defines available rewards
- `loyalty_redemption`: Tracks reward redemptions

## Naming Conventions

The loyalty feature follows the platform's standardized naming convention:

- **Database**: Uses `snake_case` for all table and column names
  - Examples: `loyalty_tier`, `points_threshold`, `is_active`

- **TypeScript**: Uses `camelCase` for all interface properties
  - Examples: `loyaltyTier`, `pointsThreshold`, `isActive`

The repository layer handles the conversion between these naming conventions, ensuring consistency throughout the application.

## Integration Points

The loyalty feature integrates with several other platform features:

- **Order**: Points are awarded for purchases
- **Customer**: Loyalty status is tied to customer accounts
- **Product**: Some rewards may be tied to specific products
- **Checkout**: Redemption codes can be applied during checkout

## Usage Examples

### Earning Points from an Order

When a customer completes an order, the system automatically awards points:

```typescript
// In order processing
const loyaltyRepo = new LoyaltyRepo();
await loyaltyRepo.processOrderPoints(
  orderId,
  orderAmount,
  customerId
);
```

### Checking Customer Status

```typescript
const loyaltyRepo = new LoyaltyRepo();
const customerPoints = await loyaltyRepo.findCustomerPoints(customerId);
```

### Redeeming a Reward

```typescript
const loyaltyRepo = new LoyaltyRepo();
const redemption = await loyaltyRepo.redeemReward(customerId, rewardId);
```

## API Endpoints

### Public API

- `GET /api/loyalty/tiers` - Get all active loyalty tiers
- `GET /api/loyalty/rewards` - Get all active rewards
- `GET /api/loyalty/my-status` - Get authenticated customer's loyalty status
- `GET /api/loyalty/my-transactions` - Get authenticated customer's transaction history
- `GET /api/loyalty/my-redemptions` - Get authenticated customer's reward redemptions
- `POST /api/loyalty/redeem` - Redeem points for a reward

### Admin API

- `GET /api/admin/loyalty/tiers` - Get all loyalty tiers
- `POST /api/admin/loyalty/tiers` - Create new loyalty tier
- `GET /api/admin/loyalty/tiers/:id` - Get a specific tier
- `PUT /api/admin/loyalty/tiers/:id` - Update a tier
- `GET /api/admin/loyalty/rewards` - Get all rewards
- `POST /api/admin/loyalty/rewards` - Create new reward
- `GET /api/admin/loyalty/rewards/:id` - Get a specific reward
- `PUT /api/admin/loyalty/rewards/:id` - Update a reward
- `GET /api/admin/loyalty/customers/:customerId/points` - Get customer points
- `POST /api/admin/loyalty/customers/:customerId/points/adjust` - Adjust customer points
- `GET /api/admin/loyalty/customers/:customerId/transactions` - Get customer transactions
- `GET /api/admin/loyalty/customers/:customerId/redemptions` - Get customer redemptions
- `PUT /api/admin/loyalty/redemptions/:id/status` - Update redemption status
- `POST /api/admin/loyalty/orders/:orderId/points` - Process order points
