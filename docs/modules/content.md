# Content Feature

## Overview

The Content feature provides a headless CMS for managing dynamic pages, content blocks, and templates. It enables merchants to create and manage landing pages, blog posts, and other content without code changes.

---

## Use Cases

| ID         | Use Case            | Actor          | Purpose                                                                    |
| ---------- | ------------------- | -------------- | -------------------------------------------------------------------------- |
| UC-CNT-001 | List Content Types  | Merchant/Admin | List all content type definitions with their field schemas                 |
| UC-CNT-002 | Create Content Type | Merchant/Admin | Define a new content type with custom fields (text, richtext, image, etc.) |
| UC-CNT-003 | Get Content Type    | Merchant/Admin | Retrieve a content type by ID or slug                                      |
| UC-CNT-004 | Update Content Type | Merchant/Admin | Update an existing content type's fields or description                    |
| UC-CNT-005 | Delete Content Type | Merchant/Admin | Permanently delete a content type definition                               |
| UC-CNT-006 | List Pages          | Merchant/Admin | List all content pages with optional type/status filtering                 |
| UC-CNT-007 | Create Page         | Merchant/Admin | Create a new content page in draft or published status with typed content  |
| UC-CNT-008 | Get Page            | Merchant/Admin | Retrieve a specific content page by ID                                     |
| UC-CNT-009 | Get Full Page       | Merchant/Admin | Retrieve a page with all its content blocks included                       |
| UC-CNT-010 | Update Page         | Merchant/Admin | Update an existing page's title, content, metadata, or status              |
| UC-CNT-011 | Delete Page         | Merchant/Admin | Permanently delete a content page                                          |
| UC-CNT-012 | Get Page Blocks     | Merchant/Admin | List all content blocks associated with a page                             |
| UC-CNT-013 | Create Block        | Merchant/Admin | Add a content block (hero, text, image, gallery, CTA, products) to a page  |
| UC-CNT-014 | Get Block           | Merchant/Admin | Retrieve a specific content block by ID                                    |
| UC-CNT-015 | Update Block        | Merchant/Admin | Update an existing content block's type, content, or sort order            |
| UC-CNT-016 | Delete Block        | Merchant/Admin | Permanently delete a content block from a page                             |
| UC-CNT-017 | Reorder Blocks      | Merchant/Admin | Reorder content blocks on a page by providing a new block ID sequence      |
| UC-CNT-018 | List Templates      | Merchant/Admin | List all available content templates                                       |
| UC-CNT-019 | Create Template     | Merchant/Admin | Create a reusable page template with layout and default blocks             |
| UC-CNT-020 | Get Template        | Merchant/Admin | Retrieve a specific content template by ID                                 |
| UC-CNT-021 | Update Template     | Merchant/Admin | Update an existing template's layout or default blocks                     |
| UC-CNT-022 | Delete Template     | Merchant/Admin | Permanently delete a content template                                      |

### API Endpoints

| ID         | Method | Endpoint                                                              |
| ---------- | ------ | --------------------------------------------------------------------- |
| UC-CNT-001 | GET    | `/business/content/types`                                             |
| UC-CNT-002 | POST   | `/business/content/types`                                             |
| UC-CNT-003 | GET    | `/business/content/types/:id` or `/business/content/types/slug/:slug` |
| UC-CNT-004 | PUT    | `/business/content/types/:id`                                         |
| UC-CNT-005 | DELETE | `/business/content/types/:id`                                         |
| UC-CNT-006 | GET    | `/business/content/pages`                                             |
| UC-CNT-007 | POST   | `/business/content/pages`                                             |
| UC-CNT-008 | GET    | `/business/content/pages/:id`                                         |
| UC-CNT-009 | GET    | `/business/content/pages/:id/full`                                    |
| UC-CNT-010 | PUT    | `/business/content/pages/:id`                                         |
| UC-CNT-011 | DELETE | `/business/content/pages/:id`                                         |
| UC-CNT-012 | GET    | `/business/content/pages/:pageId/blocks`                              |
| UC-CNT-013 | POST   | `/business/content/blocks`                                            |
| UC-CNT-014 | GET    | `/business/content/blocks/:id`                                        |
| UC-CNT-015 | PUT    | `/business/content/blocks/:id`                                        |
| UC-CNT-016 | DELETE | `/business/content/blocks/:id`                                        |
| UC-CNT-017 | POST   | `/business/content/pages/:pageId/blocks/reorder`                      |
| UC-CNT-018 | GET    | `/business/content/templates`                                         |
| UC-CNT-019 | POST   | `/business/content/templates`                                         |
| UC-CNT-020 | GET    | `/business/content/templates/:id`                                     |
| UC-CNT-021 | PUT    | `/business/content/templates/:id`                                     |
| UC-CNT-022 | DELETE | `/business/content/templates/:id`                                     |

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

