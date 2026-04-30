# Product – Merchant EARS Requirements Index

> **System**: CommerceFull – `product`
> **Actor**: Merchant / Admin
> **Date**: 2026-04-28

The merchant product spec is split into focused files. Read them in order for a complete picture.

| File | Domain Area | Key Capabilities |
| ---- | ----------- | ---------------- |
| [01-product-lifecycle.md](./01-product-lifecycle.md) | Core product CRUD | Create, update, status transitions, publish/unpublish, soft/hard delete, price changes |
| [02-variants-images.md](./02-variants-images.md) | Variants & media | Variant CRUD, inventory, barcode lookup, image management, rich media (video/3d/audio) |
| [03-attributes.md](./03-attributes.md) | Dynamic attribute system | Attribute groups → Attribute sets → Attributes → Product type hierarchy; product attribute assignment; filterable/searchable/variant flags |
| [04-categories.md](./04-categories.md) | Category tree | Category CRUD, parent/child tree, featured/menu flags, product count maintenance |
| [05-downloads-seo-pricing.md](./05-downloads-seo-pricing.md) | Downloads, SEO, price records | Downloadable files with limits/expiry; extended SEO (OG, Twitter Card, canonical, JSON-LD); multi-currency tiered price records |
| [06-relationships-bundles-collections.md](./06-relationships-bundles-collections.md) | Product grouping | Cross-sell/accessory/bundle relationships; bundle CRUD with items; public collections; internal merchant lists |
| [07-reviews-qa.md](./07-reviews-qa.md) | Reviews & Q&A | Review approve/reject/respond/delete; review media; Q&A status moderation |

## Architecture Summary

```
ProductType
  └── ProductAttributeSet  (many per type)
        └── ProductAttribute  (many per set, with per-set isRequired/position/defaultValue)

Product  (owned by merchantId or businessId)
  ├── ProductVariant[]       (SKU, price, stock, attributes, barcode)
  ├── ProductImage[]         (legacy image table)
  ├── ProductMedia[]         (image | video | document | 3d_model | audio)
  ├── ProductAttributeValue[]  (dynamic attribute assignments)
  ├── ProductDownload[]      (downloadable files, per product or variant)
  ├── ProductSeo             (extended SEO record, 1:1)
  ├── ProductPrice[]         (multi-currency / tiered / date-ranged price overrides)
  ├── ProductRelationship[]  (related | accessory | bundle links to other products)
  └── ProductCategoryMap[]   (many-to-many with ProductCategory)

ProductCollection  (public-facing curated groups)
  └── ProductCollectionMap[]

ProductList  (merchant-internal named lists)
  └── ProductListItem[]

ProductBundle
  └── ProductBundleItem[]
```

## Events Emitted

| Event                      | Trigger                        |
| -------------------------- | ------------------------------ |
| `product.created`          | Product created                |
| `product.updated`          | Product fields modified        |
| `product.status_changed`   | Status transition              |
| `product.published`        | Product published              |
| `product.unpublished`      | Product unpublished            |
| `product.deleted`          | Product soft or hard deleted   |
| `product.price_changed`    | Base price modified            |
| `product.variant_created`  | Variant added                  |
| `product.variant_updated`  | Variant modified               |
| `product.variant_deleted`  | Variant removed                |
| `product.image_added`      | Image attached                 |
| `product.category_changed` | Category assignment changed    |
| `bundle.created`           | Bundle created                 |
| `bundle.purchased`         | Bundle purchased (order event) |
