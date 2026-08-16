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


<!-- GENERATED:ENDPOINTS:START -->

| Method | Endpoint | Controller | Description |
|---|---|---|---|
| POST | `/business/content/blocks` | `createBlock` | — |
| GET | `/business/content/blocks/:id` | `getBlockById` | — |
| PUT | `/business/content/blocks/:id` | `updateBlock` | — |
| DELETE | `/business/content/blocks/:id` | `deleteBlock` | — |
| GET | `/business/content/categories` | `getCategories` | Content Category routes |
| POST | `/business/content/categories` | `createCategory` | — |
| GET | `/business/content/categories/:categoryId/pages` | `getPagesByCategory` | — |
| GET | `/business/content/categories/:id` | `getCategoryById` | — |
| PUT | `/business/content/categories/:id` | `updateCategory` | — |
| DELETE | `/business/content/categories/:id` | `deleteCategory` | — |
| POST | `/business/content/categories/:id/move` | `moveCategory` | — |
| GET | `/business/content/categories/tree` | `getCategoryTree` | — |
| GET | `/business/content/media` | `getMedia` | Content Media routes |
| POST | `/business/content/media` | `uploadMedia` | — |
| GET | `/business/content/media-folders` | `getMediaFolders` | Media Folder routes |
| POST | `/business/content/media-folders` | `createMediaFolder` | — |
| PUT | `/business/content/media-folders/:id` | `updateMediaFolder` | — |
| DELETE | `/business/content/media-folders/:id` | `deleteMediaFolder` | — |
| GET | `/business/content/media-folders/tree` | `getMediaFolderTree` | — |
| GET | `/business/content/media/:id` | `getMediaById` | — |
| PUT | `/business/content/media/:id` | `updateMedia` | — |
| DELETE | `/business/content/media/:id` | `deleteMedia` | — |
| GET | `/business/content/media/:mediaId/usage` | `getMediaUsage` | Media Usage routes |
| GET | `/business/content/media/:mediaId/usage/count` | `getMediaUsageCount` | — |
| POST | `/business/content/media/move` | `moveMediaToFolder` | — |
| POST | `/business/content/media/usage` | `trackMediaUsage` | — |
| GET | `/business/content/media/usage/:entityType/:entityId` | `getMediaUsageByEntity` | — |
| DELETE | `/business/content/media/usage/:usageId` | `untrackMediaUsage` | — |
| PUT | `/business/content/navigation-items/:id` | `updateNavigationItem` | — |
| DELETE | `/business/content/navigation-items/:id` | `deleteNavigationItem` | — |
| GET | `/business/content/navigations` | `getNavigations` | Content Navigation routes |
| POST | `/business/content/navigations` | `createNavigation` | — |
| GET | `/business/content/navigations/:id` | `getNavigationById` | — |
| PUT | `/business/content/navigations/:id` | `updateNavigation` | — |
| DELETE | `/business/content/navigations/:id` | `deleteNavigation` | — |
| GET | `/business/content/navigations/:id/items` | `getNavigationWithItems` | — |
| POST | `/business/content/navigations/:navigationId/items` | `addNavigationItem` | Navigation Item routes |
| POST | `/business/content/navigations/:navigationId/items/reorder` | `reorderNavigationItems` | — |
| GET | `/business/content/pages` | `getPages` | Content Page routes |
| POST | `/business/content/pages` | `createPage` | — |
| GET | `/business/content/pages/:id` | `getPageById` | — |
| PUT | `/business/content/pages/:id` | `updatePage` | — |
| DELETE | `/business/content/pages/:id` | `deletePage` | — |
| POST | `/business/content/pages/:id/duplicate` | `duplicatePage` | — |
| GET | `/business/content/pages/:id/full` | `getFullPageById` | — |
| POST | `/business/content/pages/:id/publish` | `publishPage` | Page Actions routes |
| POST | `/business/content/pages/:id/schedule` | `schedulePage` | — |
| POST | `/business/content/pages/:id/unpublish` | `unpublishPage` | — |
| GET | `/business/content/pages/:pageId/blocks` | `getPageBlocks` | Content Block routes |
| POST | `/business/content/pages/:pageId/blocks/reorder` | `reorderBlocks` | — |
| GET | `/business/content/pages/:pageId/categories` | `getPageCategories` | Categorization routes |
| POST | `/business/content/pages/:pageId/categories` | `assignPageToCategory` | — |
| DELETE | `/business/content/pages/:pageId/categories/:categoryId` | `removePageFromCategory` | — |
| POST | `/business/content/pages/:pageId/categories/primary` | `setPrimaryCategory` | — |
| GET | `/business/content/pages/:pageId/translations` | `getPageTranslations` | Page Translation routes |
| POST | `/business/content/pages/:pageId/translations` | `createPageTranslation` | — |
| GET | `/business/content/pages/:pageId/translations/:localeId` | `getPageTranslationByLocale` | — |
| GET | `/business/content/pages/:pageId/versions` | `getPageVersions` | Page Version routes |
| POST | `/business/content/pages/:pageId/versions` | `createPageVersion` | — |
| POST | `/business/content/pages/:pageId/versions/:versionId/restore` | `restorePageVersion` | — |
| GET | `/business/content/redirects` | `getRedirects` | Content Redirect routes |
| POST | `/business/content/redirects` | `createRedirect` | — |
| GET | `/business/content/redirects/:id` | `getRedirectById` | — |
| PUT | `/business/content/redirects/:id` | `updateRedirect` | — |
| DELETE | `/business/content/redirects/:id` | `deleteRedirect` | — |
| GET | `/business/content/templates` | `getTemplates` | Content Template routes |
| POST | `/business/content/templates` | `createTemplate` | — |
| GET | `/business/content/templates/:id` | `getTemplateById` | — |
| PUT | `/business/content/templates/:id` | `updateTemplate` | — |
| DELETE | `/business/content/templates/:id` | `deleteTemplate` | — |
| POST | `/business/content/templates/:id/duplicate` | `duplicateTemplate` | — |
| PUT | `/business/content/translations/:translationId` | `updatePageTranslation` | — |
| DELETE | `/business/content/translations/:translationId` | `deletePageTranslation` | — |
| GET | `/business/content/types` | `getContentTypes` | Content Type routes |
| POST | `/business/content/types` | `createContentType` | — |
| GET | `/business/content/types/:id` | `getContentTypeById` | — |
| PUT | `/business/content/types/:id` | `updateContentType` | — |
| DELETE | `/business/content/types/:id` | `deleteContentType` | — |
| GET | `/business/content/types/slug/:slug` | `getContentTypeBySlug` | — |
| DELETE | `/business/content/versions/:versionId` | `deletePageVersion` | — |
| GET | `/customer/content/pages` | `getPublishedPages` | Public content routes (no auth required, only published/active content) |
| GET | `/customer/content/pages/:slug` | `getPublishedPageBySlug` | — |
| GET | `/customer/content/types` | `getActiveContentTypes` | — |

<!-- GENERATED:ENDPOINTS:END -->
