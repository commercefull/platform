# CommerceFull Platform - Business Flows Analysis

## Executive Summary

This document provides a comprehensive analysis of the required changes to complete all business flows in the CommerceFull platform. The analysis covers 8 major domains: Store & Inventory, Promotion, Brand & Content, Merchant & B2B, Customer & Segments, Configuration, and Ordering.

### Supported Business Models

The platform must support four distinct ecommerce business models:

| Business Model | Description | Key Requirements | Complexity |
|---------------|-------------|------------------|------------|
| **Single-Store** | Simple single storefront ecommerce | One store, one inventory, standard checkout | Simple |
| **Multi-Store** | Single business with multiple storefronts (physical/digital) | Shared inventory, centralized management, store-specific settings | Medium |
| **Marketplace** | Platform hosting multiple independent merchants | Merchant isolation, commission handling, merchant-specific fulfillment | Complex |
| **B2B** | Business-to-business with suppliers and approval workflows | Purchase orders, approval chains, credit limits, custom pricing | Complex |

### Database Schema Convention

> **IMPORTANT**: All database columns use **camelCase** naming convention.
> - Columns: `orderId`, `createdAt`, `customerId`, `orderNumber`, `basketId`
> - PostgreSQL requires double quotes around camelCase columns in SQL queries
> - Example: `SELECT * FROM "order" WHERE "orderId" = $1`

### Single-Store Setup (Simplified Multi-Store)

For single-store deployments, the platform operates with these defaults:
- Single default store created on initialization
- Single default warehouse/inventory location
- Single default channel (web)
- All multi-store, marketplace, and B2B features disabled
- Simplified admin UI without store/merchant switching

```typescript
// Configuration for single-store mode
interface SingleStoreConfig {
  mode: 'single';
  defaultStoreId: string;
  defaultWarehouseId: string;
  defaultChannelId: string;
  features: {
    multiStore: false;
    marketplace: false;
    b2b: false;
  };
}
```

---

## CRITICAL: Distribution Module Breakdown

### Current State Analysis

The `modules/distribution/` module is currently a monolithic structure containing:

```
modules/distribution/
├── controllers/ (9 controllers mixing different concerns)
│   ├── channelController.ts        → Should be in Channel module
│   ├── distributionBusinessController.ts
│   ├── distributionCustomerController.ts
│   ├── fulfillmentBusinessController.ts → Should be in Fulfillment module
│   ├── pickupBusinessController.ts      → Should be in Store module
│   ├── pickupCustomerController.ts      → Should be in Store module
│   ├── preOrderBusinessController.ts    → Should be in Inventory module
│   ├── preOrderCustomerController.ts    → Should be in Inventory module
│   └── shippingBusinessController.ts    → Should be in Shipping module
├── domain/
│   ├── entities/
│   │   ├── DistributionChannel.ts  → Should be Channel module
│   │   ├── OrderFulfillment.ts     → Should be Fulfillment module
│   │   ├── ShippingMethod.ts       → Should be Shipping module
│   │   ├── ShippingZone.ts         → Should be Shipping module
│   │   └── Warehouse.ts            → DUPLICATE of modules/warehouse/
│   └── valueObjects/ (Address, Money, Weight, Dimensions)
├── repos/
│   ├── channelRepo.ts              → Should be Channel module
│   ├── distributionRepo.ts
│   ├── fulfillmentRepo.ts          → Should be Fulfillment module
│   ├── pickupRepo.ts               → Should be Store module
│   ├── preOrderRepo.ts             → Should be Inventory module
│   ├── shippingRepo.ts             → Should be Shipping module
│   └── warehouseRepo.ts            → DUPLICATE of modules/warehouse/
└── useCases/
    ├── fulfillment/                → Should be Fulfillment module
    ├── shipping/                   → Should be Shipping module
    └── warehouse/                  → DUPLICATE of modules/warehouse/
```

### Required Module Breakdown

```
Priority: CRITICAL
Effort: Extra Large
```

#### 1. Create `modules/channel/` (Distribution Channel)

```
modules/channel/
├── application/
│   └── useCases/
│       ├── CreateChannel.ts
│       ├── UpdateChannel.ts
│       ├── GetChannel.ts
│       ├── ListChannels.ts
│       ├── AssignProductsToChannel.ts
│       ├── SetChannelPricing.ts
│       ├── AssignWarehouseToChannel.ts
│       └── ConfigureChannelSettings.ts
├── domain/
│   ├── entities/
│   │   ├── Channel.ts
│   │   └── ChannelProduct.ts
│   ├── repositories/
│   │   └── ChannelRepository.ts
│   ├── valueObjects/
│   │   └── ChannelSettings.ts
│   └── events/
│       └── ChannelEvents.ts
├── infrastructure/
│   └── PostgresChannelRepository.ts
└── interface/
    ├── ChannelController.ts
    └── ChannelRoutes.ts
```

**Channel Entity Extensions for Multi-tenant:**
```typescript
interface ChannelProps {
  channelId: string;
  name: string;
  code: string;
  type: 'web' | 'mobile_app' | 'marketplace' | 'social' | 'pos' | 'wholesale' | 'api' | 'b2b_portal';
  
  // Ownership context
  ownerType: 'platform' | 'merchant' | 'business';
  ownerId?: string; // merchantId or businessId
  
  // Multi-store support
  storeIds: string[];
  defaultStoreId?: string;
  
  // Catalog & Pricing
  catalogId?: string;
  priceListId?: string;
  currencyCode: string;
  localeCode: string;
  
  // Fulfillment
  warehouseIds: string[];
  fulfillmentStrategy: 'nearest' | 'priority' | 'round_robin' | 'merchant_assigned';
  
  // B2B specific
  requiresApproval?: boolean;
  allowCreditPayment?: boolean;
  b2bPricingEnabled?: boolean;
  
  // Marketplace specific
  commissionRate?: number;
  merchantVisible?: boolean;
  
  isActive: boolean;
  settings?: Record<string, any>;
}
```

#### 2. Create `modules/fulfillment/` (Order Fulfillment)

```
modules/fulfillment/
├── application/
│   └── useCases/
│       ├── CreateFulfillment.ts
│       ├── AssignFulfillmentSource.ts     # Assign warehouse/merchant/supplier
│       ├── StartProcessing.ts
│       ├── ProcessPicking.ts
│       ├── ProcessPacking.ts
│       ├── CreateShipment.ts
│       ├── TrackShipment.ts
│       ├── MarkDelivered.ts
│       ├── ProcessReturn.ts
│       ├── SplitFulfillment.ts            # Multi-source fulfillment
│       └── RouteFulfillment.ts            # Determine best fulfillment source
├── domain/
│   ├── entities/
│   │   ├── Fulfillment.ts
│   │   ├── FulfillmentItem.ts
│   │   ├── FulfillmentPartner.ts
│   │   └── FulfillmentRule.ts
│   ├── repositories/
│   │   └── FulfillmentRepository.ts
│   ├── services/
│   │   ├── FulfillmentRouter.ts           # Routing logic
│   │   ├── FulfillmentSplitter.ts         # Split order logic
│   │   └── FulfillmentSourceSelector.ts   # Warehouse/merchant/supplier selection
│   ├── valueObjects/
│   │   ├── FulfillmentStatus.ts
│   │   ├── TrackingInfo.ts
│   │   └── PackageInfo.ts
│   └── events/
│       └── FulfillmentEvents.ts
├── infrastructure/
│   ├── PostgresFulfillmentRepository.ts
│   └── carriers/
│       ├── CarrierAdapter.ts (interface)
│       ├── ShippoAdapter.ts
│       ├── EasyPostAdapter.ts
│       └── FedExAdapter.ts
└── interface/
    ├── FulfillmentBusinessController.ts
    ├── FulfillmentCustomerController.ts
    └── FulfillmentRoutes.ts
```

**Fulfillment Entity with Multi-tenant Support:**
```typescript
interface FulfillmentProps {
  fulfillmentId: string;
  orderId: string;
  orderNumber?: string;
  
  // Source context - WHO is fulfilling
  sourceType: 'warehouse' | 'merchant' | 'supplier' | 'dropship' | 'store';
  sourceId: string;
  
  // For marketplace - which merchant
  merchantId?: string;
  
  // For B2B - which supplier
  supplierId?: string;
  
  // For multi-store - which store
  storeId?: string;
  
  // Fulfillment details
  status: FulfillmentStatus;
  items: FulfillmentItem[];
  
  // Shipping
  carrierId?: string;
  shippingMethodId?: string;
  trackingNumber?: string;
  trackingUrl?: string;
  
  // Addresses
  shipFromAddress: Address;
  shipToAddress: Address;
  
  // Partner (3PL)
  fulfillmentPartnerId?: string;
  
  // Workflow tracking
  pickedAt?: Date;
  packedAt?: Date;
  shippedAt?: Date;
  deliveredAt?: Date;
}
```

#### 3. Enhance `modules/shipping/` (Shipping Module)

```
modules/shipping/
├── application/
│   └── useCases/
│       ├── CalculateRates.ts
│       ├── GetAvailableMethods.ts
│       ├── CreateShippingLabel.ts
│       ├── ValidateAddress.ts
│       ├── GetDeliveryEstimate.ts
│       ├── ConfigureShippingZone.ts
│       ├── SetMerchantShippingRules.ts    # Marketplace
│       └── SetB2BShippingTerms.ts         # B2B
├── domain/
│   ├── entities/
│   │   ├── ShippingMethod.ts
│   │   ├── ShippingZone.ts
│   │   ├── ShippingRate.ts
│   │   ├── ShippingCarrier.ts
│   │   └── ShippingRule.ts
│   ├── repositories/
│   │   └── ShippingRepository.ts
│   ├── services/
│   │   ├── RateCalculator.ts
│   │   ├── ZoneMatcher.ts
│   │   └── DeliveryEstimator.ts
│   └── valueObjects/
│       └── ShippingDimensions.ts
└── infrastructure/
    └── PostgresShippingRepository.ts
```

#### 4. Migrate Pickup/PreOrder to Appropriate Modules

**Move to `modules/store/`:**
- `pickupRepo.ts` → Store pickup points
- `pickupBusinessController.ts` → Store pickup management
- `pickupCustomerController.ts` → Customer pickup scheduling

**Move to `modules/inventory/`:**
- `preOrderRepo.ts` → Pre-order/backorder handling
- `preOrderBusinessController.ts` → Pre-order management
- `preOrderCustomerController.ts` → Customer pre-order placement

---

## 1. Store & Inventory Domain

### Current State

