# Assortment

> **Status**: Implemented — `modules/assortment/` owns curated + smart collections and per-store product ranging. Extracted from `modules/product` (Option B below).

## Implemented surface

| Area           | Detail                                                                                                                                                                                    |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Domain         | `Collection` (smart `conditions`, merchandising fields, publish windows, soft delete), `CollectionMap`, `StoreAssortment` (1:1 per store, `mode`), `StoreAssortmentEntry`                 |
| Domain service | `CollectionRuleEvaluator` — validates `{field, operator, value}` sets and maps them to catalog filters                                                                                    |
| Repositories   | `CollectionRepositoryImpl`, `CollectionMapRepositoryImpl`, `StoreAssortmentRepositoryImpl` → `assortmentCollection`, `assortmentCollectionMap`, `assortmentStore`, `assortmentStoreEntry` |
| ACL adapters   | `ProductCatalogAdapter` (`CatalogQueryPort` → `ListProductsUseCase` + `findByIds`), `StoreLookupAdapter` (`StoreLookupPort` → `GetStoreUseCase`)                                          |
| Use cases      | `ManageCollections`, `ResolveCollectionProducts`, `ManageStoreAssortment`, `ResolveStoreCatalog`, `BrowseCollections`                                                                     |
| Events         | `collection.created` / `collection.updated` / `collection.deleted` / `assortment.updated`                                                                                                 |
| Business API   | `/business/assortment/collections` CRUD + `/:id/products`; `/business/assortment/stores/:storeId` config, `/entries`, `/catalog`                                                          |
| Customer API   | `GET /customer/assortment/collections`, `GET /customer/assortment/collections/:slug`                                                                                                      |
| Admin UI       | `/admin/catalog/collections` — real list/create/edit/view pages (placeholders replaced)                                                                                                   |

### Migrations

- Renamed with `assortment_` prefix and extended: `20240805000459_assortment_createAssortmentCollectionTable.js`, `20240805000905_assortment_createAssortmentCollectionMapTable.js`
- Re-prefixed from `product_` (schema ownership moved to `assortment`; still written by `libs/search/merchandising.ts`): `20260823160001_assortment_createAssortmentMerchandisingRuleTable.js`, `20260823160002_assortment_createAssortmentCategoryManualOrderTable.js`
- New: `20261001000000_assortment_createAssortmentStoreTable.js`, `20261001000001_assortment_createAssortmentStoreEntryTable.js`

### Table renames

All six owned tables were renamed to the `assortment` prefix (including PK/FK columns): `productCollection` → `assortmentCollection`, `productCollectionMap` → `assortmentCollectionMap`, `storeAssortment` → `assortmentStore`, `storeAssortmentEntry` → `assortmentStoreEntry`, `productMerchandisingRule` → `assortmentMerchandisingRule`, `productCategoryManualOrder` → `assortmentCategoryManualOrder`.

### Breaking change

`/business/collections` → `/business/assortment/collections` (request shape: `products` replaces `addProducts` on create; update keeps `addProducts`/`removeMapIds`/`removeProductIds`).

---

## Original design notes (kept for context)

## Overview

"Assortment" in commerce means _which products are sold, in which groupings, in which channels_. Three concrete merchant needs fall out of that:

1. **Manual collections** — hand-picked groups ("Summer Essentials", "Staff Picks") with ordering.
2. **Smart collections** — rule-based groups that stay in sync automatically ("all in-stock footwear under £100", "everything from Brand X tagged 'new'").
3. **Store-scoped ranging** — which products each `store` carries, so a channel store (e.g. the "Meta" digital store used by `agentic-checkout`) can sell a subset of the catalog.

### What already exists

Mostly inside `modules/product` — collections are ~70% built:

- `assortmentCollection` and `assortmentCollectionMap` tables (`libs/db/types`), with `position` ordering on the map
- `ProductCollection` / `ProductCollectionMap` port types and `ManageProductCollectionsUseCase` CRUD (`modules/product/domain/repositories/ProductCatalogPorts.ts`)
- Business endpoints: `GET/POST /business/products/collections`, `PUT/DELETE /business/products/collections/:id`
- Admin catalog controller (`adminAssortmentController.ts` — misleading name; it renders categories + collections)

### What's missing

