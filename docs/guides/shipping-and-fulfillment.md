# Shipping and Fulfillment Setup

This guide covers configuring how orders ship and how fulfillments are
executed: carriers, shipping methods, zones, rates, packaging, surcharges,
labels, and the pick → pack → ship → deliver lifecycle.

## The shipping model

```
Carrier            shipping provider (UPS, FedEx, Royal Mail, in-house…)
└── Method         named service (ground, express, next-day…)

Zone               geographic scope a rate applies to
└── Rate           price for a method × zone (+ destination conditions)
    └── Surcharge  extra fees layered on a rate

PackagingType      box/envelope definitions used at pack time

Order → Fulfillment → pick → pack → ship → deliver (+ label, tracking)
```

## 1. Carriers and methods

Carriers are the shipping providers; methods are the services they offer
(e.g. `UPS_EXPRESS`). Methods can declare which destination scopes they
support (`domestic`, `international`, `both`) — international rates only
resolve when the method allows them.

| Method                | Path                 | Purpose      |
| --------------------- | -------------------- | ------------ |
| `GET/POST/PUT/DELETE` | `/business/carriers` | Carrier CRUD |
| `GET/POST/PUT/DELETE` | `/business/methods`  | Method CRUD  |

## 2. Zones, rates, and surcharges

Rates are priced per **zone** (the geographic scope) × **method**. An order
destination resolves to a zone; only rates in that zone and matching the
destination scope are quotable.

| Method                | Path                                 | Purpose              |
| --------------------- | ------------------------------------ | -------------------- |
| `GET/POST/PUT/DELETE` | `/business/zones`                    | Zone CRUD            |
| `GET/POST/PUT/DELETE` | `/business/rates`                    | Rate CRUD            |
| `GET`                 | `/business/rates/:rateId/surcharges` | Surcharges on a rate |
| `GET/POST/DELETE`     | `/business/surcharges`               | Surcharge CRUD       |
| `GET/POST/PUT/DELETE` | `/business/packaging-types`          | Packaging CRUD       |

Rate configuration pitfalls:

- A store shipping cross-border needs an **international zone + rate** —
  without one, foreign destinations see no deliverable methods. The
  enterprise seed adds an international `UPS_EXPRESS` rate covering DE/FR.
- Rates can carry conditions (e.g. free shipping above a threshold) — a
  legitimately free method still prices as a method, not an error.

## 3. Rate quoting and delivery estimates

| Method | Path                          | Purpose                     |
| ------ | ----------------------------- | --------------------------- |
| `POST` | `/business/calculate-rates`   | Quote shipping for an order |
| `POST` | `/business/estimate-delivery` | Delivery estimate           |

Checkout resolves deliverable methods at the shipping step and re-quotes tax
on the chosen method's cost at the payment boundary, so shipping-tax changes
from a late method selection are captured.

## 4. Labels and tracking

| Method | Path                                            | Purpose                 |
| ------ | ----------------------------------------------- | ----------------------- |
| `POST` | `/business/labels`                              | Create a shipping label |
| `GET`  | `/business/labels/:id` `/labels/order/:orderId` | Label lookup            |
| `POST` | `/business/labels/:id/void`                     | Void a label            |
| `GET`  | `/business/track` `/track/:id`                  | Tracking                |

## 5. Fulfillment lifecycle

Every physical order produces one or more fulfillments that walk the
pick → pack → ship → deliver pipeline. Digital-only orders skip fulfillment
entirely.

| Method     | Path                                                         | Purpose              |
| ---------- | ------------------------------------------------------------ | -------------------- |
| `GET/POST` | `/business/fulfillments`                                     | List / create        |
| `GET`      | `/business/fulfillments/:fulfillmentId`                      | Detail               |
| `GET`      | `/business/fulfillments/order/:orderId`                      | Order's fulfillments |
| `POST`     | `/business/fulfillments/:id/pick` `/pack` `/ship` `/deliver` | Stage transitions    |
| `POST`     | `/business/fulfillments/:id/assign`                          | Assign a handler     |
| `POST`     | `/business/fulfillments/:id/cancel` `/return`                | Cancel / return      |
| `PUT`      | `/business/fulfillments/:id/tracking`                        | Update tracking      |

Customers can track their own fulfillments via `/customer/fulfillments/:id`
and `/customer/fulfillments/:id/track`.

## 6. Fulfillment locations and partners

Where fulfillment executes — store back-rooms, warehouses, third-party
partners.

| Method                | Path                                                         | Purpose          |
| --------------------- | ------------------------------------------------------------ | ---------------- |
| `GET/POST/PUT/DELETE` | `/business/fulfillment/locations`                            | Location CRUD    |
| `GET`                 | `/business/fulfillment/locations/nearest`                    | Nearest location |
| `POST`                | `/business/fulfillment/locations/:id/activate` `/deactivate` | Availability     |
| `GET/POST/PUT/DELETE` | `/business/fulfillment/partners`                             | 3PL partners     |

## 7. Wiring it together

For a regional setup (see [Organization Setup](organization-setup.md)):

1. Each physical/hybrid **store** links to a **warehouse**; inventory
   **locations** inside it hold stock.
2. **Zones + rates** cover every region the store ships to — domestic for
   the home region, an international zone for cross-border.
3. Checkout quotes a method → tax re-quotes on the chosen method → payment
   reserves stock against the store's warehouse.
4. On success, a **fulfillment** is created (skipped for digital-only
   orders) and walks pick → pack → ship → deliver.
5. Reservations held against the warehouse are consumed at fulfillment;
   cancelled/failed orders release them automatically.

Admin UI: `/admin/shipping` and `/admin/operations` (fulfillment/dispatch).

## Related guides

- [Organization Setup](organization-setup.md) — warehouses and inventory
  locations that fulfillment routes through
- [Regional Commerce Rollout Status](regional-commerce-rollout-progress.md)
  — the seeded shipping configuration (incl. the international rate)