#### Store Module (`modules/store/`)
- **Entity**: `Store.ts` - Well-defined with `merchant_store` and `business_store` types
- **Use Cases**: Only `CreateStore.ts` exists
- **Missing**: Store-Inventory relationship, shared inventory support, store-specific settings

#### Inventory Module (`modules/inventory/`)
- **Entities**: `Inventory.ts`, `InventoryItem.ts` - Duplicate domain models need consolidation
- **Types**: Supports `warehouse`, `store`, `supplier` location types
- **Use Cases**: Only `ManageStock.ts` exists

#### Warehouse Module (`modules/warehouse/`)
- **Entity**: `Warehouse.ts` - Supports both marketplace and multi-store scenarios
- **Missing**: DDD application layer (uses legacy controllers/repos pattern)

### Required Changes

#### 1.1 Store-Inventory Integration

```
Priority: HIGH
Effort: Large
```

**Changes Required:**

1. **Create StoreInventory aggregate** to link stores with inventories:
   ```
   modules/store/domain/entities/StoreInventory.ts
   - storeId
   - inventoryId
   - isShared: boolean (for shared inventory between stores)
   - inventoryMode: 'dedicated' | 'shared' | 'virtual'
   - syncStrategy: 'realtime' | 'periodic' | 'manual'
   ```

2. **Add Store-specific inventory settings**:
   ```
   modules/store/domain/valueObjects/InventorySettings.ts
   - lowStockThreshold
   - displayMode: 'show_quantity' | 'in_stock_only' | 'hide'
   - allowBackorder
   - reservationTimeout
   ```

3. **Create missing use cases for Store module**:
   - `modules/store/application/useCases/UpdateStore.ts`
   - `modules/store/application/useCases/GetStore.ts`
   - `modules/store/application/useCases/ListStores.ts`
   - `modules/store/application/useCases/DeleteStore.ts`
   - `modules/store/application/useCases/LinkInventory.ts`
   - `modules/store/application/useCases/SetInventorySettings.ts`

4. **Consolidate Inventory domain models**:
   - Remove duplicate `modules/inventory/domain/inventory.ts` and `modules/inventory/domain/item.ts`
   - Keep only `modules/inventory/domain/entities/Inventory.ts` and `InventoryItem.ts`

#### 1.2 Warehouse-Inventory Integration

```
Priority: HIGH
Effort: Medium
```

**Changes Required:**

1. **Migrate Warehouse to DDD structure**:
   ```
   modules/warehouse/
   ├── application/
   │   └── useCases/
   │       ├── CreateWarehouse.ts
   │       ├── UpdateWarehouse.ts
   │       ├── AssignToInventory.ts
   │       ├── TransferStock.ts
   │       └── ProcessRestock.ts
   ├── domain/
   │   ├── entities/
   │   │   └── Warehouse.ts (existing)
   │   ├── repositories/
   │   │   └── WarehouseRepository.ts
   │   └── events/
   │       └── WarehouseEvents.ts
   └── infrastructure/
       └── PostgresWarehouseRepository.ts
   ```

2. **Create WarehouseSupply entity** for warehouse-to-inventory stock supply:
   ```
   modules/warehouse/domain/entities/WarehouseSupply.ts
   - warehouseId
   - inventoryId
   - productId/variantId
   - supplyMode: 'auto_replenish' | 'manual' | 'threshold_based'
   - minThreshold
   - replenishQuantity
   ```

3. **Add Inventory use cases**:
   - `modules/inventory/application/useCases/CreateInventoryLocation.ts`
   - `modules/inventory/application/useCases/TransferStock.ts`
   - `modules/inventory/application/useCases/ReserveStock.ts`
   - `modules/inventory/application/useCases/ReleaseReservation.ts`
   - `modules/inventory/application/useCases/AdjustStock.ts`
   - `modules/inventory/application/useCases/CheckAvailability.ts`
   - `modules/inventory/application/useCases/GetLowStockItems.ts`

---

## 2. Promotion Domain

### Current State

#### Promotion Module (`modules/promotion/`)
- **Repos**: `couponRepo.ts`, `discountRepo.ts`, `giftCardRepo.ts`, `promotionRepo.ts`, `cartRepo.ts`, `categoryRepo.ts`
- **Use Cases**: 12 use cases including apply, redeem, validate operations
- **Domain files**: Some empty (`cart.ts`, `category.ts`, `discounts.ts`)

#### Coupon Module (`modules/coupon/`)
- Partially implemented, domain schema only

#### Loyalty Module (`modules/loyalty/`)
- **Repos**: `loyaltyRepo.ts`, `customerLoyaltyTransactionRepo.ts`
- **Missing**: DDD application layer

### Required Changes

#### 2.1 Coupon Enhancements

```
Priority: HIGH
Effort: Medium
```

**Changes Required:**

1. **Create proper Coupon entity**:
   ```
   modules/coupon/domain/entities/Coupon.ts
   - couponId
   - code
   - type: 'percentage' | 'fixed' | 'free_shipping' | 'bogo'
   - value
   - usageType: 'single_use' | 'multi_use' | 'per_customer'
   - maxUsage (for multi-use)
   - maxUsagePerCustomer
   - currentUsageCount
   - minOrderAmount
   - maxDiscountAmount
   - validFrom / validTo
   - applicableProducts[]
   - applicableCategories[]
   - excludedProducts[]
   - customerSegments[]
   - stackable: boolean
   - isActive
   ```

2. **Add Coupon use cases**:
   - `modules/coupon/application/useCases/CreateCoupon.ts`
   - `modules/coupon/application/useCases/ValidateCoupon.ts`
   - `modules/coupon/application/useCases/ApplyCoupon.ts`
   - `modules/coupon/application/useCases/RedeemCoupon.ts`
   - `modules/coupon/application/useCases/CheckCouponEligibility.ts`
   - `modules/coupon/application/useCases/GetCouponUsageStats.ts`

#### 2.2 Discount System Refactoring

```
Priority: HIGH
Effort: Large
```

**Changes Required:**

1. **Create Discount entity with proper hierarchy**:
   ```
   modules/promotion/domain/entities/Discount.ts
   - discountId
   - name
   - type: 'product' | 'category' | 'cart' | 'bundle'
   - scope: 'all_products' | 'specific_products' | 'specific_categories'
   - discountType: 'percentage' | 'fixed_amount' | 'buy_x_get_y'
   - value
   - applicableProductIds[]
   - applicableCategoryIds[]
   - conditions: DiscountCondition[]
   - priority (for stacking order)
   - stackingRule: 'exclusive' | 'stackable' | 'best_deal'
   - validFrom / validTo
   - customerSegments[]
   - isActive
   ```

2. **Create DiscountCondition value object**:
   ```
   modules/promotion/domain/valueObjects/DiscountCondition.ts
   - type: 'min_quantity' | 'min_amount' | 'customer_segment' | 'first_order' | 'time_based'
   - value
   - operator: 'equals' | 'greater_than' | 'less_than' | 'in'
   ```

3. **Implement PromotionEngine service**:
   ```
   modules/promotion/domain/services/PromotionEngine.ts
   - calculateBestDiscount(cart, customer): DiscountResult
   - calculateStackedDiscounts(cart, customer): DiscountResult[]
   - validateDiscountCombination(discounts[]): boolean
   ```

#### 2.3 Loyalty Program Enhancement

```
Priority: MEDIUM
Effort: Large
```

**Changes Required:**

1. **Migrate to DDD structure**:
   ```
   modules/loyalty/
   ├── application/
   │   └── useCases/
   │       ├── EarnPoints.ts
   │       ├── RedeemPoints.ts
   │       ├── CheckPointsBalance.ts
   │       ├── GetPointsHistory.ts
   │       ├── CalculateTierStatus.ts
   │       ├── ProcessPointsExpiration.ts
   │       └── CreateReward.ts
   ├── domain/
   │   ├── entities/
   │   │   ├── LoyaltyProgram.ts
   │   │   ├── LoyaltyMember.ts
   │   │   ├── PointsTransaction.ts
   │   │   └── Reward.ts
   │   ├── valueObjects/
   │   │   └── PointsBalance.ts
   │   └── services/
   │       └── PointsCalculator.ts
   └── infrastructure/
       └── PostgresLoyaltyRepository.ts
   ```

2. **Create LoyaltyMember aggregate**:
   ```
   modules/loyalty/domain/entities/LoyaltyMember.ts
   - memberId
   - customerId
   - currentTierId
   - lifetimePoints
   - availablePoints
   - pendingPoints
   - expiringPoints (with dates)
   - memberSince
   - lastActivityAt
   ```

3. **Points earning rules engine**:
   ```
   modules/loyalty/domain/services/PointsCalculator.ts
   - calculatePurchasePoints(order, tier): number
   - calculateBonusPoints(action, member): number
   - applyMultiplier(points, tier, promotions): number
   ```

---

## 3. Brand & Content Domain

### Current State

#### Content Module (`modules/content/`)
- 21 use cases - well implemented
- Controllers and repos in place

#### Media Module (`modules/media/`)
- **Entity**: `Media.ts` exists
- **Services**: Storage services defined
- **Missing**: Complete use cases implementation

### Required Changes

#### 3.1 Media Module Completion

```
Priority: MEDIUM
Effort: Medium
```

**Changes Required:**

1. **Complete Media use cases**:
   ```
   modules/media/application/useCases/
   ├── UploadMedia.ts
   ├── DeleteMedia.ts
   ├── GetMedia.ts
   ├── ListMedia.ts
   ├── ResizeImage.ts
   ├── GenerateThumbnail.ts
   ├── OptimizeMedia.ts
   └── AssociateMediaToEntity.ts
   ```

2. **Create MediaAssociation for polymorphic relationships**:
   ```
   modules/media/domain/entities/MediaAssociation.ts
   - mediaId
   - entityType: 'product' | 'category' | 'store' | 'brand' | 'content'
   - entityId
   - purpose: 'main' | 'gallery' | 'thumbnail' | 'banner'
   - sortOrder
   ```

#### 3.2 Brand Module (NEW)

```
Priority: MEDIUM
Effort: Medium
```

**Required Implementation:**

1. **Create Brand module structure**:
   ```
   modules/brand/
   ├── application/
   │   └── useCases/
   │       ├── CreateBrand.ts
   │       ├── UpdateBrand.ts
   │       ├── GetBrand.ts
   │       ├── ListBrands.ts
   │       ├── DeleteBrand.ts
   │       └── AssociateBrandMedia.ts
   ├── domain/
   │   ├── entities/
   │   │   └── Brand.ts
   │   ├── repositories/
   │   │   └── BrandRepository.ts
   │   └── valueObjects/
   │       └── BrandSettings.ts
   └── infrastructure/
       └── PostgresBrandRepository.ts
   ```

