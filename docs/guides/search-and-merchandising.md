# Search & Merchandising Guide

> How to use the search index abstraction, dynamic attribute filtering, merchandising rules, and per-category manual ordering.

## Architecture Overview

The search system uses an **adapter pattern** defined in `libs/search/types.ts`:

```
SearchAdapter interface
  ├── PostgresFtsAdapter (default) — PostgreSQL full-text search
  ├── (future) OpenSearch adapter
  └── (future) pgvector adapter
```

**Configuration:**
```bash
SEARCH_BACKEND=postgres   # default | opensearch | pgvector
```

The adapter is initialized at boot via `initSearchAdapter()` in `boot/routes.ts`.

## API Endpoints

### Customer Routes (public)

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/customer/search` | Full-text search with filters, facets, and merchandising |
| `GET` | `/customer/search/autocomplete` | Autocomplete suggestions |

### Business Routes (auth required)

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/business/search/health` | Search backend health check |
| `GET` | `/business/search/merchandising` | List merchandising rules |
| `POST` | `/business/search/merchandising` | Create merchandising rule |
| `PUT` | `/business/search/merchandising/:ruleId` | Update rule |
| `DELETE` | `/business/search/merchandising/:ruleId` | Delete rule |
| `GET` | `/business/search/manual-order/:categoryId` | Get manual order for category |
| `PUT` | `/business/search/manual-order/:categoryId` | Set manual order for category |
| `DELETE` | `/business/search/manual-order/:categoryId` | Delete manual order for category |

---

## Basic Search

```
GET /customer/search?q=red+shirt&page=1&limit=20
```

**Parameters:**

| Param | Type | Description |
|-------|------|-------------|
| `q` or `query` | string | Full-text search query |
| `page` | int | Page number (default: 1) |
| `limit` | int | Results per page (default: 20) |
| `sortBy` | string | `name`, `price`, `createdAt`, `popularity`, `rating`, `relevance`, `manual` |
| `sortOrder` | string | `asc` or `desc` |
| `includeFacets` | boolean | Include facet counts in response |

**Response:**
```json
{
  "success": true,
  "data": {
    "products": [...],
    "total": 142,
    "page": 1,
    "limit": 20,
    "totalPages": 8,
    "facets": {
      "categories": [...],
      "priceRanges": [...],
      "attributes": [...]
    }
  }
}
```

---

## Filtering

### Category Filter

```
GET /customer/search?categoryId=uuid-here
GET /customer/search?categoryIds=uuid1,uuid2,uuid3
```

### Price Range

```
GET /customer/search?minPrice=10&maxPrice=100
```

### Status & Visibility

```
GET /customer/search?status=active&visibility=visible
```

### Boolean Filters

```
GET /customer/search?isFeatured=true&isNew=true
GET /customer/search?isBestseller=false&hasVariants=true
GET /customer/search?inStock=true
```

### Product Type Filter

```
GET /customer/search?productTypeId=uuid-here
```

---

## Dynamic Attribute Filtering

This is the key feature for products with **dynamic attributes** (e.g., clothing has `size` and `color`, electronics has `wattage` and `voltage`).

### How It Works

Products have attributes stored in the `productAttributeValueMap` table, linked to `productAttribute` (defines the attribute) and `productAttributeValue` (defines possible values). The search adapter joins these tables at query time.

### Attribute Filter Structure

Pass the `attributes` parameter as a JSON array:

```json
[
  {
    "attributeCode": "color",
    "operator": "in",
    "values": ["red", "blue"]
  },
  {
    "attributeCode": "size",
    "operator": "eq",
    "value": "large"
  },
  {
    "attributeId": "uuid-of-price-attribute",
    "operator": "between",
    "minValue": 10,
    "maxValue": 50
  }
]
```

### Supported Operators

