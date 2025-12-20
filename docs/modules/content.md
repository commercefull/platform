# Content Feature

## Overview

The Content feature provides a headless CMS for managing dynamic pages, content blocks, and templates. It enables merchants to create and manage landing pages, blog posts, and other content without code changes.

---

## Use Cases

### Content Types (Business)

### UC-CNT-001: List Content Types (Business)
**Actor:** Merchant/Admin  
**Priority:** High

#### Given-When-Then

**Given** an authenticated merchant  
**When** they request content types  
**Then** the system returns all content type definitions

#### API Endpoint
```
GET /business/content/types
```

---

### UC-CNT-002: Create Content Type (Business)
**Actor:** Merchant/Admin  
**Priority:** High

#### Given-When-Then

**Given** an authenticated merchant  
**And** valid type configuration  
**When** they create a content type  
**Then** pages of that type can be created

#### API Endpoint
```
POST /business/content/types
Body: {
  name, slug,
  fields: [{ name, type, required?, options? }],
  description?
}
```

#### Business Rules
- Field types: text, richtext, image, video, link, number, boolean, date
- Slug must be unique
- Fields define the content schema

---

### UC-CNT-003: Get Content Type (Business)
**Actor:** Merchant/Admin  
**Priority:** Medium

#### API Endpoint
```
GET /business/content/types/:id
GET /business/content/types/slug/:slug
```

---

### UC-CNT-004: Update Content Type (Business)
**Actor:** Merchant/Admin  
**Priority:** Medium

#### API Endpoint
```
PUT /business/content/types/:id
```

---

### UC-CNT-005: Delete Content Type (Business)
**Actor:** Merchant/Admin  
**Priority:** Low

#### API Endpoint
```
DELETE /business/content/types/:id
```

---

### Content Pages (Business)

### UC-CNT-006: List Pages (Business)
**Actor:** Merchant/Admin  
**Priority:** High

#### Given-When-Then

**Given** an authenticated merchant  
**When** they request pages  
**Then** the system returns all content pages

#### API Endpoint
```
GET /business/content/pages
Query: typeId?, status?, limit, offset
```

---

### UC-CNT-007: Create Page (Business)
**Actor:** Merchant/Admin  
**Priority:** High

#### Given-When-Then

**Given** an authenticated merchant  
**And** valid page data  
**When** they create a page  
**Then** the page is created in draft status

#### API Endpoint
```
POST /business/content/pages
Body: {
  title, slug, typeId,
  content: {},
  metaTitle?, metaDescription?,
  templateId?,
  status: 'draft'|'published'
}
```

#### Business Rules
- Slug must be unique
- Content must match type schema
- Can use templates for layout

---

### UC-CNT-008: Get Page (Business)
**Actor:** Merchant/Admin  
**Priority:** High

#### API Endpoint
```
GET /business/content/pages/:id
```

---

### UC-CNT-009: Get Full Page (Business)
**Actor:** Merchant/Admin  
**Priority:** Medium

#### Given-When-Then

**Given** a page ID  
**When** requesting full page  
**Then** the system returns page with all blocks

#### API Endpoint
```
GET /business/content/pages/:id/full
```

---

### UC-CNT-010: Update Page (Business)
**Actor:** Merchant/Admin  
**Priority:** High

#### API Endpoint
```
PUT /business/content/pages/:id
```

---

### UC-CNT-011: Delete Page (Business)
**Actor:** Merchant/Admin  
**Priority:** Low

#### API Endpoint
```
DELETE /business/content/pages/:id
```

---

### Content Blocks (Business)

### UC-CNT-012: Get Page Blocks (Business)
**Actor:** Merchant/Admin  
**Priority:** High

#### API Endpoint
```
GET /business/content/pages/:pageId/blocks
```

---

### UC-CNT-013: Create Block (Business)
**Actor:** Merchant/Admin  
**Priority:** High

#### Given-When-Then

**Given** an authenticated merchant  
**And** a page  
**When** they create a content block  
**Then** the block is added to the page

#### API Endpoint
```
POST /business/content/blocks
Body: {
  pageId,
  blockType: 'hero'|'text'|'image'|'gallery'|'video'|'cta'|'products',
  content: {},
  sortOrder
}
```

#### Business Rules
- Blocks are ordered by sortOrder
- Different block types have different schemas
- Can embed product listings

---

### UC-CNT-014: Get Block (Business)
**Actor:** Merchant/Admin  
**Priority:** Medium

#### API Endpoint
```
GET /business/content/blocks/:id
```

---

### UC-CNT-015: Update Block (Business)
**Actor:** Merchant/Admin  
**Priority:** High

#### API Endpoint
```
PUT /business/content/blocks/:id
```

---

### UC-CNT-016: Delete Block (Business)
**Actor:** Merchant/Admin  
**Priority:** Medium

#### API Endpoint
```
DELETE /business/content/blocks/:id
```

---

### UC-CNT-017: Reorder Blocks (Business)
**Actor:** Merchant/Admin  
**Priority:** Medium

#### Given-When-Then

**Given** a page with blocks  
**When** reordering blocks  
**Then** the display order is updated

#### API Endpoint
```
POST /business/content/pages/:pageId/blocks/reorder
Body: { blockIds: [] }
```

---

### Content Templates (Business)

### UC-CNT-018: List Templates (Business)
**Actor:** Merchant/Admin  
**Priority:** Medium

#### API Endpoint
```
GET /business/content/templates
```

---

### UC-CNT-019: Create Template (Business)
**Actor:** Merchant/Admin  
**Priority:** Medium

#### Given-When-Then

**Given** an authenticated merchant  
**And** valid template configuration  
**When** they create a template  
**Then** pages can use that layout

#### API Endpoint
```
POST /business/content/templates
Body: {
  name, slug,
  layout: {},
  defaultBlocks: []
}
```

---

### UC-CNT-020: Get Template (Business)
**Actor:** Merchant/Admin  
**Priority:** Medium

#### API Endpoint
```
GET /business/content/templates/:id
```

---

### UC-CNT-021: Update Template (Business)
**Actor:** Merchant/Admin  
**Priority:** Low

#### API Endpoint
```
PUT /business/content/templates/:id
```

---

### UC-CNT-022: Delete Template (Business)
**Actor:** Merchant/Admin  
**Priority:** Low

#### API Endpoint
```
DELETE /business/content/templates/:id
```

---

## Events Emitted

| Event | Trigger | Payload |
|-------|---------|---------|
| `content.page.created` | Page created | pageId, slug |
| `content.page.published` | Page published | pageId |
| `content.page.updated` | Page updated | pageId |
| `content.page.deleted` | Page deleted | pageId |

---

## Integration Test Coverage

| Use Case | Test File | Status |
|----------|-----------|--------|
| UC-CNT-001 to UC-CNT-005 | `content/types.test.ts` | 🟡 |
| UC-CNT-006 to UC-CNT-011 | `content/pages.test.ts` | 🟡 |
| UC-CNT-012 to UC-CNT-017 | `content/blocks.test.ts` | ❌ |
| UC-CNT-018 to UC-CNT-022 | `content/templates.test.ts` | ❌ |