2. **Brand entity**:
   ```
   modules/brand/domain/entities/Brand.ts
   - brandId
   - name
   - slug
   - description
   - logo (mediaId)
   - coverImage (mediaId)
   - website
   - isActive
   - isFeatured
   - metadata
   ```

---

## 4. Merchant & B2B Domain

### Current State

#### Merchant Module (`modules/merchant/`)
- **Entity**: `Merchant.ts` - Basic implementation
- **Repos**: `merchantRepo.ts`
- Uses legacy controller pattern

#### B2B Module (`modules/b2b/`)
- **Repos**: `companyRepo.ts`, `quoteRepo.ts`, `approvalRepo.ts`
- **Use Cases**: Company and quote management partially implemented
- **Missing**: Proper authentication integration

#### Identity Module (`modules/identity/`)
- **Use Cases**: `Authenticate.ts`, `SocialLogin.ts`
- **Entity**: `User.ts` with `customer`, `merchant`, `admin` types
- **Repos**: Session and token management for customers/merchants

### Required Changes

#### 4.1 Merchant Authentication Integration

```
Priority: HIGH
Effort: Medium
```

**Changes Required:**

1. **Extend Identity for Merchant**:
   ```
   modules/identity/application/useCases/
   ├── MerchantLogin.ts
   ├── MerchantRegister.ts
   ├── MerchantPasswordReset.ts
   ├── MerchantMfaSetup.ts
   └── MerchantSessionManagement.ts
   ```

2. **Create MerchantUser entity extension**:
   ```
   modules/merchant/domain/entities/MerchantUser.ts
   - userId (from Identity)
   - merchantId
   - role: 'owner' | 'admin' | 'staff'
   - permissions[]
   - storeAccess[] (which stores they can access)
   - isApproved
   - approvedAt
   - approvedBy
   ```

3. **Add Merchant-specific identity repos**:
   - Already exists: `merchantSessionRepo.ts` - verify integration

#### 4.2 B2B Authentication & Authorization

```
Priority: HIGH
Effort: Large
```

**Changes Required:**

1. **Create B2BUser entity**:
   ```
   modules/b2b/domain/entities/B2BUser.ts
   - userId (from Identity)
   - companyId
   - role: 'admin' | 'buyer' | 'approver' | 'viewer'
   - purchaseLimit
   - approvalRequired: boolean
   - approvalLimit
   - departments[]
   - costCenters[]
   ```

2. **Add B2B authentication use cases**:
   ```
   modules/b2b/application/useCases/auth/
   ├── B2BLogin.ts
   ├── B2BRegister.ts
   ├── InviteB2BUser.ts
   ├── AcceptInvitation.ts
   └── SetupCompanySSO.ts
   ```

3. **Create B2B approval workflow use cases**:
   ```
   modules/b2b/application/useCases/approval/
   ├── CreateApprovalRule.ts
   ├── SubmitForApproval.ts
   ├── ApproveRequest.ts
   ├── RejectRequest.ts
   └── GetPendingApprovals.ts
   ```

4. **Migrate B2B to full DDD structure**:
   ```
   modules/b2b/domain/entities/
   ├── Company.ts
   ├── B2BUser.ts
   ├── Quote.ts
   ├── ApprovalRule.ts
   └── ApprovalRequest.ts
   ```

---

## 5. Customer & Segments Domain

### Current State

#### Customer Module (`modules/customer/`)
- **Entity**: `Customer.ts` - Well defined
- **Use Cases**: 10 use cases covering registration, authentication, profile management
- **Repos**: Customer, address, groups, preferences

#### Segments
- Customer groups exist in repos
- No dedicated segment engine

### Required Changes

#### 5.1 Customer Segmentation Engine

```
Priority: MEDIUM
Effort: Large
```

**Changes Required:**

1. **Create Segment module**:
   ```
   modules/segment/
   ├── application/
   │   └── useCases/
   │       ├── CreateSegment.ts
   │       ├── UpdateSegment.ts
   │       ├── EvaluateSegment.ts
   │       ├── GetCustomerSegments.ts
   │       ├── RefreshSegmentMembership.ts
   │       └── GetSegmentAnalytics.ts
   ├── domain/
   │   ├── entities/
   │   │   ├── Segment.ts
   │   │   └── SegmentRule.ts
   │   ├── services/
   │   │   └── SegmentEvaluator.ts
   │   └── repositories/
   │       └── SegmentRepository.ts
   └── infrastructure/
       └── PostgresSegmentRepository.ts
   ```

2. **Segment entity with dynamic rules**:
   ```
   modules/segment/domain/entities/Segment.ts
   - segmentId
   - name
   - description
   - type: 'static' | 'dynamic' | 'hybrid'
   - rules: SegmentRule[] (for dynamic)
   - memberIds: string[] (for static/hybrid)
   - evaluationFrequency: 'realtime' | 'hourly' | 'daily'
   - lastEvaluatedAt
   - memberCount
   - isActive
   ```

3. **SegmentRule value object**:
   ```
   modules/segment/domain/valueObjects/SegmentRule.ts
   - field: 'total_orders' | 'total_spent' | 'last_order_date' | 'location' | 'age' | 'tags' | custom
   - operator: 'equals' | 'greater_than' | 'less_than' | 'contains' | 'in' | 'between'
   - value: any
   - logicalOperator: 'AND' | 'OR'
   ```

4. **Segment evaluation service**:
   ```
   modules/segment/domain/services/SegmentEvaluator.ts
   - evaluateCustomer(customerId, segment): boolean
   - evaluateAllCustomers(segment): string[]
   - buildSegmentQuery(rules): SQLQuery
   ```

---

## 6. Configuration Domain

### Current State

#### Configuration Module (`modules/configuration/`)
- Basic DDD structure exists
- Application and domain layers present

### Required Changes

#### 6.1 Configuration Enhancement

```
Priority: LOW
Effort: Medium
```

**Changes Required:**

1. **Expand configuration scope**:
   ```
   modules/configuration/domain/entities/
   ├── StoreConfiguration.ts
   ├── PaymentConfiguration.ts
   ├── ShippingConfiguration.ts
   ├── TaxConfiguration.ts
   ├── NotificationConfiguration.ts
   └── FeatureFlag.ts
   ```

2. **Add configuration use cases**:
   ```
   modules/configuration/application/useCases/
   ├── GetConfiguration.ts
   ├── UpdateConfiguration.ts
   ├── ResetToDefault.ts
   ├── ImportConfiguration.ts
   ├── ExportConfiguration.ts
   ├── GetFeatureFlags.ts
   └── ToggleFeatureFlag.ts
   ```

3. **Configuration scoping**:
   ```
   ConfigurationScope:
   - global (platform-wide)
   - store (per-store override)
   - merchant (marketplace merchant override)
   - customer_segment (segment-specific)
   ```

---

## 7. Ordering Domain

### Current State

#### Basket Module (`modules/basket/`)
- **Entities**: `Basket.ts`, `BasketItem.ts` - Well implemented
- **Use Cases**: 10 use cases covering full basket management
- Status: ✅ Complete

#### Checkout Module (`modules/checkout/`)
- **Entity**: `CheckoutSession.ts` - Well implemented
- **Use Cases**: 10 use cases covering checkout flow
- Status: ✅ Complete

#### Payment Module (`modules/payment/`)
- **Entities**: `PaymentTransaction.ts`, `PaymentRefund.ts`
- **Use Cases**: `InitiatePayment.ts`, `ProcessRefund.ts`, `GetTransactions.ts`
- Status: ⚠️ Needs expansion

#### Order Module (`modules/order/`)
- **Entities**: `Order.ts`, `OrderItem.ts`, `OrderAddress.ts`
- **Use Cases**: 7 use cases
- Status: ✅ Mostly complete

#### Distribution Module (`modules/distribution/`)
- **Entities**: `OrderFulfillment.ts`, `ShippingMethod.ts`, `ShippingZone.ts`, `Warehouse.ts`, `DistributionChannel.ts`
- Uses legacy pattern with `useCases/` folder not under `application/`
- Status: ⚠️ Needs DDD migration

#### Support Module (`modules/support/`)
- **Repos**: `supportRepo.ts`, `faqRepo.ts`, `alertRepo.ts`
- Uses legacy controller pattern
- Status: ⚠️ Needs DDD migration

### Required Changes

#### 7.1 Payment Module Enhancement

```
Priority: HIGH
Effort: Medium
```

**Changes Required:**

1. **Add missing payment use cases**:
   ```
   modules/payment/application/useCases/
   ├── InitiatePayment.ts (exists)
   ├── ProcessRefund.ts (exists)
   ├── GetTransactions.ts (exists)
   ├── CapturePayment.ts (NEW)
   ├── VoidPayment.ts (NEW)
   ├── ProcessWebhook.ts (NEW)
   ├── RetryPayment.ts (NEW)
   ├── GetPaymentMethods.ts (NEW)
   └── SavePaymentMethod.ts (NEW)
   ```

2. **Create PaymentMethod entity**:
   ```
   modules/payment/domain/entities/PaymentMethod.ts
   - paymentMethodId
   - customerId
   - type: 'card' | 'bank_account' | 'wallet' | 'buy_now_pay_later'
   - provider: 'stripe' | 'paypal' | 'adyen' | etc.
   - isDefault
   - expiresAt
   - last4
   - brand (for cards)
   - metadata
   ```

#### 7.2 Distribution Module DDD Migration

```
Priority: MEDIUM
Effort: Large
```

**Changes Required:**

1. **Restructure to standard DDD**:
   ```
   modules/distribution/
   ├── application/
   │   └── useCases/
   │       ├── CreateFulfillment.ts
   │       ├── UpdateFulfillmentStatus.ts
   │       ├── AssignWarehouse.ts
   │       ├── ProcessPicking.ts
   │       ├── ProcessPacking.ts
   │       ├── ShipOrder.ts
   │       ├── TrackShipment.ts
   │       ├── MarkDelivered.ts
   │       ├── ProcessReturn.ts
   │       ├── CalculateShippingRates.ts
   │       └── CreateShippingLabel.ts
   ├── domain/
   │   ├── entities/ (existing - keep)
   │   ├── repositories/
   │   │   └── FulfillmentRepository.ts
   │   ├── services/
   │   │   ├── ShippingRateCalculator.ts
   │   │   ├── WarehouseSelector.ts
   │   │   └── FulfillmentRouter.ts
   │   └── events/
   │       └── FulfillmentEvents.ts
   └── infrastructure/
       ├── PostgresFulfillmentRepository.ts
       └── carriers/
           ├── ShippoAdapter.ts
           ├── EasyPostAdapter.ts
           └── FedExAdapter.ts
   ```

