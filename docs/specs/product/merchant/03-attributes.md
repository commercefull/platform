# Product – Merchant: Dynamic Attribute System EARS Requirements

> **System**: CommerceFull – `product`
> **Actor**: Merchant / Admin
> **Date**: 2026-04-28
> **Source**: `modules/product/application/useCases/attribute/`, `modules/product/infrastructure/repositories/DynamicAttributeRepository.ts`, `modules/product/infrastructure/repositories/ProductAttributeSetRepository.ts`

---

## Context

The dynamic attribute system follows a three-level hierarchy:

```
ProductType
  └── ProductAttributeSet  (one type can have many sets)
        └── ProductAttribute  (one set can have many attributes, with per-set isRequired / defaultValue overrides)
```

Attributes are then assigned values on individual products via the `productAttributeValueMap` table.

### Attribute Types

`text`, `number`, `select`, `multiselect`, `checkbox`, `radio`, `date`, `datetime`, `time`, `file`, `image`, `video`, `document`, `color`, `boolean`

Only types `select`, `multiselect`, `radio`, `checkbox`, `color` support predefined option values.

### Key Attribute Flags

| Flag                    | Meaning                                              |
| ----------------------- | ---------------------------------------------------- |
| `isRequired`            | Value must be set on every product using this attr   |
| `isFilterable`          | Exposed as a facet in search results                 |
| `isSearchable`          | Included in full-text search index                   |
| `isComparable`          | Shown in product comparison tables                   |
| `isVisibleOnFront`      | Displayed on the storefront product detail page      |
| `isUsedInProductListing`| Shown in product listing cards                       |
| `useForVariants`        | Drives variant matrix generation                     |
| `useForConfigurations`  | Drives configurable product option selection         |
| `isSystem`              | Cannot be updated or deleted                         |
| `isGlobal`              | Available to all merchants (not merchant-scoped)     |

### Policy Defaults

| Policy                              | Default  |
| ----------------------------------- | -------- |
| Attribute type when not specified   | `text`   |
| Attribute value position (new)      | `count of existing values` |
| Attribute set `isActive`            | `true`   |
| Attribute set `isGlobal`            | `true`   |

---

## 1. Ubiquitous Requirements

The system shall ensure every attribute `code` is unique across the catalog.

The system shall ensure every attribute group `code` is unique across the catalog.

The system shall ensure every attribute set `code` is unique across the catalog.

The system shall prevent updating or deleting any attribute where `isSystem = true`.

The system shall record `createdAt` and `updatedAt` on every attribute, attribute group, attribute set, and attribute value record.

The system shall validate a product attribute value against the attribute's predefined options when the attribute type is `select` or `radio`, and reject values not in the option list.

---

## 2. Event-Driven Requirements

### 2.1 Attribute Groups

When an authenticated merchant calls `POST /business/attribute-groups` with a valid `name` and unique `code`, the system shall create the attribute group and return HTTP 201.

When an authenticated merchant calls `GET /business/attribute-groups`, the system shall return all attribute groups.

When an authenticated merchant calls `GET /business/attribute-groups/:id`, the system shall return the attribute group.

When an authenticated merchant calls `GET /business/attribute-groups/code/:code`, the system shall return the attribute group matching that code.

When an authenticated merchant calls `PUT /business/attribute-groups/:id` with valid updates, the system shall apply the changes and return the updated group.

When an authenticated merchant calls `DELETE /business/attribute-groups/:id`, the system shall remove the attribute group and return HTTP 200.

### 2.2 Attributes

When an authenticated merchant calls `POST /business/attributes` with a valid `name`, unique `code`, and `type`, the system shall create the attribute (and any supplied `options`) and return HTTP 201.

When an authenticated merchant calls `GET /business/attributes`, the system shall return all attributes. The following query filters are supported:
- `?groupId=<id>` — attributes belonging to a specific group
- `?searchable=true` — only searchable attributes
- `?filterable=true` — only filterable attributes
- `?forVariants=true` — only attributes with `useForVariants = true`

