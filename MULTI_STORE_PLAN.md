# Multi-Store Inventory, Roles & RetailPOS Integration Plan

> **Business Context**: Skincare products business in Lesotho Maseru with 8 physical shops (7 retail outlets + 1 headquarters). 9 users total (7 cashiers + 2 managers). Headquarters dispatches stock to retail outlets and processes large invoices. All POS interactions flow through RetailPOS.

---

## Table of Contents

1. [Current State Analysis](#1-current-state-analysis)
2. [Gap Analysis](#2-gap-analysis)
3. [Phase 1: Database Migrations](#3-phase-1-database-migrations)
4. [Phase 2: modules/identity — Roles & User-Store Binding](#4-phase-2-modulesidentity--roles--user-store-binding)
5. [Phase 3: modules/store — Multi-Store & Hierarchy](#5-phase-3-modulesstore--multi-store--hierarchy)
6. [Phase 4: modules/inventory — Stock Dispatch & Per-Store Tracking](#6-phase-4-modulesinventory--stock-dispatch--per-store-tracking)
7. [Phase 5: modules/channel — POS Channel-Store Mapping](#7-phase-5-moduleschannel--pos-channel-store-mapping)
8. [Phase 6: modules/order — Store-Aware Orders](#8-phase-6-modulesorder--store-aware-orders)
9. [Phase 7: modules/product — Per-Store Stock Visibility](#9-phase-7-modulesproduct--per-store-stock-visibility)
10. [Phase 8: web/admin — Admin UI Changes](#10-phase-8-webadmin--admin-ui-changes)
11. [Phase 9: RetailPOS Integration Changes](#11-phase-9-retailpos-integration-changes)
12. [Phase 10: Seed Data & Testing](#12-phase-10-seed-data--testing)
13. [Implementation Order & Dependencies](#13-implementation-order--dependencies)

---

## 1. Current State Analysis

### 1.1 modules/identity

**Files examined:**
- `modules/identity/domain/entities/User.ts` — User entity with `UserType` = `'customer' | 'merchant' | 'admin'`
- `modules/identity/domain/repositories/UserRepository.ts` — CRUD + auth methods
- `libs/roles.ts` — Simple role enum: `'ADMIN' | 'VIEWER' | 'USER'`
- `libs/auth.ts` — Middleware: `isAdminLoggedIn`, `isMerchantLoggedIn`, `isB2BLoggedIn`, `isCustomerLoggedIn`
- `libs/session/SessionService.ts` — Session stores: `userId`, `userType`, `role`, `merchantId`, `companyId`, `permissions[]`
- `libs/types/express.ts` — `Express.User` interface with `role`, `permissions`, `merchantId`, `companyId`

**Current capabilities:**
- Three user types: customer, merchant, admin
- Session carries `role` (single string) and `permissions` (string array)
- No concept of `storeId` on the user or session
- No granular role system — only `ADMIN | VIEWER | USER`
- No user-to-store binding mechanism

### 1.2 modules/store

**Files examined:**
- `modules/store/domain/entities/Store.ts` — Store entity with `storeType: 'merchant_store' | 'business_store'`
- `modules/store/application/useCases/CreateStoreHierarchy.ts` — Creates hierarchy with `defaultStoreId`, `storeIds[]`, shared settings
- `migrations/20241220000002_createStore.js` — `store` table with address, settings, branding
- `migrations/20241223000026_createStoreHierarchyTable.js` — `storeHierarchy` table with `businessId`, `defaultStoreId`, `sharedInventoryPoolId`

**Current capabilities:**
- Full store entity with address, settings, branding, status
- Store hierarchy concept exists (`storeHierarchy` table) with `allowCrossStoreTransfers` setting
- `storeType` supports `business_store` — suitable for the retail outlets
- No `isHeadquarters` flag on stores
- Store hierarchy links stores under a business but lacks a `parentStoreId` field for HQ→outlet relationship

### 1.3 modules/inventory

**Files examined:**
- `modules/inventory/domain/entities/Inventory.ts` — `InventoryLocation` (type: `'warehouse' | 'store' | 'supplier'`), `InventoryItem` with `locationId`, `InventoryMovement`, `InventoryTransfer` (from/to location)
- `modules/inventory/application/useCases/TransferBetweenStores.ts` — Full transfer use case with validation, reservation, and event emission
- `modules/inventory/domain/repositories/InventoryRepository.ts` — Interface for CRUD, transactions, reservations
- `modules/inventory/infrastructure/repositories/InventoryRepository.ts` — SQL implementation with location-based queries, movement tracking, low-stock alerts

**Current capabilities:**
- Multi-location inventory already exists (per `locationId`)
- `InventoryLocation` supports `type: 'store'` — can map each shop to a location
- `TransferBetweenStores` use case exists — validates, reserves, creates transfer records
- Movement tracking with `type: 'transfer'` and `referenceId` linking to transfer
- Transfer statuses: `pending → in_transit → completed → cancelled`
- Low stock alerts and reorder point tracking per location
- **Gap**: No automatic stock adjustment on the receiving end when transfer completes — the use case creates transfer records but doesn't auto-deduct/add quantities across locations in one atomic operation
- **Gap**: No dispatch note / packing list concept
- **Gap**: No link between `InventoryLocation` and the `store` table

### 1.4 modules/channel

**Files examined:**
- `modules/channel/domain/entities/Channel.ts` — Channel entity with `type: 'pos'`, `storeIds[]`, `warehouseIds[]`, `fulfillmentStrategy`
- Various use cases: CreateChannel, GetChannel, ListChannels, UpdateChannel, AssignProductsToChannel, AssignWarehouseToChannel

**Current capabilities:**
- Channel `type: 'pos'` exists — perfect for RetailPOS instances
- `storeIds` array supports multi-store assignment per channel
- `defaultStoreId` field exists
- `ownerType: 'business'` fits the business model
- **Gap**: No API endpoint for RetailPOS to discover which store a channel is bound to
- **Gap**: No `channelCode` or unique identifier that RetailPOS can use during auth to self-identify

### 1.5 modules/order

**Files examined:**
- `modules/order/domain/entities/Order.ts` — Full order entity with status machine, items, addresses, metadata
- `modules/order/application/useCases/CreateOrder.ts` — Creates order from items, no `storeId` or `channelId` parameter
- `migrations/20240805000490_createOrderTable.js` — `order` table with no `storeId` or `channelId` columns

**Current capabilities:**
- Rich order lifecycle management
- No `storeId` on the order — orders are not linked to any store
- No `channelId` on the order — orders are not linked to any sales channel
- No `createdByUserId` field — cannot track which cashier created the order
- `metadata` field (JSONB) exists — could store store/channel info but not queryable by index

### 1.6 modules/product

**Files examined:**
- `modules/product/domain/entities/ProductVariant.ts` — Variant with `stockQuantity` (single global number), `lowStockThreshold`
- Master variant architecture — every product has a default variant

**Current capabilities:**
- `stockQuantity` on `ProductVariant` is a single global number — not per-store
- The `inventory` module already tracks per-location stock, so variant's `stockQuantity` is effectively a cache/aggregate
- **Gap**: No per-store stock visibility aggregation for the variant entity

### 1.7 web/admin

**Files examined:**
- `web/admin/controllers/inventoryController.ts` — Lists inventory with location filter, adjust stock, history, low-stock report
- `web/admin/views/inventory/` — index, history, locations, low-stock views
- `web/admin/controllers/` — 41 controllers including `channelController.ts`, `operationsController.ts`
- `web/admin/views/operations/` — merchants, suppliers, warehouses, fulfillments, baskets, dashboard — but **no stores views**

**Current capabilities:**
- Inventory management UI exists with location-based filtering
- Stock adjustment with transaction history
- Location listing view
- **Gap**: No store management views in admin panel
- **Gap**: No stock dispatch/transfer UI
- **Gap**: No per-store sales dashboard
- **Gap**: No user-store assignment UI

### 1.8 RetailPOS

**Files examined:**
- `services/clients/commercefull/CommerceFullApiClient.ts` — Singleton API client with token auth
- `services/order/platforms/CommerceFullOrderService.ts` — Creates orders via `POST /customer/order`
- `services/inventory/platforms/CommerceFullInventoryService.ts` — Reads/adjusts inventory via `/business/inventory`
- `services/sync/platforms/CommerceFullSyncService.ts` — Pull + webhook-based sync
- `services/config/POSConfigService.ts` — `storeName`, `storeAddress`, `storePhone` — local config, no `storeId`
- `services/auth/AuthConfigService.ts` — Auth modes: online/offline, methods: pin/platform_auth
- `docs/features/onboarding.md` — Online flow: Platform Selection → Platform Config → Payment → Hardware → POS Config → Auth → Admin → Summary

**Current capabilities:**
- Full CommerceFull integration: products, orders, inventory, customers, categories, discounts, gift cards, refunds, sync, webhooks
- Auth via `apiKey`/`apiSecret` mapped to merchant/business credentials
- No `storeId` or `channelId` sent with order creation
- No concept of "which store is this POS terminal for" beyond local `storeName` string
- Onboarding collects platform URL + credentials but not a store/channel selection step

---

## 2. Gap Analysis

| Requirement | Existing Support | Gap |
|---|---|---|
| 8 stores (7 outlets + 1 HQ) | `store` table + hierarchy exists | Need `isHeadquarters` flag, link `InventoryLocation` to `store` |
| Stock dispatch HQ → outlets | `TransferBetweenStores` use case exists | Need dispatch workflow (create → approve → ship → receive → auto-adjust) |
| Auto stock adjustment on dispatch | Movement tracking exists | Need atomic quantity update on both ends when transfer completes |
| Monitor sales from HQ | Order listing exists | Need `storeId` on orders, per-store filtering/dashboard |
| HQ processes invoices | Order creation exists | HQ is just another store; order gets `storeId` of HQ |
| 7 cashiers restricted to store | No user-store binding | Need `userStore` junction table + role `CASHIER` |
| 2 managers at HQ | Admin role exists | Need role `MANAGER` with cross-store access |
| RetailPOS assigns orders to store | No storeId in order creation | Need `storeId`/`channelId` on order + RetailPOS sends it |
| POS terminal → store binding | Channel `type: 'pos'` exists | Need onboarding step to select store, send `channelId` with requests |

---

## 3. Phase 1: Database Migrations

### 3.1 Migration: `alterStoreAddHeadquartersFlag`

**File**: `migrations/YYYYMMDD000001_alterStoreAddHeadquartersFlag.js`

```js
exports.up = function (knex) {
  return knex.schema.alterTable('store', t => {
    t.boolean('isHeadquarters').notNullable().defaultTo(false);
    t.uuid('parentStoreId').references('storeId').inTable('store').nullable();
    t.index('isHeadquarters');
    t.index('parentStoreId');
  });
};

exports.down = function (knex) {
  return knex.schema.alterTable('store', t => {
    t.dropColumn('isHeadquarters');
    t.dropColumn('parentStoreId');
  });
};
```

**Purpose**: Mark a store as HQ and allow outlets to reference their parent HQ store.

### 3.2 Migration: `createUserStoreTable`

**File**: `migrations/YYYYMMDD000002_createUserStoreTable.js`

```js
exports.up = function (knex) {
  return knex.schema.createTable('userStore', t => {
    t.uuid('userStoreId').primary().defaultTo(knex.raw('uuidv7()'));
    t.uuid('userId').notNullable().references('userId').inTable('user');
    t.uuid('storeId').notNullable().references('storeId').inTable('store');
    t.string('role', 50).notNullable(); // 'cashier', 'manager', 'admin'
    t.boolean('isPrimary').notNullable().defaultTo(false);
    t.boolean('isActive').notNullable().defaultTo(true);
    t.jsonb('permissions').defaultTo('[]');
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());

    t.unique(['userId', 'storeId']);
    t.index('userId');
    t.index('storeId');
    t.index('role');
    t.index('isActive');
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable('userStore');
};
```

**Purpose**: Junction table binding users to stores with specific roles.

### 3.3 Migration: `alterOrderAddStoreAndChannelFields`

**File**: `migrations/YYYYMMDD000003_alterOrderAddStoreAndChannelFields.js`

```js
exports.up = function (knex) {
  return knex.schema.alterTable('order', t => {
    t.uuid('storeId').references('storeId').inTable('store').nullable();
    t.uuid('channelId').references('channelId').inTable('channel').nullable();
    t.uuid('createdByUserId').references('userId').inTable('user').nullable();
    t.string('orderSource', 50).defaultTo('web'); // 'web', 'pos', 'api', 'admin'
    t.index('storeId');
    t.index('channelId');
    t.index('createdByUserId');
    t.index('orderSource');
  });
};

exports.down = function (knex) {
  return knex.schema.alterTable('order', t => {
    t.dropColumn('storeId');
    t.dropColumn('channelId');
    t.dropColumn('createdByUserId');
    t.dropColumn('orderSource');
  });
};
```

**Purpose**: Link orders to their originating store, channel, and user.

### 3.4 Migration: `alterInventoryLocationAddStoreId`

**File**: `migrations/YYYYMMDD000004_alterInventoryLocationAddStoreId.js`

```js
exports.up = function (knex) {
  return knex.schema.alterTable('inventoryLocation', t => {
    t.uuid('storeId').references('storeId').inTable('store').nullable();
    t.index('storeId');
  });
};

exports.down = function (knex) {
  return knex.schema.alterTable('inventoryLocation', t => {
    t.dropColumn('storeId');
  });
};
```

**Purpose**: Link `inventoryLocation` rows to `store` rows so each store has a mapped inventory location.

### 3.5 Migration: `createStoreDispatchTable`

**File**: `migrations/YYYYMMDD000005_createStoreDispatchTable.js`

```js
exports.up = function (knex) {
  return knex.schema.createTable('storeDispatch', t => {
    t.uuid('dispatchId').primary().defaultTo(knex.raw('uuidv7()'));
    t.uuid('fromStoreId').notNullable().references('storeId').inTable('store');
    t.uuid('toStoreId').notNullable().references('storeId').inTable('store');
    t.string('dispatchNumber', 50).notNullable().unique();
    t.enum('status', ['draft', 'pending_approval', 'approved', 'dispatched', 'in_transit', 'received', 'cancelled'])
      .notNullable().defaultTo('draft');
    t.uuid('requestedBy').references('userId').inTable('user');
    t.uuid('approvedBy').references('userId').inTable('user');
    t.uuid('dispatchedBy').references('userId').inTable('user');
    t.uuid('receivedBy').references('userId').inTable('user');
    t.timestamp('requestedAt');
    t.timestamp('approvedAt');
    t.timestamp('dispatchedAt');
    t.timestamp('receivedAt');
    t.text('notes');
    t.jsonb('metadata').defaultTo('{}');
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());

    t.index('fromStoreId');
    t.index('toStoreId');
    t.index('status');
    t.index('dispatchNumber');
    t.index('requestedBy');
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable('storeDispatch');
};
```

### 3.6 Migration: `createStoreDispatchItemTable`

**File**: `migrations/YYYYMMDD000006_createStoreDispatchItemTable.js`

```js
exports.up = function (knex) {
  return knex.schema.createTable('storeDispatchItem', t => {
    t.uuid('dispatchItemId').primary().defaultTo(knex.raw('uuidv7()'));
    t.uuid('dispatchId').notNullable().references('dispatchId').inTable('storeDispatch');
    t.uuid('productId').notNullable().references('productId').inTable('product');
    t.uuid('variantId').references('variantId').inTable('productVariant');
    t.string('sku', 100);
    t.string('productName', 255);
    t.integer('requestedQuantity').notNullable();
    t.integer('dispatchedQuantity').defaultTo(0);
    t.integer('receivedQuantity').defaultTo(0);
    t.text('notes');
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());

    t.index('dispatchId');
    t.index('productId');
    t.index('variantId');
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable('storeDispatchItem');
};
```

### 3.7 Migration: `alterChannelAddUniqueCode`

**File**: `migrations/YYYYMMDD000007_alterChannelAddUniqueCode.js`

The `channel` table already has a `code` column. We need to ensure it is unique and indexed for RetailPOS lookup.

```js
exports.up = function (knex) {
  return knex.schema.alterTable('channel', t => {
    t.unique('code');
  });
};

exports.down = function (knex) {
  return knex.schema.alterTable('channel', t => {
    t.dropUnique('code');
  });
};
```

---

## 4. Phase 2: modules/identity — Roles & User-Store Binding

### 4.1 New Domain Entity: `UserStoreAssignment`

**File**: `modules/identity/domain/entities/UserStoreAssignment.ts`

```typescript
export type StoreRole = 'cashier' | 'manager' | 'admin';

export interface UserStoreAssignmentProps {
  userStoreId: string;
  userId: string;
  storeId: string;
  role: StoreRole;
  isPrimary: boolean;
  isActive: boolean;
  permissions: string[];
  createdAt: Date;
  updatedAt: Date;
}

export class UserStoreAssignment {
  private props: UserStoreAssignmentProps;

  private constructor(props: UserStoreAssignmentProps) {
    this.props = props;
  }

  static create(props: {
    userStoreId: string;
    userId: string;
    storeId: string;
    role: StoreRole;
    isPrimary?: boolean;
    permissions?: string[];
  }): UserStoreAssignment { /* ... */ }

  static reconstitute(props: UserStoreAssignmentProps): UserStoreAssignment { /* ... */ }

  // Getters, domain methods (activate, deactivate, changeRole, updatePermissions)
}
```

**Role definitions:**

| Role | Description | Permissions |
|---|---|---|
| `cashier` | Single-store user, can only create orders + view inventory for their assigned store | `['order.create', 'order.view', 'inventory.view']` |
| `manager` | Multi-store user, full access to all stores, can dispatch, view all sales, manage users | `['order.*', 'inventory.*', 'dispatch.*', 'user.view', 'store.view', 'analytics.view']` |
| `admin` | Platform admin, unrestricted | `['*']` |

### 4.2 New Domain Repository Interface: `UserStoreRepository`

**File**: `modules/identity/domain/repositories/UserStoreRepository.ts`

```typescript
export interface UserStoreRepository {
  findByUserId(userId: string): Promise<UserStoreAssignment[]>;
  findByStoreId(storeId: string): Promise<UserStoreAssignment[]>;
  findByUserAndStore(userId: string, storeId: string): Promise<UserStoreAssignment | null>;
  findPrimaryStore(userId: string): Promise<UserStoreAssignment | null>;
  save(assignment: UserStoreAssignment): Promise<UserStoreAssignment>;
  delete(userStoreId: string): Promise<void>;
}
```

### 4.3 Infrastructure Repository: `UserStoreRepository`

**File**: `modules/identity/infrastructure/repositories/UserStoreRepository.ts`

SQL implementation using the `userStore` table. All queries use camelCase column names with PostgreSQL quoting per platform conventions.

### 4.4 New Use Cases

**File**: `modules/identity/application/useCases/store/AssignUserToStore.ts`

```typescript
export interface AssignUserToStoreInput {
  userId: string;
  storeId: string;
  role: StoreRole;
  isPrimary?: boolean;
  permissions?: string[];
  assignedBy: string;
}
```

- Validates user exists
- Validates store exists
- Checks no duplicate assignment
- Creates `UserStoreAssignment`
- Emits `user.store.assigned` event

**File**: `modules/identity/application/useCases/store/RemoveUserFromStore.ts`

**File**: `modules/identity/application/useCases/store/ListStoreUsers.ts`

**File**: `modules/identity/application/useCases/store/GetUserStores.ts`

### 4.5 Update `libs/roles.ts`

```typescript
export type Roles = 'ADMIN' | 'MANAGER' | 'CASHIER' | 'VIEWER' | 'USER';

export const roles = {
  ADMIN: 'ADMIN',
  MANAGER: 'MANAGER',
  CASHIER: 'CASHIER',
  VIEWER: 'VIEWER',
  USER: 'USER',
};

export const STORE_PERMISSIONS = {
  ORDER_CREATE: 'order.create',
  ORDER_VIEW: 'order.view',
  ORDER_MANAGE: 'order.manage',
  INVENTORY_VIEW: 'inventory.view',
  INVENTORY_ADJUST: 'inventory.adjust',
  DISPATCH_CREATE: 'dispatch.create',
  DISPATCH_APPROVE: 'dispatch.approve',
  DISPATCH_RECEIVE: 'dispatch.receive',
  USER_MANAGE: 'user.manage',
  STORE_VIEW: 'store.view',
  STORE_MANAGE: 'store.manage',
  ANALYTICS_VIEW: 'analytics.view',
  ALL: '*',
} as const;
```

### 4.6 Update `libs/session/SessionService.ts`

Add `storeId` to `SessionData` and `CreateSessionInput`:

```typescript
export interface SessionData {
  // ... existing fields ...
  storeId?: string;       // NEW: primary store for this session
  storeRole?: string;     // NEW: role at the primary store
  storeIds?: string[];    // NEW: all stores user has access to
}
```

### 4.7 Update `libs/types/express.ts`

Add `storeId` and `storeRole` to `Express.User`:

```typescript
interface User {
  // ... existing fields ...
  storeId?: string;
  storeRole?: string;
  storeIds?: string[];
}
```

### 4.8 Update `libs/auth.ts`

Add middleware `requireStoreAccess` and `requirePermission`:

```typescript
/**
 * Middleware: Verify user has access to the store in the request
 * Reads storeId from req.params.storeId or req.body.storeId or req.user.storeId
 */
export const requireStoreAccess = (requiredPermission?: string) =>
  async (req: Request, res: Response, next: NextFunction) => {
    const user = req.user;
    if (!user) return res.status(401).json({ message: 'Not authenticated' });

    // Admins bypass store checks
    if (user.role === 'ADMIN') return next();

    // Managers have access to all stores
    if (user.storeRole === 'manager') return next();

    const targetStoreId = req.params.storeId || req.body.storeId || req.query.storeId;

    // Cashiers can only access their assigned store
    if (targetStoreId && user.storeId !== targetStoreId) {
      return res.status(403).json({ message: 'Access denied to this store' });
    }

    if (requiredPermission && user.permissions && !user.permissions.includes(requiredPermission) && !user.permissions.includes('*')) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }

    return next();
  };
```

### 4.9 Update Admin Login Flow

**File**: `modules/identity/application/useCases/admin/LoginAdmin.ts`

After successful authentication, look up the user's store assignments and include `storeId`, `storeRole`, and `storeIds` in the session:

```typescript
// After validating credentials...
const storeAssignments = await userStoreRepo.findByUserId(user.userId);
const primaryStore = storeAssignments.find(a => a.isPrimary) || storeAssignments[0];

const sessionId = await SessionService.createSession({
  userId: user.userId,
  userType: 'admin',
  email: user.email,
  name: user.fullName,
  role: user.userType === 'admin' ? 'ADMIN' : primaryStore?.role?.toUpperCase() || 'USER',
  storeId: primaryStore?.storeId,
  storeRole: primaryStore?.role,
  storeIds: storeAssignments.map(a => a.storeId),
  permissions: primaryStore?.permissions || [],
});
```

### 4.10 New Interface Layer

**File**: `modules/identity/interface/controllers/UserStoreController.ts`

Endpoints:
- `POST /business/users/:userId/stores` — Assign user to store
- `DELETE /business/users/:userId/stores/:storeId` — Remove user from store
- `GET /business/users/:userId/stores` — List user's stores
- `GET /business/stores/:storeId/users` — List store's users

**File**: `modules/identity/interface/routers/userStoreRouter.ts`

Mount under `/business` in `boot/routes.ts`.

---

## 5. Phase 3: modules/store — Multi-Store & Hierarchy

### 5.1 Update Store Entity

**File**: `modules/store/domain/entities/Store.ts`

Add to `StoreProps`:

```typescript
isHeadquarters: boolean;
parentStoreId?: string;
```

Add to `Store` class:

```typescript
get isHeadquarters(): boolean { return this.props.isHeadquarters; }
get parentStoreId(): string | undefined { return this.props.parentStoreId; }

markAsHeadquarters(): void {
  this.props.isHeadquarters = true;
  this.touch();
}

setParentStore(parentStoreId: string): void {
  this.props.parentStoreId = parentStoreId;
  this.touch();
}
```

### 5.2 Update Store Repository

**File**: `modules/store/domain/repositories/StoreRepository.ts`

Add methods:

```typescript
findHeadquarters(businessId: string): Promise<Store | null>;
findOutlets(headquartersStoreId: string): Promise<Store[]>;
findByBusinessId(businessId: string): Promise<Store[]>;
```

**File**: `modules/store/infrastructure/repositories/StoreRepo.ts`

Implement the new methods using SQL queries on the `store` table with the new `isHeadquarters` and `parentStoreId` columns.

### 5.3 Update `CreateStore` Use Case

**File**: `modules/store/application/useCases/CreateStore.ts`

Add `isHeadquarters` and `parentStoreId` to the input interface. When creating an outlet, automatically:
1. Create a linked `inventoryLocation` with `type: 'store'` and `storeId` set
2. Emit `store.created` event

### 5.4 New Use Case: `ListBusinessStores`

**File**: `modules/store/application/useCases/ListBusinessStores.ts`

Returns all stores for a business, with their hierarchy (HQ first, then outlets sorted by name), user counts, and inventory summary.

### 5.5 Auto-Create InventoryLocation on Store Creation

When a new store is created, automatically insert a corresponding row into `inventoryLocation`:

```typescript
// In CreateStore use case, after saving store:
await inventoryLocationRepo.save({
  locationId: generateUUID(),
  name: `${store.name} Stock`,
  type: 'store',
  storeId: store.storeId,
  address: store.address,
  isActive: true,
  priority: store.isHeadquarters ? 0 : 10,
});
```

---

## 6. Phase 4: modules/inventory — Stock Dispatch & Per-Store Tracking

### 6.1 New Domain Entity: `StoreDispatch`

**File**: `modules/inventory/domain/entities/StoreDispatch.ts`

```typescript
export type DispatchStatus = 'draft' | 'pending_approval' | 'approved' | 'dispatched' | 'in_transit' | 'received' | 'cancelled';

export interface StoreDispatchProps {
  dispatchId: string;
  fromStoreId: string;
  toStoreId: string;
  dispatchNumber: string;
  status: DispatchStatus;
  items: StoreDispatchItem[];
  requestedBy?: string;
  approvedBy?: string;
  dispatchedBy?: string;
  receivedBy?: string;
  requestedAt?: Date;
  approvedAt?: Date;
  dispatchedAt?: Date;
  receivedAt?: Date;
  notes?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface StoreDispatchItem {
  dispatchItemId: string;
  dispatchId: string;
  productId: string;
  variantId?: string;
  sku?: string;
  productName?: string;
  requestedQuantity: number;
  dispatchedQuantity: number;
  receivedQuantity: number;
  notes?: string;
}
```

Domain methods on `StoreDispatch`:
- `approve(approvedBy: string)` — transition `draft/pending_approval → approved`
- `markDispatched(dispatchedBy: string)` — transition `approved → dispatched`
- `markInTransit()` — transition `dispatched → in_transit`
- `markReceived(receivedBy: string, receivedItems: {dispatchItemId: string, receivedQuantity: number}[])` — transition `in_transit/dispatched → received`
- `cancel(reason: string)` — transition any pre-dispatch status → `cancelled`
- Each status transition validates legal state machine

### 6.2 New Repository Interface: `StoreDispatchRepository`

**File**: `modules/inventory/domain/repositories/StoreDispatchRepository.ts`

```typescript
export interface StoreDispatchRepository {
  findById(dispatchId: string): Promise<StoreDispatch | null>;
  findByNumber(dispatchNumber: string): Promise<StoreDispatch | null>;
  findAll(filters: DispatchFilters, pagination: PaginationOptions): Promise<PaginatedResult<StoreDispatch>>;
  save(dispatch: StoreDispatch): Promise<StoreDispatch>;
  delete(dispatchId: string): Promise<void>;
}
```

### 6.3 Infrastructure Repository: `StoreDispatchRepository`

**File**: `modules/inventory/infrastructure/repositories/StoreDispatchRepository.ts`

SQL implementation querying `storeDispatch` and `storeDispatchItem` tables. All camelCase column names per platform conventions.

### 6.4 New Use Cases

#### `CreateStoreDispatch`

**File**: `modules/inventory/application/useCases/CreateStoreDispatch.ts`

```typescript
export interface CreateStoreDispatchInput {
  fromStoreId: string;
  toStoreId: string;
  items: Array<{
    productId: string;
    variantId?: string;
    quantity: number;
  }>;
  notes?: string;
  requestedBy: string;
}
```

Steps:
1. Validate `fromStoreId` is the HQ store (or any store with sufficient stock)
2. Validate `toStoreId` exists and is an outlet
3. Validate each item exists and has sufficient stock at `fromStoreId`'s inventory location
4. Generate dispatch number (`DSP-{timestamp}-{random}`)
5. Create `StoreDispatch` in `draft` status
6. Emit `inventory.dispatch.created` event

#### `ApproveStoreDispatch`

**File**: `modules/inventory/application/useCases/ApproveStoreDispatch.ts`

Steps:
1. Load dispatch, validate status is `draft` or `pending_approval`
2. Re-validate stock availability at source
3. **Reserve stock** at source location (increment `reservedQuantity`)
4. Transition to `approved`
5. Emit `inventory.dispatch.approved` event

#### `DispatchFromStore`

**File**: `modules/inventory/application/useCases/DispatchFromStore.ts`

Steps:
1. Load dispatch, validate status is `approved`
2. **Deduct stock** at source location (decrement `quantity`, release reservation)
3. Record `InventoryMovement` of type `outbound` for each item at source
4. Set `dispatchedQuantity` on each item
5. Transition to `dispatched`
6. Emit `inventory.dispatch.shipped` event

#### `ReceiveStoreDispatch`

**File**: `modules/inventory/application/useCases/ReceiveStoreDispatch.ts`

```typescript
export interface ReceiveStoreDispatchInput {
  dispatchId: string;
  receivedBy: string;
  items: Array<{
    dispatchItemId: string;
    receivedQuantity: number;
  }>;
  notes?: string;
}
```

Steps:
1. Load dispatch, validate status is `dispatched` or `in_transit`
2. For each item, **add stock** at destination location (increment `quantity`)
3. Record `InventoryMovement` of type `inbound` for each item at destination, with `referenceId` = `dispatchId`
4. Set `receivedQuantity` on each item
5. Transition to `received`
6. Emit `inventory.dispatch.received` event
7. If `receivedQuantity < dispatchedQuantity` for any item, log a discrepancy note

#### `ListStoreDispatches`

**File**: `modules/inventory/application/useCases/ListStoreDispatches.ts`

Paginated listing with filters: `fromStoreId`, `toStoreId`, `status`, `dateRange`.

#### `GetStoreDispatch`

**File**: `modules/inventory/application/useCases/GetStoreDispatch.ts`

Returns dispatch with all items, including product names and current stock levels.

### 6.5 Update `InventoryLocation` Entity

Add `storeId` property to `InventoryLocation` interface in `modules/inventory/domain/entities/Inventory.ts`:

```typescript
export interface InventoryLocation {
  locationId: string;
  name: string;
  type: 'warehouse' | 'store' | 'supplier';
  storeId?: string; // NEW: link to store table
  address?: { /* ... */ };
  isActive: boolean;
  priority: number;
  metadata?: Record<string, any>;
}
```

### 6.6 Update Infrastructure Repository

**File**: `modules/inventory/infrastructure/repositories/InventoryRepository.ts`

Add methods:
- `findByStoreId(storeId: string)` — Find inventory location by storeId, then query inventory items at that location
- `getLocationByStoreId(storeId: string)` — Returns `InventoryLocation` linked to a store

Update `getLocations()` and `getLocationById()` to include `storeId` in the mapping.

### 6.7 New Interface Layer

**File**: `modules/inventory/interface/controllers/StoreDispatchController.ts`

Endpoints:
- `POST /business/dispatches` — Create dispatch
- `GET /business/dispatches` — List dispatches (filtered)
- `GET /business/dispatches/:dispatchId` — Get dispatch detail
- `PUT /business/dispatches/:dispatchId/approve` — Approve
- `PUT /business/dispatches/:dispatchId/dispatch` — Mark dispatched
- `PUT /business/dispatches/:dispatchId/receive` — Receive at destination
- `PUT /business/dispatches/:dispatchId/cancel` — Cancel

**File**: `modules/inventory/interface/routers/storeDispatchRouter.ts`

Mount under `/business` in `boot/routes.ts` with `isMerchantLoggedIn` middleware.

### 6.8 Domain Events

Add to `modules/inventory/domain/events/InventoryEvents.ts`:

```typescript
export const INVENTORY_EVENTS = {
  // ... existing events ...
  DISPATCH_CREATED: 'inventory.dispatch.created',
  DISPATCH_APPROVED: 'inventory.dispatch.approved',
  DISPATCH_SHIPPED: 'inventory.dispatch.shipped',
  DISPATCH_RECEIVED: 'inventory.dispatch.received',
  DISPATCH_CANCELLED: 'inventory.dispatch.cancelled',
};
```

---

## 7. Phase 5: modules/channel — POS Channel-Store Mapping

### 7.1 New Use Case: `GetChannelByCode`

**File**: `modules/channel/application/useCases/GetChannelByCode.ts`

```typescript
export class GetChannelByCodeUseCase {
  constructor(private readonly channelRepository: ChannelRepository) {}

  async execute(code: string): Promise<ChannelResponse | null> {
    const channel = await this.channelRepository.findByCode(code);
    if (!channel) return null;
    return this.mapToResponse(channel);
  }
}
```

**Purpose**: RetailPOS needs to discover which channel (and therefore which store) it's connected to. During onboarding, the POS is configured with a `channelCode`. On each API call, it sends this code so the platform knows which store the request is for.

### 7.2 Update Channel Repository Interface

**File**: `modules/channel/domain/repositories/ChannelRepository.ts`

Add:
```typescript
findByCode(code: string): Promise<Channel | null>;
findByStoreId(storeId: string): Promise<Channel[]>;
```

### 7.3 Update Channel Infrastructure Repository

**File**: `modules/channel/infrastructure/repositories/ChannelRepository.ts`

Implement `findByCode` and `findByStoreId` SQL queries.

### 7.4 New API Endpoint: Channel Discovery

**File**: `modules/channel/interface/controllers/ChannelController.ts`

Add to existing controller:
```typescript
// GET /business/channels/by-code/:code
export const getChannelByCode = async (req, res) => { /* ... */ };
```

This endpoint is called by RetailPOS during initialization to resolve its `channelCode` to a `channelId` + `storeId`.

### 7.5 Update `boot/routes.ts`

Ensure channel router is mounted and the new endpoint is accessible.

---

## 8. Phase 6: modules/order — Store-Aware Orders

### 8.1 Update Order Entity

**File**: `modules/order/domain/entities/Order.ts`

Add to `OrderProps`:

```typescript
storeId?: string;
channelId?: string;
createdByUserId?: string;
orderSource?: 'web' | 'pos' | 'api' | 'admin';
```

Add to `Order.create()` factory and `Order.reconstitute()`.

Add getters:
```typescript
get storeId(): string | undefined { return this.props.storeId; }
get channelId(): string | undefined { return this.props.channelId; }
get createdByUserId(): string | undefined { return this.props.createdByUserId; }
get orderSource(): string | undefined { return this.props.orderSource; }
```

Update `toJSON()` to include the new fields.

### 8.2 Update `CreateOrderCommand`

**File**: `modules/order/application/useCases/CreateOrder.ts`

Add to `CreateOrderCommand`:

```typescript
public readonly storeId?: string,
public readonly channelId?: string,
public readonly createdByUserId?: string,
public readonly orderSource?: 'web' | 'pos' | 'api' | 'admin',
```

Pass these through in `Order.create()` call.

### 8.3 Update `OrderRepository`

**File**: `modules/order/domain/repositories/OrderRepository.ts`

Add filter options:

```typescript
export interface OrderFilters {
  // ... existing filters ...
  storeId?: string;
  channelId?: string;
  orderSource?: string;
}
```

### 8.4 Update Infrastructure Repository

**File**: `modules/order/infrastructure/repositories/OrderRepository.ts` (and `orderRepo.ts` legacy)

- Add `storeId`, `channelId`, `createdByUserId`, `orderSource` to INSERT and SELECT queries
- Add WHERE clause support for `storeId` filter in `findAll`

### 8.5 Update `ListOrders` Use Case

**File**: `modules/order/application/useCases/ListOrders.ts`

Accept `storeId` filter parameter. When a cashier calls this, automatically filter to their assigned store.

### 8.6 New Use Case: `GetStoreSalesSummary`

**File**: `modules/order/application/useCases/GetStoreSalesSummary.ts`

```typescript
export interface StoreSalesSummaryInput {
  storeId?: string; // null = all stores (managers)
  dateFrom: Date;
  dateTo: Date;
}

export interface StoreSalesSummaryOutput {
  storeId: string;
  storeName: string;
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  topProducts: Array<{ productId: string; name: string; quantity: number; revenue: number }>;
  ordersByStatus: Record<string, number>;
  ordersByDate: Array<{ date: string; orders: number; revenue: number }>;
}
```

This powers the HQ sales monitoring dashboard.

### 8.7 Update Order Customer Controller

**File**: `modules/order/interface/controllers/OrderCustomerController.ts`

When an order is created via `POST /customer/order`, extract `storeId` and `channelId` from:
1. The request body (sent by RetailPOS)
2. The authenticated user's session (if available)
3. The channel lookup (if `channelCode` header is present)

```typescript
// In createOrder handler:
let storeId = req.body.storeId;
let channelId = req.body.channelId;

// If channelCode header present (RetailPOS), resolve to storeId
const channelCode = req.headers['x-channel-code'] as string;
if (channelCode && !storeId) {
  const channel = await channelRepo.findByCode(channelCode);
  if (channel) {
    channelId = channel.channelId;
    storeId = channel.defaultStoreId || channel.storeIds[0];
  }
}

const command = new CreateOrderCommand(
  // ... existing params ...
  storeId,
  channelId,
  req.user?.userId,
  channelCode ? 'pos' : 'web',
);
```

### 8.8 New Endpoint: Store Sales Summary

Add to `modules/order/interface/controllers/OrderBusinessController.ts`:

```typescript
// GET /business/orders/store-summary?storeId=&dateFrom=&dateTo=
export const getStoreSalesSummary = async (req, res) => { /* ... */ };
```

Add to `modules/order/interface/routers/businessRouter.ts`.

---

## 9. Phase 7: modules/product — Per-Store Stock Visibility

### 9.1 New Use Case: `GetProductStoreAvailability`

**File**: `modules/product/application/useCases/GetProductStoreAvailability.ts`

```typescript
export interface ProductStoreAvailabilityInput {
  productId: string;
  variantId?: string;
  storeId?: string; // null = all stores
}

export interface ProductStoreAvailabilityOutput {
  productId: string;
  variantId?: string;
  sku: string;
  totalQuantity: number;
  stores: Array<{
    storeId: string;
    storeName: string;
    locationId: string;
    quantity: number;
    reservedQuantity: number;
    availableQuantity: number;
    isLowStock: boolean;
    isOutOfStock: boolean;
  }>;
}
```

This use case queries the `inventory` table joined with `inventoryLocation` (filtered by `storeId` where applicable) to return per-store stock breakdown.

### 9.2 New API Endpoint

Add to `modules/product/interface/controllers/ProductBusinessController.ts`:

```typescript
// GET /business/products/:productId/availability?storeId=
export const getProductAvailability = async (req, res) => { /* ... */ };
```

This is useful for both the admin UI and RetailPOS to show real-time stock levels per store.

---

## 10. Phase 8: web/admin — Admin UI Changes

### 10.1 New Admin Views: Store Management

Create new view directory: `web/admin/views/stores/`

#### `web/admin/views/stores/index.ejs`
- List all stores in a table
- Columns: Name, Type (HQ/Outlet), Location, Active, Users, Stock Value
- Filter by: status, type (HQ/outlet)
- Action buttons: View, Edit, Create

#### `web/admin/views/stores/view.ejs`
- Store details card
- Linked users list (with roles)
- Inventory summary for this store
- Recent orders from this store
- Recent dispatches to/from this store

#### `web/admin/views/stores/create.ejs`
- Form: name, slug, description, storeType, address, contact info
- Checkbox: isHeadquarters
- Dropdown: parentStoreId (if outlet)
- Settings section

#### `web/admin/views/stores/edit.ejs`
- Same as create but pre-populated
- Additional: user assignment section

#### `web/admin/views/stores/users.ejs`
- Manage store user assignments
- Add user to store (select user + role)
- Remove user from store
- Change role

### 10.2 New Admin Controller: `storeController.ts`

**File**: `web/admin/controllers/storeController.ts`

Functions:
- `listStores` — Render `stores/index.ejs`
- `viewStore` — Render `stores/view.ejs` with store details, users, inventory, orders
- `createStoreForm` / `createStore` — Create form + POST handler
- `editStoreForm` / `updateStore` — Edit form + POST handler
- `manageStoreUsers` — Render `stores/users.ejs`
- `assignUserToStore` / `removeUserFromStore` — POST handlers

Uses direct use case imports per admin architecture pattern.

### 10.3 New Admin Views: Stock Dispatch

Create new view directory: `web/admin/views/inventory/dispatches/`

#### `web/admin/views/inventory/dispatches/index.ejs`
- List all dispatches in a table
- Columns: Dispatch #, From Store, To Store, Status, Items, Requested By, Date
- Filter by: status, store, date range
- Action button: Create Dispatch

#### `web/admin/views/inventory/dispatches/create.ejs`
- Form: From Store (dropdown, defaults to HQ), To Store (dropdown)
- Product selection table (search + add items with quantities)
- Notes field
- Submit creates dispatch in `draft` status

#### `web/admin/views/inventory/dispatches/view.ejs`
- Dispatch details card with status badge
- Items table: Product, SKU, Requested, Dispatched, Received
- Status timeline (requested → approved → dispatched → received)
- Action buttons based on current status:
  - `draft` → Approve, Cancel
  - `approved` → Mark Dispatched, Cancel
  - `dispatched/in_transit` → Mark Received
  - `received` → Print dispatch note (read-only)

### 10.4 Update Inventory Controller

**File**: `web/admin/controllers/inventoryController.ts`

Add new functions:
- `listDispatches` — Render `inventory/dispatches/index.ejs`
- `createDispatchForm` / `createDispatch` — Create form + POST handler
- `viewDispatch` — Render `inventory/dispatches/view.ejs`
- `approveDispatch` — POST handler → calls `ApproveStoreDispatch` use case
- `markDispatched` — POST handler → calls `DispatchFromStore` use case
- `receiveDispatch` — POST handler → calls `ReceiveStoreDispatch` use case
- `cancelDispatch` — POST handler

### 10.5 New Admin Views: Store Sales Dashboard

#### `web/admin/views/analytics/store-sales.ejs`
- Dropdown: Select store (or "All Stores" for managers)
- Date range picker
- KPI cards: Total Orders, Revenue, Average Order Value, Top Product
- Chart: Daily sales trend (bar chart)
- Table: Per-store breakdown (when "All Stores" selected)
- Table: Recent orders for selected store

### 10.6 Update Analytics Controller

**File**: `web/admin/controllers/analyticsController.ts`

Add:
- `storeSalesDashboard` — Render `analytics/store-sales.ejs` using `GetStoreSalesSummary` use case

### 10.7 Update Admin Router

**File**: `web/admin/adminRouters.ts` (or wherever admin routes are configured)

Add routes:

```typescript
// Stores
router.get('/admin/stores', isAdminLoggedIn, storeController.listStores);
router.get('/admin/stores/create', isAdminLoggedIn, storeController.createStoreForm);
router.post('/admin/stores', isAdminLoggedIn, storeController.createStore);
router.get('/admin/stores/:storeId', isAdminLoggedIn, storeController.viewStore);
router.get('/admin/stores/:storeId/edit', isAdminLoggedIn, storeController.editStoreForm);
router.post('/admin/stores/:storeId', isAdminLoggedIn, storeController.updateStore);
router.get('/admin/stores/:storeId/users', isAdminLoggedIn, storeController.manageStoreUsers);
router.post('/admin/stores/:storeId/users', isAdminLoggedIn, storeController.assignUserToStore);
router.delete('/admin/stores/:storeId/users/:userId', isAdminLoggedIn, storeController.removeUserFromStore);

// Stock Dispatches
router.get('/admin/dispatches', isAdminLoggedIn, inventoryController.listDispatches);
router.get('/admin/dispatches/create', isAdminLoggedIn, inventoryController.createDispatchForm);
router.post('/admin/dispatches', isAdminLoggedIn, inventoryController.createDispatch);
router.get('/admin/dispatches/:dispatchId', isAdminLoggedIn, inventoryController.viewDispatch);
router.post('/admin/dispatches/:dispatchId/approve', isAdminLoggedIn, inventoryController.approveDispatch);
router.post('/admin/dispatches/:dispatchId/dispatch', isAdminLoggedIn, inventoryController.markDispatched);
router.post('/admin/dispatches/:dispatchId/receive', isAdminLoggedIn, inventoryController.receiveDispatch);
router.post('/admin/dispatches/:dispatchId/cancel', isAdminLoggedIn, inventoryController.cancelDispatch);

// Store Sales Analytics
router.get('/admin/analytics/store-sales', isAdminLoggedIn, analyticsController.storeSalesDashboard);
```

### 10.8 Update Admin Sidebar

**File**: `web/admin/views/partials/sidebar.ejs`

Add navigation items:
- Under "Operations" section: **Stores** (icon: `ti-building-store`)
- Under "Inventory" section: **Dispatches** (icon: `ti-truck-delivery`)
- Under "Analytics" section: **Store Sales** (icon: `ti-chart-bar`)

### 10.9 Update Existing Inventory Views

**File**: `web/admin/views/inventory/index.ejs`

- Add "Store" column showing the store name (via location → store join)
- Add store filter dropdown alongside the existing location filter
- For cashier role: auto-filter to their assigned store only

**File**: `web/admin/views/orders/index.ejs`

- Add "Store" column
- Add "Source" column (POS / Web / Admin)
- Add store filter dropdown
- For cashier role: auto-filter to their assigned store only

---

## 11. Phase 9: RetailPOS Integration Changes

### 11.1 Add Channel Code to RetailPOS Configuration

**File**: `services/config/POSConfigService.ts` (RetailPOS)

Add to `POSConfig`:

```typescript
export interface POSConfig {
  // ... existing fields ...
  channelCode: string;    // NEW: unique code mapping to CommerceFull channel
  storeId: string;        // NEW: resolved storeId from CommerceFull
  channelId: string;      // NEW: resolved channelId from CommerceFull
}
```

Add `channelCode` to `REQUIRED_FIELDS`.

### 11.2 Update Onboarding Flow

**File**: `screens/OnboardingScreen.tsx` (RetailPOS)

Add a new step between "Platform Configuration" and "Payment Provider":

**Step: Store Selection**
1. After platform credentials are validated, call `GET /business/channels?type=pos` to list available POS channels
2. Display channels as selectable cards showing store name and location
3. User selects which channel/store this POS terminal represents
4. Save `channelCode`, `storeId`, `channelId` to `POSConfigService`
5. If no POS channels exist, show a message: "No POS channels configured. Please create one in the admin panel first."

### 11.3 Update `CommerceFullApiClient`

**File**: `services/clients/commercefull/CommerceFullApiClient.ts` (RetailPOS)

Add `X-Channel-Code` header to all API requests:

```typescript
private getHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };
  if (this.accessToken) {
    headers['Authorization'] = `Bearer ${this.accessToken}`;
  }
  // NEW: Include channel code for store identification
  const posConfig = POSConfigService.getInstance();
  if (posConfig.isLoaded && posConfig.values.channelCode) {
    headers['X-Channel-Code'] = posConfig.values.channelCode;
  }
  return headers;
}
```

### 11.4 Update `CommerceFullOrderService`

**File**: `services/order/platforms/CommerceFullOrderService.ts` (RetailPOS)

Update `mapToCommerceFullOrder` to include store/channel fields:

```typescript
private mapToCommerceFullOrder(order: Order): Record<string, unknown> {
  const posConfig = POSConfigService.getInstance();
  return {
    // ... existing fields ...
    storeId: posConfig.values.storeId,      // NEW
    channelId: posConfig.values.channelId,  // NEW
    orderSource: 'pos',                     // NEW
  };
}
```

### 11.5 Update `CommerceFullInventoryService`

**File**: `services/inventory/platforms/CommerceFullInventoryService.ts` (RetailPOS)

Update `getInventory` to filter by store's location:

```typescript
async getInventory(productIds: string[]): Promise<InventoryResult> {
  // Pass storeId as query param to get location-specific inventory
  const posConfig = POSConfigService.getInstance();
  const params: Record<string, string> = {};
  if (posConfig.values.storeId) {
    params.storeId = posConfig.values.storeId;
  }

  const data = await this.apiClient.get<any>('/business/inventory', params);
  // ... rest of mapping ...
}
```

### 11.6 Update Webhook Handling for Dispatch Events

**File**: `services/sync/platforms/CommerceFullSyncService.ts` (RetailPOS)

Register listener for dispatch events:

```typescript
// In initialization or after webhook registration:
this.onWebhookEvent('inventory.dispatch.received', async (event) => {
  const { toStoreId, items } = event.data;
  const posConfig = POSConfigService.getInstance();

  // Only process if this dispatch is for our store
  if (toStoreId !== posConfig.values.storeId) return;

  // Update local inventory with received quantities
  for (const item of items) {
    // Update local SQLite inventory
    await localInventoryRepo.adjustQuantity(
      item.productId,
      item.variantId,
      item.receivedQuantity,
      'add',
    );
  }
});
```

### 11.7 New API Endpoint: Channel Discovery for RetailPOS

On the CommerceFull platform side, ensure the business router exposes:

```
GET /business/channels?type=pos
GET /business/channels/by-code/:code
```

These are used by RetailPOS during onboarding and initialization.

---

## 12. Phase 10: Seed Data & Testing

### 12.1 Seed Data File

**File**: `seeds/multi-store-setup.ts`

Creates the complete Lesotho Maseru setup:

```typescript
// 1. Create Business
const businessId = 'business-lesotho-skincare';

// 2. Create 8 Stores
const stores = [
  { name: 'Headquarters', slug: 'hq-maseru', isHeadquarters: true, address: { city: 'Maseru', country: 'LS' } },
  { name: 'Kingsway Store', slug: 'kingsway-maseru', isHeadquarters: false },
  { name: 'Pioneer Mall Store', slug: 'pioneer-mall-maseru', isHeadquarters: false },
  { name: 'Lakeside Store', slug: 'lakeside-maseru', isHeadquarters: false },
  { name: 'LNDC Centre Store', slug: 'lndc-maseru', isHeadquarters: false },
  { name: 'Maseru Mall Store', slug: 'maseru-mall', isHeadquarters: false },
  { name: 'Old Europa Store', slug: 'old-europa-maseru', isHeadquarters: false },
  { name: 'Ha Foso Store', slug: 'ha-foso-maseru', isHeadquarters: false },
];

// 3. Create InventoryLocation for each store
// 4. Create 8 POS Channels (one per store)
// 5. Create Store Hierarchy

// 6. Create 9 Users
const users = [
  { email: 'manager1@skincare.co.ls', role: 'manager', stores: ['hq'] },
  { email: 'manager2@skincare.co.ls', role: 'manager', stores: ['hq'] },
  { email: 'cashier-kingsway@skincare.co.ls', role: 'cashier', stores: ['kingsway'] },
  { email: 'cashier-pioneer@skincare.co.ls', role: 'cashier', stores: ['pioneer-mall'] },
  // ... 5 more cashiers
];

// 7. Create UserStore assignments
// 8. Create sample products (petroleum jelly, body creams, etc.)
// 9. Seed initial inventory at HQ
```

### 12.2 Test Plan

#### Unit Tests

| Module | Test File | What to Test |
|---|---|---|
| `identity` | `modules/identity/application/useCases/store/AssignUserToStore.test.ts` | Assignment creation, duplicate prevention, validation |
| `identity` | `modules/identity/application/useCases/store/GetUserStores.test.ts` | Returns correct stores for user |
| `inventory` | `modules/inventory/application/useCases/CreateStoreDispatch.test.ts` | Dispatch creation, stock validation, number generation |
| `inventory` | `modules/inventory/application/useCases/ReceiveStoreDispatch.test.ts` | Stock adjustment at destination, discrepancy handling |
| `order` | `modules/order/application/useCases/CreateOrder.test.ts` | Order carries storeId/channelId, source field |
| `order` | `modules/order/application/useCases/GetStoreSalesSummary.test.ts` | Correct aggregation per store |
| `channel` | `modules/channel/application/useCases/GetChannelByCode.test.ts` | Returns channel by unique code |
| `auth` | `libs/auth.test.ts` | `requireStoreAccess` middleware blocks cross-store access |

#### Integration Tests

| Test File | What to Test |
|---|---|
| `tests/integration/store-dispatch.test.ts` | Full dispatch lifecycle: create → approve → dispatch → receive → verify stock levels |
| `tests/integration/store-order.test.ts` | Order creation with storeId, listing filtered by store |
| `tests/integration/user-store-binding.test.ts` | User assignment, login includes storeId in session, API access restricted |

#### E2E Tests (Cypress)

| Test File | What to Test |
|---|---|
| `cypress/e2e/admin-stores.cy.ts` | Create store, view store, assign user |
| `cypress/e2e/admin-dispatch.cy.ts` | Full dispatch flow through admin UI |
| `cypress/e2e/admin-store-sales.cy.ts` | Store sales dashboard loads with correct data |

---

## 13. Implementation Order & Dependencies

```
Phase 1: Database Migrations (no code dependencies)
  └─ Run: yarn db:migrate

Phase 2: modules/identity (depends on Phase 1)
  ├─ 2.1 UserStoreAssignment entity
  ├─ 2.2 UserStoreRepository interface
  ├─ 2.3 UserStoreRepository implementation
  ├─ 2.4 Use cases (Assign, Remove, List, Get)
  ├─ 2.5 Update libs/roles.ts
  ├─ 2.6 Update libs/session/SessionService.ts
  ├─ 2.7 Update libs/types/express.ts
  ├─ 2.8 Update libs/auth.ts (requireStoreAccess middleware)
  ├─ 2.9 Update admin login flow
  └─ 2.10 Interface layer (controller + router)

Phase 3: modules/store (depends on Phase 1)
  ├─ 3.1 Update Store entity
  ├─ 3.2 Update Store repository
  ├─ 3.3 Update CreateStore use case (auto-create InventoryLocation)
  └─ 3.4 New ListBusinessStores use case

Phase 4: modules/inventory (depends on Phase 1, 3)
  ├─ 4.1 StoreDispatch entity
  ├─ 4.2 StoreDispatchRepository interface
  ├─ 4.3 StoreDispatchRepository implementation
  ├─ 4.4 Use cases (Create, Approve, Dispatch, Receive, List, Get)
  ├─ 4.5 Update InventoryLocation entity (add storeId)
  ├─ 4.6 Update InventoryRepository (storeId queries)
  ├─ 4.7 Interface layer (controller + router)
  └─ 4.8 Domain events

Phase 5: modules/channel (depends on Phase 1)
  ├─ 5.1 GetChannelByCode use case
  ├─ 5.2 Update ChannelRepository
  └─ 5.3 New API endpoint

Phase 6: modules/order (depends on Phase 1, 5)
  ├─ 6.1 Update Order entity
  ├─ 6.2 Update CreateOrderCommand
  ├─ 6.3 Update OrderRepository (filters)
  ├─ 6.4 Update infrastructure repository
  ├─ 6.5 Update ListOrders use case
  ├─ 6.6 New GetStoreSalesSummary use case
  ├─ 6.7 Update OrderCustomerController (channel code → storeId resolution)
  └─ 6.8 New store sales summary endpoint

Phase 7: modules/product (depends on Phase 4)
  ├─ 7.1 GetProductStoreAvailability use case
  └─ 7.2 New API endpoint

Phase 8: web/admin (depends on Phase 2-7)
  ├─ 8.1 Store management views + controller
  ├─ 8.2 Stock dispatch views + controller updates
  ├─ 8.3 Store sales dashboard
  ├─ 8.4 Admin router updates
  ├─ 8.5 Sidebar navigation updates
  └─ 8.6 Existing views updates (add store columns/filters)

Phase 9: RetailPOS (depends on Phase 5, 6)
  ├─ 9.1 Update POSConfig with channelCode/storeId/channelId
  ├─ 9.2 Add Store Selection onboarding step
  ├─ 9.3 Update API client (X-Channel-Code header)
  ├─ 9.4 Update order service (include storeId)
  ├─ 9.5 Update inventory service (filter by store)
  └─ 9.6 Handle dispatch webhook events

Phase 10: Seed data & testing (depends on all phases)
  ├─ 10.1 Seed data file
  ├─ 10.2 Unit tests
  ├─ 10.3 Integration tests
  └─ 10.4 E2E tests
```

### Parallelizable Work

The following can be done in parallel:
- Phase 2 (identity) and Phase 3 (store) — both only depend on Phase 1
- Phase 4 (inventory) and Phase 5 (channel) — independent of each other
- Phase 8.1-8.5 (admin views) can be done incrementally as each module is completed

### Estimated Effort

| Phase | Files to Create | Files to Modify | Complexity |
|---|---|---|---|
| 1. Migrations | 7 | 0 | Low |
| 2. Identity | 6 | 5 | Medium |
| 3. Store | 1 | 4 | Low |
| 4. Inventory | 8 | 3 | High |
| 5. Channel | 1 | 3 | Low |
| 6. Order | 1 | 5 | Medium |
| 7. Product | 1 | 1 | Low |
| 8. Admin UI | 12 | 5 | High |
| 9. RetailPOS | 0 | 6 | Medium |
| 10. Testing | 8 | 0 | Medium |
| **Total** | **~45** | **~32** | |

---

## Appendix A: Data Flow — Order from RetailPOS to CommerceFull

```
RetailPOS (cashier login)
  │
  ├─ 1. Onboarding: configured with channelCode = "POS-KINGSWAY"
  │     POSConfig: { channelCode: "POS-KINGSWAY", storeId: "uuid-kingsway", channelId: "uuid-ch-1" }
  │
  ├─ 2. Cashier completes sale
  │     └─ POST /customer/order
  │         Headers: { Authorization: Bearer ..., X-Channel-Code: "POS-KINGSWAY" }
  │         Body: { items: [...], customerEmail: "...", storeId: "uuid-kingsway",
  │                 channelId: "uuid-ch-1", orderSource: "pos" }
  │
  └─ 3. CommerceFull receives order
        └─ OrderCustomerController.createOrder()
              ├─ Reads X-Channel-Code header → resolves channel → confirms storeId
              ├─ Creates Order with storeId, channelId, createdByUserId, orderSource='pos'
              ├─ Emits 'order.created' event
              └─ Returns order response
```

## Appendix B: Data Flow — Stock Dispatch HQ → Outlet

```
Admin Panel (manager at HQ)
  │
  ├─ 1. Navigate to Dispatches → Create Dispatch
  │     └─ Select: From = "Headquarters", To = "Kingsway Store"
  │         Add items: Petroleum Jelly × 50, Body Cream × 30
  │
  ├─ 2. Submit → POST /admin/dispatches
  │     └─ CreateStoreDispatch use case
  │           ├─ Validates stock at HQ location
  │           ├─ Creates StoreDispatch (status: draft)
  │           └─ Returns dispatch with number DSP-ABC123
  │
  ├─ 3. Manager approves → POST /admin/dispatches/:id/approve
  │     └─ ApproveStoreDispatch use case
  │           ├─ Reserves stock at HQ (reservedQuantity += 50/30)
  │           └─ Status → approved
  │
  ├─ 4. Manager marks dispatched → POST /admin/dispatches/:id/dispatch
  │     └─ DispatchFromStore use case
  │           ├─ Deducts stock at HQ (quantity -= 50/30, releases reservation)
  │           ├─ Records InventoryMovement (type: outbound) at HQ
  │           └─ Status → dispatched
  │           └─ Emits inventory.dispatch.shipped event
  │
  └─ 5. Cashier at Kingsway receives → POST /admin/dispatches/:id/receive
        └─ ReceiveStoreDispatch use case
              ├─ Adds stock at Kingsway location (quantity += 50/30)
              ├─ Records InventoryMovement (type: inbound) at Kingsway
              ├─ Status → received
              └─ Emits inventory.dispatch.received event
                    └─ Webhook → RetailPOS at Kingsway
                          └─ Updates local SQLite inventory
```

## Appendix C: Role Access Matrix

| Action | Admin | Manager | Cashier |
|---|---|---|---|
| View all stores | ✅ | ✅ | ❌ (own store only) |
| Create/edit stores | ✅ | ❌ | ❌ |
| Assign users to stores | ✅ | ✅ | ❌ |
| Create dispatch | ✅ | ✅ | ❌ |
| Approve dispatch | ✅ | ✅ | ❌ |
| Receive dispatch | ✅ | ✅ | ✅ (own store only) |
| View all orders | ✅ | ✅ | ❌ (own store only) |
| Create orders (POS) | ✅ | ✅ | ✅ (own store only) |
| View sales analytics | ✅ | ✅ (all stores) | ❌ |
| Adjust inventory | ✅ | ✅ | ❌ |
| View inventory | ✅ | ✅ | ✅ (own store only) |
| Process invoices at HQ | ✅ | ✅ | ❌ |
