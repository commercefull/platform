# Membership Feature

The Membership feature provides a flexible subscription system for the CommerceFull platform, enabling businesses to create tiered membership plans with customizable benefits, pricing, and access controls.

## Architecture

The Membership feature follows the standard CommerceFull platform architecture with clear separation of concerns:

- **Repository Layer**: Handles data access and database operations
- **Controller Layer**: Processes business logic and request handling
- **Router Layer**: Defines API endpoints and routing

## Core Concepts

### Membership Tiers

The membership system uses a tiered approach where customers can subscribe to different membership levels:

- Each tier has configurable monthly and annual pricing
- Tiers can be ranked by level (numeric value)
- Tiers can be active or inactive
- Multiple tiers can be offered simultaneously

### Membership Benefits

Benefits are advantages provided to members of specific tiers:

- Benefits can be associated with multiple tiers
- Types include discounts, free shipping, exclusive access, and rewards
- Benefits can have percentage-based or fixed amount discounts
- Benefits can be active or inactive independently of tiers

### User Memberships

User memberships represent the relationship between a customer and a membership tier:

- Tracks subscription details including start/end dates
- Supports monthly, annual, or lifetime payment options
- Handles auto-renewal settings
- Tracks payment history and usage

## Database Schema

The membership feature uses several tables to manage its data:

- `membership_tier`: Defines available membership tiers
- `membership_benefit`: Stores benefit definitions
- `user_membership`: Links users to their membership tiers
- `membership_payment`: Records payment history
- `membership_benefit_usage`: Tracks benefit usage

## API Endpoints

### Admin API

- `GET /api/admin/membership/tiers`: List all membership tiers
- `POST /api/admin/membership/tiers`: Create a new tier
- `GET /api/admin/membership/tiers/:id`: Get tier details
- `PUT /api/admin/membership/tiers/:id`: Update a tier
- `DELETE /api/admin/membership/tiers/:id`: Delete a tier

- `GET /api/admin/membership/benefits`: List all benefits
- `POST /api/admin/membership/benefits`: Create a new benefit
- `GET /api/admin/membership/benefits/:id`: Get benefit details
- `PUT /api/admin/membership/benefits/:id`: Update a benefit
- `DELETE /api/admin/membership/benefits/:id`: Delete a benefit

- `GET /api/admin/membership/user-memberships`: List user memberships
- `POST /api/admin/membership/user-memberships`: Create a user membership
- `GET /api/admin/membership/user-memberships/:id`: Get membership details
- `PUT /api/admin/membership/user-memberships/:id`: Update a membership
- `PUT /api/admin/membership/user-memberships/:id/cancel`: Cancel a membership

### Public API

- `GET /api/membership/tiers`: List active membership tiers
- `GET /api/membership/tiers/:id`: Get details of a specific tier
- `GET /api/membership/tiers/:id/benefits`: Get benefits for a tier
- `GET /api/membership/my-membership`: Get current user's membership
- `POST /api/membership/subscribe`: Subscribe to a membership tier

## Naming Convention Implementation

The membership feature follows the platform's standardized naming convention:

### Database Schema

- Database tables and columns use `snake_case` naming
  ```sql
  CREATE TABLE "membership_tier" (
    id: uuid,
    name: varchar,
    monthly_price: decimal,
    is_active: boolean
    -- other fields...
  )
  ```

### TypeScript Interfaces

- TypeScript interfaces use `camelCase` properties
  ```typescript
  interface MembershipTier {
    id: string;
    name: string;
    monthlyPrice: number;
    isActive: boolean;
    // other properties...
  }
  ```

### Field Mapping

- The repository layer handles translation between database and TypeScript formats
  ```typescript
  const membershipTierFields = {
    id: 'id',
    name: 'name',
    monthlyPrice: 'monthly_price',
    isActive: 'is_active',
    // other mappings...
  };
  ```

- Transform functions convert between formats
  ```typescript
  function transformMembershipTierFromDb(dbRecord) {
    return {
      id: dbRecord.id,
      name: dbRecord.name,
      monthlyPrice: dbRecord.monthly_price,
      isActive: dbRecord.is_active,
      // other fields...
    };
  }
  ```

## Integration with Other Features

The membership feature integrates with several other platform features:

- **Customer**: Links memberships to customer accounts
- **Orders**: Applies membership discounts to orders
- **Products**: Handles exclusive product access for members
- **Payments**: Processes subscription payments and recurring billing

## Usage Examples

### Creating a Membership Tier

```typescript
const membershipRepo = new MembershipRepo();
const newTier = await membershipRepo.createTier({
  name: 'Premium',
  description: 'Our premium membership tier',
  monthlyPrice: 19.99,
  annualPrice: 199.99,
  level: 2,
  isActive: true
});
```

### Adding a Benefit to a Tier

```typescript
const benefit = await membershipRepo.createBenefit({
  name: '10% Discount',
  description: '10% off all purchases',
  tierIds: [premiumTierId],
  benefitType: 'discount',
  discountPercentage: 10,
  isActive: true
});
```

### Creating a User Membership

```typescript
const userMembership = await membershipRepo.createUserMembership({
  userId: 'user123',
  tierId: 'premium-tier-id',
  startDate: new Date().toISOString(),
  endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
  isActive: true,
  autoRenew: true,
  membershipType: 'annual'
});
```

## Testing

The membership feature has comprehensive integration tests that verify:

1. Tier management functionality
2. Benefit management functionality
3. User membership operations
4. Public API access
5. Proper implementation of the platform's naming convention

Run the tests with:
```bash
npm test tests/integration/membership
```