When an authenticated merchant calls `GET /business/attributes/:id`, the system shall return the attribute; for `select`/`multiselect`/`radio`/`checkbox`/`color` types the system shall also include the predefined `values` array.

When an authenticated merchant calls `GET /business/attributes/code/:code`, the system shall return the attribute matching that code.

When an authenticated merchant calls `PUT /business/attributes/:id` with valid updates, the system shall apply the changes and return the updated attribute.

When an authenticated merchant calls `DELETE /business/attributes/:id`, the system shall remove the attribute and return HTTP 200.

### 2.3 Attribute Values (predefined options)

When an authenticated merchant calls `GET /business/attributes/:id/values`, the system shall return all predefined values for that attribute.

When an authenticated merchant calls `POST /business/attributes/:id/values` with a valid `value` payload, the system shall add the option to the attribute and return HTTP 201.

When an authenticated merchant calls `DELETE /business/attributes/:id/values/:valueId`, the system shall remove the predefined option.

### 2.4 Attribute Sets

When an authenticated merchant calls `POST /business/attribute-sets` with a valid `name`, unique `code`, and optional `productTypeId`, the system shall create the attribute set and return HTTP 201.

When an authenticated merchant calls `GET /business/attribute-sets`, the system shall return all attribute sets.

When an authenticated merchant calls `GET /business/attribute-sets/:id`, the system shall return the attribute set with its full list of mapped attributes (including per-set `isRequired`, `position`, and `defaultValue`).

When an authenticated merchant calls `PUT /business/attribute-sets/:id` with valid updates, the system shall apply the changes and return the updated set.

When an authenticated merchant calls `DELETE /business/attribute-sets/:id`, the system shall remove the set and all its attribute mappings.

When an authenticated merchant calls `POST /business/attribute-sets/:id/attributes` with `{ attributeId, position, isRequired, defaultValue }`, the system shall add the attribute to the set (or update the mapping if it already exists via `ON CONFLICT DO UPDATE`).

When an authenticated merchant calls `DELETE /business/attribute-sets/:id/attributes/:attributeId`, the system shall remove the attribute from the set.

When an authenticated merchant calls `POST /business/attribute-sets/:id/attributes/reorder` with an ordered array of `attributeIds`, the system shall update each mapping's `position` to match the supplied order.

### 2.5 Product Types

When an authenticated merchant calls `POST /business/product-types` with a valid `name` and unique `slug`, the system shall create the product type and return HTTP 201.

When an authenticated merchant calls `GET /business/product-types`, the system shall return all product types. `?active=true` returns only active types.

When an authenticated merchant calls `GET /business/product-types/:id`, the system shall return the product type together with its associated `attributeSets` array.

When an authenticated merchant calls `GET /business/product-types/slug/:slug`, the system shall return the product type matching that slug.

When an authenticated merchant calls `GET /business/product-types/:id/attributes`, the system shall return the deduplicated, position-ordered list of all attributes across all active attribute sets linked to that product type.

When an authenticated merchant calls `PUT /business/product-types/:id` with valid updates, the system shall apply the changes and return the updated product type.

When an authenticated merchant calls `DELETE /business/product-types/:id`, the system shall remove the product type and return HTTP 200.

### 2.6 Product Attribute Assignment

When an authenticated merchant calls `GET /business/products/:productId/attributes`, the system shall return all attribute values currently assigned to the product, including `attributeId`, `attributeCode`, `attributeName`, `attributeType`, `value`, `isFilterable`, and `isSearchable`.

When an authenticated merchant calls `POST /business/products/:productId/attributes` with `{ attributeId, value }` (or `{ attributeCode, value }`), the system shall assign that attribute value to the product.

When an authenticated merchant calls `PUT /business/products/:productId/attributes` with `{ attributes: [...], clearExisting }`, the system shall set all provided attribute values; if `clearExisting = true` the system shall remove all prior assignments first. The response shall include `{ set: <count>, failed: [...] }`.

When an authenticated merchant calls `DELETE /business/products/:productId/attributes/:attributeId`, the system shall remove that attribute assignment from the product.

