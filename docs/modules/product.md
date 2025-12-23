# Product Feature

## Overview

The Product feature manages the product catalog, including products, variants, bundles, media, and categorization. It supports both business/admin operations and customer-facing product browsing.

---

## Use Cases

### UC-PRD-001: List Products (Business)

**Actor:** Merchant/Admin  
**Priority:** High

#### Given-When-Then

**Given** an authenticated merchant  
**When** they request the product list  
**Then** the system returns a paginated list of products

#### API Endpoint

```
GET /business/products
Query: status, categoryId, search, limit, offset
```

#### Business Rules

- Returns all products (including unpublished)
- Supports filtering by status, category
- Supports text search
- Includes variant count and stock status

---

### UC-PRD-002: Create Product (Business)

**Actor:** Merchant/Admin  
**Priority:** High

#### Given-When-Then

**Given** an authenticated merchant  
**And** valid product data  
**When** they create a product  
**Then** the system creates the product with master variant  
**And** emits product.created event

#### API Endpoint

```
POST /business/products
Body: { name, slug, description, sku, price, categoryIds, ... }
```

#### Business Rules

- Name and SKU are required
- Slug is auto-generated if not provided
- Master variant is created automatically
- Product starts in draft status
- SKU must be unique

---

### UC-PRD-003: Get Product Details (Business)

**Actor:** Merchant/Admin  
**Priority:** High

#### Given-When-Then

**Given** an authenticated merchant  
**And** a valid product ID  
**When** they request product details  
**Then** the system returns the complete product with variants

#### API Endpoint

```
GET /business/products/:productId
```

#### Business Rules

- Returns full product details
- Includes all variants
- Includes category assignments
- Includes media attachments

---

### UC-PRD-004: Update Product (Business)

**Actor:** Merchant/Admin  
**Priority:** High

#### Given-When-Then

**Given** an authenticated merchant  
**And** an existing product  
**When** they update the product  
**Then** the system saves the changes  
**And** emits product.updated event

#### API Endpoint

```
PUT /business/products/:productId
Body: { name?, description?, price?, ... }
```

#### Business Rules

- Only provided fields are updated
- SKU change validates uniqueness
- Price changes may trigger price alerts
- Updates timestamp

---

### UC-PRD-005: Update Product Status (Business)

**Actor:** Merchant/Admin  
**Priority:** High

#### Given-When-Then

**Given** an authenticated merchant  
**And** an existing product  
**When** they update the product status  
**Then** the system changes the product status  
**And** emits product.status_changed event

#### API Endpoint

```
PUT /business/products/:productId/status
Body: { status: 'draft'|'active'|'archived' }
```

#### Business Rules

- Valid statuses: draft, active, archived
- Archived products are hidden from storefront
- Active products must be published to be visible

---

### UC-PRD-006: Publish Product (Business)

**Actor:** Merchant/Admin  
**Priority:** High

#### Given-When-Then

**Given** an authenticated merchant  
**And** a product ready for publishing  
**When** they publish the product  
**Then** the product becomes visible on storefront  
**And** emits product.published event

#### API Endpoint

```
POST /business/products/:productId/publish
```

#### Business Rules

- Product must be in active status
- Must have at least one variant with stock
- Must have required fields (name, description, price)
- Sets publishedAt timestamp

---

### UC-PRD-007: Unpublish Product (Business)

**Actor:** Merchant/Admin  
**Priority:** Medium

#### Given-When-Then

**Given** an authenticated merchant  
**And** a published product  
**When** they unpublish the product  
**Then** the product is hidden from storefront  
**And** emits product.unpublished event

#### API Endpoint

```
POST /business/products/:productId/unpublish
```

#### Business Rules

- Product is no longer visible to customers
- Existing cart items may need handling
- Product data is retained

---

### UC-PRD-008: Delete Product (Business)

**Actor:** Merchant/Admin  
**Priority:** Medium

