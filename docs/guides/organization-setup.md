# Organization Setup

This guide walks through standing up a complete commerce organization: the
organization itself, its stores, sales channels, currencies, tax
configuration, warehouses, and inventory. Follow the sections in order —
each layer depends on the ones before it.

> **Fast path:** `seeds/20261002110000_seedEnterpriseRegionalCommerce.js`
> seeds a full representative enterprise setup (US/UK/EU stores, channels,
> currencies, tax, warehouses) in one pass. Use it as a working reference
> for every step below.

## The setup model

```
Organization
├── Stores            physical / digital / hybrid, per-region
│   ├── Currencies        default + secondary per store
│   ├── Channel assignments  website, Facebook, Google, POS, agentic…
│   └── Locales           settings.locale per store / per channel
├── Sales Channels      org-owned, assigned to stores
├── Tax                 zones → rates → categories → nexus → VAT registrations
├── Warehouses          regional fulfillment centers
└── Inventory           locations → items → stock transactions
```

## 1. Create the organization

```bash
yarn job:new:organization
```

Or via the business API:

| Method            | Path                                                   | Purpose             |
| ----------------- | ------------------------------------------------------ | ------------------- |
| `POST`            | `/business/organizations`                              | Create organization |
| `GET/PUT/DELETE`  | `/business/organizations/:id`                          | Manage organization |
| `POST/PUT/DELETE` | `/business/organizations/:organizationId/addresses`    | Addresses           |
| `POST/PUT/DELETE` | `/business/organizations/:organizationId/payment-info` | Payment info        |

The organization owns everything below — stores, channels, and tax
configuration are all organization-scoped.

## 2. Create stores

Each region typically gets its own store. A store carries a fulfillment
**modality** — `physical`, `digital`, or `hybrid` — which determines whether
it needs warehouses and how checkout handles fulfillment.

| Method | Path                                 | Purpose           |
| ------ | ------------------------------------ | ----------------- |
| `GET`  | `/business/stores`                   | List stores       |
| `GET`  | `/business/stores/:storeId`          | Store detail      |
| `GET`  | `/business/organizations/:id/stores` | Stores for an org |

Admin UI: `/admin/stores` — create/edit stores, set modality, default
currency, `settings.locale`, `settings.priceDisplayMode` (tax-inclusive vs
exclusive), and the store's theme.

Seeded example: US New York (hybrid), US California (physical), US digital,
UK London (hybrid), Germany (hybrid), France (hybrid).

## 3. Create sales channels and assign them to stores

Channels are defined once per organization, then assigned to stores with an
optional default flag and per-assignment `settings` (e.g. `locale`,
theme override).

| Method       | Path                                            | Purpose                |
| ------------ | ----------------------------------------------- | ---------------------- |
| `GET/POST`   | `/business/stores/channels`                     | List / create channels |
| `PUT/DELETE` | `/business/stores/channels/:channelId`          | Update / remove        |
| `GET/POST`   | `/business/stores/:storeId/channels`            | List / assign to store |
| `DELETE`     | `/business/stores/:storeId/channels/:channelId` | Unassign               |

Channel types: `web`, `marketplace`, `social`, `pos`, `agentic`, `api`,
`other`.

Assign a `web` channel as the **default** for each store — the storefront
resolves it automatically. POS channels belong on physical/hybrid stores;
agentic channels power surfaces like the ChatGPT integration.

Admin UI: the store detail page (`/admin/stores/:id`) manages assignments.

## 4. Configure currencies

Currencies are global; stores opt in per currency with a default and
secondary memberships (store currency settings table).

- Seed currencies first: `20240805000201_seedCurrency.js` and
  `20240805000927_seedCurrencyExchangeRates.js` cover USD/GBP/EUR.
- Per-store currency settings are managed from the store admin page; the
  seed sets USD for US stores, GBP for UK, EUR for DE/FR.
- Baskets and orders reject currencies a store doesn't support.

## 5. Configure tax

Tax resolves in this order: **zone** (geographic scope) → **rate** (per
zone/category) → **category** (product tax class) → **nexus** (US collection
obligation) → **VAT registrations** (EU/UK B2B).

