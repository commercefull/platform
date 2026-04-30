# Product – Merchant: Relationships, Bundles, Collections & Lists EARS Requirements

> **System**: CommerceFull – `product`
> **Actor**: Merchant / Admin
> **Date**: 2026-04-28
> **Source**: `modules/product/infrastructure/repositories/productRelationshipRepo.ts`, `modules/product/infrastructure/repositories/bundleRepo.ts`, `modules/product/application/useCases/ManageProductCollection.ts`, `modules/product/infrastructure/repositories/productListRepo.ts`

---

## Context

Four mechanisms group or link products together:

| Mechanism        | Purpose                                                                 | Visibility  |
| ---------------- | ----------------------------------------------------------------------- | ----------- |
| **Relationship** | Cross-sell / up-sell / accessory links between individual products      | Internal    |
| **Bundle**       | Discounted product sets sold together (fixed, dynamic, mix-and-match)   | Customer-facing |
| **Collection**   | Curated public-facing product groupings (e.g. "Summer Sale")            | Customer-facing |
| **List**         | Merchant-internal named product lists (e.g. "Reorder candidates")       | Internal    |

---

## Part A — Product Relationships

### Relationship Types

| Type        | Use case                                      |
| ----------- | --------------------------------------------- |
| `related`   | "You might also like" recommendations         |
| `accessory` | Compatible accessories for this product       |
| `bundle`    | Products commonly purchased together          |

### A.1 Ubiquitous Requirements

The system shall prevent a product from being related to itself.

The system shall prevent duplicate relationships of the same `type` between the same two products.

The system shall record `createdAt` and `updatedAt` on every relationship record.

### A.2 Event-Driven Requirements

When an authenticated merchant creates a relationship with valid `productId`, `relatedProductId`, and `type`, the system shall persist it and return the created record.

When an authenticated merchant creates a bidirectional relationship, the system shall simultaneously create both the forward (`A → B`) and reverse (`B → A`) relationship records.

When an authenticated merchant bulk-creates relationships, the system shall create each one and silently skip any that already exist or would create a self-relationship.

When an authenticated merchant lists relationships for a product, the system shall return all relationships ordered by `position ASC, createdAt ASC`. An optional `type` filter narrows results to a single relationship type.

When an authenticated merchant lists reverse relationships for a product, the system shall return all relationships where `relatedProductId` matches the specified product.

When an authenticated merchant updates a relationship, the system shall apply changes to `type`, `position`, or `isAutomated` and return the updated record.

When an authenticated merchant reorders relationships, the system shall update `position` on each record in the supplied order.

When an authenticated merchant deletes a relationship by ID, the system shall permanently remove it.

When an authenticated merchant deletes a specific relationship by `productId + relatedProductId + type`, the system shall permanently remove that record.

When an authenticated merchant deletes all relationships for a product, the system shall remove every relationship where `productId` matches.

When an authenticated merchant deletes all automated relationships for a product, the system shall remove only records where `isAutomated = true`.

### A.3 Unwanted Behaviour

If a merchant attempts to create a relationship where `productId = relatedProductId`, the system shall reject with: `"Product cannot be related to itself"`.

If a merchant attempts to create a relationship that already exists for the same type, the system shall reject with: `"Relationship already exists between products for type '<type>'"`.

---

## Part B — Bundles

### Bundle Types

`fixed` — fixed set of products; `dynamic` — merchant-defined optional items; `mix_match` — customer selects from allowed items.

### Discount Types

`percentage`, `fixed`, `fixed_price`.

### B.1 Event-Driven Requirements

When an authenticated merchant calls `POST /business/bundles` with a valid bundle configuration, the system shall create the bundle and publish `bundle.created` with `{ bundleId, productId }`.

When an authenticated merchant calls `GET /business/bundles`, the system shall return bundles. Optional filters: `bundleType`, `isActive`.

When an authenticated merchant calls `GET /business/bundles/:id`, the system shall return the bundle with its items.

When an authenticated merchant calls `PUT /business/bundles/:id` with valid updates, the system shall apply the changes and return the updated bundle.

When an authenticated merchant calls `DELETE /business/bundles/:id`, the system shall remove the bundle.

