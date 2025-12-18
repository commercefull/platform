import express from "express";
import { ContentController } from "./controllers/contentBusinessController";

const router = express.Router();
const contentController = new ContentController();

// Content Type routes
router.get("/content/types", contentController.getContentTypes);
router.post("/content/types", contentController.createContentType);
router.get("/content/types/:id", contentController.getContentTypeById);
router.get("/content/types/slug/:slug", contentController.getContentTypeBySlug);
router.put("/content/types/:id", contentController.updateContentType);
router.delete("/content/types/:id", contentController.deleteContentType);

// Content Page routes
router.get("/content/pages", contentController.getPages);
router.post("/content/pages", contentController.createPage);
router.get("/content/pages/:id", contentController.getPageById);
router.get("/content/pages/:id/full", contentController.getFullPageById);
router.put("/content/pages/:id", contentController.updatePage);
router.delete("/content/pages/:id", contentController.deletePage);

// Content Block routes
router.get("/content/pages/:pageId/blocks", contentController.getPageBlocks);
router.post("/content/blocks", contentController.createBlock);
router.get("/content/blocks/:id", contentController.getBlockById);
router.put("/content/blocks/:id", contentController.updateBlock);
router.delete("/content/blocks/:id", contentController.deleteBlock);
router.post("/content/pages/:pageId/blocks/reorder", contentController.reorderBlocks);

// Content Template routes
router.get("/content/templates", contentController.getTemplates);
router.post("/content/templates", contentController.createTemplate);
router.get("/content/templates/:id", contentController.getTemplateById);
router.put("/content/templates/:id", contentController.updateTemplate);
router.delete("/content/templates/:id", contentController.deleteTemplate);
router.post("/content/templates/:id/duplicate", contentController.duplicateTemplate);

// Page Actions routes
router.post("/content/pages/:id/publish", contentController.publishPage);
router.post("/content/pages/:id/unpublish", contentController.unpublishPage);
router.post("/content/pages/:id/schedule", contentController.schedulePage);
router.post("/content/pages/:id/duplicate", contentController.duplicatePage);

// Content Category routes
router.get("/content/categories", contentController.getCategories);
router.get("/content/categories/tree", contentController.getCategoryTree);
router.post("/content/categories", contentController.createCategory);
router.get("/content/categories/:id", contentController.getCategoryById);
router.put("/content/categories/:id", contentController.updateCategory);
router.delete("/content/categories/:id", contentController.deleteCategory);
router.post("/content/categories/:id/move", contentController.moveCategory);

// Content Navigation routes
router.get("/content/navigations", contentController.getNavigations);
router.post("/content/navigations", contentController.createNavigation);
router.get("/content/navigations/:id", contentController.getNavigationById);
router.get("/content/navigations/:id/items", contentController.getNavigationWithItems);
router.put("/content/navigations/:id", contentController.updateNavigation);
router.delete("/content/navigations/:id", contentController.deleteNavigation);

// Navigation Item routes
router.post("/content/navigations/:navigationId/items", contentController.addNavigationItem);
router.put("/content/navigation-items/:id", contentController.updateNavigationItem);
router.delete("/content/navigation-items/:id", contentController.deleteNavigationItem);
router.post("/content/navigations/:navigationId/items/reorder", contentController.reorderNavigationItems);

// Content Media routes
router.get("/content/media", contentController.getMedia);
router.post("/content/media", contentController.uploadMedia);
router.get("/content/media/:id", contentController.getMediaById);
router.put("/content/media/:id", contentController.updateMedia);
router.delete("/content/media/:id", contentController.deleteMedia);
router.post("/content/media/move", contentController.moveMediaToFolder);

// Media Folder routes
router.get("/content/media-folders", contentController.getMediaFolders);
router.get("/content/media-folders/tree", contentController.getMediaFolderTree);
router.post("/content/media-folders", contentController.createMediaFolder);
router.put("/content/media-folders/:id", contentController.updateMediaFolder);
router.delete("/content/media-folders/:id", contentController.deleteMediaFolder);

// Content Redirect routes
router.get("/content/redirects", contentController.getRedirects);
router.post("/content/redirects", contentController.createRedirect);
router.get("/content/redirects/:id", contentController.getRedirectById);
router.put("/content/redirects/:id", contentController.updateRedirect);
router.delete("/content/redirects/:id", contentController.deleteRedirect);

export const contentRouterAdmin = router;