| Method                | Path                                     | Purpose                             |
| --------------------- | ---------------------------------------- | ----------------------------------- |
| `GET/POST/PUT/DELETE` | `/business/tax/zones`                    | Zones (country/state scoping)       |
| `GET/POST`            | `/business/tax/zones/find`               | Resolve zone for an address         |
| `GET/POST/PUT/DELETE` | `/business/tax/rates`                    | Rates per zone + category           |
| `GET/POST/PUT/DELETE` | `/business/tax/categories`               | Tax categories (standard, reduced…) |
| `GET`                 | `/business/tax/settings/:organizationId` | Org tax settings                    |
| `GET`                 | `/business/tax/exemption/:customerId`    | Customer exemptions                 |
| `POST`                | `/business/tax/calculate`                | Quote check                         |

Key settings:

- `pricesIncludeTax` — UK/EU stores should display tax-inclusive prices;
  each VAT rate also carries its own `includeInPrice` flag so mixed zones
  are handled per line.
- `taxNexus` records — once any exist, destinations **without** coverage
  quote zero tax. Seed one per state/country you collect in.
- `taxVatRegistration` — required for B2B reverse charge; a valid customer
  VAT ID on an eligible cross-border order zeroes the tax.

Seed reference: NY/CA/DE state nexus, GB/DE/FR country nexus, and
DE/FR/OSS/GB VAT registrations on the enterprise org.

## 6. Create warehouses

Physical and hybrid stores need at least one warehouse; digital-only stores
need none.

| Method                | Path                                                 | Purpose               |
| --------------------- | ---------------------------------------------------- | --------------------- |
| `GET/POST/PUT/DELETE` | `/business/warehouses`                               | Warehouse CRUD        |
| `GET`                 | `/business/warehouses/code/:code`                    | Lookup by code        |
| `GET`                 | `/business/organizations/:organizationId/warehouses` | Org warehouses        |
| `GET/POST/DELETE`     | `/business/warehouses/:id/zones`                     | Zones (pick areas)    |
| `GET/POST/DELETE`     | `/business/warehouses/:id/bins`                      | Bins (storage slots)  |
| `GET`                 | `/business/warehouses/:id/receiving`                 | Receiving             |
| `GET`                 | `/business/warehouses/:id/pick-pack`                 | Pick & pack           |
| `GET`                 | `/business/warehouses/fulfillment-centers`           | FC-type warehouses    |
| `GET`                 | `/business/warehouses/nearest`                       | Nearest to a location |

Admin UI: `/admin/inventory` and warehouse pages under the operations menu.

## 7. Set up inventory locations and stock

Inventory lives in **locations** (stock-holding places, linked to stores and
warehouses) holding **items** (per SKU/variant stock).

| Method            | Path                                                                | Purpose                  |
| ----------------- | ------------------------------------------------------------------- | ------------------------ |
| `GET/POST/DELETE` | `/business/inventory/locations`                                     | Location CRUD            |
| `GET/POST/PUT`    | `/business/inventory/locations/:inventoryLocationId`                | Location detail / adjust |
| `GET/POST`        | `/business/inventory/items`                                         | Inventory items          |
| `GET`             | `/business/inventory/availability/:sku`                             | Availability check       |
| `GET`             | `/business/inventory/availability/product/:productId`               | Per-product availability |
| `POST`            | `/business/inventory/:inventoryId/reserve` / `/restock` / `/adjust` | Stock operations         |
| `GET`             | `/business/inventory/low-stock` / `/out-of-stock`                   | Alerts                   |

Link each location to its store so checkout routes reservations to the
store's best-stocked warehouse. Seed data creates one regional FC per
physical/hybrid store.

## 8. Verify the setup

End-to-end sanity check on a seeded or manually created organization:

1. Store resolves on the storefront (locale, currency, theme).
2. A product sellable in the store's assortment adds to a basket on the
   default website channel.
3. Checkout shows the region's tax treatment (exclusive US / inclusive VAT).
4. Payment initiation reserves stock against the store's warehouse.
5. The order records `storeId` and `channelId` attribution.

## Related guides

- [Product Setup and Dynamic Fields](product-setup.md) — catalog modeling
- [Advanced Content Setup](content-setup.md) — pages, blocks, themes
- [Regional Commerce Rollout Status](regional-commerce-rollout-progress.md) — capability coverage
