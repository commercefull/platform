# CommerceFull Data Model Alignment Analysis

**Last Updated: December 23, 2024**

> **Status**: This document outlines database schema enhancements for multi-store, marketplace, and B2B scenarios.
> The recommended changes are **additive** and do not break existing functionality.
> Implementation should use migrations with default values for backward compatibility.

This document provides an in-depth comparison between the CommerceFull platform's current data model and the reference commerce data model that supports multi-store, marketplace, and B2B scenarios.

## Executive Summary

The CommerceFull platform has a solid foundation but requires several enhancements to fully support:
- **Multi-Store**: Regional brands with shared inventory
- **Marketplace**: Multi-seller platform with commission management
- **B2B**: Account-based pricing, approval workflows, credit terms

### Key Gaps Identified

| Area | Current State | Required State | Priority |
|------|---------------|----------------|----------|
| **Organization/Store Hierarchy** | Flat store model | Hierarchical org → store → channel | HIGH |
| **Channel Management** | Basic | Multi-channel with store mapping | HIGH |
| **Assortment Management** | None | Scoped assortments (store/seller/account) | HIGH |
| **Price List Scoping** | Basic | Multi-scope with priority resolution | HIGH |
| **Seller/Marketplace** | Partial | Full seller lifecycle + payouts | MEDIUM |
| **Inventory Pooling** | Basic | Location-based with reservations | HIGH |
| **B2B Accounts** | Partial | Full account hierarchy + terms | MEDIUM |
| **Order Splitting** | None | Multi-seller/warehouse splitting | HIGH |

---

## 1. Commerce Context

### 1.1 Organization Entity

**Reference Model:**
```
Organization
├── orgId (PK)
├── name
└── Owns: stores, channels, locations, sellers
```

**CommerceFull Current State:**
- ❌ No explicit `organization` table
- Stores exist independently without parent organization

**Required Changes:**

```sql
-- New table: organization
CREATE TABLE "organization" (
  "organizationId" VARCHAR(50) PRIMARY KEY,
  "name" VARCHAR(255) NOT NULL,
  "slug" VARCHAR(100) UNIQUE NOT NULL,
  "type" VARCHAR(50) DEFAULT 'single', -- 'single', 'multi_store', 'marketplace', 'b2b'
  "settings" JSONB DEFAULT '{}',
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "deletedAt" TIMESTAMP
);

-- Modify store table to add organizationId
ALTER TABLE "store" ADD COLUMN "organizationId" VARCHAR(50) REFERENCES "organization"("organizationId");
```

### 1.2 Store Entity

**Reference Model:**
```
Store
├── storeId (PK)
├── orgId (FK)
├── code, name
├── defaultCurrency, defaultLanguage
├── taxZoneId
└── priceRoundingRules
```

**CommerceFull Current State:**
- ✅ `store` table exists
- ⚠️ Missing `organizationId` foreign key
- ⚠️ Missing `taxZoneId` reference
- ⚠️ Missing `priceRoundingRules`

**Required Changes:**

```sql
-- Modify existing store table
ALTER TABLE "store" ADD COLUMN "organizationId" VARCHAR(50);
ALTER TABLE "store" ADD COLUMN "taxZoneId" VARCHAR(50);
ALTER TABLE "store" ADD COLUMN "priceRoundingRules" JSONB DEFAULT '{}';
ALTER TABLE "store" ADD COLUMN "defaultCurrency" VARCHAR(3) DEFAULT 'USD';
ALTER TABLE "store" ADD COLUMN "defaultLanguage" VARCHAR(10) DEFAULT 'en';
```

### 1.3 Channel Entity

**Reference Model:**
```
Channel
├── channelId (PK)
├── orgId (FK)
├── type (web, app, pos, api, marketplace_feed)
├── name, region
└── domain/appId
```

**CommerceFull Current State:**
- ✅ `channel` table exists in modules/channel
- ⚠️ Missing `orgId` reference
- ⚠️ Limited channel types

**Required Changes:**

```sql
-- Modify channel table
ALTER TABLE "channel" ADD COLUMN "organizationId" VARCHAR(50);
ALTER TABLE "channel" ADD COLUMN "region" VARCHAR(50);
ALTER TABLE "channel" ADD COLUMN "domain" VARCHAR(255);
ALTER TABLE "channel" ADD COLUMN "appId" VARCHAR(100);

-- Ensure type enum includes all values
-- type: 'web' | 'mobile' | 'pos' | 'api' | 'marketplace_feed' | 'social'
```

