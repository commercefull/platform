import express from "express";
import { getAllProducts, getProductById, createProduct, updateProduct, deleteProduct, updateProductStatus, updateProductVisibility, getRelatedProducts, getProductsByCategory, getProductWithVariants } from "./controllers/productBusinessController";
import { getVariantsByProductId, getVariantById, createVariant, updateVariant, deleteVariant, setDefaultVariant, updateInventory, adjustInventory, reorderVariants } from "./controllers/variantBusinessController";
import { getImagesByProductId, getImagesByVariantId, getImageById, createImage, updateImage, deleteImage, setPrimaryImage, reorderImages } from "./controllers/imageBusinessController";

const router = express.Router();

// GET: List all products with filtering
router.get("/", getAllProducts);

// POST: Create a new product
router.post("/", createProduct);

// GET: Get a single product by ID
router.get("/:id", getProductById);

// GET: Get a product with all its variants
router.get("/:id/with-variants", getProductWithVariants);

// PUT: Update a product
router.put("/:id", updateProduct);

// DELETE: Delete a product
router.delete("/:id", deleteProduct);

// PATCH: Update product status
router.patch("/:id/status", updateProductStatus);

// PATCH: Update product visibility
router.patch("/:id/visibility", updateProductVisibility);

// GET: Get related products
router.get("/:id/related", getRelatedProducts);

// GET: Get products by category
router.get("/category/:categoryId", getProductsByCategory);

// ===== Product Variant Routes =====
// GET: Get all variants for a product
router.get("/:productId/variants", getVariantsByProductId);

// POST: Create a new variant for a product
router.post("/:productId/variants", createVariant);

// GET: Get a variant by ID
router.get("/variants/:id", getVariantById);

// PUT: Update a variant
router.put("/variants/:id", updateVariant);

// DELETE: Delete a variant
router.delete("/variants/:id", deleteVariant);

// PATCH: Set a variant as the default
router.patch("/variants/:id/default", setDefaultVariant);

// PATCH: Update variant inventory
router.patch("/variants/:id/inventory", updateInventory);

// PATCH: Adjust variant inventory
router.patch("/variants/:id/inventory/adjust", adjustInventory);

// POST: Reorder variants
router.post("/:productId/variants/reorder", reorderVariants);

// ===== Product Image Routes =====
// GET: Get all images for a product
router.get("/:productId/images", getImagesByProductId);

// POST: Create a new image for a product
router.post("/:productId/images", createImage);

// GET: Get images for a variant
router.get("/variants/:variantId/images", getImagesByVariantId);

// GET: Get an image by ID
router.get("/images/:id", getImageById);

// PUT: Update an image
router.put("/images/:id", updateImage);

// DELETE: Delete an image
router.delete("/images/:id", deleteImage);

// PATCH: Set an image as primary
router.patch("/images/:id/primary", setPrimaryImage);

// POST: Reorder imagess
router.post("/:productId/images/reorder", reorderImages);

export const productBusinessRouter = router;
