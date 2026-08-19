# Shipping Feature

## Overview

The Shipping feature manages carrier integrations, rate calculations, and label generation. It works alongside the Distribution feature to provide end-to-end shipping functionality.

---

## Use Cases

| ID | Use Case | Actor | Purpose |
|---|---|---|---|
| UC-SHP-001 | List Carriers | Merchant/Admin | List all configured shipping carriers |
| UC-SHP-002 | Get Carrier | Merchant/Admin | Retrieve a specific carrier configuration by ID |
| UC-SHP-003 | Create Carrier | Merchant/Admin | Configure a new shipping carrier (UPS, FedEx, USPS, DHL, custom) with API credentials |
| UC-SHP-004 | Update Carrier | Merchant/Admin | Update an existing carrier's configuration or credentials |
| UC-SHP-005 | Delete Carrier | Merchant/Admin | Permanently remove a shipping carrier |
| UC-SHP-006 | Get Shipping Rates | Customer | Retrieve available shipping rates sorted by price with estimated delivery dates |
| UC-SHP-007 | Create Shipping Label | Merchant/Admin | Generate a shipping label for an order and start tracking |
| UC-SHP-008 | Get Shipping Label | Merchant/Admin | Retrieve a shipping label by ID |
| UC-SHP-009 | Void Shipping Label | Merchant/Admin | Void a previously generated shipping label |
| UC-SHP-010 | Get Tracking Info | Customer | Retrieve shipment tracking status by tracking number |

### API Endpoints

| ID | Method | Endpoint |
|---|---|---|
| UC-SHP-001 | GET | `/business/shipping/carriers` |
| UC-SHP-002 | GET | `/business/shipping/carriers/:id` |
| UC-SHP-003 | POST | `/business/shipping/carriers` |
| UC-SHP-004 | PUT | `/business/shipping/carriers/:id` |
| UC-SHP-005 | DELETE | `/business/shipping/carriers/:id` |
| UC-SHP-006 | POST | `/shipping/rates` |
| UC-SHP-007 | POST | `/business/shipping/labels` |
| UC-SHP-008 | GET | `/business/shipping/labels/:id` |
| UC-SHP-009 | POST | `/business/shipping/labels/:id/void` |
| UC-SHP-010 | GET | `/shipping/tracking/:trackingNumber` |

---

## Events Emitted

| Event                       | Trigger           | Payload                          |
| --------------------------- | ----------------- | -------------------------------- |
| `shipping.label.created`    | Label generated   | labelId, orderId, trackingNumber |
| `shipping.label.voided`     | Label voided      | labelId                          |
| `shipping.tracking.updated` | Tracking update   | trackingNumber, status           |
| `shipping.delivered`        | Package delivered | trackingNumber, orderId          |

---

## Integration Test Coverage

| Use Case                 | Test File                           | Status |
| ------------------------ | ----------------------------------- | ------ |
| UC-SHP-001 to UC-SHP-005 | `shipping/shipping.test.ts`         | ✅     |
| UC-SHP-006               | `shipping/shipping.test.ts`         | ✅     |
| UC-SHP-007 to UC-SHP-009 | `shipping/shippingExpanded.test.ts` | ✅     |
| UC-SHP-010               | `shipping/shippingExpanded.test.ts` | ✅     |


<!-- GENERATED:ENDPOINTS:START -->

| Method | Endpoint | Controller | Description |
|---|---|---|---|
| POST | `/business/calculate-rates` | `calculateRates` | — |
| GET | `/business/carriers` | `getCarriers` | — |
| POST | `/business/carriers` | `createCarrier` | — |
| GET | `/business/carriers/:id` | `getCarrierById` | — |
| PUT | `/business/carriers/:id` | `updateCarrier` | — |
| DELETE | `/business/carriers/:id` | `deleteCarrier` | — |
| POST | `/business/labels` | `createLabel` | — |
| GET | `/business/labels/:id` | `getLabel` | — |
| POST | `/business/labels/:id/void` | `voidLabel` | — |
| GET | `/business/labels/order/:orderId` | `getLabelsByOrder` | — |
| GET | `/business/methods` | `getMethods` | — |
| POST | `/business/methods` | `createMethod` | — |
| GET | `/business/methods/:id` | `getMethodById` | — |
| PUT | `/business/methods/:id` | `updateMethod` | — |
| DELETE | `/business/methods/:id` | `deleteMethod` | — |
| GET | `/business/packaging-types` | `getPackagingTypes` | — |
| POST | `/business/packaging-types` | `createPackagingType` | — |
| GET | `/business/packaging-types/:id` | `getPackagingTypeById` | — |
| PUT | `/business/packaging-types/:id` | `updatePackagingType` | — |
| DELETE | `/business/packaging-types/:id` | `deletePackagingType` | — |
| GET | `/business/rates` | `getRates` | — |
| POST | `/business/rates` | `createRate` | — |
| GET | `/business/rates/:id` | `getRateById` | — |
| PUT | `/business/rates/:id` | `updateRate` | — |
| DELETE | `/business/rates/:id` | `deleteRate` | — |
| GET | `/business/track` | `trackShipment` | — |
| GET | `/business/track/:id` | `trackShipment` | — |
| GET | `/business/zones` | `getZones` | — |
| POST | `/business/zones` | `createZone` | — |
| GET | `/business/zones/:id` | `getZoneById` | — |
| PUT | `/business/zones/:id` | `updateZone` | — |
| DELETE | `/business/zones/:id` | `deleteZone` | — |
| POST | `/customer/calculate-rates` | `calculateRates` | Calculate shipping rates for an order |
| POST | `/customer/estimate-delivery` | `estimateDelivery` | Estimate delivery time for a shipping method |
| GET | `/customer/methods` | `getMethods` | Get available shipping methods (for checkout) |
| GET | `/customer/packaging-types` | `getPackagingTypes` | Get packaging types (for reference) |

<!-- GENERATED:ENDPOINTS:END -->
