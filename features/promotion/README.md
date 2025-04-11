# How the Promotion Feature Works

Based on the code I've examined, the promotion feature in the commerce platform provides a flexible and powerful discount system. Here's how it works:

## Core Components

### 1. Generic Promotion (Base Layer)
- The foundation of the promotion system
- Defines common properties like status, scope, priority, dates, and discount parameters
- Handles generic promotion rules and actions based on configurable conditions
- Implements a rule-based engine for flexible promotion targeting
- Repository: `promotionRepo.ts`

### 2. Coupon Promotion
- Extends the base promotion system with unique codes that customers can apply
- Handles coupon-specific properties like code, usage limits, and per-customer limits
- Supports various coupon types: percentage discounts, fixed amounts, free shipping, etc.
- Manages coupon usage tracking and validation
- Repository: `couponRepo.ts`

### 3. Cart Promotions
- Applies promotions directly to shopping carts
- Tracks which promotions are applied to which carts
- Handles discount calculations at the cart level
- Manages promotion application/removal from carts
- Repository: `cartRepo.ts`

### 4. Category Promotions
- Applies promotions to specific product categories
- Enables percentage or fixed discounts on category-wide items
- Sets category-specific promotion parameters (min purchase amount, max discount)
- Repository: `categoryRepo.ts`

### 5. Discount Promotions
- Offers more targeted discount mechanisms
- Can be applied to specific products or categories
- Supports various discount types including percentage, fixed, and BOGO (buy-one-get-one)
- Handles priority-based application of multiple discounts
- Repository: `discountsRepo.ts`

## Data Flow & Relationships

The promotion service flows as follows:

1. **Promotion Creation**: Promotions are created through their respective endpoints, stored in the database with snake_case column names while maintaining camelCase in TypeScript interfaces.
2. **Rule Configuration**: For generic promotions, rules and actions are configured to determine when and how discounts apply (e.g., first order, minimum spend, specific products).
3. **Application Process**:
   - **Cart Promotions**: Applied directly when a promotion is added to a cart
   - **Category Promotions**: Applied when products from eligible categories are added to the cart
   - **Coupon Promotions**: Applied when a user enters a valid coupon code
   - **Discount Promotions**: Applied automatically based on eligibility rules
4. **Validation & Calculation**: Each promotion type implements its own validation logic and discount calculation methods.
5. **Conflict Resolution**: Promotions have priority settings to determine which apply when multiple are eligible.

## Controller Layer

Each promotion type has its own controller implementing standard CRUD operations and specialized methods:

- **Generic Promotions**: Creation, updating, applying to carts, validation
- **Coupons**: Code validation, usage tracking, discount calculation
- **Cart Promotions**: Application, removal, retrieval by cart ID
- **Category Promotions**: Category-specific promotion management
- **Discount Promotions**: Product and category-specific discount management

## API Endpoints

