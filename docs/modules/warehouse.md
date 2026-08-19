# Warehouse Feature

## Overview

The Warehouse feature manages warehouse operations including receiving, put-away, picking, packing, and shipping. It supports multi-warehouse inventory and warehouse management system (WMS) functionality.

---

## Use Cases

| ID | Use Case | Actor | Purpose |
|---|---|---|---|
| UC-WHS-001 | List Warehouses | Merchant/Admin | List all warehouse locations with optional active filtering |
| UC-WHS-002 | Get Warehouse | Merchant/Admin | Retrieve a specific warehouse by ID |
| UC-WHS-003 | Create Warehouse | Merchant/Admin | Create a warehouse (owned, 3pl, dropship) with address and capacity |
| UC-WHS-004 | Update Warehouse | Merchant/Admin | Update an existing warehouse's configuration |
| UC-WHS-005 | Delete Warehouse | Merchant/Admin | Permanently delete a warehouse |
| UC-WHS-006 | List Warehouse Zones | Merchant/Admin | List all zones within a specific warehouse |
| UC-WHS-007 | Create Warehouse Zone | Merchant/Admin | Create a zone within a warehouse for inventory organization |
| UC-WHS-008 | Get Warehouse Zone | Merchant/Admin | Retrieve a specific warehouse zone by ID |
| UC-WHS-009 | Update Warehouse Zone | Merchant/Admin | Update an existing warehouse zone |
| UC-WHS-010 | Delete Warehouse Zone | Merchant/Admin | Permanently delete a warehouse zone |
| UC-WHS-011 | List Bin Locations | Merchant/Admin | List all bin locations within a specific warehouse |
| UC-WHS-012 | Create Bin Location | Merchant/Admin | Create a bin location with type, dimensions, and pick/receive/mixed flags |
| UC-WHS-013 | Get Bin Location | Merchant/Admin | Retrieve a specific bin location by ID |
| UC-WHS-014 | Update Bin Location | Merchant/Admin | Update an existing bin location's configuration |
| UC-WHS-015 | Delete Bin Location | Merchant/Admin | Permanently delete a bin location |
| UC-WHS-016 | Create Receiving Record | Warehouse Staff | Create a receiving record for incoming inventory (PO, transfer, return, or adjustment) |
| UC-WHS-017 | List Receiving Records | Warehouse Staff | List all receiving records for a warehouse with optional status filtering |
| UC-WHS-018 | Get Receiving Record | Warehouse Staff | Retrieve a specific receiving record by ID |
| UC-WHS-019 | Complete Receiving | Warehouse Staff | Complete a receiving record, processing received items and discrepancies |
| UC-WHS-020 | Create Pick/Pack Task | System/Merchant | Create a pick/pack task for order fulfillment with items and assignment |
| UC-WHS-021 | List Pick/Pack Tasks | Warehouse Staff | List all pick/pack tasks for a warehouse with optional status filtering |
| UC-WHS-022 | Get Pick/Pack Task | Warehouse Staff | Retrieve a specific pick/pack task by ID |
| UC-WHS-023 | Start Picking | Warehouse Staff | Start the picking phase of a pick/pack task |
| UC-WHS-024 | Complete Picking | Warehouse Staff | Complete the picking phase of a pick/pack task |
| UC-WHS-025 | Start Packing | Warehouse Staff | Start the packing phase of a pick/pack task |
| UC-WHS-026 | Complete Packing | Warehouse Staff | Complete the packing phase of a pick/pack task |
| UC-WHS-027 | Assign Pick/Pack Task | Merchant/Admin | Assign a pick/pack task to a specific warehouse staff member |

### API Endpoints

