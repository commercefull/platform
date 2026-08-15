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

| Use Case                 | Test File                   | Status |
| ------------------------ | --------------------------- | ------ |
| UC-SHP-001 to UC-SHP-005 | `shipping/shipping.test.ts` | ✅     |
| UC-SHP-006               | `shipping/shipping.test.ts` | ✅     |
| UC-SHP-007 to UC-SHP-009 | —                           | ❌     |
| UC-SHP-010               | —                           | ❌     |