2. **Move existing useCases under application layer**

3. **Create Fulfillment routing service**:
   ```
   modules/distribution/domain/services/FulfillmentRouter.ts
   - selectWarehouse(order, availableWarehouses): Warehouse
   - calculateOptimalRoute(orderItems, warehouses): FulfillmentPlan
   - splitFulfillment(order): Fulfillment[] (for multi-warehouse)
   ```

#### 7.3 Support Module DDD Migration

```
Priority: LOW
Effort: Medium
```

**Changes Required:**

1. **Create DDD structure**:
   ```
   modules/support/
   ├── application/
   │   └── useCases/
   │       ├── CreateTicket.ts
   │       ├── UpdateTicket.ts
   │       ├── AssignTicket.ts
   │       ├── ResolveTicket.ts
   │       ├── AddTicketComment.ts
   │       ├── EscalateTicket.ts
   │       ├── GetCustomerTickets.ts
   │       ├── SearchFAQ.ts
   │       └── CreateAlert.ts
   ├── domain/
   │   ├── entities/
   │   │   ├── Ticket.ts
   │   │   ├── TicketComment.ts
   │   │   ├── FAQ.ts
   │   │   └── Alert.ts
   │   ├── repositories/
   │   │   └── TicketRepository.ts
   │   └── valueObjects/
   │       └── TicketStatus.ts
   └── infrastructure/
       └── PostgresTicketRepository.ts
   ```

2. **Create Ticket aggregate**:
   ```
   modules/support/domain/entities/Ticket.ts
   - ticketId
   - customerId
   - orderId (optional)
   - subject
   - description
   - type: 'question' | 'issue' | 'complaint' | 'return_request' | 'refund_request'
   - priority: 'low' | 'medium' | 'high' | 'urgent'
   - status: 'open' | 'pending' | 'in_progress' | 'resolved' | 'closed'
   - assignedTo
   - comments: TicketComment[]
   - tags[]
   - slaDeadline
   - resolvedAt
   ```

---

## 8. Multi-Tenant Architecture Requirements

### 8.1 Multi-Store Setup (Single Business, Multiple Storefronts)

```
Priority: HIGH
Effort: Large
```

**Use Case:** A retail brand with physical stores + online store + mobile app, sharing inventory.

#### Required Changes:

1. **Store Hierarchy Entity**:
   ```typescript
   // modules/store/domain/entities/StoreHierarchy.ts
   interface StoreHierarchy {
     businessId: string;
     stores: Store[];
     defaultStoreId: string;
     
     // Shared resources
     sharedInventoryPoolId?: string;  // All stores draw from same pool
     sharedCatalogId?: string;        // Same products across stores
     
     // Per-store overrides
     storeSettings: Map<string, StoreSettings>;
   }
   
   interface StoreSettings {
     storeId: string;
     
     // Inventory behavior
     inventoryMode: 'shared' | 'dedicated' | 'hybrid';
     inventoryLocationId?: string;    // For dedicated inventory
     
     // Pricing overrides
     priceListId?: string;
     taxProfileId?: string;
     
     // Fulfillment
     canFulfillOnline: boolean;       // Ship from this store
     canPickupInStore: boolean;       // BOPIS enabled
     localDeliveryEnabled: boolean;   // Local delivery zone
     localDeliveryRadius?: number;    // In kilometers
     
     // Operating hours for pickup/fulfillment
     operatingHours: Record<string, { open: string; close: string }>;
   }
   ```

2. **Inventory Pool Sharing**:
   ```
   modules/inventory/domain/entities/InventoryPool.ts
   - poolId
   - ownerType: 'business' | 'merchant'
   - ownerId
   - poolType: 'shared' | 'virtual' | 'aggregated'
   - linkedInventoryIds: string[]
   - allocationStrategy: 'fifo' | 'nearest' | 'even_split'
   - reservationPolicy: 'immediate' | 'deferred'
   ```

3. **Store-specific Order Routing**:
   ```
   modules/order/domain/services/OrderRouter.ts
   - routeOrderToStore(order): Store
   - determinePickupStore(order, customerLocation): Store
   - determineFulfillmentStore(order): Store
   ```

4. **Use Cases Required**:
   - `modules/store/application/useCases/CreateStoreHierarchy.ts`
   - `modules/store/application/useCases/ShareInventoryPool.ts`
   - `modules/store/application/useCases/ConfigureStorePickup.ts`
   - `modules/store/application/useCases/SetLocalDeliveryZone.ts`
   - `modules/inventory/application/useCases/AllocateFromPool.ts`
   - `modules/inventory/application/useCases/TransferBetweenStores.ts`

---

### 8.2 Marketplace Setup (Multiple Independent Merchants)

```
Priority: HIGH
Effort: Extra Large
```

**Use Case:** Platform hosting multiple sellers, each managing their own products, inventory, and fulfillment.

#### Required Changes:

1. **Merchant Isolation Layer**:
   ```typescript
   // modules/merchant/domain/entities/MerchantContext.ts
   interface MerchantContext {
     merchantId: string;
     
     // Merchant's own resources
     storeId: string;           // Merchant's storefront
     catalogId: string;         // Merchant's product catalog
     inventoryId: string;       // Merchant's inventory
     warehouseIds: string[];    // Merchant's fulfillment locations
     
     // Platform relationship
     platformId: string;
     onboardedAt: Date;
     status: 'pending' | 'active' | 'suspended' | 'terminated';
     
     // Commission & Fees
     commissionProfile: CommissionProfile;
     payoutSchedule: PayoutSchedule;
     
     // Fulfillment options
     fulfillmentType: 'merchant_fulfilled' | 'platform_fulfilled' | 'hybrid';
     dropshipEnabled: boolean;
   }
   
   interface CommissionProfile {
     baseCommissionRate: number;      // Percentage
     categoryRates?: Map<string, number>;  // Category-specific rates
     volumeDiscounts?: VolumeDiscount[];
     fixedFeePerOrder?: number;
     paymentProcessingFee?: number;
   }
   ```

2. **Order Split for Multi-Merchant Orders**:
   ```typescript
   // modules/order/domain/services/MarketplaceOrderSplitter.ts
   interface SplitOrder {
     parentOrderId: string;
     merchantOrders: MerchantOrder[];
   }
   
   interface MerchantOrder {
     subOrderId: string;
     merchantId: string;
     items: OrderItem[];
     subtotal: Money;
     merchantPayout: Money;
     platformCommission: Money;
     fulfillmentSource: 'merchant' | 'platform';
   }
   ```

3. **Merchant Settlement System**:
   ```
   modules/merchant/domain/entities/Settlement.ts
   - settlementId
   - merchantId
   - periodStart / periodEnd
   - grossSales
   - commissions
   - fees
   - refunds
   - chargebacks
   - netPayout
   - status: 'pending' | 'processing' | 'paid' | 'failed'
   - payoutMethod
   - payoutReference
   ```

4. **Marketplace-specific Use Cases**:
   ```
   modules/merchant/application/useCases/
   ├── OnboardMerchant.ts
   ├── ApproveMerchant.ts
   ├── SuspendMerchant.ts
   ├── SetCommissionProfile.ts
   ├── CalculateSettlement.ts
   ├── ProcessPayout.ts
   ├── GetMerchantAnalytics.ts
   └── TransferInventoryToPlatform.ts
   
   modules/order/application/useCases/
   ├── SplitMarketplaceOrder.ts
   ├── RouteToMerchant.ts
   └── ReconcileMerchantOrder.ts
   ```

5. **Product Ownership & Visibility**:
   ```typescript
   // Extend Product entity
   interface MarketplaceProductProps {
     productId: string;
     merchantId: string;                // Owner
     platformVisible: boolean;          // Show on main marketplace
     merchantStoreVisible: boolean;     // Show on merchant's store
     approvalStatus: 'pending' | 'approved' | 'rejected';
     approvedBy?: string;
     approvedAt?: Date;
     platformCategories: string[];      // Platform's categorization
     merchantCategories: string[];      // Merchant's categorization
   }
   ```

---

### 8.3 B2B Setup (Suppliers, Approval Workflows, Custom Pricing)

```
Priority: HIGH
Effort: Extra Large
```

**Use Case:** Business selling to other businesses with purchase orders, approval chains, credit limits, and negotiated pricing.

#### Required Changes:

1. **Supplier Integration Module** (Enhance existing `modules/supplier/`):
   ```
   modules/supplier/
   ├── application/
   │   └── useCases/
   │       ├── CreateSupplier.ts
   │       ├── ApproveSupplier.ts
   │       ├── CreatePurchaseOrder.ts
   │       ├── ReceiveGoods.ts
   │       ├── ProcessSupplierInvoice.ts
   │       ├── ManageSupplierProducts.ts
   │       ├── NegotiateTerms.ts
   │       └── SetupDropship.ts
   ├── domain/
   │   ├── entities/
   │   │   ├── Supplier.ts (existing - enhance)
   │   │   ├── PurchaseOrder.ts
   │   │   ├── ReceivingRecord.ts
   │   │   ├── SupplierContract.ts
   │   │   └── SupplierProduct.ts
   │   ├── services/
   │   │   ├── PurchaseOrderGenerator.ts   # Auto-generate POs from low stock
   │   │   ├── SupplierMatcher.ts          # Find best supplier for product
   │   │   └── CostCalculator.ts           # Calculate landed costs
   │   └── events/
   │       └── SupplierEvents.ts
   └── infrastructure/
       └── PostgresSupplierRepository.ts
   ```

2. **B2B Approval Workflow Engine**:
   ```typescript
   // modules/b2b/domain/entities/ApprovalWorkflow.ts
   interface ApprovalWorkflow {
     workflowId: string;
     companyId: string;
     name: string;
     triggerType: 'order' | 'quote' | 'purchase_order' | 'credit_request';
     
     // Conditions for triggering
     conditions: ApprovalCondition[];
     
     // Approval chain
     steps: ApprovalStep[];
     
     // Escalation
     escalationTimeout: number;  // Hours
     escalationAction: 'notify_manager' | 'auto_approve' | 'auto_reject';
   }
   
   interface ApprovalCondition {
     field: 'total_amount' | 'item_count' | 'category' | 'product' | 'custom';
     operator: 'gt' | 'lt' | 'eq' | 'contains';
     value: any;
   }
   
   interface ApprovalStep {
     stepOrder: number;
     approverType: 'user' | 'role' | 'department' | 'manager';
     approverId?: string;
     approverRole?: string;
     requiredApprovals: number;  // How many need to approve
     canSkip: boolean;
     skipConditions?: ApprovalCondition[];
   }
   ```