### 1.4 StoreChannel (Many-to-Many)

**Reference Model:**
```
StoreChannel
├── storeId (FK)
├── channelId (FK)
├── status
└── launchDate
```

**CommerceFull Current State:**
- ❌ No `storeChannel` junction table

**Required Changes:**

```sql
CREATE TABLE "storeChannel" (
  "storeChannelId" VARCHAR(50) PRIMARY KEY,
  "storeId" VARCHAR(50) NOT NULL REFERENCES "store"("storeId"),
  "channelId" VARCHAR(50) NOT NULL REFERENCES "channel"("channelId"),
  "status" VARCHAR(20) DEFAULT 'active', -- 'active', 'inactive', 'pending'
  "launchDate" TIMESTAMP,
  "settings" JSONB DEFAULT '{}',
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE("storeId", "channelId")
);
```

---

## 2. Products and Merchandising

### 2.1 Product Entity

**Reference Model:**
```
Product
├── productId (PK)
├── orgId (FK)
├── productType, brand, status
├── title, description
└── attributes (JSON)
```

**CommerceFull Current State:**
- ✅ `product` table exists with most fields
- ⚠️ Missing `organizationId` for multi-tenant
- ⚠️ `attributes` stored differently

**Required Changes:**

```sql
ALTER TABLE "product" ADD COLUMN "organizationId" VARCHAR(50);
ALTER TABLE "product" ADD COLUMN "approvalStatus" VARCHAR(20) DEFAULT 'approved';
ALTER TABLE "product" ADD COLUMN "platformVisible" BOOLEAN DEFAULT true;
```

### 2.2 Variant (SKU) Entity

**Reference Model:**
```
Variant (SKU)
├── skuId (PK)
├── productId (FK)
├── skuCode, barcode
├── attributes (JSON)
└── weight, dimensions
```

**CommerceFull Current State:**
- ✅ `productVariant` table exists
- ✅ Has `sku`, `barcode`, `weight`
- ⚠️ Dimensions stored in separate fields vs JSON

**Status:** ✅ Mostly aligned, minor enhancements needed

---

## 3. Assortment Management (CRITICAL GAP)

### 3.1 Assortment Entity

**Reference Model:**
```
Assortment
├── assortmentId (PK)
├── orgId (FK)
├── name
└── scopeType (store, seller, account, channel)
```

**CommerceFull Current State:**
- ❌ No `assortment` table
- Products are globally visible

**Required Changes:**

```sql
CREATE TABLE "assortment" (
  "assortmentId" VARCHAR(50) PRIMARY KEY,
  "organizationId" VARCHAR(50) NOT NULL,
  "name" VARCHAR(255) NOT NULL,
  "description" TEXT,
  "scopeType" VARCHAR(20) NOT NULL, -- 'store', 'seller', 'account', 'channel'
  "isDefault" BOOLEAN DEFAULT false,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "deletedAt" TIMESTAMP
);

CREATE TABLE "assortmentScope" (
  "assortmentScopeId" VARCHAR(50) PRIMARY KEY,
  "assortmentId" VARCHAR(50) NOT NULL REFERENCES "assortment"("assortmentId"),
  "storeId" VARCHAR(50) REFERENCES "store"("storeId"),
  "sellerId" VARCHAR(50) REFERENCES "seller"("sellerId"),
  "accountId" VARCHAR(50) REFERENCES "b2bCompany"("companyId"),
  "channelId" VARCHAR(50) REFERENCES "channel"("channelId"),
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "assortmentItem" (
  "assortmentItemId" VARCHAR(50) PRIMARY KEY,
  "assortmentId" VARCHAR(50) NOT NULL REFERENCES "assortment"("assortmentId"),
  "productVariantId" VARCHAR(50) NOT NULL REFERENCES "productVariant"("productVariantId"),
  "visibility" VARCHAR(20) DEFAULT 'listed', -- 'listed', 'hidden'
  "buyable" BOOLEAN DEFAULT true,
  "minQty" INTEGER DEFAULT 1,
  "maxQty" INTEGER,
  "incrementQty" INTEGER DEFAULT 1,
  "leadTimeDays" INTEGER,
  "discontinueDate" DATE,
  "sortOrder" INTEGER DEFAULT 0,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE("assortmentId", "productVariantId")
);
```

