import express from "express";
import { ContentController } from "./controllers/contentMerchantController";

const router = express.Router();
const contentController = new ContentController();

// Content Type routes
router.get("/types", contentController.getContentTypes);
router.post("/types", contentController.createContentType);
router.get("/types/:id", contentController.getContentTypeById);
router.get("/types/slug/:slug", contentController.getContentTypeBySlug);
router.put("/types/:id", contentController.updateContentType);
router.delete("/types/:id", contentController.deleteContentType);

// Content Page routes
router.get("/pages", contentController.getPages);
router.post("/pages", contentController.createPage);
router.get("/pages/:id", contentController.getPageById);
router.get("/pages/:id/full", contentController.getFullPageById);
router.put("/pages/:id", contentController.updatePage);
router.delete("/pages/:id", contentController.deletePage);

// Content Block routes
router.get("/pages/:pageId/blocks", contentController.getPageBlocks);
router.post("/blocks", contentController.createBlock);
router.get("/blocks/:id", contentController.getBlockById);
router.put("/blocks/:id", contentController.updateBlock);
router.delete("/blocks/:id", contentController.deleteBlock);
router.post("/pages/:pageId/blocks/reorder", contentController.reorderBlocks);

// Content Template routes
router.get("/templates", contentController.getTemplates);
router.post("/templates", contentController.createTemplate);
router.get("/templates/:id", contentController.getTemplateById);
router.put("/templates/:id", contentController.updateTemplate);
router.delete("/templates/:id", contentController.deleteTemplate);

export const contentRouterAdmin = router;