#### Given-When-Then

**Given** an authenticated merchant  
**And** an existing product  
**When** they delete the product  
**Then** the product is soft deleted  
**And** emits product.deleted event

#### API Endpoint

```
DELETE /business/products/:productId
```

#### Business Rules

- Soft delete (sets deletedAt)
- Product is hidden from all views
- Cannot delete products with open orders
- Historical order data is preserved

---

### UC-PRD-009: Search Products (Customer)

**Actor:** Customer/Guest  
**Priority:** High

#### Given-When-Then

**Given** any user  
**And** a search query  
**When** they search for products  
**Then** the system returns matching products

#### API Endpoint

```
GET /products/search
Query: q, categoryId, minPrice, maxPrice, sort, limit, offset
```

#### Business Rules

- Only returns published products
- Searches name, description, SKU
- Supports price range filtering
- Supports sorting (relevance, price, date)
- Tracks search queries for analytics

---

### UC-PRD-010: Get Featured Products (Customer)

**Actor:** Customer/Guest  
**Priority:** Medium

#### Given-When-Then

**Given** any user  
**When** they request featured products  
**Then** the system returns curated featured products

#### API Endpoint

```
GET /products/featured
Query: limit
```

#### Business Rules

- Returns products marked as featured
- Limited to published products
- May use algorithmic selection

---

### UC-PRD-011: Get Products by Category (Customer)

**Actor:** Customer/Guest  
**Priority:** High

#### Given-When-Then

**Given** any user  
**And** a valid category ID  
**When** they request products in category  
**Then** the system returns products in that category

#### API Endpoint

```
GET /products/category/:categoryId
Query: sort, limit, offset
```

#### Business Rules

- Only published products
- Includes products in subcategories
- Supports sorting and pagination

---

### UC-PRD-012: List Products (Customer)

**Actor:** Customer/Guest  
**Priority:** High

#### Given-When-Then

**Given** any user  
**When** they request the product list  
**Then** the system returns published products

#### API Endpoint

```
GET /products
Query: sort, limit, offset
```

#### Business Rules

- Only published products visible
- Default sorted by newest
- Supports pagination

---

### UC-PRD-013: Get Related Products (Customer)

**Actor:** Customer/Guest  
**Priority:** Medium

#### Given-When-Then

**Given** any user viewing a product  
**When** they request related products  
**Then** the system returns similar products

#### API Endpoint

```
GET /products/:productId/related
Query: limit
```

#### Business Rules

- Based on category, tags, or recommendations
- Excludes the source product
- Only published products

---

### UC-PRD-014: Get Product Details (Customer)

**Actor:** Customer/Guest  
**Priority:** High

#### Given-When-Then

**Given** any user  
**And** a product ID or slug  
**When** they request product details  
**Then** the system returns the product for display

#### API Endpoint

```
GET /products/:identifier
```

#### Business Rules

- Only published products
- Accepts ID or slug
- Includes variants, media, pricing
- Tracks product view for analytics

---

## Bundle Use Cases

### UC-PRD-015: List Bundles (Business)

**Actor:** Merchant/Admin  
**Priority:** Medium

#### Given-When-Then

**Given** an authenticated merchant  
**When** they request bundles  
**Then** the system returns all product bundles

#### API Endpoint

```
GET /business/products/bundles
```

---

### UC-PRD-016: Create Bundle (Business)

**Actor:** Merchant/Admin  
**Priority:** Medium

#### Given-When-Then

**Given** an authenticated merchant  
**And** valid bundle configuration  
**When** they create a bundle  
**Then** the system creates the bundle

#### API Endpoint

```
POST /business/products/bundles
Body: { productId, bundleType, discountType, discountValue, ... }
```

#### Business Rules

- Bundle types: fixed, dynamic, mix_match
- Discount types: percentage, fixed, fixed_price
- Requires at least 2 items for most bundles