| ID | Method | Endpoint |
|---|---|---|
| UC-WHS-001 | GET | `/business/warehouses` |
| UC-WHS-002 | GET | `/business/warehouses/:id` |
| UC-WHS-003 | POST | `/business/warehouses` |
| UC-WHS-004 | PUT | `/business/warehouses/:id` |
| UC-WHS-005 | DELETE | `/business/warehouses/:id` |
| UC-WHS-006 | GET | `/business/warehouses/:id/zones` |
| UC-WHS-007 | POST | `/business/warehouses/:id/zones` |
| UC-WHS-008 | GET | `/business/warehouses/:id/zones/:zoneId` |
| UC-WHS-009 | PUT | `/business/warehouses/:id/zones/:zoneId` |
| UC-WHS-010 | DELETE | `/business/warehouses/:id/zones/:zoneId` |
| UC-WHS-011 | GET | `/business/warehouses/:id/bins` |
| UC-WHS-012 | POST | `/business/warehouses/:id/bins` |
| UC-WHS-013 | GET | `/business/warehouses/:id/bins/:binId` |
| UC-WHS-014 | PUT | `/business/warehouses/:id/bins/:binId` |
| UC-WHS-015 | DELETE | `/business/warehouses/:id/bins/:binId` |
| UC-WHS-016 | POST | `/business/warehouses/:id/receiving` |
| UC-WHS-017 | GET | `/business/warehouses/:id/receiving` |
| UC-WHS-018 | GET | `/business/warehouses/:id/receiving/:receivingId` |
| UC-WHS-019 | POST | `/business/warehouses/:id/receiving/:receivingId/complete` |
| UC-WHS-020 | POST | `/business/warehouses/:id/pick-pack` |
| UC-WHS-021 | GET | `/business/warehouses/:id/pick-pack` |
| UC-WHS-022 | GET | `/business/warehouses/:id/pick-pack/:pickPackId` |
| UC-WHS-023 | POST | `/business/warehouses/:id/pick-pack/:pickPackId/start-picking` |
| UC-WHS-024 | POST | `/business/warehouses/:id/pick-pack/:pickPackId/complete-picking` |
| UC-WHS-025 | POST | `/business/warehouses/:id/pick-pack/:pickPackId/start-packing` |
| UC-WHS-026 | POST | `/business/warehouses/:id/pick-pack/:pickPackId/complete-packing` |
| UC-WHS-027 | POST | `/business/warehouses/:id/pick-pack/:pickPackId/assign` |

---

## Events Emitted

| Event                           | Trigger                  | Payload                              |
| ------------------------------- | ------------------------ | ------------------------------------ |
| `warehouse.zone.created`        | Zone created             | zoneId, warehouseId, name, code      |
| `warehouse.zone.updated`        | Zone updated             | zoneId, changes                      |
| `warehouse.zone.deleted`        | Zone deleted             | zoneId                               |
| `warehouse.bin.created`         | Bin created              | binId, warehouseId, locationCode     |
| `warehouse.bin.updated`         | Bin updated              | binId, changes                       |
| `warehouse.bin.deleted`         | Bin deleted              | binId                                |
| `warehouse.receiving.created`   | Receiving record created | receivingId, warehouseId, receiptNumber |
| `warehouse.receiving.completed` | Receiving completed      | receivingId, warehouseId             |
| `warehouse.pick.created`        | Pick/pack created        | pickPackId, warehouseId, pickPackNumber |
| `warehouse.pick.completed`      | Picking completed        | pickPackId, warehouseId              |
| `warehouse.pack.completed`      | Packing completed        | pickPackId, warehouseId              |

---

## Integration Test Coverage

| Use Case                  | Test File                            | Status |
| ------------------------- | ------------------------------------ | ------ |
| UC-WHS-001 to UC-WHS-005  | `warehouse/warehouse.test.ts`        | ✅     |
| UC-WHS-006 to UC-WHS-010  | `warehouse/warehouseExpanded.test.ts`| ✅     |
| UC-WHS-011 to UC-WHS-015  | `warehouse/warehouseExpanded.test.ts`| ✅     |
| UC-WHS-016 to UC-WHS-019  | `warehouse/warehouseExpanded.test.ts`| 🟡     |
| UC-WHS-020 to UC-WHS-027  | `warehouse/warehouseExpanded.test.ts`| 🟡     |


<!-- GENERATED:ENDPOINTS:START -->