- **Smart collections** — no rule engine; membership is manual-only via `assortmentCollectionMap`.
- **Collection merchandising fields** — no SEO fields, publish/schedule windows, or featured pinning beyond `position`.
- **Storefront exposure** — collections have business endpoints but no customer-facing browse (`/customer/collections`, storefront collection pages).
- **Per-store ranging** — nothing answers "which products does store X sell?" — increasingly important now that `store` models sales channels (physical, digital, agentic surfaces).

---

## Architecture Decision

Two viable placements:

**Option A — finish collections inside `modules/product`** and build `modules/assortment` only for store-scoped ranging. Collection CRUD, smart-rule evaluation, and merchandising fields extend the existing `ProductCollection` machinery; `assortment` owns `storeId ↔ productId|collectionId` assignment.

**Option B — `modules/assortment` owns all of it**: collections (CRUD, smart rules, merchandising, storefront) move out of `product`, which stays pure catalog primitives; `assortment` additionally owns store-scoped ranging.

**Recommendation: Option B — extract.** The coupling audit supports it:

- Nothing outside `product` consumes collection ports today — only `web/admin` views and `localization` translations touch them.
- Collections are already cleanly isolated inside `product` (own ports, tables, use cases, endpoints) — the move is mechanical.
- Assortment's core operations (include a collection in a store's ranging, resolve the catalog) depend on collections; keeping them in `product` would force a permanent port hop on every operation.
- `product` is the largest module in the codebase; extraction shrinks it.

### Extraction path

| Step                | Detail                                                                                                                                                                                                                                           |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Move domain         | `ProductCollection`, `ProductCollectionMap` types → `assortment/domain/entities/`; `ProductCollectionPort`/`ProductCollectionMapPort` → `assortment/domain/repositories/`                                                                        |
| Move application    | `ManageProductCollectionsUseCase` → `assortment/application/useCases/`                                                                                                                                                                           |
| Move infrastructure | `assortmentCollectionRepo`/`assortmentCollectionMapRepo` impls → `assortment/infrastructure/repositories/`; tables renamed to `assortmentCollection`/`assortmentCollectionMap`, ownership transfers in each module's `manifest.ts` `tables` list |
| Move interface      | `/business/products/collections` endpoints → `/business/assortment/collections` (**breaking change** — only consumer is the admin panel; update `adminAssortmentController` references in `web/admin/adminRouters.ts`)                           |
| Rewire              | `localization` translation lookups for collections → assortment port; delete the ports section from `ProductCatalogPorts.ts`                                                                                                                     |

```
modules/assortment/
├── interface/routers/assortmentBusinessRouter.ts   # /business/assortment/collections + /stores/:id/...
├── application/
│   ├── useCases/           # ManageCollections, EvaluateCollectionRules,
│   │                       # ManageStoreAssortment, ResolveStoreCatalog
│   └── ports/
│       └── CatalogQueryPort.ts   # → product (list products/categories/brands)
├── infrastructure/repositories/  # CollectionRepositoryImpl, StoreAssortmentRepositoryImpl
└── domain/entities/
    ├── Collection.ts             # moved from product + smart rules + merchandising fields
    ├── CollectionRule.ts         # {field, operator, value} sets for smart membership
    ├── StoreAssortment.ts        # storeId, mode: 'all'|'include'|'exclude',
    │                             #   rules: productIds[] | collectionIds[] | categoryIds[]
    └── AssortmentEntry.ts        # resolved member + per-store overrides (visibility, position)
```

## Domain Model

`StoreAssortment` (aggregate):

| Field                                                                  | Purpose                                                                                                              |
| ---------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `storeId`                                                              | The store this assortment applies to (1:1 — every store gets one, defaulting to `mode: 'all'`)                       |
| `mode`                                                                 | `'all'` (entire catalog minus exclusions) \| `'include'` (explicit ranging) \| `'exclude'` (full catalog minus list) |
| `includedProductIds` / `includedCollectionIds` / `includedCategoryIds` | Explicit membership sources; collections resolve dynamically so smart collections propagate                          |
| `excludedProductIds`                                                   | Always-applied removal list                                                                                          |
| `entries`                                                              | Per-product overrides for this store: hidden, featured position, store-specific availability                         |

Resolution order: expand collections + categories → apply include/exclude by mode → apply per-entry overrides → return the effective product set for the store.

## Use Cases

