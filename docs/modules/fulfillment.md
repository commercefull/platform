# Fulfillment Feature

## Overview

The Fulfillment feature manages order fulfillment operations including picking, packing, shipping, delivery tracking, and returns. It supports multi-source fulfillment (warehouses, stores, dropship, 3PL partners) and provides a complete fulfillment lifecycle with status tracking.

---

## Use Cases

| ID | Use Case | Actor | Purpose |
|---|---|---|---|
| UC-FLF-001 | Create Fulfillment | Merchant/Admin/System | Create a pending fulfillment for an order with items from a specific source (warehouse, store, dropship, 3PL) |
| UC-FLF-002 | List Fulfillments | Merchant/Admin | List all fulfillments with optional status, order, or source filtering |
| UC-FLF-003 | List Fulfillments by Order | Merchant/Admin | Retrieve all fulfillments for a specific order |
| UC-FLF-004 | Get Fulfillment | Merchant/Admin | Retrieve a specific fulfillment by ID |
| UC-FLF-005 | Process Picking | Warehouse Staff | Start or complete the picking process for a fulfillment |
| UC-FLF-006 | Process Packing | Warehouse Staff | Start or complete the packing process, recording weight and dimensions |
| UC-FLF-007 | Ship Fulfillment | Merchant/Admin | Mark a packed fulfillment as shipped with tracking number and carrier details |
| UC-FLF-008 | Update Tracking | Merchant/Admin | Update tracking number or URL for an existing shipment |
| UC-FLF-009 | Mark Delivered | Merchant/Admin/System | Mark a shipped fulfillment as delivered |
| UC-FLF-010 | Cancel Fulfillment | Merchant/Admin | Cancel a fulfillment that has not been delivered or returned |
| UC-FLF-011 | Initiate Return | Merchant/Admin | Initiate a return for a delivered fulfillment |
| UC-FLF-012 | List Fulfillment Locations | Merchant/Admin | List all fulfillment locations (warehouses, stores, 3PL, dark stores) with optional type/active filtering |
| UC-FLF-013 | Get Fulfillment Location | Merchant/Admin | Retrieve a specific fulfillment location by ID |
| UC-FLF-014 | Create Fulfillment Location | Merchant/Admin | Create a new fulfillment location with type, capabilities, and operating hours |
| UC-FLF-015 | Update Fulfillment Location | Merchant/Admin | Update an existing fulfillment location's details or capabilities |
| UC-FLF-016 | Activate/Deactivate Fulfillment Location | Merchant/Admin | Toggle the active status of a fulfillment location |
| UC-FLF-017 | Find Nearest Fulfillment Locations | Merchant/Admin | Find fulfillment locations sorted by distance from coordinates |
| UC-FLF-018 | List Fulfillment Partners | Merchant/Admin | List all configured fulfillment partners with optional active-only filter |
| UC-FLF-019 | Get Fulfillment Partner | Merchant/Admin | Retrieve a specific fulfillment partner by ID |
| UC-FLF-020 | Create Fulfillment Partner | Merchant/Admin | Create a new fulfillment partner with API configuration and contact details |
| UC-FLF-021 | List Fulfillments by Order (Customer) | Customer | Retrieve all fulfillments for a customer's order |
| UC-FLF-022 | Get Fulfillment (Customer) | Customer | Retrieve a specific fulfillment by ID |
| UC-FLF-023 | Track Fulfillment (Customer) | Customer | Retrieve tracking information for a fulfillment |

### API Endpoints

| ID | Method | Endpoint |
|---|---|---|
| UC-FLF-001 | POST | `/business/fulfillments` |
| UC-FLF-002 | GET | `/business/fulfillments` |
| UC-FLF-003 | GET | `/business/fulfillments/order/:orderId` |
| UC-FLF-004 | GET | `/business/fulfillments/:fulfillmentId` |
| UC-FLF-005 | POST | `/business/fulfillments/:fulfillmentId/pick` |
| UC-FLF-006 | POST | `/business/fulfillments/:fulfillmentId/pack` |
| UC-FLF-007 | POST | `/business/fulfillments/:fulfillmentId/ship` |
| UC-FLF-008 | PUT | `/business/fulfillments/:fulfillmentId/tracking` |
| UC-FLF-009 | POST | `/business/fulfillments/:fulfillmentId/deliver` |
| UC-FLF-010 | POST | `/business/fulfillments/:fulfillmentId/cancel` |
| UC-FLF-011 | POST | `/business/fulfillments/:fulfillmentId/return` |
| UC-FLF-012 | GET | `/business/fulfillment/locations` |
| UC-FLF-013 | GET | `/business/fulfillment/locations/:locationId` |
| UC-FLF-014 | POST | `/business/fulfillment/locations` |
| UC-FLF-015 | PUT | `/business/fulfillment/locations/:locationId` |
| UC-FLF-016 | POST | `/business/fulfillment/locations/:locationId/activate` or `/deactivate` |
| UC-FLF-017 | GET | `/business/fulfillment/locations/nearest` |
| UC-FLF-018 | GET | `/business/fulfillment/partners` |
| UC-FLF-019 | GET | `/business/fulfillment/partners/:partnerId` |
| UC-FLF-020 | POST | `/business/fulfillment/partners` |
| UC-FLF-021 | GET | `/order/:orderId` |
| UC-FLF-022 | GET | `/:fulfillmentId` |
| UC-FLF-023 | GET | `/:fulfillmentId/track` |

