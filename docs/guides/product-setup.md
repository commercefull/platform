# Product Setup and Dynamic Fields

This guide covers the complete catalog model: product types, the dynamic
attribute system (groups, sets, attributes, options), products and variants,
inventory policies, categories, collections, bundles, media, downloads, and
relationships.

## The catalog model

```
ProductType            catalog family — drives which attribute sets apply
├── AttributeSet       a bundle of attributes for a product type
│   └── Attributes     dynamic fields (see §2)
├── AttributeGroup     visual/logical grouping of attributes on a PDP
└── Product            the sellable record (productTypeId links it back)
    ├── Variants       concrete purchasables (SKU, options, inventory policy)
    ├── Images         ordered media
    ├── Downloads      digital deliverables
    ├── Relationships  related / upsell / cross-sell
    └── Reviews / Q&A  customer-generated content

Category → Collection → Assortment   merchandising layers on top
```

## 1. Product types

A product **type** defines the product family and its attribute sets —
distinct from the product **kind** (`simple`, `configurable`, `grouped`,
`virtual`, `downloadable`, `bundle`, `subscription`), which is the legacy
physical form factor. Every product carries a nullable `productTypeId`
reference to its type.

| Method                | Path                                     | Purpose                  |
| --------------------- | ---------------------------------------- | ------------------------ |
| `GET/POST/PUT/DELETE` | `/business/product-types`                | Type CRUD                |
| `GET`                 | `/business/product-types/slug/:slug`     | Lookup by slug           |
| `GET`                 | `/business/product-types/:id/attributes` | Attributes the type uses |

Seed reference: `seeds/20240805000204_seedProductType.js`,
`seeds/20260913100300_seedFashionAttributes.js` (apparel/electronics sets).

## 2. Dynamic fields — attributes, groups, sets

The attribute system is how products get rich, typed, filterable fields
without schema changes.

### Attribute groups

Logical groupings rendered on the PDP (e.g. "Specifications", "Materials").

| Method                | Path                                    | Purpose        |
| --------------------- | --------------------------------------- | -------------- |
| `GET/POST/PUT/DELETE` | `/business/attribute-groups`            | Group CRUD     |
| `GET`                 | `/business/attribute-groups/code/:code` | Lookup by code |

### Attributes

Typed fields attached to sets. Supported types:

`text`, `number`, `select`, `multiselect`, `checkbox`, `radio`, `date`,
`datetime`, `time`, `file`, `image`, `video`, `document`, `color`,
`boolean`.

Choice types (`select`, `multiselect`, `radio`, `checkbox`, `color`) get
their values from **attribute options**. `validationRules` support
`minLength`/`maxLength`, `minValue`/`maxValue`, `pattern`, `required`,
`unique`, `allowedExtensions`, `maxFileSize`.

| Method                | Path                                  | Purpose               |
| --------------------- | ------------------------------------- | --------------------- |
| `GET/POST/PUT/DELETE` | `/business/attributes`                | Attribute CRUD        |
| `GET`                 | `/business/attributes/code/:code`     | Lookup by code        |
| `GET`                 | `/business/attributes/group/:groupId` | Attributes in a group |
| `GET/POST/DELETE`     | `/business/attributes/:id/values`     | Attribute values      |
| `GET/POST/PUT/DELETE` | `/business/attribute-options`         | Choice options        |

### Attribute sets

Named bundles assigned to product types — the "schema" for a family.

| Method                | Path                                              | Purpose       |
| --------------------- | ------------------------------------------------- | ------------- |
| `GET/POST/PUT/DELETE` | `/business/attribute-sets`                        | Set CRUD      |
| `POST`                | `/business/attribute-sets/:id/attributes`         | Add attribute |
| `POST`                | `/business/attribute-sets/:id/attributes/reorder` | Reorder       |

### Applying to a product

| Method         | Path                                                | Purpose            |
| -------------- | --------------------------------------------------- | ------------------ |
| `POST`         | `/business/products/:productId/apply-attribute-set` | Apply a set        |
| `GET/POST/PUT` | `/business/products/:productId/attributes`          | Per-product values |

## 3. Products

| Method           | Path                                                               | Purpose                  |
| ---------------- | ------------------------------------------------------------------ | ------------------------ |
| `GET/POST`       | `/business/products`                                               | List / create            |
| `GET/PUT/DELETE` | `/business/products/:productId`                                    | Detail / update / delete |
| `PUT`            | `/business/products/:productId/status` `/visibility`               | Lifecycle                |
| `POST`           | `/business/products/:productId/publish` `/unpublish`               | Publish flow             |
| `POST`           | `/business/products/:productId/configure`                          | Configure options        |
| `GET`            | `/business/products/:productId/availability` `/store-availability` | Availability             |