| ID         | Use Case              | Actor          | Purpose                                                                                                                       |
| ---------- | --------------------- | -------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| UC-ASS-001 | Get Store Assortment  | Merchant/Admin | Retrieve a store's assortment config + resolved product count                                                                 |
| UC-ASS-002 | Set Assortment Mode   | Merchant/Admin | Switch a store between all / include / exclude                                                                                |
| UC-ASS-003 | Add/Remove Products   | Merchant/Admin | Ranged explicit product membership                                                                                            |
| UC-ASS-004 | Include Collection    | Merchant/Admin | Range an entire collection (dynamic — membership follows the collection)                                                      |
| UC-ASS-005 | Exclude Products      | Merchant/Admin | Remove specific products in `all`/`exclude` mode                                                                              |
| UC-ASS-006 | Resolve Store Catalog | Internal       | Return the effective product list for a store — consumed by storefront queries, `agentic-checkout` feeds, and search indexing |

### New collection capabilities (post-extraction)

| ID        | Use Case               | Purpose                                                                                                                                                                |
| --------- | ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| UC-PRD-xx | Smart Collection Rules | `CollectionRule` entity + evaluator: `{field, operator, value}` sets (brand, category, price range, attribute, in-stock) refreshed on product save + scheduled re-eval |
| UC-PRD-xx | Merchandising Fields   | `metaTitle`, `metaDescription`, `publishAt`/`unpublishAt`, `isFeatured` on collections                                                                                 |
| UC-PRD-xx | Storefront Collections | `GET /customer/collections`, `GET /customer/collections/:slug`, storefront collection pages                                                                            |

## API Endpoints

| Method | Endpoint                                                  | Purpose                                                                                         |
| ------ | --------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| GET    | `/business/assortment/collections`                        | List collections (filters: organizationId, isActive, isFeatured)                                |
| POST   | `/business/assortment/collections`                        | Create collection (+ optional `products` membership)                                            |
| GET    | `/business/assortment/collections/:collectionId`          | Collection + members                                                                            |
| GET    | `/business/assortment/collections/:collectionId/products` | Resolved products (manual or smart)                                                             |
| PUT    | `/business/assortment/collections/:collectionId`          | Update fields, add/remove members                                                               |
| DELETE | `/business/assortment/collections/:collectionId`          | Soft delete                                                                                     |
| GET    | `/business/assortment/stores/:storeId`                    | Get assortment config + entries                                                                 |
| PUT    | `/business/assortment/stores/:storeId`                    | Set mode (`all` \| `include` \| `exclude`)                                                      |
| POST   | `/business/assortment/stores/:storeId/entries`            | Add entry (`targetType`: product\|collection\|category, `effect`: include\|exclude, `isHidden`) |
| DELETE | `/business/assortment/stores/:storeId/entries/:entryId`   | Remove entry                                                                                    |
| GET    | `/business/assortment/stores/:storeId/catalog`            | Resolved store catalog (paginated)                                                              |
| GET    | `/customer/assortment/collections`                        | List published collections (public)                                                             |
| GET    | `/customer/assortment/collections/:slug`                  | Collection page + resolved products (public)                                                    |

## Dependencies & Consumers

- **Depends on**: `product` (catalog queries via `CatalogQueryPort`), `store` (storeId validity, store lifecycle — deleting a store cascades its assortment), `localization` (translatable collection fields).
- **Consumed by**: `agentic-checkout` (`CatalogPort` feed generation = resolve store catalog → serialize), storefront product listing/search (filter by resolved store assortment), `search` indexing (index per-store availability).

This makes the feed story consistent: **the assortment decides what a channel sells; the feed just serializes it.**

## Events

| Event                | Trigger                                                            |
| -------------------- | ------------------------------------------------------------------ |
| `collection.created` | Collection created                                                 |
| `collection.updated` | Collection fields/members changed                                  |
| `collection.deleted` | Collection soft-deleted                                            |
| `assortment.updated` | Store mode or entry changed → consumers re-resolve (feeds, search) |

## Phasing (completed)

1. ~~Extract collections~~ — done: `modules/assortment` owns `assortmentCollection`/`assortmentCollectionMap`; admin UI rewired to `/admin/catalog/collections`.
2. ~~Smart collections + storefront~~ — done: `CollectionRuleEvaluator`, merchandising fields, publish windows, `/customer/assortment/collections`, storefront pages at `/collections` + `/collections/:slug`.
3. ~~`StoreAssortment`~~ — done: `assortmentStore` + `assortmentStoreEntry` tables, business API, `ResolveStoreCatalog`.
4. **Wire to `agentic-checkout`** — pending: channel stores get explicit assortments; `GenerateProductFeed` resolves via `ResolveStoreCatalog`.