| Use Case                 | Test File                             | Status |
| ------------------------ | ------------------------------------- | ------ |
| UC-CNT-001 to UC-CNT-005 | `content/content.test.ts`             | ✅     |
| UC-CNT-006 to UC-CNT-011 | `content/blocks.test.ts`              | ✅     |
| UC-CNT-012 to UC-CNT-017 | `content/blockValidation.test.ts`     | ✅     |
| UC-CNT-018 to UC-CNT-022 | `content/categories.test.ts`          | ✅     |
| Pages                    | `content/pages/pages.test.ts`         | ✅     |
| Page Actions             | `content/pageActions.test.ts`         | ✅     |
| Page Translations        | `content/pageTranslations.test.ts`    | ✅     |
| Page Versions            | `content/pageVersions.test.ts`        | ✅     |
| Navigation               | `content/navigation.test.ts`          | ✅     |
| Redirects                | `content/redirects/redirects.test.ts` | ✅     |
| Templates                | `content/templates/templates.test.ts` | ✅     |
| Media                    | `content/media/media.test.ts`         | ✅     |
| Categorization           | `content/categorization.test.ts`      | ✅     |
| Customer Content         | `content/customerContent.test.ts`     | ✅     |
| Media & Redirects        | `content/mediaAndRedirects.test.ts`   | ✅     |

<!-- GENERATED:ENDPOINTS:START -->