3. **B2B Pricing Engine**:
   ```typescript
   // modules/pricing/domain/entities/B2BPriceList.ts
   interface B2BPriceList {
     priceListId: string;
     name: string;
     
     // Scope
     companyIds?: string[];        // Specific companies
     companyTiers?: string[];      // Company tiers (gold, platinum)
     
     // Pricing rules
     baseDiscountPercent?: number;
     categoryDiscounts?: Map<string, number>;
     productPrices?: Map<string, Money>;  // Fixed prices per product
     volumeTiers?: VolumeTier[];
     
     // Contract terms
     contractId?: string;
     validFrom: Date;
     validTo: Date;
     
     // Negotiated terms
     paymentTermsDays: number;
     minOrderValue?: Money;
     freeShippingThreshold?: Money;
   }
   
   interface VolumeTier {
     minQuantity: number;
     maxQuantity?: number;
     discountPercent?: number;
     fixedPrice?: Money;
   }
   ```

4. **Purchase Order Workflow**:
   ```
   modules/b2b/domain/entities/B2BPurchaseOrder.ts
   - purchaseOrderId
   - companyId
   - buyerId (B2B user who created)
   - poNumber (company's PO number)
   - status: 'draft' | 'pending_approval' | 'approved' | 'submitted' | 'acknowledged' | 'fulfilled' | 'invoiced' | 'paid'
   - items: B2BOrderItem[]
   - shippingAddress
   - billingAddress
   - paymentTerms
   - requestedDeliveryDate
   - actualDeliveryDate
   - approvalHistory: ApprovalRecord[]
   - invoices: Invoice[]
   ```

5. **B2B-specific Use Cases**:
   ```
   modules/b2b/application/useCases/
   ├── workflow/
   │   ├── CreateApprovalWorkflow.ts
   │   ├── SubmitForApproval.ts
   │   ├── ApproveRequest.ts
   │   ├── RejectRequest.ts
   │   ├── EscalateRequest.ts
   │   └── GetPendingApprovals.ts
   ├── ordering/
   │   ├── CreatePurchaseOrder.ts
   │   ├── SubmitPurchaseOrder.ts
   │   ├── AcknowledgePurchaseOrder.ts
   │   ├── RequestQuote.ts
   │   ├── ConvertQuoteToOrder.ts
   │   └── ReorderFromHistory.ts
   ├── pricing/
   │   ├── GetCompanyPricing.ts
   │   ├── NegotiatePrice.ts
   │   ├── CreatePriceAgreement.ts
   │   └── CalculateVolumeDiscount.ts
   └── credit/
       ├── RequestCreditIncrease.ts
       ├── CheckCreditAvailability.ts
       ├── ProcessCreditPayment.ts
       └── GenerateStatement.ts
   ```

6. **Dropship & Supplier Fulfillment**:
   ```typescript
   // modules/fulfillment/domain/services/SupplierFulfillmentRouter.ts
   interface SupplierFulfillmentRouter {
     // Determine if order should be dropshipped
     shouldDropship(order: Order): boolean;
     
     // Find best supplier for dropship
     selectDropshipSupplier(productId: string, destination: Address): Supplier;
     
     // Create supplier order
     createSupplierOrder(order: Order, supplier: Supplier): SupplierOrder;
     
     // Track supplier shipment
     trackSupplierShipment(supplierOrderId: string): TrackingInfo;
   }
   ```

---

### 8.4 Unified Entity Context Pattern

To support all three models, entities need context awareness:

```typescript
// libs/domain/EntityContext.ts
interface EntityContext {
  // Platform-level
  platformId?: string;
  
  // Business model
  businessModel: 'multistore' | 'marketplace' | 'b2b' | 'hybrid';
  
  // Ownership chain
  businessId?: string;     // For multi-store
  merchantId?: string;     // For marketplace
  companyId?: string;      // For B2B
  
  // Store context
  storeId?: string;
  channelId?: string;
  
  // User context
  userId?: string;
  userType: 'customer' | 'merchant_staff' | 'b2b_buyer' | 'admin';
  
  // Access control
  permissions: string[];
}
```

**Apply to Key Entities:**

| Entity | Multi-Store | Marketplace | B2B |
|--------|-------------|-------------|-----|
| **Order** | `storeId`, `businessId` | `merchantId`, split to sub-orders | `companyId`, `purchaseOrderNumber`, `approverId` |
| **Product** | `storeIds[]` for visibility | `merchantId` owner | `supplierId[]`, `b2bPriceListId` |
| **Inventory** | `poolId` for sharing | `merchantId` isolation | `supplierId` for dropship |
| **Customer** | Unified across stores | Per-merchant optional | `companyId`, `buyerId`, credit |
| **Fulfillment** | `sourceStoreId` | `merchantId` | `supplierId` for dropship |

---

## 9. Cross-Cutting Concerns

### 9.1 Event-Driven Integration

```
Priority: HIGH
Effort: Large
```

**Required Domain Events:**

1. **Store Events**:
   - `StoreCreated`, `StoreUpdated`, `StoreDeactivated`
   - `InventoryLinked`, `InventoryUnlinked`

2. **Inventory Events**:
   - `StockUpdated`, `LowStockAlert`, `OutOfStock`
   - `StockReserved`, `ReservationReleased`
   - `StockTransferred`

3. **Promotion Events**:
   - `CouponCreated`, `CouponRedeemed`, `CouponExpired`
   - `DiscountApplied`, `PromotionActivated`
   - `PointsEarned`, `PointsRedeemed`, `TierUpgrade`

4. **Order Events**:
   - `OrderCreated`, `OrderConfirmed`, `OrderCancelled`
   - `PaymentReceived`, `PaymentFailed`
   - `FulfillmentStarted`, `OrderShipped`, `OrderDelivered`

5. **Customer Events**:
   - `CustomerRegistered`, `CustomerVerified`
   - `SegmentMembershipChanged`

### 8.2 Authentication Middleware Updates

**Required Changes:**

1. **Multi-tenant auth support**:
   - Store-scoped tokens for merchant staff
   - Company-scoped tokens for B2B users
   - Customer tokens with segment claims

2. **Permission system**:
   ```
   libs/auth/
   ├── permissions/
   │   ├── storePermissions.ts
   │   ├── merchantPermissions.ts
   │   ├── b2bPermissions.ts
   │   └── adminPermissions.ts
   └── middleware/
       ├── requireStoreAccess.ts
       ├── requireMerchantRole.ts
       └── requireB2BRole.ts
   ```

---

## 10. Missing Use-Cases by Module (Comprehensive Audit)

### Legend
- ✅ Exists
- ❌ Missing (needs implementation)
- ⚠️ Partial (needs enhancement)

### 10.1 Store Module (`modules/store/`)

| Use Case | Status | Priority |
|----------|--------|----------|
| `CreateStore` | ✅ Exists | - |
| `UpdateStore` | ❌ Missing | HIGH |
| `GetStore` | ❌ Missing | HIGH |
| `ListStores` | ❌ Missing | HIGH |
| `DeleteStore` | ❌ Missing | MEDIUM |
| `ActivateStore` | ❌ Missing | MEDIUM |
| `DeactivateStore` | ❌ Missing | MEDIUM |
| `SetStoreSettings` | ❌ Missing | HIGH |
| `LinkInventory` | ❌ Missing | HIGH |
| `ConfigurePickup` | ❌ Missing | MEDIUM |
| `SetLocalDeliveryZone` | ❌ Missing | LOW |

### 10.2 Inventory Module (`modules/inventory/`)

| Use Case | Status | Priority |
|----------|--------|----------|
| `ManageStock` | ✅ Exists | - |
| `CreateInventoryItem` | ❌ Missing | HIGH |
| `UpdateInventoryItem` | ❌ Missing | HIGH |
| `GetInventoryItem` | ❌ Missing | HIGH |
| `ListInventoryItems` | ❌ Missing | HIGH |
| `ReserveStock` | ❌ Missing | HIGH |
| `ReleaseReservation` | ❌ Missing | HIGH |
| `AdjustStock` | ❌ Missing | HIGH |
| `TransferStock` | ❌ Missing | HIGH |
| `CreateInventoryPool` | ❌ Missing | MEDIUM |
| `AllocateFromPool` | ❌ Missing | MEDIUM |
| `GetLowStockItems` | ❌ Missing | MEDIUM |
| `GetOutOfStockItems` | ❌ Missing | MEDIUM |
| `CreatePreOrder` | ❌ Missing | LOW |
| `FulfillPreOrder` | ❌ Missing | LOW |

### 10.3 Warehouse Module (`modules/warehouse/`)

| Use Case | Status | Priority |
|----------|--------|----------|
| `CreateWarehouse` | ❌ Missing (in distribution) | HIGH |
| `UpdateWarehouse` | ❌ Missing (in distribution) | HIGH |
| `DeleteWarehouse` | ❌ Missing (in distribution) | MEDIUM |
| `GetWarehouse` | ❌ Missing | HIGH |
| `ListWarehouses` | ❌ Missing | HIGH |
| `ActivateWarehouse` | ❌ Missing | MEDIUM |
| `DeactivateWarehouse` | ❌ Missing | MEDIUM |
| `SetDefaultWarehouse` | ❌ Missing | MEDIUM |
| `AssignToStore` | ❌ Missing | HIGH |
| `ConfigureCapacity` | ❌ Missing | LOW |

### 10.4 Merchant Module (`modules/merchant/`)

| Use Case | Status | Priority |
|----------|--------|----------|
| `CreateMerchant` | ❌ Missing | HIGH |
| `UpdateMerchant` | ❌ Missing | HIGH |
| `GetMerchant` | ❌ Missing | HIGH |
| `ListMerchants` | ❌ Missing | HIGH |
| `ApproveMerchant` | ❌ Missing | HIGH |
| `SuspendMerchant` | ❌ Missing | HIGH |
| `OnboardMerchant` | ❌ Missing | HIGH |
| `SetCommissionProfile` | ❌ Missing | HIGH |
| `CalculateSettlement` | ❌ Missing | HIGH |
| `ProcessPayout` | ❌ Missing | HIGH |
| `GetMerchantAnalytics` | ❌ Missing | MEDIUM |