---

## 4. Pricing System

### 4.1 Price List Entity

**Reference Model:**
```
PriceList
├── priceListId (PK)
├── orgId (FK)
├── name, currency
├── validFrom, validTo
└── type (retail, wholesale, contract, promo)
```

**CommerceFull Current State:**
- ✅ `priceList` table exists
- ⚠️ Missing `organizationId`
- ⚠️ Limited scope support

**Required Changes:**

```sql
ALTER TABLE "priceList" ADD COLUMN "organizationId" VARCHAR(50);
ALTER TABLE "priceList" ADD COLUMN "type" VARCHAR(20) DEFAULT 'retail';

CREATE TABLE "priceListScope" (
  "priceListScopeId" VARCHAR(50) PRIMARY KEY,
  "priceListId" VARCHAR(50) NOT NULL REFERENCES "priceList"("priceListId"),
  "storeId" VARCHAR(50) REFERENCES "store"("storeId"),
  "channelId" VARCHAR(50) REFERENCES "channel"("channelId"),
  "accountId" VARCHAR(50) REFERENCES "b2bCompany"("companyId"),
  "sellerId" VARCHAR(50) REFERENCES "seller"("sellerId"),
  "customerSegmentId" VARCHAR(50) REFERENCES "segment"("segmentId"),
  "priority" INTEGER DEFAULT 0, -- Higher = more specific
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 4.2 Price Entity

**Reference Model:**
```
Price
├── priceListId (FK)
├── skuId (FK)
├── amount, compareAtAmount
├── minQty (tier pricing)
└── taxIncluded
```

**CommerceFull Current State:**
- ✅ Price-related tables exist
- ⚠️ Tier pricing (minQty) support is limited

**Status:** ⚠️ Enhancement needed for tier pricing

---

## 5. Sellers (Marketplace)

### 5.1 Seller Entity

**Reference Model:**
```
Seller
├── sellerId (PK)
├── orgId (FK)
├── type (internal, external)
├── name, status
└── commissionPlanId
```

**CommerceFull Current State:**
- ⚠️ `merchant` table exists but different structure
- ⚠️ Commission plans partially implemented

**Required Changes:**

```sql
-- Rename/align merchant to seller concept
ALTER TABLE "merchant" ADD COLUMN "type" VARCHAR(20) DEFAULT 'external';
ALTER TABLE "merchant" ADD COLUMN "commissionPlanId" VARCHAR(50);