`CreateProduct` requires a `productTypeId` — pass the seeded type's UUID.
Kinds that set `isInventoryManaged = false` (virtual, downloadable) skip
stock tracking automatically.

Admin UI: `/admin/products`.

## 4. Variants and inventory policy

Variants are the concrete purchasables — each with its own SKU, option
values (`optionValues`), barcode/MPN, and **inventory policy**.

| Method           | Path                                                | Purpose             |
| ---------------- | --------------------------------------------------- | ------------------- |
| `GET/POST`       | `/business/products/:productId/variants`            | List / create       |
| `GET/PUT/DELETE` | `/business/products/:productId/variants/:variantId` | Manage              |
| `PATCH`          | `/business/products/variants/:variantId/inventory`  | Update stock/policy |
| `GET`            | `/business/products/:productId/variant-matrix`      | Option matrix       |

### Inventory policies

| Policy          | Behavior                                      |
| --------------- | --------------------------------------------- |
| `tracked`       | Standard — must be in stock to sell           |
| `unlimited`     | Never runs out — digital goods, made-to-order |
| `backorderable` | Sells below zero — takes backorders           |

Admin UI: the product edit page has an inline per-variant policy editor
(`POST /admin/products/:productId/variants/:variantId/inventory-policy`).
Availability shown to customers resolves through the inventory module.

## 5. Categories and merchandising

| Method                | Path                                | Purpose       |
| --------------------- | ----------------------------------- | ------------- |
| `GET/POST/PUT/DELETE` | `/business/categories`              | Category CRUD |
| `GET`                 | `/business/categories/tree` `/root` | Tree          |
| `GET`                 | `/business/categories/:id/children` | Children      |
| `GET`                 | `/business/categories/slug/:slug`   | Lookup        |

Categories form the taxonomy; **collections** and **assortments** layer on
top for merchandising and per-store/channel sellability — see
[Organization Setup](organization-setup.md) for assortment scoping and the
[Advanced Content Setup](content-setup.md) scoping cheatsheet.

## 6. Bundles and grouped products

| Method                | Path                                             | Purpose           |
| --------------------- | ------------------------------------------------ | ----------------- |
| `GET/POST/PUT/DELETE` | `/business/bundles`                              | Bundle CRUD       |
| `POST/PUT/DELETE`     | `/business/bundles/:id/items`                    | Bundle items      |
| `POST`                | `/business/products/bundles/:id/calculate`       | Price calculation |
| `GET`                 | `/business/products/:productId/grouped-children` | Grouped children  |

## 7. Media, downloads, and engagement

| Method                | Path                                                                  | Purpose                   |
| --------------------- | --------------------------------------------------------------------- | ------------------------- |
| `POST/PUT/DELETE`     | `/business/products/:productId/images`                                | Product images            |
| `POST`                | `/business/products/:productId/images/reorder`                        | Reorder                   |
| `GET/POST/PUT/DELETE` | `/business/products/:productId/downloads`                             | Digital files             |
| `GET/POST/DELETE`     | `/business/products/:productId/relationships`                         | Related/upsell/cross-sell |
| `PUT`                 | `/business/products/:productId/relationships/reorder`                 | Reorder                   |
| `GET/POST`            | `/business/products/:productId/qa`                                    | Questions & answers       |
| `PATCH`               | `/business/products/:productId/qa/:qaId/status`                       | Moderate Q&A              |
| `GET/POST/PUT/DELETE` | `/business/products/:productId/reviews`                               | Reviews                   |
| `POST`                | `/business/reviews/:reviewId/approve` `/respond` `/helpful` `/report` | Review moderation         |

## 8. Recommended setup order

1. **Product types** — one per catalog family (apparel, electronics, digital…).
2. **Attribute groups** → **attributes** → **attribute options** → assemble
   into **attribute sets** → attach sets to types.
3. **Categories** — the taxonomy customers browse.
4. **Products** — create with `productTypeId`, then apply attribute sets and
   set per-product values.
5. **Variants** — SKUs, option values, inventory policy per variant.
6. **Collections and assortments** — merchandising and store/channel
   sellability.
7. **Media, downloads, relationships** — images, digital deliverables,
   cross-sells.

## Related guides

- [Organization Setup](organization-setup.md) — stores, channels, warehouses
- [Advanced Content Setup](content-setup.md) — pages and blocks that feature
  products