| Method | Endpoint | Controller | Description |
|---|---|---|---|
| POST | `/content/blocks` | `asyncHandler(contentController.createBlock)` | — |
| GET | `/content/blocks/:id` | `asyncHandler(contentController.getBlockById)` | — |
| PUT | `/content/blocks/:id` | `asyncHandler(contentController.updateBlock)` | — |
| DELETE | `/content/blocks/:id` | `asyncHandler(contentController.deleteBlock)` | — |
| GET | `/content/categories` | `asyncHandler(contentController.getCategories)` | Content Category routes |
| POST | `/content/categories` | `asyncHandler(contentController.createCategory)` | — |
| GET | `/content/categories/:categoryId/pages` | `asyncHandler(contentController.getPagesByCategory)` | — |
| GET | `/content/categories/:id` | `asyncHandler(contentController.getCategoryById)` | — |
| PUT | `/content/categories/:id` | `asyncHandler(contentController.updateCategory)` | — |
| DELETE | `/content/categories/:id` | `asyncHandler(contentController.deleteCategory)` | — |
| POST | `/content/categories/:id/move` | `asyncHandler(contentController.moveCategory)` | — |
| GET | `/content/categories/tree` | `asyncHandler(contentController.getCategoryTree)` | — |
| GET | `/content/media` | `asyncHandler(contentController.getMedia)` | Content Media routes |
| POST | `/content/media` | `asyncHandler(contentController.uploadMedia)` | — |
| GET | `/content/media-folders` | `asyncHandler(contentController.getMediaFolders)` | Media Folder routes |
| POST | `/content/media-folders` | `asyncHandler(contentController.createMediaFolder)` | — |
| PUT | `/content/media-folders/:id` | `asyncHandler(contentController.updateMediaFolder)` | — |
| DELETE | `/content/media-folders/:id` | `asyncHandler(contentController.deleteMediaFolder)` | — |
| GET | `/content/media-folders/tree` | `asyncHandler(contentController.getMediaFolderTree)` | — |
| GET | `/content/media/:id` | `asyncHandler(contentController.getMediaById)` | — |
| PUT | `/content/media/:id` | `asyncHandler(contentController.updateMedia)` | — |
| DELETE | `/content/media/:id` | `asyncHandler(contentController.deleteMedia)` | — |
| GET | `/content/media/:mediaId/usage` | `asyncHandler(contentController.getMediaUsage)` | Media Usage routes |
| GET | `/content/media/:mediaId/usage/count` | `asyncHandler(contentController.getMediaUsageCount)` | — |
| POST | `/content/media/move` | `asyncHandler(contentController.moveMediaToFolder)` | — |
| POST | `/content/media/usage` | `asyncHandler(contentController.trackMediaUsage)` | — |
| GET | `/content/media/usage/:entityType/:entityId` | `asyncHandler(contentController.getMediaUsageByEntity)` | — |
| DELETE | `/content/media/usage/:usageId` | `asyncHandler(contentController.untrackMediaUsage)` | — |
| PUT | `/content/navigation-items/:id` | `asyncHandler(contentController.updateNavigationItem)` | — |
| DELETE | `/content/navigation-items/:id` | `asyncHandler(contentController.deleteNavigationItem)` | — |
| GET | `/content/navigations` | `asyncHandler(contentController.getNavigations)` | Content Navigation routes |
| POST | `/content/navigations` | `asyncHandler(contentController.createNavigation)` | — |
| GET | `/content/navigations/:id` | `asyncHandler(contentController.getNavigationById)` | — |
| PUT | `/content/navigations/:id` | `asyncHandler(contentController.updateNavigation)` | — |
| DELETE | `/content/navigations/:id` | `asyncHandler(contentController.deleteNavigation)` | — |
| GET | `/content/navigations/:id/items` | `asyncHandler(contentController.getNavigationWithItems)` | — |
| POST | `/content/navigations/:navigationId/items` | `asyncHandler(contentController.addNavigationItem)` | Navigation Item routes |
| POST | `/content/navigations/:navigationId/items/reorder` | `asyncHandler(contentController.reorderNavigationItems)` | — |
| GET | `/content/pages` | `asyncHandler(contentController.getPages)` | Content Page routes |
| POST | `/content/pages` | `asyncHandler(contentController.createPage)` | — |
| GET | `/content/pages` | `asyncHandler(getPublishedPages)` | Public content routes (no auth required, only published/active content) |
| GET | `/content/pages/:id` | `asyncHandler(contentController.getPageById)` | — |
| PUT | `/content/pages/:id` | `asyncHandler(contentController.updatePage)` | — |
| DELETE | `/content/pages/:id` | `asyncHandler(contentController.deletePage)` | — |
| POST | `/content/pages/:id/duplicate` | `asyncHandler(contentController.duplicatePage)` | — |
| GET | `/content/pages/:id/full` | `asyncHandler(contentController.getFullPageById)` | — |
| POST | `/content/pages/:id/publish` | `asyncHandler(contentController.publishPage)` | Page Actions routes |
| POST | `/content/pages/:id/schedule` | `asyncHandler(contentController.schedulePage)` | — |
| POST | `/content/pages/:id/unpublish` | `asyncHandler(contentController.unpublishPage)` | — |
| GET | `/content/pages/:pageId/blocks` | `asyncHandler(contentController.getPageBlocks)` | Content Block routes |
| POST | `/content/pages/:pageId/blocks/reorder` | `asyncHandler(contentController.reorderBlocks)` | — |
| GET | `/content/pages/:pageId/categories` | `asyncHandler(contentController.getPageCategories)` | Categorization routes |
| POST | `/content/pages/:pageId/categories` | `asyncHandler(contentController.assignPageToCategory)` | — |
| DELETE | `/content/pages/:pageId/categories/:categoryId` | `asyncHandler(contentController.removePageFromCategory)` | — |
| POST | `/content/pages/:pageId/categories/primary` | `asyncHandler(contentController.setPrimaryCategory)` | — |
| GET | `/content/pages/:pageId/translations` | `asyncHandler(contentController.getPageTranslations)` | Page Translation routes |
| POST | `/content/pages/:pageId/translations` | `asyncHandler(contentController.createPageTranslation)` | — |
| GET | `/content/pages/:pageId/translations/:localeId` | `asyncHandler(contentController.getPageTranslationByLocale)` | — |
| GET | `/content/pages/:pageId/versions` | `asyncHandler(contentController.getPageVersions)` | Page Version routes |
| POST | `/content/pages/:pageId/versions` | `asyncHandler(contentController.createPageVersion)` | — |
| POST | `/content/pages/:pageId/versions/:versionId/restore` | `asyncHandler(contentController.restorePageVersion)` | — |
| GET | `/content/pages/:slug` | `asyncHandler(getPublishedPageBySlug)` | — |
| GET | `/content/redirects` | `asyncHandler(contentController.getRedirects)` | Content Redirect routes |
| POST | `/content/redirects` | `asyncHandler(contentController.createRedirect)` | — |
| GET | `/content/redirects/:id` | `asyncHandler(contentController.getRedirectById)` | — |
| PUT | `/content/redirects/:id` | `asyncHandler(contentController.updateRedirect)` | — |
| DELETE | `/content/redirects/:id` | `asyncHandler(contentController.deleteRedirect)` | — |
| GET | `/content/templates` | `asyncHandler(contentController.getTemplates)` | Content Template routes |
| POST | `/content/templates` | `asyncHandler(contentController.createTemplate)` | — |
| GET | `/content/templates/:id` | `asyncHandler(contentController.getTemplateById)` | — |
| PUT | `/content/templates/:id` | `asyncHandler(contentController.updateTemplate)` | — |
| DELETE | `/content/templates/:id` | `asyncHandler(contentController.deleteTemplate)` | — |
| POST | `/content/templates/:id/duplicate` | `asyncHandler(contentController.duplicateTemplate)` | — |
| PUT | `/content/translations/:translationId` | `asyncHandler(contentController.updatePageTranslation)` | — |
| DELETE | `/content/translations/:translationId` | `asyncHandler(contentController.deletePageTranslation)` | — |
| GET | `/content/types` | `asyncHandler(contentController.getContentTypes)` | Content Type routes |
| POST | `/content/types` | `asyncHandler(contentController.createContentType)` | — |
| GET | `/content/types` | `asyncHandler(getActiveContentTypes)` | — |
| GET | `/content/types/:id` | `asyncHandler(contentController.getContentTypeById)` | — |
| PUT | `/content/types/:id` | `asyncHandler(contentController.updateContentType)` | — |
| DELETE | `/content/types/:id` | `asyncHandler(contentController.deleteContentType)` | — |
| GET | `/content/types/slug/:slug` | `asyncHandler(contentController.getContentTypeBySlug)` | — |
| DELETE | `/content/versions/:versionId` | `asyncHandler(contentController.deletePageVersion)` | — |

<!-- GENERATED:ENDPOINTS:END -->