| Operator | Description | Fields Used |
|----------|-------------|-------------|
| `eq` | Equal to | `value` |
| `neq` | Not equal to | `value` |
| `in` | In list of values | `values[]` |
| `nin` | Not in list of values | `values[]` |
| `gt` | Greater than (numeric) | `minValue` |
| `gte` | Greater than or equal (numeric) | `minValue` |
| `lt` | Less than (numeric) | `maxValue` |
| `lte` | Less than or equal (numeric) | `maxValue` |
| `between` | Between two values (numeric) | `minValue`, `maxValue` |
| `like` | ILIKE pattern match | `value` (use `%` as wildcard) |

### Identifying Attributes

You can filter by either:
- **`attributeId`** — UUID of the attribute (from `productAttribute` table)
- **`attributeCode`** — Code string (e.g., `color`, `size`, `brand`)

### URL Encoding

When passing via query string, URL-encode the JSON:

```
GET /customer/search?q=shirt&attributes=%5B%7B%22attributeCode%22%3A%22color%22%2C%22operator%22%3A%22in%22%2C%22values%22%3A%5B%22red%22%2C%22blue%22%5D%7D%5D
```

Or use the API directly:

```typescript
const result = await searchAdapter.search({
  query: 'shirt',
  attributes: [
    { attributeCode: 'color', operator: 'in', values: ['red', 'blue'] },
    { attributeCode: 'size', operator: 'eq', value: 'large' },
    { attributeCode: 'price', operator: 'between', minValue: 10, maxValue: 50 },
  ],
  includeFacets: true,
});
```

---

## Faceted Search

Enable facets with `includeFacets=true`:

```
GET /customer/search?q=shirt&includeFacets=true
```

**Returns three types of facets:**

1. **Category facets** — `{ id, name, count }` for each matching category
2. **Price range facets** — `{ min, max, count }` for price buckets
3. **Attribute facets** — `{ attributeId, attributeCode, attributeName, type, values[] }` for each dynamic attribute

Use these facets to build filter UIs (sidebar filters, drill-down navigation).

---

## Autocomplete

```
GET /customer/search/autocomplete?q=red&limit=10
```

Returns product name and category suggestions:

```json
{
  "success": true,
  "data": [
    { "text": "Red Cotton Shirt", "type": "product", "productId": "..." },
    { "text": "Red Dress", "type": "product", "productId": "..." },
    { "text": "Red Collection", "type": "category", "categoryId": "..." }
  ]
}
```

Minimum query length is 2 characters.

---

## Merchandising Rules

Merchandising allows you to boost, bury, or pin products in search results.

### Rule Types

| Type | Effect |
|------|--------|
| `boost` | Moves product toward the top of results |
| `bury` | Moves product toward the bottom of results |
| `pin` | Locks product at a specific position |

### Creating Rules

```bash
POST /business/search/merchandising
Content-Type: application/json

{
  "ruleType": "pin",
  "productId": "uuid-here",
  "position": 0,
  "searchTerm": "shirt",
  "categoryId": "uuid-here",
  "isActive": true
}
```

- **`searchTerm`** (optional) — Rule only applies when search query matches
- **`categoryId`** (optional) — Rule only applies when browsing that category
- If both are omitted, the rule applies globally

### Listing Rules

```bash
GET /business/search/merchandising?ruleType=boost&isActive=true
```

### Updating Rules

```bash
PUT /business/search/merchandising/:ruleId
{ "isActive": false }
```

### Deleting Rules

```bash
DELETE /business/search/merchandising/:ruleId
```

---

## Per-Category Manual Ordering

Override the sort order for a specific category with a fixed product list.

### Setting Manual Order

```bash
PUT /business/search/manual-order/:categoryId
Content-Type: application/json

{
  "productIds": ["product-uuid-1", "product-uuid-2", "product-uuid-3"]
}
```

This replaces any existing manual order for the category.

### Activating Manual Order