### 10.5 Supplier Module (`modules/supplier/`)

| Use Case | Status | Priority |
|----------|--------|----------|
| `CreateSupplier` | ❌ Missing | HIGH |
| `UpdateSupplier` | ❌ Missing | HIGH |
| `GetSupplier` | ❌ Missing | HIGH |
| `ListSuppliers` | ❌ Missing | HIGH |
| `ApproveSupplier` | ❌ Missing | HIGH |
| `CreatePurchaseOrder` | ❌ Missing | HIGH |
| `SubmitPurchaseOrder` | ❌ Missing | HIGH |
| `ApprovePurchaseOrder` | ❌ Missing | HIGH |
| `ReceiveGoods` | ❌ Missing | HIGH |
| `ProcessSupplierInvoice` | ❌ Missing | MEDIUM |
| `ConfigureDropship` | ❌ Missing | MEDIUM |
| `GetSupplierProducts` | ❌ Missing | MEDIUM |

### 10.6 Pricing Module (`modules/pricing/`)

| Use Case | Status | Priority |
|----------|--------|----------|
| `CreatePriceList` | ❌ Missing | HIGH |
| `UpdatePriceList` | ❌ Missing | HIGH |
| `GetPriceList` | ❌ Missing | HIGH |
| `ListPriceLists` | ❌ Missing | HIGH |
| `SetProductPrice` | ❌ Missing | HIGH |
| `GetProductPrice` | ❌ Missing | HIGH |
| `CalculatePrice` | ❌ Missing | HIGH |
| `ApplyPricingRule` | ❌ Missing | MEDIUM |
| `CreateB2BPriceList` | ❌ Missing | MEDIUM |
| `GetCompanyPricing` | ❌ Missing | MEDIUM |
| `SetVolumeDiscount` | ❌ Missing | MEDIUM |

### 10.7 Loyalty Module (`modules/loyalty/`)

| Use Case | Status | Priority |
|----------|--------|----------|
| `CreateLoyaltyProgram` | ❌ Missing | HIGH |
| `EarnPoints` | ❌ Missing | HIGH |
| `RedeemPoints` | ❌ Missing | HIGH |
| `CheckPointsBalance` | ❌ Missing | HIGH |
| `GetPointsHistory` | ❌ Missing | MEDIUM |
| `CalculateTierStatus` | ❌ Missing | MEDIUM |
| `CreateReward` | ❌ Missing | MEDIUM |
| `RedeemReward` | ❌ Missing | MEDIUM |
| `ProcessPointsExpiration` | ❌ Missing | LOW |

### 10.8 Membership Module (`modules/membership/`)

| Use Case | Status | Priority |
|----------|--------|----------|
| `CreateMembershipTier` | ❌ Missing | HIGH |
| `UpdateMembershipTier` | ❌ Missing | HIGH |
| `AssignMembership` | ❌ Missing | HIGH |
| `UpgradeMembership` | ❌ Missing | HIGH |
| `DowngradeMembership` | ❌ Missing | HIGH |
| `CancelMembership` | ❌ Missing | MEDIUM |
| `RenewMembership` | ❌ Missing | MEDIUM |
| `GetMembershipBenefits` | ❌ Missing | MEDIUM |

### 10.9 Shipping Module (`modules/shipping/`)

| Use Case | Status | Priority |
|----------|--------|----------|
| `CalculateRates` | ⚠️ In distribution | HIGH |
| `GetAvailableMethods` | ⚠️ In distribution | HIGH |
| `CreateShippingMethod` | ❌ Missing | HIGH |
| `UpdateShippingMethod` | ❌ Missing | HIGH |
| `CreateShippingZone` | ❌ Missing | HIGH |
| `CreateShippingLabel` | ❌ Missing | MEDIUM |
| `ValidateAddress` | ❌ Missing | MEDIUM |
| `GetDeliveryEstimate` | ❌ Missing | MEDIUM |
| `TrackShipment` | ❌ Missing | MEDIUM |

### 10.10 Tax Module (`modules/tax/`)

| Use Case | Status | Priority |
|----------|--------|----------|
| `CalculateTax` | ⚠️ Partial | HIGH |
| `CreateTaxRate` | ❌ Missing | HIGH |
| `UpdateTaxRate` | ❌ Missing | HIGH |
| `GetTaxRateForAddress` | ⚠️ Partial | HIGH |
| `CreateTaxZone` | ❌ Missing | MEDIUM |
| `SetTaxExemption` | ❌ Missing | MEDIUM |
| `ValidateTaxId` | ❌ Missing | LOW |

### 10.11 Payment Module (`modules/payment/`)

| Use Case | Status | Priority |
|----------|--------|----------|
| `InitiatePayment` | ✅ Exists | - |
| `ProcessRefund` | ✅ Exists | - |
| `GetTransactions` | ✅ Exists | - |
| `CapturePayment` | ❌ Missing | HIGH |
| `VoidPayment` | ❌ Missing | HIGH |
| `ProcessWebhook` | ❌ Missing | HIGH |
| `RetryPayment` | ❌ Missing | MEDIUM |
| `GetPaymentMethods` | ❌ Missing | HIGH |
| `SavePaymentMethod` | ❌ Missing | HIGH |
| `DeletePaymentMethod` | ❌ Missing | MEDIUM |
| `SetDefaultPaymentMethod` | ❌ Missing | MEDIUM |

### 10.12 Notification Module (`modules/notification/`)

| Use Case | Status | Priority |
|----------|--------|----------|
| `SendNotification` | ❌ Missing | HIGH |
| `SendEmail` | ❌ Missing | HIGH |
| `SendSMS` | ❌ Missing | MEDIUM |
| `SendPushNotification` | ❌ Missing | MEDIUM |
| `GetNotifications` | ❌ Missing | HIGH |
| `MarkAsRead` | ❌ Missing | HIGH |
| `CreateNotificationTemplate` | ❌ Missing | MEDIUM |
| `SetNotificationPreferences` | ❌ Missing | MEDIUM |

### 10.13 Localization Module (`modules/localization/`)

| Use Case | Status | Priority |
|----------|--------|----------|
| `CreateLocale` | ❌ Missing | HIGH |
| `UpdateLocale` | ❌ Missing | MEDIUM |
| `CreateCountry` | ❌ Missing | HIGH |
| `UpdateCountry` | ❌ Missing | MEDIUM |
| `CreateCurrency` | ❌ Missing | HIGH |
| `SetExchangeRate` | ❌ Missing | HIGH |
| `ConvertCurrency` | ❌ Missing | HIGH |
| `TranslateContent` | ❌ Missing | MEDIUM |

---

## 11. Event System - Missing Events and Setup

### 11.1 Events Already Defined in `libs/events/eventBus.ts`

The following event types are defined but many lack emission points:

```typescript
// Defined in EventType union - verify emission exists
Order Events (12): ✅ Most emit from use-cases
Basket Events (10): ✅ Emit from use-cases  
Checkout Events (8): ✅ Emit from use-cases
Identity Events (24): ✅ Emit from emitIdentityEvent.ts
Content Events (24): ✅ Emit from use-cases
Product Events (13): ⚠️ Some missing emission
Customer Events (3): ⚠️ Partial
Inventory Events (4): ⚠️ Partial
Payment Events (4): ⚠️ Partial
```

### 11.2 Missing Events to Add to EventType

```typescript
// Add to libs/events/eventBus.ts

// Store Events (NEW)
| 'store.created'
| 'store.updated'
| 'store.activated'
| 'store.deactivated'
| 'store.deleted'
| 'store.inventory_linked'
| 'store.inventory_unlinked'
| 'store.settings_updated'
| 'store.pickup_configured'

// Warehouse Events (NEW)
| 'warehouse.created'
| 'warehouse.updated'
| 'warehouse.activated'
| 'warehouse.deactivated'
| 'warehouse.deleted'
| 'warehouse.assigned_to_store'
| 'warehouse.capacity_updated'

// Merchant Events (NEW)
| 'merchant.created'
| 'merchant.updated'
| 'merchant.approved'
| 'merchant.suspended'
| 'merchant.terminated'
| 'merchant.onboarded'
| 'merchant.settlement_created'
| 'merchant.payout_processed'

// Pricing Events (NEW)
| 'pricing.price_list_created'
| 'pricing.price_list_updated'
| 'pricing.price_changed'
| 'pricing.volume_discount_applied'

// Loyalty Events (NEW)
| 'loyalty.points_earned'
| 'loyalty.points_redeemed'
| 'loyalty.points_expired'
| 'loyalty.tier_upgraded'
| 'loyalty.tier_downgraded'
| 'loyalty.reward_redeemed'

// Membership Events (NEW)
| 'membership.assigned'
| 'membership.upgraded'
| 'membership.downgraded'
| 'membership.cancelled'
| 'membership.renewed'

// Shipping Events (NEW)
| 'shipping.method_created'
| 'shipping.zone_created'
| 'shipping.rate_calculated'
| 'shipping.label_created'

// Fulfillment Events (NEW)
| 'fulfillment.created'
| 'fulfillment.assigned'
| 'fulfillment.picking_started'
| 'fulfillment.packing_completed'
| 'fulfillment.shipped'
| 'fulfillment.delivered'
| 'fulfillment.failed'
| 'fulfillment.returned'

// Channel Events (NEW)
| 'channel.created'
| 'channel.updated'
| 'channel.activated'
| 'channel.deactivated'
| 'channel.products_assigned'
| 'channel.warehouse_assigned'

// Tax Events (NEW)
| 'tax.rate_created'
| 'tax.rate_updated'
| 'tax.exemption_applied'
```

### 11.3 Event Handler Registration at App Boot

Create a centralized event registration module:

```typescript
// libs/events/registerEventHandlers.ts

import { eventBus } from './eventBus';

// Import all module event handlers
import { registerOrderEventHandlers } from '../../modules/notification/eventHandlers';
import { registerInventoryEventHandlers } from '../../modules/inventory/eventHandlers';
import { registerFulfillmentEventHandlers } from '../../modules/fulfillment/eventHandlers';
import { registerLoyaltyEventHandlers } from '../../modules/loyalty/eventHandlers';
import { registerAnalyticsEventHandlers } from '../../modules/analytics/eventHandlers';

/**
 * Register all event handlers on application boot
 * Called from app initialization
 */
export function registerAllEventHandlers(): void {
  console.log('[EVENTS] Registering event handlers...');

  // Order-related handlers (notifications, fulfillment trigger)
  registerOrderEventHandlers();

  // Inventory handlers (stock alerts, reorder triggers)
  registerInventoryEventHandlers();

  // Fulfillment handlers (shipping integration, tracking updates)
  registerFulfillmentEventHandlers();

  // Loyalty handlers (points calculation, tier updates)
  registerLoyaltyEventHandlers();

  // Analytics handlers (tracking, reporting)
  registerAnalyticsEventHandlers();

  console.log('[EVENTS] Event handlers registered');
  console.log(`[EVENTS] Total registered event types: ${eventBus.getRegisteredTypes().length}`);
}

/**
 * Unregister all handlers (for testing/shutdown)
 */
export function unregisterAllEventHandlers(): void {
  // Implementation for cleanup
}
```