When an authenticated merchant calls `POST /business/bundles/:id/items` with a valid item payload, the system shall add the item to the bundle and return HTTP 201.

When an authenticated merchant calls `PUT /business/bundles/:id/items/:itemId` with valid updates, the system shall update the bundle item.

When an authenticated merchant calls `DELETE /business/bundles/:id/items/:itemId`, the system shall remove the item from the bundle.

### B.2 Unwanted Behaviour

If a merchant requests a bundle that does not exist, the system shall return HTTP 404.

If a merchant requests a bundle item that does not exist, the system shall return HTTP 404.

---

## Part C — Collections

### C.1 Ubiquitous Requirements

The system shall require every collection to have a non-empty `name` and `slug`.

The system shall record `createdAt` and `updatedAt` on every collection and collection map record.

### C.2 Event-Driven Requirements

When an authenticated merchant calls `POST /business/collections` with a valid `name` and `slug`, the system shall create the collection and, if `addProducts` is provided, simultaneously create a `productCollectionMap` entry for each product.

When an authenticated merchant calls `GET /business/collections`, the system shall return all collections.

When an authenticated merchant calls `PUT /business/collections/:collectionId` with valid updates, the system shall update the collection metadata, add any products in `addProducts`, and remove any map entries in `removeMapIds`.

When an authenticated merchant calls `DELETE /business/collections/:collectionId`, the system shall soft-delete the collection.

### C.3 Unwanted Behaviour

If a merchant calls `POST /business/collections` without `name`, the system shall reject with HTTP 400: `"name is required"`.

If a merchant calls `POST /business/collections` without `slug`, the system shall reject with HTTP 400: `"slug is required"`.

If a merchant attempts to update a collection that does not exist, the system shall return HTTP 404: `"Collection not found: <id>"`.

---

## Part D — Product Lists (Internal)

Product lists are merchant-internal named lists, distinct from public-facing collections.

### D.1 Ubiquitous Requirements

The system shall scope every product list to a `merchantId`.

The system shall record `createdAt` and `updatedAt` on every list and list item record.

### D.2 Event-Driven Requirements

When an authenticated merchant creates a product list with a valid `name`, the system shall persist it scoped to the merchant and return the created record.

When an authenticated merchant lists their product lists, the system shall return all non-deleted lists for that merchant ordered by `createdAt DESC`.

When an authenticated merchant retrieves a product list by ID, the system shall return the list if it belongs to that merchant.

When an authenticated merchant updates a product list, the system shall apply the changes and return the updated record.

When an authenticated merchant soft-deletes a product list, the system shall set `deletedAt` and return HTTP 200.

When an authenticated merchant adds a product to a list, the system shall create a `productListItem` record with the specified `position`.

When an authenticated merchant retrieves items in a list, the system shall return them ordered by `position ASC, createdAt ASC`.

When an authenticated merchant removes a product from a list, the system shall permanently delete the `productListItem` record.

---

## 8. Use Case Traceability

| Requirement                                    | Repo / Use Case                    | Source File                                                                              |
| ---------------------------------------------- | ---------------------------------- | ---------------------------------------------------------------------------------------- |
| Product relationship CRUD + bidirectional      | `ProductRelationshipRepo`          | `modules/product/infrastructure/repositories/productRelationshipRepo.ts`                 |
| Bundle CRUD + items                            | `BundleController`                 | `modules/product/interface/controllers/BundleController.ts`                              |
| Bundle repo                                    | `bundleRepo`                       | `modules/product/infrastructure/repositories/bundleRepo.ts`                              |
| Collection create / update / delete            | `ManageProductCollectionUseCase`   | `modules/product/application/useCases/ManageProductCollection.ts`                        |
| Collection map items                           | `productCollectionMapRepo`         | `modules/product/infrastructure/repositories/productCollectionMapRepo.ts`                |
| Product list CRUD                              | `ProductListRepo`                  | `modules/product/infrastructure/repositories/productListRepo.ts`                         |
| Product list items                             | `ProductListItemRepo`              | `modules/product/infrastructure/repositories/productListItemRepo.ts`                     |
