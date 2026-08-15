# Content Feature

## Overview

The Content feature provides a headless CMS for managing dynamic pages, content blocks, and templates. It enables merchants to create and manage landing pages, blog posts, and other content without code changes.

---

## Use Cases

| ID | Use Case | Actor | Purpose |
|---|---|---|---|
| UC-CNT-001 | List Content Types | Merchant/Admin | List all content type definitions with their field schemas |
| UC-CNT-002 | Create Content Type | Merchant/Admin | Define a new content type with custom fields (text, richtext, image, etc.) |
| UC-CNT-003 | Get Content Type | Merchant/Admin | Retrieve a content type by ID or slug |
| UC-CNT-004 | Update Content Type | Merchant/Admin | Update an existing content type's fields or description |
| UC-CNT-005 | Delete Content Type | Merchant/Admin | Permanently delete a content type definition |
| UC-CNT-006 | List Pages | Merchant/Admin | List all content pages with optional type/status filtering |
| UC-CNT-007 | Create Page | Merchant/Admin | Create a new content page in draft or published status with typed content |
| UC-CNT-008 | Get Page | Merchant/Admin | Retrieve a specific content page by ID |
| UC-CNT-009 | Get Full Page | Merchant/Admin | Retrieve a page with all its content blocks included |
| UC-CNT-010 | Update Page | Merchant/Admin | Update an existing page's title, content, metadata, or status |
| UC-CNT-011 | Delete Page | Merchant/Admin | Permanently delete a content page |
| UC-CNT-012 | Get Page Blocks | Merchant/Admin | List all content blocks associated with a page |
| UC-CNT-013 | Create Block | Merchant/Admin | Add a content block (hero, text, image, gallery, CTA, products) to a page |
| UC-CNT-014 | Get Block | Merchant/Admin | Retrieve a specific content block by ID |
| UC-CNT-015 | Update Block | Merchant/Admin | Update an existing content block's type, content, or sort order |
| UC-CNT-016 | Delete Block | Merchant/Admin | Permanently delete a content block from a page |
| UC-CNT-017 | Reorder Blocks | Merchant/Admin | Reorder content blocks on a page by providing a new block ID sequence |
| UC-CNT-018 | List Templates | Merchant/Admin | List all available content templates |
| UC-CNT-019 | Create Template | Merchant/Admin | Create a reusable page template with layout and default blocks |
| UC-CNT-020 | Get Template | Merchant/Admin | Retrieve a specific content template by ID |
| UC-CNT-021 | Update Template | Merchant/Admin | Update an existing template's layout or default blocks |
| UC-CNT-022 | Delete Template | Merchant/Admin | Permanently delete a content template |

### API Endpoints

| ID | Method | Endpoint |
|---|---|---|
| UC-CNT-001 | GET | `/business/content/types` |
| UC-CNT-002 | POST | `/business/content/types` |
| UC-CNT-003 | GET | `/business/content/types/:id` or `/business/content/types/slug/:slug` |
| UC-CNT-004 | PUT | `/business/content/types/:id` |
| UC-CNT-005 | DELETE | `/business/content/types/:id` |
| UC-CNT-006 | GET | `/business/content/pages` |
| UC-CNT-007 | POST | `/business/content/pages` |
| UC-CNT-008 | GET | `/business/content/pages/:id` |
| UC-CNT-009 | GET | `/business/content/pages/:id/full` |
| UC-CNT-010 | PUT | `/business/content/pages/:id` |
| UC-CNT-011 | DELETE | `/business/content/pages/:id` |
| UC-CNT-012 | GET | `/business/content/pages/:pageId/blocks` |
| UC-CNT-013 | POST | `/business/content/blocks` |
| UC-CNT-014 | GET | `/business/content/blocks/:id` |
| UC-CNT-015 | PUT | `/business/content/blocks/:id` |
| UC-CNT-016 | DELETE | `/business/content/blocks/:id` |
| UC-CNT-017 | POST | `/business/content/pages/:pageId/blocks/reorder` |
| UC-CNT-018 | GET | `/business/content/templates` |
| UC-CNT-019 | POST | `/business/content/templates` |
| UC-CNT-020 | GET | `/business/content/templates/:id` |
| UC-CNT-021 | PUT | `/business/content/templates/:id` |
| UC-CNT-022 | DELETE | `/business/content/templates/:id` |

---

## Events Emitted

| Event                    | Trigger        | Payload      |
| ------------------------ | -------------- | ------------ |
| `content.page.created`   | Page created   | pageId, slug |
| `content.page.published` | Page published | pageId       |
| `content.page.updated`   | Page updated   | pageId       |
| `content.page.deleted`   | Page deleted   | pageId       |

---

## Integration Test Coverage

| Use Case                 | Test File                          | Status |
| ------------------------ | ---------------------------------- | ------ |
| UC-CNT-001 to UC-CNT-005 | `content/content.test.ts`          | ✅     |
| UC-CNT-006 to UC-CNT-011 | `content/content.test.ts`          | ✅     |
| UC-CNT-012 to UC-CNT-017 | `content/blocks.test.ts`           | ✅     |
| UC-CNT-018 to UC-CNT-022 | `content/content.test.ts`          | ✅     |
