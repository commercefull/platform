import express from "express";
import { ContentPublicController } from "./controllers/contentPublicController";

const router = express.Router();
const contentPublicController = new ContentPublicController();

// Public routes for content access
router.get("/pages", contentPublicController.getPublishedPages);
router.get("/pages/:slug", contentPublicController.getPublishedPageBySlug);
router.get("/types", contentPublicController.getActiveContentTypes);

export const contentRouter = router;