---

## 3. State-Driven Requirements

While an attribute has `isSystem = true`, the system shall reject any update or delete request for that attribute.

While an attribute type is `select` or `radio`, the system shall reject adding a predefined value that duplicates an existing value for the same attribute.

While an attribute type does not support options (`text`, `number`, `boolean`, `date`, `datetime`, `time`, `file`, `image`, `video`, `document`), the system shall reject attempts to add predefined values to it.

---

## 4. Unwanted Behaviour / Edge Cases

If a merchant attempts to create an attribute with a `code` that already exists, the system shall reject with: `"Attribute with code \"<code>\" already exists"`.

If a merchant attempts to update an attribute's `code` to one that already exists on a different attribute, the system shall reject with: `"Attribute with code \"<code>\" already exists"`.

If a merchant attempts to create an attribute group with a `code` that already exists, the system shall reject with HTTP 400: `"Attribute group with this code already exists"`.

If a merchant attempts to create an attribute set with a `code` that already exists, the system shall reject with HTTP 400.

If a merchant attempts to create a product type with a `slug` that already exists, the system shall reject with HTTP 400: `"Product type with slug \"<slug>\" already exists"`.

If a merchant attempts to update a product type's `slug` to one that already exists, the system shall reject with HTTP 400.

If a merchant attempts to set a product attribute value of type `select` or `radio` to a value not in the attribute's predefined options, the system shall reject with: `"Invalid value \"<value>\" for attribute \"<name>\""`.

If a merchant requests an attribute, attribute group, attribute set, or product type that does not exist, the system shall return HTTP 404.

If a merchant calls `POST /business/attributes` without `name` or `code`, the system shall reject with HTTP 400: `"Name and code are required"`.

If a merchant calls `POST /business/attribute-groups` without `name` or `code`, the system shall reject with HTTP 400: `"Name and code are required"`.

---

## 8. Use Case Traceability

| Requirement                                    | Use Case / Controller          | Source File                                                                              |
| ---------------------------------------------- | ------------------------------ | ---------------------------------------------------------------------------------------- |
| Create attribute                               | `CreateAttributeUseCase`       | `modules/product/application/useCases/attribute/CreateAttribute.ts`                      |
| Update attribute                               | `UpdateAttributeUseCase`       | `modules/product/application/useCases/attribute/UpdateAttribute.ts`                      |
| Delete attribute                               | `AttributeController`          | `modules/product/interface/controllers/AttributeController.ts`                           |
| Get / list attributes (with filters)           | `AttributeController`          | `modules/product/interface/controllers/AttributeController.ts`                           |
| Add / remove / get attribute values            | `ManageAttributeValues`        | `modules/product/application/useCases/attribute/ManageAttributeValues.ts`                |
| Create / update / delete attribute group       | `AttributeGroupController`     | `modules/product/interface/controllers/AttributeGroupController.ts`                      |
| Attribute set CRUD + attribute mapping         | `ProductAttributeSetRepository`| `modules/product/infrastructure/repositories/ProductAttributeSetRepository.ts`           |
| Create / update / delete product type          | `ProductTypeController`        | `modules/product/interface/controllers/ProductTypeController.ts`                         |
| Get product type with attribute sets           | `ProductTypeController`        | `modules/product/interface/controllers/ProductTypeController.ts`                         |
| Get attributes for product type                | `ProductTypeController`        | `modules/product/interface/controllers/ProductTypeController.ts`                         |
| Set single product attribute                   | `SetProductAttributeUseCase`   | `modules/product/application/useCases/attribute/AssignProductAttributes.ts`              |
| Set multiple product attributes                | `SetProductAttributesUseCase`  | `modules/product/application/useCases/attribute/AssignProductAttributes.ts`              |
| Get product attributes                         | `GetProductAttributesUseCase`  | `modules/product/application/useCases/attribute/AssignProductAttributes.ts`              |
| Remove product attribute                       | `RemoveProductAttributeUseCase`| `modules/product/application/useCases/attribute/AssignProductAttributes.ts`              |