### 11.4 Event Handlers to Create per Module

| Module | Handler File | Events to Handle |
|--------|--------------|------------------|
| `inventory` | `eventHandlers.ts` | `order.created` → reserve stock, `order.cancelled` → release stock |
| `fulfillment` | `eventHandlers.ts` | `order.paid` → create fulfillment, `order.cancelled` → cancel fulfillment |
| `loyalty` | `eventHandlers.ts` | `order.completed` → earn points, `customer.registered` → welcome bonus |
| `analytics` | `eventHandlers.ts` | All events → track for reporting |
| `merchant` | `eventHandlers.ts` | `order.completed` → update settlement |
| `pricing` | `eventHandlers.ts` | `product.created` → assign default price |
| `store` | `eventHandlers.ts` | `inventory.low` → store-specific alerts |

### 11.5 App Boot Integration

```typescript
// In app.ts or server.ts

import { registerAllEventHandlers } from './libs/events/registerEventHandlers';

async function bootstrap() {
  // ... other initialization

  // Register event handlers
  registerAllEventHandlers();

  // Start server
  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
}

bootstrap();
```

---

## Implementation Priority Matrix

| Domain | Priority | Effort | Dependencies | Business Model |
|--------|----------|--------|--------------|----------------|
| **Distribution Module Breakdown** | CRITICAL | X-Large | All | All |
| Channel Module (from distribution) | CRITICAL | Large | None | All |
| Fulfillment Module (from distribution) | CRITICAL | Large | Shipping | All |
| Store-Inventory Integration | HIGH | Large | Inventory, Warehouse | Multi-Store |
| Merchant Context & Settlement | HIGH | Large | Identity, Payment | Marketplace |
| B2B Approval Workflows | HIGH | Large | Identity, B2B | B2B |
| Supplier Integration Enhancement | HIGH | Large | Inventory | B2B |
| Merchant Authentication | HIGH | Medium | Identity | Marketplace |
| B2B Authentication | HIGH | Large | Identity | B2B |
| Inventory Pool Sharing | HIGH | Medium | Inventory | Multi-Store |
| Order Splitting (Multi-merchant) | HIGH | Medium | Order | Marketplace |
| B2B Pricing Engine | HIGH | Large | Pricing | B2B |
| Coupon Enhancements | HIGH | Medium | Promotion | All |
| Discount System Refactoring | HIGH | Large | Promotion, Coupon | All |
| Payment Module Enhancement | HIGH | Medium | Checkout, Order | All |
| Warehouse DDD Migration | HIGH | Medium | Inventory | All |
| Store Hierarchy & Pickup | MEDIUM | Medium | Store | Multi-Store |
| Dropship Fulfillment | MEDIUM | Medium | Fulfillment, Supplier | B2B |
| Loyalty Program Enhancement | MEDIUM | Large | Customer, Promotion | All |
| Customer Segmentation | MEDIUM | Large | Customer | All |
| Media Module Completion | MEDIUM | Medium | Content | All |
| Brand Module | MEDIUM | Medium | Media | All |
| Support DDD Migration | LOW | Medium | Customer, Order | All |
| Configuration Enhancement | LOW | Medium | None | All |

---

## Recommended Implementation Order

### Phase 0: Distribution Module Decomposition (Weeks 1-2)
1. Create `modules/channel/` from distribution channel code
2. Create `modules/fulfillment/` from fulfillment code
3. Enhance `modules/shipping/` with extracted shipping code
4. Move pickup to `modules/store/` 
5. Move pre-order to `modules/inventory/`
6. Remove duplicate warehouse code (consolidate to `modules/warehouse/`)
7. Delete `modules/distribution/` after migration complete

### Phase 1: Multi-Store Foundation (Weeks 3-5)
8. Store-Inventory Integration
9. Inventory Pool Sharing
10. Store Hierarchy Entity
11. Store Pickup (BOPIS) implementation
12. Local Delivery Zones

### Phase 2: Marketplace Foundation (Weeks 6-9)
13. Merchant Context & Isolation
14. Merchant Authentication
15. Order Splitting for Multi-Merchant
16. Merchant Settlement System
17. Commission Profile Management
18. Product Ownership & Approval

### Phase 3: B2B Foundation (Weeks 10-14)
19. B2B Authentication & User Roles
20. B2B Approval Workflow Engine
21. B2B Pricing Engine
22. Supplier Integration Enhancement
23. Purchase Order Workflow
24. Dropship Fulfillment
25. Credit Management

### Phase 4: Commerce Engine (Weeks 15-18)
26. Coupon Enhancements
27. Discount System Refactoring
28. Payment Module Enhancement
29. Loyalty Program Enhancement

### Phase 5: Experience & Polish (Weeks 19-22)
30. Customer Segmentation
31. Media Module Completion
32. Brand Module
33. Support DDD Migration
34. Configuration Enhancement

---

## Database Schema Changes Required

### New Tables

#### Channel Module
- `channel` - Distribution channels
- `channel_product` - Products assigned to channels
- `channel_warehouse` - Warehouses per channel

#### Fulfillment Module
- `fulfillment` - Order fulfillments
- `fulfillment_item` - Items per fulfillment
- `fulfillment_partner` - 3PL partners
- `fulfillment_rule` - Routing rules

#### Multi-Store
- `store_hierarchy` - Business store relationships
- `store_settings` - Per-store configuration
- `store_pickup_location` - Pickup points
- `store_delivery_zone` - Local delivery areas

#### Inventory
- `inventory_pool` - Shared inventory pools
- `inventory_pool_location` - Pool to location mapping
- `inventory_allocation` - Stock allocation records

#### Marketplace
- `merchant_context` - Merchant isolation context
- `merchant_settlement` - Settlement periods
- `merchant_settlement_line` - Settlement line items
- `merchant_payout` - Payout records
- `commission_profile` - Commission rules
- `marketplace_product` - Product ownership/approval

#### B2B
- `b2b_approval_workflow` - Approval workflow definitions
- `b2b_approval_step` - Workflow steps
- `b2b_approval_request` - Pending approvals
- `b2b_approval_action` - Approval history
- `b2b_price_list` - B2B pricing
- `b2b_price_list_item` - Per-product prices
- `b2b_volume_tier` - Volume discounts
- `b2b_purchase_order` - Purchase orders
- `b2b_purchase_order_item` - PO line items
- `supplier_contract` - Supplier agreements
- `supplier_dropship` - Dropship configuration

### Modified Tables

| Table | Changes |
|-------|---------|
| `order` | Add `storeId`, `merchantId`, `companyId`, `purchaseOrderNumber`, `parentOrderId` (for split orders) |
| `product` | Add `merchantId`, `approvalStatus`, `platformVisible`, `b2bPriceListId` |
| `inventory_item` | Add `poolId`, `merchantId`, `supplierId` |
| `customer` | Add `companyId`, `b2bUserId`, `creditLimit`, `availableCredit` |
| `fulfillment` | Add `sourceType`, `sourceId`, `merchantId`, `supplierId`, `storeId` |

---

## API Changes Summary

### New Endpoints - Channel Module
- `GET /api/channels` - List channels
- `POST /api/channels` - Create channel
- `GET /api/channels/:id` - Get channel
- `PUT /api/channels/:id` - Update channel
- `POST /api/channels/:id/products` - Assign products
- `POST /api/channels/:id/warehouses` - Assign warehouses

### New Endpoints - Fulfillment Module
- `POST /api/fulfillments` - Create fulfillment
- `GET /api/fulfillments/:id` - Get fulfillment
- `PUT /api/fulfillments/:id/status` - Update status
- `POST /api/fulfillments/:id/ship` - Mark shipped
- `GET /api/fulfillments/:id/tracking` - Get tracking
- `POST /api/fulfillments/route` - Route order to source

### New Endpoints - Multi-Store
- `POST /api/stores/:storeId/inventory` - Link inventory
- `GET /api/stores/:storeId/inventory/availability` - Check stock
- `POST /api/stores/:storeId/pickup-locations` - Create pickup point
- `GET /api/stores/:storeId/pickup-slots` - Get available slots
- `POST /api/inventory/pools` - Create inventory pool
- `POST /api/inventory/pools/:id/allocate` - Allocate from pool
- `POST /api/inventory/transfer` - Transfer between locations

### New Endpoints - Marketplace
- `POST /api/merchants/onboard` - Onboard new merchant
- `PUT /api/merchants/:id/approve` - Approve merchant
- `GET /api/merchants/:id/settlements` - Get settlements
- `POST /api/merchants/:id/payouts` - Process payout
- `GET /api/merchants/:id/analytics` - Merchant analytics
- `POST /api/orders/:id/split` - Split multi-merchant order

### New Endpoints - B2B
- `POST /api/b2b/auth/login` - B2B login
- `POST /api/b2b/users/invite` - Invite B2B user
- `GET /api/b2b/companies/:id/pricing` - Get company pricing
- `POST /api/b2b/purchase-orders` - Create PO
- `PUT /api/b2b/purchase-orders/:id/submit` - Submit PO
- `GET /api/b2b/approvals/pending` - Pending approvals
- `POST /api/b2b/approvals/:id/approve` - Approve request
- `POST /api/b2b/approvals/:id/reject` - Reject request
- `GET /api/b2b/companies/:id/credit` - Check credit
- `POST /api/b2b/companies/:id/credit/request` - Request credit increase
- `POST /api/suppliers/:id/dropship` - Configure dropship

### New Endpoints - Common
- `GET /api/segments` - List segments
- `POST /api/segments/:id/evaluate` - Evaluate segment
- `POST /api/loyalty/points/earn` - Earn points
- `POST /api/loyalty/rewards/redeem` - Redeem reward

### Updated Endpoints
- All order endpoints to include business model context
- All product endpoints to support ownership/visibility
- All promotion endpoints to support new discount logic
- Payment endpoints for saved payment methods
- Fulfillment endpoints for multi-source routing

---