## Remaining work

- `localization` translations for collection fields (entity type already exists).
- Search-index integration — `assortment.updated` events are published for consumers.

## Open Questions

- Does assortment interact with `pricing` (per-store price books) or stay purely membership? Recommend membership-only; pricing already has its own scoping.
- Should excluded products be hidden but purchasable (direct URL works) or fully blocked at checkout for that store? Block-at-checkout is the safer default for channels.

<!-- GENERATED:ENDPOINTS:START -->

| Method                                                                            | Endpoint                                                            | Controller                                     | Description                                                         |
| --------------------------------------------------------------------------------- | ------------------------------------------------------------------- | ---------------------------------------------- | ------------------------------------------------------------------- |
| GET                                                                               | `/assortment/collections`                                           | `isOrganizationLoggedIn`                       | List collections                                                    |
| GET /business/assortment/collections                                              |
| POST                                                                              | `/assortment/collections`                                           | `isOrganizationLoggedIn`                       | Create collection                                                   |
| POST /business/assortment/collections                                             |
| GET                                                                               | `/assortment/collections`                                           | `asyncHandler(controller.listCollections)`     | List published collections                                          |
| GET /customer/assortment/collections                                              |
| GET                                                                               | `/assortment/collections/:collectionId`                             | `isOrganizationLoggedIn`                       | Get collection (with members)                                       |
| GET /business/assortment/collections/:collectionId                                |
| PUT                                                                               | `/assortment/collections/:collectionId`                             | `isOrganizationLoggedIn`                       | Update collection                                                   |
| PUT /business/assortment/collections/:collectionId                                |
| DELETE                                                                            | `/assortment/collections/:collectionId`                             | `isOrganizationLoggedIn`                       | Delete collection (soft)                                            |
| DELETE /business/assortment/collections/:collectionId                             |
| GET                                                                               | `/assortment/collections/:collectionId/products`                    | `isOrganizationLoggedIn`                       | Resolve collection products (manual or smart)                       |
| GET /business/assortment/collections/:collectionId/products                       |
| GET                                                                               | `/assortment/collections/:collectionId/publications`                | `isOrganizationLoggedIn`                       | List collection visibility publications (store/channel scoping)     |
| GET /business/assortment/collections/:collectionId/publications                   |
| POST                                                                              | `/assortment/collections/:collectionId/publications`                | `isOrganizationLoggedIn`                       | Create or update a collection publication for a store/channel scope |
| POST /business/assortment/collections/:collectionId/publications                  |
| DELETE                                                                            | `/assortment/collections/:collectionId/publications/:publicationId` | `isOrganizationLoggedIn`                       | Remove a collection publication                                     |
| DELETE /business/assortment/collections/:collectionId/publications/:publicationId |
| GET                                                                               | `/assortment/collections/:slug`                                     | `asyncHandler(controller.getCollectionBySlug)` | Get collection page by slug (metadata + resolved products)          |
| GET /customer/assortment/collections/:slug                                        |
| GET                                                                               | `/assortment/stores/:storeId`                                       | `isOrganizationLoggedIn`                       | Get store assortment config + entries                               |
| GET /business/assortment/stores/:storeId                                          |
| PUT                                                                               | `/assortment/stores/:storeId`                                       | `isOrganizationLoggedIn`                       | Set assortment mode (all                                            | include    | exclude)  |
| PUT /business/assortment/stores/:storeId                                          |
| GET                                                                               | `/assortment/stores/:storeId/catalog`                               | `isOrganizationLoggedIn`                       | Resolve effective store catalog                                     |
| GET /business/assortment/stores/:storeId/catalog                                  |
| POST                                                                              | `/assortment/stores/:storeId/entries`                               | `isOrganizationLoggedIn`                       | Add assortment entry (product                                       | collection | category) |
| POST /business/assortment/stores/:storeId/entries                                 |
| DELETE                                                                            | `/assortment/stores/:storeId/entries/:entryId`                      | `isOrganizationLoggedIn`                       | Remove assortment entry                                             |
| DELETE /business/assortment/stores/:storeId/entries/:entryId                      |

<!-- GENERATED:ENDPOINTS:END -->
