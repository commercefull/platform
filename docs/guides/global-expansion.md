# From One Store to Global Markets

How Commercefull scales a commerce operation: one store → multiple stores and
sales channels → multiple markets. Each stage builds on the last — no stage
requires tearing down or forking the previous one.

| Stage | What you operate                             | Guides                                                                                                                             |
| ----- | -------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| A     | One store, one channel, one currency/locale  | [Organization Setup](./organization-setup.md) §1–4, [Product Setup](./product-setup.md), [Shipping](./shipping-and-fulfillment.md) |
| B     | Multiple stores, multiple sales channels     | [Organization Setup](./organization-setup.md) §2–5, [Content Setup](./content-setup.md)                                            |
| C     | Multiple markets (country-neutral expansion) | [Market Launch](./market-launch.md)                                                                                                |

## Stage A — One store

The minimum viable setup. An `Organization` owns one `Store` assigned to one
`SalesChannel` (typically `web`). The store carries its default currency,
locale, tax display mode, warehouses, and fulfillment modality.

- Create the organization: `yarn job:new:organization` or `POST /business/organizations`.
- Create the store (`physical` / `digital` / `hybrid`) — modality decides whether warehouses and shipping are required.
- Bind a catalog assortment and a price list; add products in the store's currency.
- Configure one shipping zone covering your selling country and one PSP route.

At this stage, store, channel, country, currency, and locale coincide — the
platform resolves them implicitly.

## Stage B — Multiple stores and sales channels

Expand horizontally **without** a market model:

- **Stores per region** — a US store (USD, tax-exclusive) and a UK store
  (GBP, tax-inclusive) can coexist under one organization. Each keeps its own
  currencies, locales, warehouses, and theme.
- **Sales channels per store** — `web`, `pos`, `marketplace`, `social`,
  `agentic`, `api` are organization-owned `salesChannel` records assigned
  many-to-many through `storeSalesChannel`. One store sells through all its
  channels simultaneously; every basket, order, and event records
  `storeId` + `channelId`.
- **Channel-scoped merchandising** — assortments, collections, promotions,
  pricing rules, content, and themes are all targetable per store and per
  channel.

The storefront resolves the store by hostname/channel assignment; the
customer-facing context stays consistent across every entry point. See
[Organization Setup](./organization-setup.md) §2–5 for the API sequence.

## Stage C — Multiple markets

When expansion is driven by _countries_ rather than by store count, switch to
the market model: a `Market` binds selling **countries**, **currencies**,
**locales**, **capabilities** (`MarketCapabilities`), a catalog assortment, a
default price list, payment/fulfillment methods, a contracting entity, and
hostnames.

```
Organization
├── Stores / Sales Channels      (Stage B — where and how you sell)
└── Markets                      (Stage C — which countries you serve, under what rules)
     ├── countries, currencies, locales, capabilities
     ├── assortment + price list + contracting entity
     └── readiness → launch → versioned decisions on orders
```

- Markets are created as `draft` and must pass a **12-dimension readiness
  evaluation** (locale, currency, catalog, pricing, tax, payments, shipping,
  returns, legal, compliance, support, fraud) before launch.
- Launching a new market is a **configuration exercise** — no code changes,
  except for a genuinely new external protocol (PSP rail, domestic carrier
  API), which lands as an adapter behind the existing ports.
- Once active, orders record the market context, a version snapshot, and an
  explainable decision log (`GET /business/orders/:orderId/decisions`).

Follow [Market Launch](./market-launch.md) for the full draft → readiness →
launch procedure. For the underlying model see `ARCHITECTURE.md → Global
Commerce`.

## Choosing your stage

- One country, one storefront → **Stage A**.
- Regional catalogs/fulfillment or several sales channels → **Stage B**.
- Expanding across countries with distinct tax, payment, legal, and language
  rules → **Stage C**. Markets and stores are complementary, not exclusive: a
  store can serve multiple markets, and a market resolves through the
  channels assigned to its bound store.
