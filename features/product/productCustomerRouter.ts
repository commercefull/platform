import express from "express";
import { getProductBySlug, getProductsByCategory, getPublishedProducts, searchProducts } from "./controllers/productCustomerController";

const router = express.Router();

// GET: display all products
router.get("/", getPublishedProducts);

// GET: search box
router.get("/search", searchProducts);

// GET: get product by category
router.get("/category/:slug", getProductsByCategory);

// GET: get a product by slug
router.get("/:slug", getProductBySlug);

export const productCustomerRouter = router;