When a user browses a category with manual ordering set, and `sortBy=manual` (or no sort is specified), products appear in the defined order. Products not in the manual list appear after, sorted by default relevance.

```
GET /customer/search?categoryId=uuid-here&sortBy=manual
```

### Getting Manual Order

```bash
GET /business/search/manual-order/:categoryId
```

### Deleting Manual Order

```bash
DELETE /business/search/manual-order/:categoryId
```

---

## Using the Search Adapter Programmatically

```typescript
import { getSearchAdapter } from 'libs/search';

const adapter = getSearchAdapter();

// Search with dynamic attributes
const result = await adapter.search({
  query: 'laptop',
  categoryIds: ['cat-1', 'cat-2'],
  minPrice: 500,
  maxPrice: 2000,
  attributes: [
    { attributeCode: 'ram', operator: 'gte', minValue: 16 },
    { attributeCode: 'brand', operator: 'in', values: ['Dell', 'HP', 'Lenovo'] },
  ],
  sortBy: 'price',
  sortOrder: 'asc',
  page: 1,
  limit: 20,
  includeFacets: true,
});

// Autocomplete
const suggestions = await adapter.autocomplete('lap', 10);

// Health check
const health = await adapter.health();
```

---

## How FTS Works (PostgresFtsAdapter)

The default adapter uses PostgreSQL native full-text search:

- **`to_tsvector('english', ...)`** — Creates a tsvector from product name, description, short description, and SKU
- **`plainto_tsquery('english', ...)`** — Creates a tsquery from the user's search input
- **`@@` operator** — Matches tsvector against tsquery
- **`ts_rank_cd()`** — Ranks results by cover density (how close and frequent the search terms appear)
- **`ILIKE`** — Fallback for substring matching (SKU, barcode) that FTS doesn't handle well
- **`similarity()`** — Trigram similarity for autocomplete (requires `pg_trgm` extension)

No separate index table is needed — the tsvector is generated at query time. For production scale, add a **GIN index** on a generated tsvector column:

```sql
ALTER TABLE "product" ADD COLUMN "searchVector" tsvector
  GENERATED ALWAYS AS (
    to_tsvector('english',
      coalesce("name", '') || ' ' ||
      coalesce("description", '') || ' ' ||
      coalesce("shortDescription", '') || ' ' ||
      coalesce("sku", '')
    )
  ) STORED;

CREATE INDEX idx_product_search_vector ON "product" USING GIN ("searchVector");
```

---

## Implementing a Custom Search Adapter

To use a different backend (OpenSearch, pgvector, etc.), implement the `SearchAdapter` interface:

```typescript
import type { SearchAdapter, SearchQuery, SearchResult, AutocompleteSuggestion } from 'libs/search/types';

class OpenSearchAdapter implements SearchAdapter {
  async search(query: SearchQuery): Promise<SearchResult> { ... }
  async autocomplete(partialQuery: string, limit?: number): Promise<AutocompleteSuggestion[]> { ... }
  async indexProduct(productId: string): Promise<void> { ... }
  async indexAll(): Promise<number> { ... }
  async removeProduct(productId: string): Promise<void> { ... }
  async health(): Promise<{ healthy: boolean; details?: Record<string, unknown> }> { ... }
}
```

Register it in `libs/search/init.ts` and set `SEARCH_BACKEND=opensearch`.

---

## Database Tables

### Merchandising Tables

- **`merchandisingRule`** — Boost/bury/pin rules with optional searchTerm and categoryId scoping
- **`categoryManualOrder`** — Per-category product ordering with position

### Existing Tables Used

- **`product`** — Main product table (searched via FTS)
- **`productCategoryMap`** — Product-to-category mapping
- **`productAttributeValueMap`** — Product attribute values (for dynamic attribute filtering)
- **`productAttribute`** — Attribute definitions
- **`productAttributeValue`** — Attribute value definitions
- **`productCategory`** — Category definitions (for autocomplete and facets)
