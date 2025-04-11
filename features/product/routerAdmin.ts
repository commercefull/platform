import express from "express";
import productController from "./controllers/productController";
import productVariantController from "./controllers/productVariantController";
import productImageController from "./controllers/productImageController";

const router = express.Router();

// Apply admin auth middleware to all routes
// router.use(adminAuth);

// GET: List all products with filtering
router.get("/", productController.getAllProducts.bind(productController));

// POST: Create a new product
router.post("/", productController.createProduct.bind(productController));

// GET: Get a single product by ID
router.get("/:id", productController.getProductById.bind(productController));

// GET: Get a product with all its variants
router.get("/:id/with-variants", productController.getProductWithVariants.bind(productController));

// PUT: Update a product
router.put("/:id", productController.updateProduct.bind(productController));

// DELETE: Delete a product
router.delete("/:id", productController.deleteProduct.bind(productController));

// PATCH: Update product status
router.patch("/:id/status", productController.updateProductStatus.bind(productController));

// PATCH: Update product visibility
router.patch("/:id/visibility", productController.updateProductVisibility.bind(productController));

// GET: Get related products
router.get("/:id/related", productController.getRelatedProducts.bind(productController));

// GET: Get products by category
router.get("/category/:categoryId", productController.getProductsByCategory.bind(productController));

// ===== Product Variant Routes =====
// GET: Get all variants for a product
router.get("/:productId/variants", productVariantController.getVariantsByProductId.bind(productVariantController));

// POST: Create a new variant for a product
router.post("/:productId/variants", productVariantController.createVariant.bind(productVariantController));

// GET: Get a variant by ID
router.get("/variants/:id", productVariantController.getVariantById.bind(productVariantController));

// PUT: Update a variant
router.put("/variants/:id", productVariantController.updateVariant.bind(productVariantController));

// DELETE: Delete a variant
router.delete("/variants/:id", productVariantController.deleteVariant.bind(productVariantController));

// PATCH: Set a variant as the default
router.patch("/variants/:id/default", productVariantController.setDefaultVariant.bind(productVariantController));

// PATCH: Update variant inventory
router.patch("/variants/:id/inventory", productVariantController.updateInventory.bind(productVariantController));

// PATCH: Adjust variant inventory
router.patch("/variants/:id/inventory/adjust", productVariantController.adjustInventory.bind(productVariantController));

// POST: Reorder variants
router.post("/:productId/variants/reorder", productVariantController.reorderVariants.bind(productVariantController));

// ===== Product Image Routes =====
// GET: Get all images for a product
router.get("/:productId/images", productImageController.getImagesByProductId.bind(productImageController));

// POST: Create a new image for a product
router.post("/:productId/images", productImageController.createImage.bind(productImageController));

// GET: Get images for a variant
router.get("/variants/:variantId/images", productImageController.getImagesByVariantId.bind(productImageController));

// GET: Get an image by ID
router.get("/images/:id", productImageController.getImageById.bind(productImageController));

// PUT: Update an image
router.put("/images/:id", productImageController.updateImage.bind(productImageController));

// DELETE: Delete an image
router.delete("/images/:id", productImageController.deleteImage.bind(productImageController));

// PATCH: Set an image as primary
router.patch("/images/:id/primary", productImageController.setPrimaryImage.bind(productImageController));

// POST: Reorder images
router.post("/:productId/images/reorder", productImageController.reorderImages.bind(productImageController));

export const productRouterAdmin = router;
