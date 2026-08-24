import express from 'express';
import { asyncHandler } from '../../../../libs/asyncHandler';
import { ContentController } from '../controllers/contentBusinessController';
import { isOrganizationLoggedIn } from '../../../../libs/auth';

const router = express.Router();
const contentController = new ContentController();

router.use(isOrganizationLoggedIn);

// Content Type routes
router.get('/content/types', asyncHandler(contentController.getContentTypes));
router.post('/content/types', asyncHandler(contentController.createContentType));
router.get('/content/types/:id', asyncHandler(contentController.getContentTypeById));
router.get('/content/types/slug/:slug', asyncHandler(contentController.getContentTypeBySlug));
router.put('/content/types/:id', asyncHandler(contentController.updateContentType));
router.delete('/content/types/:id', asyncHandler(contentController.deleteContentType));

// Content Page routes
router.get('/content/pages', asyncHandler(contentController.getPages));
router.post('/content/pages', asyncHandler(contentController.createPage));
router.get('/content/pages/:id', asyncHandler(contentController.getPageById));
router.get('/content/pages/:id/full', asyncHandler(contentController.getFullPageById));
router.put('/content/pages/:id', asyncHandler(contentController.updatePage));
router.delete('/content/pages/:id', asyncHandler(contentController.deletePage));

// Content Block routes
router.get('/content/pages/:pageId/blocks', asyncHandler(contentController.getPageBlocks));
router.post('/content/blocks', asyncHandler(contentController.createBlock));
router.get('/content/blocks/:id', asyncHandler(contentController.getBlockById));
router.put('/content/blocks/:id', asyncHandler(contentController.updateBlock));
router.delete('/content/blocks/:id', asyncHandler(contentController.deleteBlock));
router.post('/content/pages/:pageId/blocks/reorder', asyncHandler(contentController.reorderBlocks));

// Content Template routes
router.get('/content/templates', asyncHandler(contentController.getTemplates));
router.post('/content/templates', asyncHandler(contentController.createTemplate));
router.get('/content/templates/:id', asyncHandler(contentController.getTemplateById));
router.put('/content/templates/:id', asyncHandler(contentController.updateTemplate));
router.delete('/content/templates/:id', asyncHandler(contentController.deleteTemplate));
router.post('/content/templates/:id/duplicate', asyncHandler(contentController.duplicateTemplate));

// Page Actions routes
router.post('/content/pages/:id/publish', asyncHandler(contentController.publishPage));
router.post('/content/pages/:id/unpublish', asyncHandler(contentController.unpublishPage));
router.post('/content/pages/:id/schedule', asyncHandler(contentController.schedulePage));
router.post('/content/pages/:id/duplicate', asyncHandler(contentController.duplicatePage));

// Content Category routes
router.get('/content/categories', asyncHandler(contentController.getCategories));
router.get('/content/categories/tree', asyncHandler(contentController.getCategoryTree));
router.post('/content/categories', asyncHandler(contentController.createCategory));
router.get('/content/categories/:id', asyncHandler(contentController.getCategoryById));
router.put('/content/categories/:id', asyncHandler(contentController.updateCategory));
router.delete('/content/categories/:id', asyncHandler(contentController.deleteCategory));
router.post('/content/categories/:id/move', asyncHandler(contentController.moveCategory));

// Content Navigation routes
router.get('/content/navigations', asyncHandler(contentController.getNavigations));
router.post('/content/navigations', asyncHandler(contentController.createNavigation));
router.get('/content/navigations/:id', asyncHandler(contentController.getNavigationById));
router.get('/content/navigations/:id/items', asyncHandler(contentController.getNavigationWithItems));
router.put('/content/navigations/:id', asyncHandler(contentController.updateNavigation));
router.delete('/content/navigations/:id', asyncHandler(contentController.deleteNavigation));

// Navigation Item routes
router.post('/content/navigations/:navigationId/items', asyncHandler(contentController.addNavigationItem));
router.put('/content/navigation-items/:id', asyncHandler(contentController.updateNavigationItem));
router.delete('/content/navigation-items/:id', asyncHandler(contentController.deleteNavigationItem));
router.post('/content/navigations/:navigationId/items/reorder', asyncHandler(contentController.reorderNavigationItems));

// Content Media routes
router.get('/content/media', asyncHandler(contentController.getMedia));
router.post('/content/media', asyncHandler(contentController.uploadMedia));
router.get('/content/media/:id', asyncHandler(contentController.getMediaById));
router.put('/content/media/:id', asyncHandler(contentController.updateMedia));
router.delete('/content/media/:id', asyncHandler(contentController.deleteMedia));
router.post('/content/media/move', asyncHandler(contentController.moveMediaToFolder));

// Media Folder routes
router.get('/content/media-folders', asyncHandler(contentController.getMediaFolders));
router.get('/content/media-folders/tree', asyncHandler(contentController.getMediaFolderTree));
router.post('/content/media-folders', asyncHandler(contentController.createMediaFolder));
router.put('/content/media-folders/:id', asyncHandler(contentController.updateMediaFolder));
router.delete('/content/media-folders/:id', asyncHandler(contentController.deleteMediaFolder));

// Content Redirect routes
router.get('/content/redirects', asyncHandler(contentController.getRedirects));
router.post('/content/redirects', asyncHandler(contentController.createRedirect));
router.get('/content/redirects/:id', asyncHandler(contentController.getRedirectById));
router.put('/content/redirects/:id', asyncHandler(contentController.updateRedirect));
router.delete('/content/redirects/:id', asyncHandler(contentController.deleteRedirect));

// Page Version routes
router.get('/content/pages/:pageId/versions', asyncHandler(contentController.getPageVersions));
router.post('/content/pages/:pageId/versions', asyncHandler(contentController.createPageVersion));
router.post('/content/pages/:pageId/versions/:versionId/restore', asyncHandler(contentController.restorePageVersion));
router.delete('/content/versions/:versionId', asyncHandler(contentController.deletePageVersion));

// Page Translation routes
router.get('/content/pages/:pageId/translations', asyncHandler(contentController.getPageTranslations));
router.get('/content/pages/:pageId/translations/:localeId', asyncHandler(contentController.getPageTranslationByLocale));
router.post('/content/pages/:pageId/translations', asyncHandler(contentController.createPageTranslation));
router.put('/content/translations/:translationId', asyncHandler(contentController.updatePageTranslation));
router.delete('/content/translations/:translationId', asyncHandler(contentController.deletePageTranslation));

// Categorization routes
router.get('/content/pages/:pageId/categories', asyncHandler(contentController.getPageCategories));
router.post('/content/pages/:pageId/categories', asyncHandler(contentController.assignPageToCategory));
router.delete('/content/pages/:pageId/categories/:categoryId', asyncHandler(contentController.removePageFromCategory));
router.post('/content/pages/:pageId/categories/primary', asyncHandler(contentController.setPrimaryCategory));
router.get('/content/categories/:categoryId/pages', asyncHandler(contentController.getPagesByCategory));

// Media Usage routes
router.get('/content/media/:mediaId/usage', asyncHandler(contentController.getMediaUsage));
router.get('/content/media/usage/:entityType/:entityId', asyncHandler(contentController.getMediaUsageByEntity));
router.post('/content/media/usage', asyncHandler(contentController.trackMediaUsage));
router.delete('/content/media/usage/:usageId', asyncHandler(contentController.untrackMediaUsage));
router.get('/content/media/:mediaId/usage/count', asyncHandler(contentController.getMediaUsageCount));

export const contentRouterAdmin = router;