## Module Dependency Graph

```
                    ┌─────────────┐
                    │   identity  │
                    └──────┬──────┘
           ┌───────────────┼───────────────┐
           ▼               ▼               ▼
    ┌──────────┐    ┌──────────┐    ┌──────────┐
    │ customer │    │ merchant │    │   b2b    │
    └────┬─────┘    └────┬─────┘    └────┬─────┘
         │               │               │
         ▼               ▼               ▼
    ┌─────────────────────────────────────────┐
    │                  store                   │
    └─────────────────────┬───────────────────┘
                          │
         ┌────────────────┼────────────────┐
         ▼                ▼                ▼
    ┌─────────┐     ┌──────────┐    ┌──────────┐
    │ channel │     │ inventory│    │ warehouse│
    └────┬────┘     └────┬─────┘    └────┬─────┘
         │               │               │
         └───────────────┼───────────────┘
                         ▼
    ┌─────────────────────────────────────────┐
    │                 product                  │
    └─────────────────────┬───────────────────┘
                          │
    ┌─────────────────────┼─────────────────────┐
    │                     │                     │
    ▼                     ▼                     ▼
┌────────┐          ┌──────────┐         ┌──────────┐
│ basket │          │ promotion│         │ supplier │
└───┬────┘          └────┬─────┘         └────┬─────┘
    │                    │                    │
    ▼                    │                    │
┌──────────┐             │                    │
│ checkout │◄────────────┘                    │
└────┬─────┘                                  │
     │                                        │
     ▼                                        │
┌──────────┐                                  │
│  order   │◄─────────────────────────────────┘
└────┬─────┘
     │
     ├──────────────────┐
     ▼                  ▼
┌──────────┐      ┌───────────┐
│ payment  │      │fulfillment│
└──────────┘      └─────┬─────┘
                        │
                        ▼
                  ┌──────────┐
                  │ shipping │
                  └──────────┘
```

---

## 12. Code Refactoring Guidelines

### 12.1 Code Readability Standards

The codebase should follow these principles for human readability:

**Naming Conventions:**
- Use descriptive, self-documenting names
- Variables: `camelCase` (e.g., `orderTotal`, `customerId`)
- Classes/Types: `PascalCase` (e.g., `OrderService`, `CustomerEntity`)
- Constants: `UPPER_SNAKE_CASE` (e.g., `MAX_RETRIES`, `DEFAULT_PAGE_SIZE`)
- Files: `camelCase.ts` for modules, `PascalCase.ts` for entities/classes
- Database columns: `camelCase` (as per platform convention)

**Function Structure:**
```typescript
// Good: Clear, single-purpose functions
async function calculateOrderTotal(items: OrderItem[]): Promise<Money> {
  // Implementation
}

// Avoid: Ambiguous names or multiple responsibilities
async function process(data: any): Promise<any> {
  // Does too many things
}
```

**Code Organization:**
- One class/entity per file
- Group related imports
- Use barrel exports (`index.ts`) for cleaner imports
- Maximum function length: ~50 lines
- Maximum file length: ~500 lines

### 12.2 Refactoring Priorities

| Priority | Area | Current Issue | Target State |
|----------|------|---------------|--------------|
| HIGH | Controller Logic | Business logic in controllers | Move to use-cases |
| HIGH | Repository Naming | Inconsistent table/column naming | Standardized camelCase |
| HIGH | Error Handling | Inconsistent error responses | Unified error classes |
| MEDIUM | Magic Strings | Hardcoded values | Constants/enums |
| MEDIUM | Type Safety | `any` types used | Proper TypeScript types |
| MEDIUM | Code Duplication | Similar logic repeated | Shared utilities |
| LOW | Comments | Missing documentation | JSDoc comments |
| LOW | Test Coverage | Low coverage modules | 80%+ coverage target |

### 12.3 Modules Requiring Refactoring

| Module | Issues | Effort |
|--------|--------|--------|
| `pricing/` | No application layer, controller-heavy | Large |
| `loyalty/` | No application layer, legacy patterns | Large |
| `membership/` | No application layer | Large |
| `warehouse/` | Duplicated with distribution | Medium |
| `shipping/` | Mixed with distribution | Medium |
| `supplier/` | No use-cases, controller-only | Large |
| `notification/` | No use-cases | Medium |
| `localization/` | No use-cases | Medium |

---

## 13. Database Cleanup - Orphaned Tables Analysis

### 13.1 Tables Without Repos or Usage

The following tables have migrations but **no repository or usage** in the codebase:

| Table | Migration | Status | Recommendation |
|-------|-----------|--------|----------------|
| `customerContact` | ✅ | ❌ No repo/usage | Keep - needs implementation |
| `customerActivity` | ✅ | ❌ No repo/usage | Keep - needs implementation |
| `customerPreference` | ✅ | ❌ No repo/usage | Keep - needs implementation |
| `merchantContact` | ✅ | ❌ No repo/usage | Keep - needs implementation |
| `merchantVerificationDocument` | ✅ | ❌ No repo/usage | Keep - needs implementation |
| `notificationEventLog` | ✅ | ❌ No repo/usage | Keep - needs implementation |
| `notificationWebhook` | ✅ | ❌ No repo/usage | Keep - needs implementation |
| `productQa` | ✅ | ❌ No repo/usage | Keep - Q&A feature |
| `productQaAnswer` | ✅ | ❌ No repo/usage | Keep - Q&A feature |
| `productQaVote` | ✅ | ❌ No repo/usage | Keep - Q&A feature |
| `paymentWebhook` | ✅ | ❌ No repo/usage | Keep - needs implementation |
| `paymentBalance` | ✅ | ❌ No repo/usage | Keep - needs implementation |
| `paymentPlan` | ✅ | ❌ No repo/usage | Keep - needs implementation |
| `paymentSettings` | ✅ | ❌ No repo/usage | Keep - needs implementation |
| `vatOssReport` | ✅ | ❌ No repo/usage | Keep - EU VAT compliance |
| `vatOssReportLine` | ✅ | ❌ No repo/usage | Keep - EU VAT compliance |
| `membershipStatusLog` | ✅ | ❌ No repo/usage | Keep - audit trail |
| `membershipDiscountCode` | ✅ | ❌ No repo/usage | Keep - needs implementation |
| `membershipDiscountCodeUsage` | ✅ | ❌ No repo/usage | Keep - needs implementation |
| `membershipGroup` | ✅ | ❌ No repo/usage | Keep - group feature |
| `membershipGroupMember` | ✅ | ❌ No repo/usage | Keep - group feature |

### 13.2 Potentially Redundant Tables

| Table | Issue | Recommendation |
|-------|-------|----------------|
| `distributionWarehouse` | Duplicates `modules/warehouse/` | Migrate & remove |
| `distributionWarehouseZone` | Part of warehouse module | Move to warehouse |
| `distributionWarehouseBin` | Part of warehouse module | Move to warehouse |
| `distributionShippingCarrier` | Duplicates shipping module | Consolidate |
| `distributionShippingZone` | Duplicates shipping module | Consolidate |
| `distributionShippingMethod` | Duplicates shipping module | Consolidate |
| `distributionShippingRate` | Duplicates shipping module | Consolidate |

### 13.3 Tables Needing Repos

These tables exist and may have some usage but lack dedicated repository files:

| Table | Current Usage | Action Needed |
|-------|---------------|---------------|
| `customerConsent` | Used in GDPR module | Create customerConsentRepo.ts |
| `session` | Express session | No action (managed by express-session) |
| `productType` | Referenced in product | Create productTypeRepo.ts |
| `productAttributeSet` | Referenced | Create attributeSetRepo.ts |
| `productAttributeSetMapping` | Referenced | Add to attributeSetRepo.ts |
| `productListItem` | Referenced | Create productListRepo.ts |
| `promotionCouponBatch` | Referenced | Add to couponRepo.ts |
| `promotionCouponRestriction` | Referenced | Add to couponRepo.ts |
| `referral` | Marketing module | Create referralRepo.ts |
| `referralReward` | Marketing module | Create referralRepo.ts |
| `dunningAttempt` | Subscription module | Create dunningRepo.ts |

### 13.4 Cleanup Action Plan

**Phase 1: Remove Duplicates (Week 1)**
1. Consolidate `distributionWarehouse*` → `modules/warehouse/`
2. Consolidate `distributionShipping*` → `modules/shipping/`
3. Update all references to use new locations
4. Remove old migrations (create cleanup migration)

**Phase 2: Create Missing Repos (Weeks 2-3)**
1. Create repos for tables listed in 13.3
2. Add to appropriate modules
3. Wire up to controllers/use-cases

**Phase 3: Implement Orphaned Tables (Weeks 4-6)**
1. Implement repos for tables in 13.1
2. Create corresponding use-cases
3. Add controller endpoints
4. Add tests

### 13.5 Cleanup Migration Template

```javascript
// migrations/YYYYMMDD_cleanupOrphanedTables.js

exports.up = async function(knex) {
  // Only drop tables that are confirmed unused after full audit
  // DO NOT run without thorough testing
  
  // Example: Remove confirmed orphans (be very careful!)
  // await knex.schema.dropTableIfExists('tableToRemove');
  
  // Rename consolidated tables
  // await knex.schema.renameTable('oldName', 'newName');
};

exports.down = async function(knex) {
  // Recreate tables if needed for rollback
};
```

---

## Summary Statistics

| Category | Count |
|----------|-------|
| **Total Missing Use-Cases** | ~150+ across 13 modules |
| **Modules with no Use-Cases** | 8 (pricing, loyalty, membership, warehouse, supplier, localization, notification, shipping) |
| **Missing Events to Define** | ~50 new event types |
| **Event Handlers to Create** | 7 new handler files |
| **New Modules to Create** | 3 (channel, fulfillment, brand) |
| **Modules to Migrate to DDD** | 10+ legacy controller-based modules |
| **Tables without Repos/Usage** | 21 orphaned tables |
| **Redundant Tables to Consolidate** | 7 distribution-related duplicates |
| **Tables Needing Repos** | 11 tables with usage but no dedicated repo |
| **Total Migration Files** | 346 migrations |

---

*Document generated: December 23, 2024*
*Version: 4.0*
*Updates:*
- *v1.0: Initial analysis*
- *v2.0: Added Distribution Module Breakdown, Multi-Store, Marketplace, and B2B requirements*
- *v3.0: Added Single-Store setup, comprehensive missing use-cases audit, event system documentation, camelCase DB schema note*
- *v4.0: Added code refactoring guidelines, orphaned tables analysis, database cleanup recommendations*
