# Store Feature

## Overview

The Store feature manages store entities for both marketplace (merchant-owned) and multi-store (organization-owned) scenarios. It supports store hierarchy, BOPIS (Buy Online, Pick Up In Store) configuration, local delivery zones, and store listing with filtering and pagination.

---

## Use Cases

| ID | Use Case | Actor | Purpose |
|---|---|---|---|
| UC-STR-001 | List Stores | Merchant/Admin | List stores with filtering by type, ownership, status, search, and pagination |
| UC-STR-002 | Create Store | Merchant/Admin | Create a store (merchant_store or organization_store) with unique slug and optional hierarchy |
| UC-STR-003 | Get Store | Merchant/Admin | Retrieve a specific store by ID or slug |
| UC-STR-004 | Update Store | Merchant/Admin | Update an existing store's fields (only provided fields are updated) |
| UC-STR-005 | Delete Store | Merchant/Admin | Soft delete a store |
| UC-STR-006 | Get Stores by Organization | Merchant/Admin | Retrieve all stores belonging to a specific organization |
| UC-STR-007 | Get Active Stores | Merchant/Admin | Retrieve all active stores |
| UC-STR-008 | Configure Store Pickup / BOPIS | Merchant/Admin | Enable/disable Buy Online Pick Up In Store with prepare time, hold days, notifications, and curbside options |
| UC-STR-009 | Set Local Delivery Zone | Merchant/Admin | Enable/disable local delivery with radius or postal codes, fees, and daily order limits |
| UC-STR-010 | Create Store Hierarchy | Merchant/Admin | Link multiple stores in a hierarchy with shared inventory, catalog, and cross-store settings |
| UC-STR-011 | List Stores | Customer/Guest | Browse active stores (public endpoint) |
| UC-STR-012 | Get Store | Customer/Guest | Retrieve a specific store's public details by ID |

### API Endpoints

| ID | Method | Endpoint |
|---|---|---|
| UC-STR-001 | GET | `/business/stores` |
| UC-STR-002 | POST | `/business/stores` |
| UC-STR-003 | GET | `/business/stores/:storeId` or `/business/stores/slug/:slug` |
| UC-STR-004 | PUT | `/business/stores/:storeId` |
| UC-STR-005 | DELETE | `/business/stores/:storeId` |
| UC-STR-006 | GET | `/business/stores/organization/:organizationId` |
| UC-STR-007 | GET | `/business/stores/active` |
| UC-STR-008 | PUT | `/business/stores/:storeId/pickup` |
| UC-STR-009 | PUT | `/business/stores/:storeId/local-delivery` |
| UC-STR-010 | POST | `/business/stores/hierarchy` |
| UC-STR-011 | GET | `/stores` |
| UC-STR-012 | GET | `/stores/:storeId` |

---

## Events Emitted

| Event             | Trigger         | Payload                    |
| ----------------- | --------------- | -------------------------- |
| `store.created`   | Store created   | storeId, name, storeType   |
| `store.updated`   | Store modified  | storeId, changes           |
| `store.deleted`   | Store deleted   | storeId                    |

---

## Integration Test Coverage

| Use Case    | Test File                          | Status |
| ----------- | ---------------------------------- | ------ |
| UC-STR-001  | `store/hierarchyAndList.test.ts`   | ✅     |
| UC-STR-002  | `store/storeCrud.test.ts`          | ✅     |
| UC-STR-003  | `store/storeCrud.test.ts`          | ✅     |
| UC-STR-004  | `store/storeCrud.test.ts`          | ✅     |
| UC-STR-005  | `store/storeCrud.test.ts`          | ✅     |
| UC-STR-006  | `store/storeCrud.test.ts`          | ✅     |
| UC-STR-007  | `store/store.test.ts`              | ✅     |
| UC-STR-008  | `store/storeCrud.test.ts`          | ✅     |
| UC-STR-009  | `store/storeCrud.test.ts`          | ✅     |
| UC-STR-010  | `store/hierarchyAndList.test.ts`   | ✅     |
| UC-STR-011  | `store/store.test.ts`              | ✅     |
| UC-STR-012  | `store/store.test.ts`              | ✅     |


<!-- GENERATED:ENDPOINTS:START -->

| Method | Endpoint | Controller | Description |
|---|---|---|---|
| GET | `/customer/stores` | `async (req: TypedRequest, res: Response) => {
  try {
    co` | — |
| GET | `/customer/stores/:storeId` | `async (req: TypedRequest, res: Response) => {
  try {
    co` | — |
| POST | `/stores` | `bind` | Create store |
| GET | `/stores` | `bind` | List stores with filtering and pagination |
| GET | `/stores/:storeId` | `bind` | Get store by ID |
| PUT | `/stores/:storeId` | `bind` | Update store |
| DELETE | `/stores/:storeId` | `bind` | Delete store |
| PUT | `/stores/:storeId/local-delivery` | `bind` | Set local delivery zone |
| PUT | `/stores/:storeId/pickup` | `bind` | Configure store pickup (BOPIS) |
| GET | `/stores/active` | `bind` | Get active stores (must be before :storeId to avoid collision) |
| GET | `/stores/business/:organizationId` | `bind` | Get stores by business |
| POST | `/stores/hierarchy` | `bind` | Create store hierarchy |
| GET | `/stores/slug/:slug` | `bind` | Get store by slug |

<!-- GENERATED:ENDPOINTS:END -->