CREATE TABLE "commissionPlan" (
  "commissionPlanId" VARCHAR(50) PRIMARY KEY,
  "organizationId" VARCHAR(50) NOT NULL,
  "name" VARCHAR(255) NOT NULL,
  "rules" JSONB NOT NULL, -- { categoryRules: [...], fixedFees: [...] }
  "isDefault" BOOLEAN DEFAULT false,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "sellerPolicy" (
  "sellerPolicyId" VARCHAR(50) PRIMARY KEY,
  "sellerId" VARCHAR(50) NOT NULL REFERENCES "merchant"("merchantId"),
  "returnsPolicy" TEXT,
  "shippingPolicy" TEXT,
  "slaDays" INTEGER DEFAULT 3,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 6. Inventory and Fulfillment

### 6.1 Location Entity

**Reference Model:**
```
Location
├── locationId (PK)
├── orgId (FK)
├── type (warehouse, store, dropship_vendor, 3pl, dark_store)
├── name
└── addressId, timezone
```

**CommerceFull Current State:**
- ✅ `warehouse` table exists
- ✅ `inventoryLocation` exists
- ⚠️ Missing unified location concept with types

**Required Changes:**

```sql
-- Create unified location table
CREATE TABLE "fulfillmentLocation" (
  "locationId" VARCHAR(50) PRIMARY KEY,
  "organizationId" VARCHAR(50) NOT NULL,
  "type" VARCHAR(30) NOT NULL, -- 'warehouse', 'store', 'dropship_vendor', '3pl', 'dark_store'
  "name" VARCHAR(255) NOT NULL,
  "code" VARCHAR(50) UNIQUE,
  "addressId" VARCHAR(50),
  "timezone" VARCHAR(50) DEFAULT 'UTC',
  "sellerId" VARCHAR(50), -- For dropship vendors
  "isActive" BOOLEAN DEFAULT true,
  "capabilities" JSONB DEFAULT '{}', -- { canShip: true, canPickup: true, canLocalDeliver: true }
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 6.2 Inventory Balance

**Reference Model:**
```
InventoryBalance
├── locationId (FK)
├── skuId (FK)
├── onHandQty
├── safetyStockQty
└── inboundQty
```

**CommerceFull Current State:**
- ✅ `inventoryLevel` table exists
- ⚠️ Missing `safetyStockQty` and `inboundQty`

**Required Changes:**

```sql
ALTER TABLE "inventoryLevel" ADD COLUMN "safetyStockQty" INTEGER DEFAULT 0;
ALTER TABLE "inventoryLevel" ADD COLUMN "inboundQty" INTEGER DEFAULT 0;
ALTER TABLE "inventoryLevel" ADD COLUMN "locationId" VARCHAR(50);
```

### 6.3 Inventory Reservation

**Reference Model:**
```
InventoryReservation
├── reservationId (PK)
├── orderId (FK)
├── skuId (FK)
├── locationId (FK)
├── qty, status
└── expiresAt
```

**CommerceFull Current State:**
- ⚠️ Reservation tracking is implicit in `reservedQuantity` field
- ❌ No dedicated reservation table

**Required Changes:**

```sql
CREATE TABLE "inventoryReservation" (
  "reservationId" VARCHAR(50) PRIMARY KEY,
  "orderId" VARCHAR(50) NOT NULL,
  "productVariantId" VARCHAR(50) NOT NULL,
  "locationId" VARCHAR(50) NOT NULL,
  "quantity" INTEGER NOT NULL,
  "status" VARCHAR(20) DEFAULT 'reserved', -- 'reserved', 'released', 'consumed'
  "expiresAt" TIMESTAMP,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 6.4 Fulfillment Network Rules

**Reference Model:**
```
FulfillmentNetworkRule
├── ruleId (PK)
├── storeId (FK)
├── channelId (FK)
├── priority
└── rule (JSON)
```

**CommerceFull Current State:**
- ❌ No fulfillment routing rules table

**Required Changes:**

```sql
CREATE TABLE "fulfillmentNetworkRule" (
  "ruleId" VARCHAR(50) PRIMARY KEY,
  "organizationId" VARCHAR(50) NOT NULL,
  "storeId" VARCHAR(50) REFERENCES "store"("storeId"),
  "channelId" VARCHAR(50) REFERENCES "channel"("channelId"),
  "name" VARCHAR(255) NOT NULL,
  "priority" INTEGER DEFAULT 0,
  "ruleType" VARCHAR(30) NOT NULL, -- 'location_preference', 'ship_from_store', 'bopis', 'seller_only'
  "conditions" JSONB DEFAULT '{}',
  "actions" JSONB DEFAULT '{}',
  "isActive" BOOLEAN DEFAULT true,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 7. Customers and B2B

### 7.1 Account (B2B Company)

**Reference Model:**
```
Account
├── accountId (PK)
├── orgId (FK)
├── name, status
├── paymentTermsId
└── creditLimit
```

**CommerceFull Current State:**
- ✅ `b2bCompany` table exists
- ⚠️ Missing some fields

**Required Changes:**

```sql
ALTER TABLE "b2bCompany" ADD COLUMN "organizationId" VARCHAR(50);
ALTER TABLE "b2bCompany" ADD COLUMN "paymentTermsId" VARCHAR(50);
ALTER TABLE "b2bCompany" ADD COLUMN "creditLimit" DECIMAL(15,2);
ALTER TABLE "b2bCompany" ADD COLUMN "availableCredit" DECIMAL(15,2);
```

### 7.2 Account User

**Reference Model:**
```
AccountUser
├── accountId (FK)
├── customerId (FK)
└── role (buyer, approver, admin)
```

**CommerceFull Current State:**
- ✅ `b2bUser` table exists
- ✅ Role field exists

**Status:** ✅ Aligned

### 7.3 Payment Terms

**Reference Model:**
```
PaymentTerms
├── paymentTermsId (PK)
├── name (Net 30, Net 60)
└── days
```

**CommerceFull Current State:**
- ❌ No dedicated payment terms table

**Required Changes:**

```sql
CREATE TABLE "paymentTerms" (
  "paymentTermsId" VARCHAR(50) PRIMARY KEY,
  "organizationId" VARCHAR(50) NOT NULL,
  "name" VARCHAR(100) NOT NULL, -- 'Net 30', 'Net 60', 'Due on Receipt'
  "code" VARCHAR(20) UNIQUE NOT NULL,
  "days" INTEGER NOT NULL,
  "discountPercentage" DECIMAL(5,2), -- Early payment discount
  "discountDays" INTEGER, -- Days for discount eligibility
  "isDefault" BOOLEAN DEFAULT false,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 7.4 Tax Exemption

**Reference Model:**
```
TaxExemption
├── taxExemptionId (PK)
├── accountId (FK)
├── certificateRef
└── validTo
```

**CommerceFull Current State:**
- ⚠️ Partial support in tax module

**Required Changes:**

```sql
CREATE TABLE "taxExemption" (
  "taxExemptionId" VARCHAR(50) PRIMARY KEY,
  "accountId" VARCHAR(50) NOT NULL REFERENCES "b2bCompany"("companyId"),
  "type" VARCHAR(30) NOT NULL, -- 'resale', 'nonprofit', 'government', 'manufacturing'
  "certificateRef" VARCHAR(100),
  "certificateDocument" VARCHAR(255), -- URL to uploaded certificate
  "jurisdiction" VARCHAR(50), -- State/country where valid
  "validFrom" DATE NOT NULL,
  "validTo" DATE,
  "status" VARCHAR(20) DEFAULT 'active', -- 'active', 'expired', 'revoked'
  "verifiedAt" TIMESTAMP,
  "verifiedBy" VARCHAR(50),
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 8. Cart and Order

### 8.1 Cart Entity

**Reference Model:**
```
Cart
├── cartId (PK)
├── storeId, channelId
├── customerId (nullable)
├── accountId (nullable)
└── currency, status
```

**CommerceFull Current State:**
- ✅ `basket` table exists (different naming)
- ⚠️ Missing `storeId`, `channelId`, `accountId`

**Required Changes:**

```sql
ALTER TABLE "basket" ADD COLUMN "storeId" VARCHAR(50);
ALTER TABLE "basket" ADD COLUMN "channelId" VARCHAR(50);
ALTER TABLE "basket" ADD COLUMN "accountId" VARCHAR(50); -- B2B
```

### 8.2 Cart Item with Seller

**Reference Model:**
```
CartItem
├── cartId (FK)
├── skuId (FK)
├── qty
├── sellerId (nullable) -- Marketplace
├── unitPrice, discounts, tax
```

**CommerceFull Current State:**
- ✅ `basketItem` exists
- ❌ Missing `sellerId` for marketplace

**Required Changes:**

```sql
ALTER TABLE "basketItem" ADD COLUMN "sellerId" VARCHAR(50);
```

### 8.3 Order Entity

**Reference Model:**
```
Order
├── orderId (PK)
├── storeId, channelId
├── customerId, accountId (nullable)
├── currency, totals, status
└── billingAddressId, shippingAddressId
```

**CommerceFull Current State:**
- ✅ `order` table exists
- ⚠️ Missing some marketplace/B2B fields

**Required Changes:**

```sql
ALTER TABLE "order" ADD COLUMN "storeId" VARCHAR(50);
ALTER TABLE "order" ADD COLUMN "channelId" VARCHAR(50);
ALTER TABLE "order" ADD COLUMN "accountId" VARCHAR(50); -- B2B company
ALTER TABLE "order" ADD COLUMN "merchantId" VARCHAR(50); -- Primary merchant (marketplace)
ALTER TABLE "order" ADD COLUMN "purchaseOrderNumber" VARCHAR(100); -- B2B PO reference
ALTER TABLE "order" ADD COLUMN "parentOrderId" VARCHAR(50); -- For split orders
```

### 8.4 Order Line with Seller

**Reference Model:**
```
OrderLine
├── orderLineId (PK)
├── orderId (FK)
├── skuId (FK)
├── qty
├── sellerId (nullable) -- Marketplace
├── unitPrice, discount, tax, lineTotal
```

**CommerceFull Current State:**
- ✅ `orderLine` exists
- ❌ Missing `sellerId`

**Required Changes:**

```sql
ALTER TABLE "orderLine" ADD COLUMN "sellerId" VARCHAR(50);
```

### 8.5 Order Allocation (CRITICAL for Multi-Warehouse)

**Reference Model:**
```
OrderAllocation
├── allocationId (PK)
├── orderLineId (FK)
├── locationId (FK)
└── qty
```

**CommerceFull Current State:**
- ❌ No order allocation table

**Required Changes:**

```sql
CREATE TABLE "orderAllocation" (
  "allocationId" VARCHAR(50) PRIMARY KEY,
  "orderLineId" VARCHAR(50) NOT NULL REFERENCES "orderLine"("orderLineId"),
  "locationId" VARCHAR(50) NOT NULL,
  "sellerId" VARCHAR(50), -- For marketplace
  "quantity" INTEGER NOT NULL,
  "status" VARCHAR(20) DEFAULT 'allocated', -- 'allocated', 'picked', 'shipped'
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 8.6 Payout (Marketplace)

**Reference Model:**
```
Payout
├── payoutId (PK)
├── sellerId (FK)
├── orderId (FK)
├── gross, commission, net
└── status
```

**CommerceFull Current State:**
- ⚠️ `merchantSettlement` exists but different structure

**Required Changes:**

```sql
CREATE TABLE "payout" (
  "payoutId" VARCHAR(50) PRIMARY KEY,
  "sellerId" VARCHAR(50) NOT NULL REFERENCES "merchant"("merchantId"),
  "orderId" VARCHAR(50) REFERENCES "order"("orderId"),
  "settlementId" VARCHAR(50) REFERENCES "merchantSettlement"("settlementId"),
  "grossAmount" DECIMAL(15,2) NOT NULL,
  "commissionAmount" DECIMAL(15,2) NOT NULL,
  "feeAmount" DECIMAL(15,2) DEFAULT 0,
  "netAmount" DECIMAL(15,2) NOT NULL,
  "currency" VARCHAR(3) NOT NULL,
  "status" VARCHAR(20) DEFAULT 'pending', -- 'pending', 'scheduled', 'processing', 'completed', 'failed'
  "scheduledDate" DATE,
  "processedAt" TIMESTAMP,
  "paymentReference" VARCHAR(100),
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 9. Implementation Priority Matrix

### Phase 1: Foundation (Weeks 1-4)
| Task | Priority | Effort |
|------|----------|--------|
| Add `organization` table | HIGH | Small |
| Add org references to store, channel, product | HIGH | Medium |
| Create `storeChannel` junction table | HIGH | Small |
| Add marketplace fields to basket/order | HIGH | Small |

### Phase 2: Assortment & Pricing (Weeks 5-8)
| Task | Priority | Effort |
|------|----------|--------|
| Create `assortment` tables | HIGH | Large |
| Create `priceListScope` table | HIGH | Medium |
| Add tier pricing support | MEDIUM | Medium |
| Create `fulfillmentNetworkRule` table | HIGH | Medium |

### Phase 3: Inventory & Fulfillment (Weeks 9-12)
| Task | Priority | Effort |
|------|----------|--------|
| Create `fulfillmentLocation` unified table | HIGH | Large |
| Create `inventoryReservation` table | HIGH | Medium |
| Create `orderAllocation` table | HIGH | Medium |
| Add inventory balance fields | MEDIUM | Small |

### Phase 4: Marketplace & B2B (Weeks 13-16)
| Task | Priority | Effort |
|------|----------|--------|
| Create `commissionPlan` table | MEDIUM | Medium |
| Create `sellerPolicy` table | MEDIUM | Small |
| Create `payout` table | MEDIUM | Medium |
| Create `paymentTerms` table | MEDIUM | Small |
| Create `taxExemption` table | MEDIUM | Small |

---

## 10. Migration Strategy

### Approach: Additive Changes First

1. **Add new tables without breaking existing functionality**
2. **Add new columns with default values**
3. **Create data migration scripts to populate new fields**
4. **Update application code to use new structures**
5. **Deprecate old patterns over time**

### Backward Compatibility

- All new columns should be nullable or have defaults
- Existing APIs continue to work during migration
- New endpoints for enhanced functionality
- Feature flags to enable new behavior per organization

### Data Migration Example

```sql
-- Migrate existing stores to default organization
INSERT INTO "organization" ("organizationId", "name", "slug", "type")
VALUES ('org_default', 'Default Organization', 'default', 'single');

UPDATE "store" SET "organizationId" = 'org_default' WHERE "organizationId" IS NULL;

-- Create default assortment for each store
INSERT INTO "assortment" ("assortmentId", "organizationId", "name", "scopeType", "isDefault")
SELECT 
  'asmt_' || "storeId",
  "organizationId",
  "name" || ' Default Assortment',
  'store',
  true
FROM "store";
```

---

## 11. Key Join Patterns

After implementing all changes, these will be the primary join patterns:

### What can I sell here?
```sql
SELECT pv.* 
FROM "productVariant" pv
JOIN "assortmentItem" ai ON ai."productVariantId" = pv."productVariantId"
JOIN "assortmentScope" as2 ON as2."assortmentId" = ai."assortmentId"
WHERE as2."storeId" = $1 AND ai."visibility" = 'listed' AND ai."buyable" = true;
```

### What price does this buyer get?
```sql
SELECT p.* 
FROM "price" p
JOIN "priceListScope" pls ON pls."priceListId" = p."priceListId"
WHERE p."productVariantId" = $1
  AND (pls."storeId" = $2 OR pls."storeId" IS NULL)
  AND (pls."channelId" = $3 OR pls."channelId" IS NULL)
  AND (pls."accountId" = $4 OR pls."accountId" IS NULL)
ORDER BY pls."priority" DESC
LIMIT 1;
```

### Where can I fulfill from?
```sql
SELECT fl.* 
FROM "fulfillmentLocation" fl
JOIN "fulfillmentNetworkRule" fnr ON fnr."organizationId" = fl."organizationId"
WHERE fnr."storeId" = $1
  AND (fnr."channelId" = $2 OR fnr."channelId" IS NULL)
  AND fl."isActive" = true
ORDER BY fnr."priority" DESC;
```

### Do I have stock?
```sql
SELECT 
  il."quantity" - COALESCE(SUM(ir."quantity"), 0) - il."safetyStockQty" AS availableToSell
FROM "inventoryLevel" il
LEFT JOIN "inventoryReservation" ir ON ir."productVariantId" = il."productVariantId" 
  AND ir."locationId" = il."locationId" AND ir."status" = 'reserved'
WHERE il."productVariantId" = $1 AND il."locationId" = $2
GROUP BY il."inventoryLevelId";
```

---

## 12. Summary

### Tables to Create
1. `organization` - Multi-tenant root
2. `storeChannel` - Store-channel mapping
3. `assortment` - Catalog scoping
4. `assortmentScope` - Scope bindings
5. `assortmentItem` - SKU visibility/availability
6. `priceListScope` - Price list bindings
7. `fulfillmentLocation` - Unified locations
8. `inventoryReservation` - Stock reservations
9. `fulfillmentNetworkRule` - Routing rules
10. `orderAllocation` - Multi-warehouse allocation
11. `commissionPlan` - Marketplace commissions
12. `sellerPolicy` - Seller policies
13. `payout` - Marketplace payouts
14. `paymentTerms` - B2B terms
15. `taxExemption` - B2B tax certificates

### Tables to Modify
1. `store` - Add organizationId, taxZoneId, priceRoundingRules
2. `channel` - Add organizationId, region, domain
3. `product` - Add organizationId, approvalStatus
4. `priceList` - Add organizationId, type
5. `inventoryLevel` - Add safetyStockQty, inboundQty
6. `basket` - Add storeId, channelId, accountId
7. `basketItem` - Add sellerId
8. `order` - Add storeId, channelId, accountId, merchantId, parentOrderId
9. `orderLine` - Add sellerId
10. `merchant` - Add type, commissionPlanId
11. `b2bCompany` - Add organizationId, paymentTermsId, creditLimit

---

*Document Version: 1.0*
*Last Updated: December 23, 2024*
*Author: CommerceFull Platform Team*