| Method | Endpoint | Controller | Description |
|---|---|---|---|
| GET | `/business/organizations/:organizationId/warehouses` | `getWarehousesByMerchant` | Organization warehouses |
| GET | `/business/warehouses` | `getWarehouses` | Warehouse listing with various filters |
| POST | `/business/warehouses` | `createWarehouse` | Warehouse CRUD operations |
| GET | `/business/warehouses/:id` | `getWarehouseById` | — |
| PUT | `/business/warehouses/:id` | `updateWarehouse` | — |
| DELETE | `/business/warehouses/:id` | `deleteWarehouse` | — |
| POST | `/business/warehouses/:id/activate` | `activateWarehouse` | — |
| POST | `/business/warehouses/:id/bins` | `createBin` | — |
| GET | `/business/warehouses/:id/bins` | `getBins` | — |
| GET | `/business/warehouses/:id/bins/:binId` | `getBinById` | — |
| PUT | `/business/warehouses/:id/bins/:binId` | `updateBin` | — |
| DELETE | `/business/warehouses/:id/bins/:binId` | `deleteBin` | — |
| POST | `/business/warehouses/:id/deactivate` | `deactivateWarehouse` | — |
| POST | `/business/warehouses/:id/default` | `setDefaultWarehouse` | Warehouse status management |
| POST | `/business/warehouses/:id/pick-pack` | `createPickPack` | — |
| GET | `/business/warehouses/:id/pick-pack` | `getPickPacks` | — |
| GET | `/business/warehouses/:id/pick-pack/:pickPackId` | `getPickPackById` | — |
| POST | `/business/warehouses/:id/pick-pack/:pickPackId/assign` | `assignPickPack` | — |
| POST | `/business/warehouses/:id/pick-pack/:pickPackId/complete-packing` | `completePacking` | — |
| POST | `/business/warehouses/:id/pick-pack/:pickPackId/complete-picking` | `completePicking` | — |
| POST | `/business/warehouses/:id/pick-pack/:pickPackId/start-packing` | `startPacking` | — |
| POST | `/business/warehouses/:id/pick-pack/:pickPackId/start-picking` | `startPicking` | — |
| POST | `/business/warehouses/:id/receiving` | `createReceiving` | — |
| GET | `/business/warehouses/:id/receiving` | `getReceiving` | — |
| GET | `/business/warehouses/:id/receiving/:receivingId` | `getReceivingById` | — |
| POST | `/business/warehouses/:id/receiving/:receivingId/complete` | `completeReceiving` | — |
| POST | `/business/warehouses/:id/shipping-methods` | `addShippingMethod` | Shipping method management |
| DELETE | `/business/warehouses/:id/shipping-methods/:method` | `removeShippingMethod` | — |
| POST | `/business/warehouses/:id/zones` | `createZone` | — |
| GET | `/business/warehouses/:id/zones` | `getZones` | — |
| GET | `/business/warehouses/:id/zones/:zoneId` | `getZoneById` | — |
| PUT | `/business/warehouses/:id/zones/:zoneId` | `updateZone` | — |
| DELETE | `/business/warehouses/:id/zones/:zoneId` | `deleteZone` | — |
| GET | `/business/warehouses/code/:code` | `getWarehouseByCode` | — |
| GET | `/business/warehouses/country/:country` | `getWarehousesByCountry` | — |
| GET | `/business/warehouses/default` | `getDefaultWarehouse` | — |
| GET | `/business/warehouses/fulfillment-centers` | `getFulfillmentCenters` | — |
| GET | `/business/warehouses/nearest` | `findNearestWarehouses` | — |
| GET | `/business/warehouses/return-centers` | `getReturnCenters` | — |
| GET | `/business/warehouses/statistics` | `getWarehouseStatistics` | — |
| GET | `/customer/warehouse/:id` | `getStoreById` | — |
| GET | `/customer/warehouse/:id/availability/:productId` | `checkStoreAvailability` | — |
| GET | `/customer/warehouse/city/:city` | `getStoresByCity` | — |
| GET | `/customer/warehouse/country/:country` | `getStoresByCountry` | — |
| GET | `/customer/warehouse/nearest` | `findNearestStores` | Store Locator Routes (Public) |

<!-- GENERATED:ENDPOINTS:END -->