---

## Events Emitted

| Event                        | Trigger              | Payload                                    |
| ---------------------------- | -------------------- | ------------------------------------------ |
| `fulfillment.created`        | Fulfillment created  | fulfillmentId, orderId, sourceType         |
| `fulfillment.assigned`       | Fulfillment assigned | fulfillmentId, sourceType, sourceId        |
| `fulfillment.picking`        | Picking started      | fulfillmentId, orderId                     |
| `fulfillment.picked`         | Picking completed    | fulfillmentId, orderId                     |
| `fulfillment.packing`        | Packing started      | fulfillmentId, orderId                     |
| `fulfillment.packed`         | Packing completed    | fulfillmentId, orderId                     |
| `fulfillment.shipped`        | Fulfillment shipped  | fulfillmentId, orderId, trackingNumber     |
| `fulfillment.tracking_updated` | Tracking updated   | fulfillmentId, orderId, trackingNumber     |
| `fulfillment.delivered`      | Fulfillment delivered| fulfillmentId, orderId                     |
| `fulfillment.cancelled`      | Fulfillment cancelled| fulfillmentId, orderId, reason             |
| `fulfillment.returned`       | Return initiated     | fulfillmentId, orderId                     |

---

## Integration Test Coverage

| Use Case                 | Test File                                | Status |
| ------------------------ | ---------------------------------------- | ------ |
| UC-FLF-001 to UC-FLF-004 | `fulfillment/fulfillmentLifecycle.test.ts` | ✅   |
| UC-FLF-005 to UC-FLF-011 | `fulfillment/fulfillmentLifecycle.test.ts` | ✅   |
| UC-FLF-012 to UC-FLF-017 | `fulfillment/fulfillmentLocation.test.ts`   | ✅   |
| UC-FLF-018 to UC-FLF-020 | `fulfillment/fulfillmentLocation.test.ts`   | ✅   |
| UC-FLF-021 to UC-FLF-023 | `fulfillment/fulfillmentLifecycle.test.ts` | ✅   |


<!-- GENERATED:ENDPOINTS:START -->

| Method | Endpoint | Controller | Description |
|---|---|---|---|
| GET | `/:fulfillmentId` | `getFulfillment` | Get fulfillment by ID (customer view) |
| GET | `/:fulfillmentId/track` | `getTrackingInfo` | Track fulfillment |
| GET | `/business/fulfillment/locations` | `isOrganizationLoggedIn` | — |
| POST | `/business/fulfillment/locations` | `isOrganizationLoggedIn` | — |
| GET | `/business/fulfillment/locations/:locationId` | `isOrganizationLoggedIn` | — |
| PUT | `/business/fulfillment/locations/:locationId` | `isOrganizationLoggedIn` | — |
| DELETE | `/business/fulfillment/locations/:locationId` | `isOrganizationLoggedIn` | — |
| POST | `/business/fulfillment/locations/:locationId/activate` | `isOrganizationLoggedIn` | — |
| POST | `/business/fulfillment/locations/:locationId/deactivate` | `isOrganizationLoggedIn` | — |
| GET | `/business/fulfillment/locations/nearest` | `isOrganizationLoggedIn` | — |
| GET | `/business/fulfillment/partners` | `isOrganizationLoggedIn` | — |
| POST | `/business/fulfillment/partners` | `isOrganizationLoggedIn` | — |
| GET | `/business/fulfillment/partners/:partnerId` | `isOrganizationLoggedIn` | — |
| PUT | `/business/fulfillment/partners/:partnerId` | `isOrganizationLoggedIn` | — |
| DELETE | `/business/fulfillment/partners/:partnerId` | `isOrganizationLoggedIn` | — |
| GET | `/business/fulfillments` | `listFulfillments` | List all fulfillments (with filters/pagination) |
| POST | `/business/fulfillments` | `createFulfillment` | Create fulfillment |
| GET | `/business/fulfillments/:fulfillmentId` | `getFulfillment` | Get fulfillment by ID |
| POST | `/business/fulfillments/:fulfillmentId/assign` | `assignFulfillment` | Assign fulfillment |
| POST | `/business/fulfillments/:fulfillmentId/cancel` | `cancelFulfillment` | Cancel fulfillment |
| POST | `/business/fulfillments/:fulfillmentId/deliver` | `markDelivered` | Mark delivered |
| POST | `/business/fulfillments/:fulfillmentId/pack` | `processPacking` | Process packing |
| POST | `/business/fulfillments/:fulfillmentId/pick` | `processPicking` | Process picking |
| POST | `/business/fulfillments/:fulfillmentId/return` | `initiateReturn` | Initiate return |
| POST | `/business/fulfillments/:fulfillmentId/ship` | `shipOrder` | Ship order |
| PUT | `/business/fulfillments/:fulfillmentId/tracking` | `updateTracking` | Update tracking info |
| GET | `/business/fulfillments/order/:orderId` | `listFulfillmentsByOrder` | List by order |
| GET | `/order/:orderId` | `listFulfillmentsByOrder` | List fulfillments by order (customer view) |

<!-- GENERATED:ENDPOINTS:END -->
