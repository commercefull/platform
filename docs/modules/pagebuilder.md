# Page Builder Module

## Overview

The Page Builder module provides a drag-and-drop page editor with a block schema registry, live preview with theme engine integration, and multi-region layout support.

---

## Public API (`index.ts`)

| Export | Type | Description |
|---|---|---|
| `PageDraft` | Entity | Draft page with placed blocks in regions |
| `PageDraftRepository` | Port | Repository interface |
| `BlockSchemaRegistry` | Service | Registry of 14 built-in block types with field schemas |
| `PageBuilderErrors` | Errors | Domain error classes |

---

## Domain Entities

| Entity | Description |
|---|---|
| `PageDraft` | `draftId`, `organizationId`, `storeId`, name, blocks (header/main/sidebar/footer regions), status (draft/published/archived), version |

## Block Types

| Block | Category | Description |
|---|---|---|
| `heading` | content | Heading text with level |
| `text` | content | Plain text block |
| `rich-text` | content | Rich text editor block |
| `image` | content | Single image with alt text |
| `hero-banner` | content | Full-width hero banner |
| `spacer` | layout | Vertical spacing block |
| `video` | content | Embedded video |
| `html` | content | Raw HTML block |
| `product-grid` | commerce | Product grid with configurable columns |
| `product-carousel` | commerce | Horizontal product carousel |
| `category-grid` | commerce | Category grid |
| `call-to-action` | content | CTA button block |
| `divider` | layout | Horizontal divider |
| `container` | layout | Container for nested blocks |

## Domain Errors

| Error | Code | Status |
|---|---|---|
| `PageDraftNotFoundError` | `pagebuilder.draft_not_found` | 404 |
| `PageBuilderValidationError` | `pagebuilder.validation_error` | 400 |
| `BlockValidationError` | `pagebuilder.block_validation_error` | 400 |

## Events

| Direction | Events |
|---|---|
| Publishes | `pagebuilder.draft.created`, `pagebuilder.draft.updated`, `pagebuilder.draft.deleted`, `pagebuilder.draft.published`, `pagebuilder.draft.unpublished`, `pagebuilder.block.added`, `pagebuilder.block.removed`, `pagebuilder.block.moved`, `pagebuilder.block.updated`, `pagebuilder.blocks.reordered` |
| Subscribes | (none) |

## Tables

| Table | Description |
|---|---|
| `pageDraft` | Draft pages with JSONB blocks and region layout |

## Routes

| Method | Endpoint | Description |
|---|---|---|
| GET | `/business/page-builder/drafts` | List drafts |
| POST | `/business/page-builder/drafts` | Create draft |
| GET | `/business/page-builder/drafts/:id` | Get draft |
| PUT | `/business/page-builder/drafts/:id` | Update draft |
| DELETE | `/business/page-builder/drafts/:id` | Delete draft |
| POST | `/business/page-builder/drafts/:id/publish` | Publish draft |
| POST | `/business/page-builder/drafts/:id/preview` | Preview draft |
| GET | `/business/page-builder/blocks` | List available block types |