---

### UC-PRD-017: Get Bundle (Business)

**Actor:** Merchant/Admin  
**Priority:** Medium

#### API Endpoint

```
GET /business/products/bundles/:id
```

---

### UC-PRD-018: Update Bundle (Business)

**Actor:** Merchant/Admin  
**Priority:** Medium

#### API Endpoint

```
PUT /business/products/bundles/:id
Body: { discountValue?, isActive?, ... }
```

---

### UC-PRD-019: Delete Bundle (Business)

**Actor:** Merchant/Admin  
**Priority:** Low

#### API Endpoint

```
DELETE /business/products/bundles/:id
```

---

### UC-PRD-020: Manage Bundle Items (Business)

**Actor:** Merchant/Admin  
**Priority:** Medium

#### API Endpoints

```
POST /business/products/bundles/:id/items
PUT /business/products/bundles/:id/items/:itemId
DELETE /business/products/bundles/:id/items/:itemId
```

---

### UC-PRD-021: Get Active Bundles (Customer)

**Actor:** Customer/Guest  
**Priority:** Medium

#### API Endpoint

```
GET /products/bundles
```

---

### UC-PRD-022: Get Bundle Details (Customer)

**Actor:** Customer/Guest  
**Priority:** Medium

#### API Endpoint

```
GET /products/bundles/:id
```

---

### UC-PRD-023: Get Bundle for Product (Customer)

**Actor:** Customer/Guest  
**Priority:** Medium

#### API Endpoint

```
GET /products/bundles/product/:productId
```

---

### UC-PRD-024: Calculate Bundle Price (Customer)

**Actor:** Customer/Guest  
**Priority:** Medium

#### API Endpoint

```
POST /products/bundles/:id/calculate
Body: { items: [{ productId, variantId, quantity }] }
```

---

## Events Emitted

| Event                    | Trigger                 | Payload                         |
| ------------------------ | ----------------------- | ------------------------------- |
| `product.created`        | Product created         | productId, name, sku            |
| `product.updated`        | Product modified        | productId, changes              |
| `product.deleted`        | Product deleted         | productId                       |
| `product.published`      | Product published       | productId                       |
| `product.unpublished`    | Product unpublished     | productId                       |
| `product.archived`       | Product archived        | productId                       |
| `product.status_changed` | Status changed          | productId, oldStatus, newStatus |
| `product.price_changed`  | Price modified          | productId, oldPrice, newPrice   |
| `product.viewed`         | Customer viewed product | productId, customerId           |
| `bundle.created`         | Bundle created          | bundleId, productId             |
| `bundle.purchased`       | Bundle purchased        | bundleId, orderId               |

---

## Integration Test Coverage

| Use Case                 | Test File                 | Status |
| ------------------------ | ------------------------- | ------ |
| UC-PRD-001               | `product/product.test.ts` | ✅     |
| UC-PRD-002               | `product/product.test.ts` | ✅     |
| UC-PRD-003               | `product/product.test.ts` | ✅     |
| UC-PRD-004               | `product/product.test.ts` | ✅     |
| UC-PRD-005               | `product/product.test.ts` | 🟡     |
| UC-PRD-006               | `product/product.test.ts` | 🟡     |
| UC-PRD-007               | `product/product.test.ts` | ❌     |
| UC-PRD-008               | `product/product.test.ts` | ✅     |
| UC-PRD-009               | `product/product.test.ts` | 🟡     |
| UC-PRD-010               | `product/product.test.ts` | ❌     |
| UC-PRD-011               | `product/product.test.ts` | 🟡     |
| UC-PRD-012               | `product/product.test.ts` | ✅     |
| UC-PRD-013               | `product/product.test.ts` | ❌     |
| UC-PRD-014               | `product/product.test.ts` | ✅     |
| UC-PRD-015 to UC-PRD-024 | `product/bundle.test.ts`  | ❌     |
