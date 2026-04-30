# Product – Merchant: Category Management EARS Requirements

> **System**: CommerceFull – `product`
> **Actor**: Merchant / Admin
> **Date**: 2026-04-28
> **Source**: `modules/product/infrastructure/repositories/categoryRepo.ts`, `modules/product/interface/routers/productBusinessRouter.ts`

---

## Context

Categories form a tree structure. Each category has a `parentId`, a computed `depth`, and a materialized `path` string (ancestor IDs joined by `/`). Categories can be merchant-scoped (`merchantId`) or global (`isGlobal = true`). The `productCount` field is maintained by the system and reflects the number of products mapped to each category.

### Category Fields

| Field             | Description                                              |
| ----------------- | -------------------------------------------------------- |
| `name`            | Display name (required)                                  |
| `slug`            | URL-safe identifier, auto-generated from name if omitted |
| `parentId`        | Parent category ID; null for root categories             |
| `depth`           | Computed tree depth (0 = root)                           |
| `path`            | Materialized path of ancestor IDs                        |
| `isActive`        | Controls customer visibility                             |
| `isFeatured`      | Included in featured category queries                    |
| `includeInMenu`   | Included in navigation menu queries                      |
| `imageUrl`        | Category image                                           |
| `bannerUrl`       | Category banner image                                    |
| `iconUrl`         | Category icon                                            |
| `displaySettings` | JSON blob for custom layout/display configuration        |
| `productCount`    | Maintained by system; count of mapped products           |

### Policy Defaults

| Policy                  | Default |
| ----------------------- | ------- |
| `isActive`              | `true`  |
| `isFeatured`            | `false` |
| `includeInMenu`         | `true`  |
| `isGlobal`              | `true`  |
| `depth` (root category) | `0`     |

---

## 1. Ubiquitous Requirements

The system shall compute `depth` and `path` from the parent category at creation time.

The system shall auto-generate a URL-safe `slug` from the category `name` when no slug is provided.

The system shall record `createdAt` and `updatedAt` on every category record.

The system shall maintain `productCount` on each category to reflect the number of products currently mapped to it.

---

## 2. Event-Driven Requirements

When an authenticated merchant calls `POST /business/categories` with a valid `name`, the system shall create the category, compute `depth` and `path` from the parent (if provided), and return HTTP 201.

When an authenticated merchant calls `GET /business/categories`, the system shall return all categories ordered by `position ASC`.

When an authenticated merchant calls `GET /business/categories/:id`, the system shall return the category matching that ID.

When an authenticated merchant calls `GET /business/categories/slug/:slug`, the system shall return the category matching that slug.

When an authenticated merchant calls `GET /business/categories/:categoryId/children`, the system shall return all direct child categories of the specified parent, ordered by `position ASC`.

When an authenticated merchant calls `GET /business/categories/root`, the system shall return all root categories (where `parentId IS NULL`), ordered by `position ASC`.

When an authenticated merchant calls `PUT /business/categories/:id` with valid updates, the system shall apply the changes and return the updated category.

When an authenticated merchant calls `DELETE /business/categories/:id`, the system shall permanently remove the category.

When a product is mapped to or unmapped from a category, the system shall update `productCount` on that category.

---

## 3. State-Driven Requirements

While a category has `isActive = false`, the system shall exclude it from all customer-facing category listings.

While a category has `isFeatured = true` and `isActive = true`, the system shall include it in featured category queries (`?featured=true`).

While a category has `includeInMenu = true` and `isActive = true`, the system shall include it in navigation menu queries (`?menu=true`).

---

## 4. Unwanted Behaviour / Edge Cases

If a merchant requests a category that does not exist, the system shall return HTTP 404.

If a merchant provides a `parentId` that does not correspond to an existing category, the system shall reject the request.

---

## 8. Use Case Traceability

| Requirement                          | Controller / Repo  | Source File                                                              |
| ------------------------------------ | ------------------ | ------------------------------------------------------------------------ |
| Create / update / delete category    | `categoryRepo`     | `modules/product/infrastructure/repositories/categoryRepo.ts`            |
| List / get / children / root         | `categoryRepo`     | `modules/product/infrastructure/repositories/categoryRepo.ts`            |
| Featured / menu category queries     | `categoryRepo`     | `modules/product/infrastructure/repositories/categoryRepo.ts`            |
| Update product count                 | `categoryRepo`     | `modules/product/infrastructure/repositories/categoryRepo.ts`            |
| Customer-facing category browsing    | `CategoryCustomerController` | `modules/product/interface/controllers/CategoryCustomerController.ts` |
