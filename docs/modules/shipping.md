# Shipping Feature

## Overview

The Shipping feature manages carrier integrations, rate calculations, and label generation. It works alongside the Distribution feature to provide end-to-end shipping functionality.

---

## Use Cases

| ID         | Use Case              | Actor          | Purpose                                                                               |
| ---------- | --------------------- | -------------- | ------------------------------------------------------------------------------------- |
| UC-SHP-001 | List Carriers         | Merchant/Admin | List all configured shipping carriers                                                 |
| UC-SHP-002 | Get Carrier           | Merchant/Admin | Retrieve a specific carrier configuration by ID                                       |
| UC-SHP-003 | Create Carrier        | Merchant/Admin | Configure a new shipping carrier (UPS, FedEx, USPS, DHL, custom) with API credentials |
| UC-SHP-004 | Update Carrier        | Merchant/Admin | Update an existing carrier's configuration or credentials                             |
| UC-SHP-005 | Delete Carrier        | Merchant/Admin | Permanently remove a shipping carrier                                                 |
| UC-SHP-006 | Get Shipping Rates    | Customer       | Retrieve available shipping rates sorted by price with estimated delivery dates       |
| UC-SHP-007 | Create Shipping Label | Merchant/Admin | Generate a shipping label for an order and start tracking                             |
| UC-SHP-008 | Get Shipping Label    | Merchant/Admin | Retrieve a shipping label by ID                                                       |
| UC-SHP-009 | Void Shipping Label   | Merchant/Admin | Void a previously generated shipping label                                            |
| UC-SHP-010 | Get Tracking Info     | Customer       | Retrieve shipment tracking status by tracking number                                  |

### API Endpoints

| ID         | Method | Endpoint                             |
| ---------- | ------ | ------------------------------------ |
| UC-SHP-001 | GET    | `/business/shipping/carriers`        |
| UC-SHP-002 | GET    | `/business/shipping/carriers/:id`    |
| UC-SHP-003 | POST   | `/business/shipping/carriers`        |
| UC-SHP-004 | PUT    | `/business/shipping/carriers/:id`    |
| UC-SHP-005 | DELETE | `/business/shipping/carriers/:id`    |
| UC-SHP-006 | POST   | `/shipping/rates`                    |
| UC-SHP-007 | POST   | `/business/shipping/labels`          |
| UC-SHP-008 | GET    | `/business/shipping/labels/:id`      |
| UC-SHP-009 | POST   | `/business/shipping/labels/:id/void` |
| UC-SHP-010 | GET    | `/shipping/tracking/:trackingNumber` |

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
| POST | `/calculate-rates` | `asyncHandler(shippingController.calculateRates)` | — |
| POST | `/calculate-rates` | `asyncHandler(shippingController.calculateRates)` | Calculate shipping rates for an order |
| GET | `/carriers` | `asyncHandler(shippingController.getCarriers)` | — |
| POST | `/carriers` | `asyncHandler(shippingController.createCarrier)` | — |
| GET | `/carriers/:id` | `asyncHandler(shippingController.getCarrierById)` | — |
| PUT | `/carriers/:id` | `asyncHandler(shippingController.updateCarrier)` | — |
| DELETE | `/carriers/:id` | `asyncHandler(shippingController.deleteCarrier)` | — |
| POST | `/estimate-delivery` | `asyncHandler(shippingController.estimateDelivery)` | Estimate delivery time for a shipping method |
| POST | `/labels` | `asyncHandler(shippingController.createLabel)` | — |
| GET | `/labels/:id` | `asyncHandler(shippingController.getLabel)` | — |
| POST | `/labels/:id/void` | `asyncHandler(shippingController.voidLabel)` | — |
| GET | `/labels/order/:orderId` | `asyncHandler(shippingController.getLabelsByOrder)` | — |
| GET | `/methods` | `asyncHandler(shippingController.getMethods)` | — |
| POST | `/methods` | `asyncHandler(shippingController.createMethod)` | — |
| GET | `/methods` | `asyncHandler(shippingController.getMethods)` | Get available shipping methods (for checkout) |
| GET | `/methods/:id` | `asyncHandler(shippingController.getMethodById)` | — |
| PUT | `/methods/:id` | `asyncHandler(shippingController.updateMethod)` | — |
| DELETE | `/methods/:id` | `asyncHandler(shippingController.deleteMethod)` | — |
| GET | `/packaging-types` | `asyncHandler(shippingController.getPackagingTypes)` | — |
| POST | `/packaging-types` | `asyncHandler(shippingController.createPackagingType)` | — |
| GET | `/packaging-types` | `asyncHandler(shippingController.getPackagingTypes)` | Get packaging types (for reference) |
| GET | `/packaging-types/:id` | `asyncHandler(shippingController.getPackagingTypeById)` | — |
| PUT | `/packaging-types/:id` | `asyncHandler(shippingController.updatePackagingType)` | — |
| DELETE | `/packaging-types/:id` | `asyncHandler(shippingController.deletePackagingType)` | — |
| GET | `/rates` | `asyncHandler(shippingController.getRates)` | — |
| POST | `/rates` | `asyncHandler(shippingController.createRate)` | — |
| GET | `/rates/:id` | `asyncHandler(shippingController.getRateById)` | — |
| PUT | `/rates/:id` | `asyncHandler(shippingController.updateRate)` | — |
| DELETE | `/rates/:id` | `asyncHandler(shippingController.deleteRate)` | — |
| GET | `/rates/:rateId/surcharges` | `asyncHandler(shippingController.getSurchargesByRate)` | — |
| POST | `/surcharges` | `asyncHandler(shippingController.createSurcharge)` | — |
| GET | `/surcharges/:id` | `asyncHandler(shippingController.getSurchargeById)` | — |
| PUT | `/surcharges/:id` | `asyncHandler(shippingController.updateSurcharge)` | — |
| DELETE | `/surcharges/:id` | `asyncHandler(shippingController.deleteSurcharge)` | — |
| GET | `/track` | `asyncHandler(shippingController.trackShipment)` | — |
| GET | `/track/:id` | `asyncHandler(shippingController.trackShipment)` | — |
| GET | `/zones` | `asyncHandler(shippingController.getZones)` | — |
| POST | `/zones` | `asyncHandler(shippingController.createZone)` | — |
| GET | `/zones/:id` | `asyncHandler(shippingController.getZoneById)` | — |
| PUT | `/zones/:id` | `asyncHandler(shippingController.updateZone)` | — |
| DELETE | `/zones/:id` | `asyncHandler(shippingController.deleteZone)` | — |

<!-- GENERATED:ENDPOINTS:END -->