The system exposes a comprehensive API via [routerAdmin.ts](cci:7://file:///Users/ank6259/work/commercefull/platform/features/promotion/routerAdmin.ts:0:0-0:0) with modern endpoints for each promotion type plus legacy endpoints for backward compatibility.

## Technical Implementation Notes

- All repositories use snake_case for database column names while maintaining camelCase for TypeScript interfaces
- Explicit mapping is implemented through AS clauses in SQL queries
- The system maintains transactional integrity when deleting promotions with related records
- Date handling is standardized across all promotion types for consistent validation

### 1. Promotions
- **Types of Discounts**: The system supports multiple discount types:
  - Percentage discounts (e.g., 10% off)
  - Fixed amount discounts (e.g., $15 off)
  - Free item offers
  - Buy X get Y offers (e.g., buy one get one free)

- **Scope**: Promotions can be applied at different levels:
  - Cart-level (entire order)
  - Product-level (specific products)
  - Category-level (all products in a category)
  - Customer-level (specific customer groups)

- **Lifecycle Management**: Promotions have:
  - Status tracking (active, scheduled, expired, disabled)
  - Start and end dates
  - Usage limits and tracking

### 2. Promotion Rules
Each promotion can have multiple qualifying rules that determine when it applies:
- Cart total requirements (e.g., spend at least $50)
- Item quantity requirements (e.g., buy at least 2 items)
- Product category requirements
- Customer group restrictions
- First order qualifications
- Date and time restrictions (time of day, day of week)
- Shipping method restrictions
- Payment method restrictions

### 3. Promotion Actions
When rules are satisfied, one or more actions are triggered:
- Apply percentage discount
- Apply fixed amount discount
- Discount shipping
- Add free items

### 4. Coupons
The system also supports coupon codes that can be:
- Connected to promotions
- Validated at checkout
- Tracked for usage

## Example Promotion Rules

Here are practical examples of how to configure different types of promotions:

### 1. Seasonal Discount (10% off entire order)
```json
{
  "name": "Summer Sale 10% Off",
  "description": "10% discount on all purchases during summer",
  "status": "active",
  "scope": "cart",
  "priority": 10,
  "startDate": "2025-06-01T00:00:00Z",
  "endDate": "2025-08-31T23:59:59Z",
  "usageLimit": null,
  "discountType": "percentage",
  "discountValue": 10,
  "minOrderAmount": 0,
  "exclusive": false,
  "rules": [],
  "actions": [
    {
      "type": "discount_by_percentage",
      "value": 10
    }
  ]
}
```

### 2. Minimum Purchase Discount ($20 off orders over $100)
```json
{
  "name": "$20 Off $100+ Orders",
  "description": "Get $20 off when you spend $100 or more",
  "status": "active",
  "scope": "cart",
  "priority": 20,
  "discountType": "fixed_amount",
  "discountValue": 20,
  "exclusive": false,
  "rules": [
    {
      "condition": "cart_total",
      "operator": ">=",
      "value": 100
    }
  ],
  "actions": [
    {
      "type": "discount_by_amount",
      "value": 20
    }
  ]
}
```

### 3. Buy One Get One Free (BOGO)
```json
{
  "name": "Buy One Get One Free - T-shirts",
  "description": "Buy one t-shirt, get another free",
  "status": "active",
  "scope": "product",
  "priority": 30,
  "discountType": "buy_x_get_y",
  "exclusive": true,
  "rules": [
    {
      "condition": "product_category",
      "operator": "=",
      "value": "t-shirts"
    },
    {
      "condition": "item_quantity",
      "operator": ">=",
      "value": 2
    }
  ],
  "actions": [
    {
      "type": "discount_by_percentage",
      "value": 50,
      "targetType": "category",
      "targetId": "t-shirts"
    }
  ]
}
```

### 4. First-Time Customer Discount
```json
{
  "name": "First Order 15% Off",
  "description": "15% discount for first-time customers",
  "status": "active",
  "scope": "customer",
  "priority": 40,
  "discountType": "percentage",
  "discountValue": 15,
  "exclusive": false,
  "rules": [
    {
      "condition": "first_order",
      "operator": "=",
      "value": true
    }
  ],
  "actions": [
    {
      "type": "discount_by_percentage",
      "value": 15
    }
  ]
}
```

### 5. Free Shipping on Orders Over $50
```json
{
  "name": "Free Shipping over $50",
  "description": "Free shipping on all orders over $50",
  "status": "active",
  "scope": "cart",
  "priority": 10,
  "exclusive": false,
  "rules": [
    {
      "condition": "cart_total",
      "operator": ">=",
      "value": 50
    }
  ],
  "actions": [
    {
      "type": "discount_shipping",
      "value": 100
    }
  ]
}
```

### 6. Complex Multi-Rule Holiday Campaign
```json
{
  "name": "Holiday Weekend Special",
  "description": "Special weekend holiday promotion with tiered discounts, time restrictions, and customer targeting",
  "status": "scheduled",
  "scope": "cart",
  "priority": 100,
  "startDate": "2025-12-24T00:00:00Z",
  "endDate": "2025-12-26T23:59:59Z",
  "usageLimit": 1000,
  "discountType": "percentage",
  "discountValue": 25,
  "minOrderAmount": 150,
  "maxDiscountAmount": 200,
  "exclusive": true,
  "rules": [
    {
      "name": "Weekend days only",
      "condition": "day_of_week",
      "operator": "in",
      "value": ["friday", "saturday", "sunday"]
    },
    {
      "name": "Shopping hours only",
      "condition": "time_of_day",
      "operator": "between",
      "value": {
        "start": "09:00",
        "end": "22:00"
      }
    },
    {
      "name": "Premium members or big spenders",
      "condition": "customer_group",
      "operator": "in",
      "value": ["premium", "vip", "gold"]
    },
    {
      "name": "Has qualifying items",
      "condition": "product_category",
      "operator": "includes_any",
      "value": ["electronics", "home-appliances", "furniture"]
    },
    {
      "name": "Minimum qualified items",
      "condition": "item_quantity",
      "operator": ">=",
      "value": 2
    },
    {
      "name": "Minimum spend threshold",
      "condition": "cart_total",
      "operator": ">=",
      "value": 150
    }
  ],
  "actions": [
    {
      "type": "discount_by_percentage",
      "value": 25,
      "targetType": "categories",
      "targetId": ["electronics", "home-appliances", "furniture"]
    },
    {
      "type": "discount_shipping",
      "value": 100
    },
    {
      "type": "free_item",
      "value": 1,
      "targetType": "product",
      "targetId": "holiday-gift-2025",
      "metadata": {
        "message": "Free holiday gift with your purchase!"
      }
    }
  ]
}
```

This complex example combines multiple rule types:
1. **Time-based restrictions**: Limited to weekend days and specific hours
2. **Customer segmentation**: Only for premium, VIP, or gold tier customers
3. **Product targeting**: Must include items from specific categories
4. **Quantity requirements**: At least 2 qualifying items
5. **Minimum spend**: Cart total must be at least $150

When all conditions are met, multiple actions are triggered:
- 25% discount on qualifying categories (up to $200 max discount)
- Free shipping
- A free gift item added to the cart

Such complex promotions allow for highly targeted marketing campaigns with precise customer and product targeting, while the time restrictions help create urgency and the exclusive flag prevents combining with other offers.

## How It Works

1. **Creating Promotions**: Merchants create promotions through the admin interface, defining:
   - Basic information (name, description)
   - Timing (start/end dates)
   - Discount details
   - Rules and qualifying conditions
   - Actions to take when applied

2. **Promotion Validation**: When a customer shops:
   - Active promotions are evaluated against the cart contents
   - All applicable rules are checked
   - Promotions with priority settings determine which applies if multiple qualify
   - Exclusive promotions may prevent other promotions from applying simultaneously

3. **Applying Promotions**: When a promotion is valid:
   - The system calculates the appropriate discount
   - The discount is applied to the cart
   - Usage is tracked
   - The customer sees the discount reflected in their total

4. **Coupon Management**: Additionally, customers can:
   - Enter coupon codes
   - Have coupons validated
   - See the associated discount applied

## Technical Implementation

The system is implemented with:
- A `PromotionRepo` class that handles database operations
- Controllers for both customer-facing and admin operations
- API endpoints for promotion management and application
- Validation logic to ensure promotions are correctly applied
- Usage tracking to prevent exceeding limits

This flexible promotion system allows merchants to create sophisticated marketing campaigns, seasonal discounts, loyalty rewards, and targeted offers to drive sales and customer retention.

## How Promotions and Tax Calculations Interact

Based on my analysis of the codebase, here's how promotions and tax calculations interact in the commerce platform:

### Order of Operations

The platform offers configurable behavior through the `applyDiscountBeforeTax` setting in the tax configuration:

1. **Discount-then-Tax (Default)**: When `applyDiscountBeforeTax` is set to `true`:
   - Promotions are applied first to reduce the price of eligible items or the overall cart
   - Tax calculations are then performed on the discounted amounts
   - This typically results in lower tax amounts since the tax base (the price) has been reduced by discounts

2. **Tax-then-Discount**: When `applyDiscountBeforeTax` is set to `false`:
   - Tax calculations are performed on the original prices
   - Promotions are then applied to the tax-inclusive amounts
   - This generally results in higher tax collection as taxes are calculated on pre-discount prices

### Calculation Process

During checkout, the sequence typically works like this:

1. The system first loads all active promotions applicable to the cart
2. It evaluates promotion rules against the cart contents
3. Depending on the `applyDiscountBeforeTax` setting:
   - If `true`: The system applies discounts, then calculates taxes on the discounted subtotal
   - If `false`: The system calculates taxes on the original subtotal, then applies discounts
4. The basket/checkout service coordinates between the promotion and tax services to ensure the correct order of operations

### Special Cases

The system handles several special cases:

1. **Tax-Exempt Products**: Some promotions may apply to products that are tax-exempt. In such cases, the promotion is applied but no tax calculation occurs for those items.

2. **Tax-Exclusive Promotions**: Some promotions may be configured to apply only to the pre-tax amount, regardless of the `applyDiscountBeforeTax` setting.

3. **Shipping Discounts**: When promotions offer free or discounted shipping, the tax on shipping (if applicable) is adjusted based on the discounted shipping cost.

### Technical Implementation

The interaction between promotions and taxes is handled through:

1. **Basket Calculation Service**: Orchestrates the overall calculation flow, applying both promotions and taxes in the proper sequence

2. **Tax Settings**: Configurable options in the tax settings control whether discounts are applied before or after tax calculations

3. **Tax Breakdown**: The system maintains a detailed breakdown of taxable amounts, with and without discounts, to ensure accurate reporting and transparency

This flexible approach allows merchants to configure their tax and promotion interactions according to their business rules and local tax regulations.

## Best Practices

To make the most of the promotions feature and ensure smooth integration with the rest of the platform, consider these best practices:

### Promotion Configuration

1. **Prioritize Promotions Carefully**: 
   - Set promotion priorities carefully to control which discounts apply when multiple promotions are valid
   - Higher priority promotions will be evaluated first
   - Use the `exclusive` flag for promotions that should not combine with others

2. **Use Specific Targeting**:
   - Create focused promotions with specific target audiences rather than broad, general discounts
   - Target specific product categories, customer segments, or cart configurations for better conversion rates and lower discount costs

3. **Set Reasonable Limits**:
   - Always define usage limits for promotions to prevent excessive discounting
   - Consider both per-customer limits and overall campaign limits
   - Include minimum order thresholds to maintain profitability

4. **Test Thoroughly**:
   - Test promotions with various cart scenarios before activating them
   - Verify that rules trigger as expected and the correct discount amounts apply
   - Test edge cases like zero-value carts, high-quantity orders, and combined promotions

### Tax Integration

1. **Consider Regional Tax Laws**:
   - Some jurisdictions have specific rules about calculating taxes on discounted amounts
   - Configure the `applyDiscountBeforeTax` setting based on your tax obligations

2. **Document Your Tax Strategy**:
   - Clearly document whether your store calculates tax before or after discounts
   - Ensure this information is available to customers in your terms & conditions

3. **Monitor Tax Reports**:
   - Regularly review tax reports when running promotions to ensure accurate tax collection
   - Validate tax calculations especially for cross-border and multi-jurisdiction sales

### Performance Considerations

1. **Limit Rule Complexity**:
   - While the system supports complex rules, each additional condition adds overhead
   - For high-traffic stores, limit the number of simultaneous active promotions
   - Use date restrictions to automatically cycle through promotions rather than keeping too many active

2. **Index Critical Fields**:
   - Ensure database indexes exist on frequently queried fields like promotion status, dates, and coupon codes

3. **Cache Where Appropriate**:
   - Cache promotion validation results when possible
   - Consider caching the list of active promotions for faster initial loading

By following these best practices, you can create effective promotional campaigns while maintaining system performance and ensuring proper tax compliance.
