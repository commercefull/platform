import express from "express";
import productPublicController from "./controllers/productStorefrontController";

const router = express.Router();

// GET: display all products
router.get("/", productPublicController.getPublishedProducts.bind(productPublicController));

// GET: search box
router.get("/search", productPublicController.searchProducts.bind(productPublicController));

// GET: get product by category
router.get("/category/:slug", productPublicController.getProductsByCategory.bind(productPublicController));

// GET: get a product by slug
router.get("/:slug", productPublicController.getProductBySlug.bind(productPublicController));

export const productStorefrontRouter = router;
