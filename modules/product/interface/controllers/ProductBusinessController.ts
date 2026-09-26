/**
 * Product Business Controller
 * HTTP interface for business/admin product operations
 */

import type { HttpRequest, HttpResponse } from 'libs/http';
import { CreateProductCommand } from '../../application/useCases/CreateProduct';
import { GetProductCommand } from '../../application/useCases/GetProduct';
import { ListProductsCommand } from '../../application/useCases/ListProducts';
import { UpdateProductCommand } from '../../application/useCases/UpdateProduct';
import { ManageProductCollectionCommand } from '../../application/useCases/ManageProductCollection';
import { ProductStatus } from '../../domain/valueObjects/ProductStatus';
import { ProductVisibility } from '../../domain/valueObjects/ProductVisibility';
import {
  listProductsUseCase,
  getProductUseCase,
  createProductUseCase,
  updateProductUseCase,
  manageProductCollectionUseCase,
  updateProductStatusUseCase,
  deleteProductUseCase,
  createCatalogVariantUseCase,
  updateCatalogVariantUseCase,
  getVariantMatrixUseCase,
  configureVariantUseCase,
  listGroupedChildrenUseCase,
  applyAttributeSetUseCase,
  getProductStoreAvailabilityUseCase,
  manageProductVariantsUseCase,
  manageProductImagesUseCase,
  manageProductReviewsUseCase,
  manageProductQaUseCase,
  manageReviewMediaUseCase,
  manageProductCollectionsUseCase,
  manageProductDownloadsUseCase,
  manageProductRelationshipsUseCase,
} from '../../application/useCases/wired';
import { CreateCatalogVariantCommand } from '../../application/useCases/CreateCatalogVariant';
import { UpdateCatalogVariantCommand } from '../../application/useCases/UpdateCatalogVariant';
import type { CatalogVariantCreateParams, CatalogVariantUpdateParams, CatalogVariantOption } from '../../application/ports/CatalogVariantPort';
import { getErrorStatusCode, getErrorMessage } from '../../../../libs/errors';
import { successResponse, errorResponse } from '../../../../libs/apiResponse';
import { ProductVariantUpdateProps, ProductQaStatus, ReviewFilters } from '../../application/wired';
import type { ProductRelationType } from '../../application/useCases/ManageProductAssets';

// ============================================================================
// Request Body Interfaces
// ============================================================================

interface CreateProductBody {
  name?: string;
  description?: string;
  productTypeId?: string;
  type?: string;
  sku?: string;
  slug?: string;
  shortDescription?: string;
  categoryId?: string;
  /** Prices are integer cents — written to the pricing-owned store. */
  basePriceCents?: number;
  salePriceCents?: number;
  costPriceCents?: number;
  compareAtPriceCents?: number;
  currencyCode?: string;
  weight?: number;
  weightUnit?: 'kg' | 'lb' | 'oz' | 'g';
  length?: number;
  width?: number;
  height?: number;
  dimensionUnit?: 'cm' | 'in' | 'm' | 'mm';
  isFeatured?: boolean;
  isVirtual?: boolean;
  isDownloadable?: boolean;
  isSubscription?: boolean;
  isTaxable?: boolean;
  taxClass?: string;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
  tags?: string[];
  metadata?: Record<string, unknown>;
}

interface UpdateProductBody {
  name?: string;
  description?: string;
  shortDescription?: string;
  sku?: string;
  slug?: string;
  categoryId?: string;
  /** Prices are integer cents — written to the pricing-owned store. */
  basePriceCents?: number;
  salePriceCents?: number | null;
  costPriceCents?: number | null;
  compareAtPriceCents?: number | null;
  currencyCode?: string;
  weight?: number;
  weightUnit?: 'kg' | 'lb' | 'oz' | 'g';
  length?: number;
  width?: number;
  height?: number;
  dimensionUnit?: 'cm' | 'in' | 'm' | 'mm';
  isFeatured?: boolean;
  isVirtual?: boolean;
  isDownloadable?: boolean;
  isSubscription?: boolean;
  isTaxable?: boolean;
  taxClass?: string;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
  minOrderQuantity?: number;
  maxOrderQuantity?: number;
  returnPolicy?: string;
  warranty?: string;
  tags?: string[];
  metadata?: Record<string, unknown>;
}

interface StatusBody {
  status?: string;
}

interface VisibilityBody {
  visibility?: string;
}

interface VariantBody {
  sku?: string;
  name?: string;
  /** Variant-level catalog price in integer cents — written to the pricing-owned store. */
  priceCents?: number;
  salePriceCents?: number;
  compareAtPriceCents?: number | null;
  costPriceCents?: number | null;
  weight?: number | null;
  length?: number | null;
  width?: number | null;
  height?: number | null;
  weightUnit?: string | null;
  dimensionUnit?: string | null;
  barcode?: string;
  isDefault?: boolean;
  isActive?: boolean;
  position?: number;
  inventory?: number;
  inventoryPolicy?: string;
  options?: Array<{ name: string; value: string }>;
  [key: string]: unknown;
}

interface InventoryBody {
  inventory?: string | number;
}

interface ImageReorderBody {
  imageIds?: string[];
}

interface ReviewResponseBody {
  response?: string;
}

interface CollectionBody {
  name?: string;
  slug?: string;
  description?: string;
  imageUrl?: string;
  isActive?: boolean;
  position?: number;
  addProducts?: Array<{ productId: string; position?: number }>;
  removeMapIds?: string[];
}

interface DownloadBody {
  name?: string;
  fileUrl?: string;
  filePath?: string;
  fileSize?: number;
  mimeType?: string;
  maxDownloads?: number;
  daysValid?: number;
  isActive?: boolean;
  sampleUrl?: string;
  sortOrder?: number;
  productVariantId?: string;
}

interface RelationshipBody {
  relatedProductId?: string;
  type?: string;
  position?: number;
  isAutomated?: boolean;
}

interface OptionsBody {
  options?: Array<{ name: string; value: string }>;
}

interface AttributeSetBody {
  attributeSetId?: string;
}

// ============================================================================
// Content Negotiation Helpers
// ============================================================================

function respond(req: HttpRequest, res: HttpResponse, data: unknown, statusCode: number = 200): void {
  res.status(statusCode).json({ success: true, data });
}

function respondError(req: HttpRequest, res: HttpResponse, message: string, statusCode: number = 500): void {
  res.status(statusCode).json({ success: false, error: message });
}

// ============================================================================
// Controller Actions
// ============================================================================

/**
 * List all products (admin)
 * GET /products
 */
export const listProducts = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { status, visibility, categoryId, organizationId, search, limit, offset, orderBy, orderDirection } = req.query;

  const filters: {
    status?: ProductStatus;
    visibility?: ProductVisibility;
    categoryId?: string;
    organizationId?: string;
    search?: string;
  } = {};
  if (status) filters.status = status as ProductStatus;
  if (visibility) filters.visibility = visibility as ProductVisibility;
  if (categoryId) filters.categoryId = categoryId as string;
  if (organizationId) filters.organizationId = organizationId as string;
  if (search) filters.search = search as string;

  const command = new ListProductsCommand(
    Object.keys(filters).length > 0 ? filters : undefined,
    parseInt(limit as string) || 50,
    parseInt(offset as string) || 0,
    (orderBy as string) || 'createdAt',
    (orderDirection as 'asc' | 'desc') || 'desc',
  );

  const useCase = listProductsUseCase;
  const result = await useCase.execute(command);

  respond(req, res, result, 200);
};

/**
 * Get product details (admin)
 * GET /products/:productId
 */
export const getProduct = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { productId } = req.params;

  // Guard: reject obviously non-UUID values that would cause a DB error
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidPattern.test(productId)) {
    respondError(req, res, 'Product not found', 404);
    return;
  }

  const command = new GetProductCommand(productId, undefined, undefined, true, true);
  const useCase = getProductUseCase;
  const product = await useCase.execute(command);

  if (!product) {
    respondError(req, res, 'Product not found', 404);
    return;
  }

  respond(req, res, product, 200);
};

export const getProductStoreAvailability = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const result = await getProductStoreAvailabilityUseCase.execute({
    productId: req.params.productId,
    variantId: req.query.variantId as string | undefined,
    storeId: req.query.storeId as string | undefined,
  });

  respond(req, res, result, 200);
};

/**
 * Create a new product
 * POST /products
 */
export const createProduct = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const organizationId = req.user?.organizationId || req.user?.id;
  const body = req.body as CreateProductBody;
  const {
    name,
    description,
    productTypeId,
    type,
    sku,
    slug,
    shortDescription,
    categoryId,
    basePriceCents,
    salePriceCents,
    costPriceCents,
    compareAtPriceCents,
    currencyCode,
    weight,
    weightUnit,
    length,
    width,
    height,
    dimensionUnit,
    isFeatured,
    isVirtual,
    isDownloadable,
    isSubscription,
    isTaxable,
    taxClass,
    metaTitle,
    metaDescription,
    metaKeywords,
    tags,
    metadata,
  } = body;

  if (!name?.trim()) {
    respondError(req, res, 'Product name is required', 400);
    return;
  }

  // Accept either productTypeId or type (for backward compatibility)
  const resolvedProductTypeId = productTypeId || type;
  if (!resolvedProductTypeId) {
    respondError(req, res, 'Product type is required', 400);
    return;
  }

  const command = new CreateProductCommand(
    name,
    description || '',
    resolvedProductTypeId,
    sku,
    slug,
    shortDescription,
    categoryId,
    organizationId,
    basePriceCents,
    salePriceCents,
    costPriceCents,
    compareAtPriceCents,
    currencyCode,
    weight,
    weightUnit,
    length,
    width,
    height,
    dimensionUnit,
    isFeatured,
    isVirtual,
    isDownloadable,
    isSubscription,
    isTaxable,
    taxClass,
    metaTitle,
    metaDescription,
    metaKeywords,
    tags,
    metadata,
  );

  const useCase = createProductUseCase;
  const product = await useCase.execute(command);

  respond(req, res, product, 201);
};

/**
 * Update a product
 * PUT /products/:productId
 */
export const updateProduct = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { productId } = req.params;
  const updates = req.body as UpdateProductBody;

  const command = new UpdateProductCommand(productId, updates);
  const useCase = updateProductUseCase;
  await useCase.execute(command);

  // Fetch the full updated product to return complete data
  const command2 = new GetProductCommand(productId, undefined, undefined, false, false);
  const useCase2 = getProductUseCase;
  const result = await useCase2.execute(command2);

  respond(req, res, result, 200);
};

/**
 * Update product status
 * PUT /products/:productId/status
 */
export const updateProductStatus = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { productId } = req.params;
  const { status } = req.body as StatusBody;

  const validStatuses = Object.values(ProductStatus) as string[];
  if (!status || !validStatuses.includes(status)) {
    respondError(req, res, `Invalid status. Must be one of: ${validStatuses.join(', ')}`, 400);
    return;
  }

  try {
    const product = await updateProductStatusUseCase.updateStatus(productId, status as ProductStatus);
    respond(req, res, { productId, status: product.status, updatedAt: product.updatedAt.toISOString() }, 200);
  } catch (error) {
    respondError(req, res, getErrorMessage(error), getErrorStatusCode(error));
  }
};

/**
 * Update product visibility
 * PUT /products/:productId/visibility
 */
export const updateProductVisibility = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { productId } = req.params;
  const { visibility } = req.body as VisibilityBody;

  const validVisibilities = Object.values(ProductVisibility) as string[];
  if (!visibility || !validVisibilities.includes(visibility)) {
    respondError(req, res, `Invalid visibility. Must be one of: ${validVisibilities.join(', ')}`, 400);
    return;
  }

  try {
    const product = await updateProductStatusUseCase.updateVisibility(productId, visibility as ProductVisibility);
    respond(req, res, { productId, visibility: product.visibility, updatedAt: product.updatedAt.toISOString() }, 200);
  } catch (error) {
    respondError(req, res, getErrorMessage(error), getErrorStatusCode(error));
  }
};

/**
 * Delete a product
 * DELETE /products/:productId
 */
export const deleteProduct = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { productId } = req.params;
  const { permanent } = req.query;

  try {
    await deleteProductUseCase.execute(productId, permanent === 'true');
    respond(req, res, { productId, deleted: true, permanent: permanent === 'true' }, 200);
  } catch (error) {
    respondError(req, res, getErrorMessage(error), getErrorStatusCode(error));
  }
};

/**
 * Publish a product
 * POST /products/:productId/publish
 */
export const publishProduct = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { productId } = req.params;

  try {
    const product = await updateProductStatusUseCase.publish(productId);
    respond(
      req,
      res,
      { productId, status: product.status, visibility: product.visibility, publishedAt: product.publishedAt?.toISOString() },
      200,
    );
  } catch (error) {
    respondError(req, res, getErrorMessage(error), getErrorStatusCode(error));
  }
};

/**
 * Unpublish a product
 * POST /products/:productId/unpublish
 */
export const unpublishProduct = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { productId } = req.params;

  try {
    const product = await updateProductStatusUseCase.unpublish(productId);
    respond(req, res, { productId, visibility: product.visibility, updatedAt: product.updatedAt.toISOString() }, 200);
  } catch (error) {
    respondError(req, res, getErrorMessage(error), getErrorStatusCode(error));
  }
};

// ============================================================================
// Barcode Lookup
// ============================================================================

/**
 * Get product by variant barcode
 * GET /products/barcode/:barcode
 */
export const findByBarcode = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { barcode } = req.params;

  if (!barcode?.trim()) {
    respondError(req, res, 'Barcode is required', 400);
    return;
  }

  const result = await getProductUseCase.findByBarcode(barcode);
  if (!result) {
    respondError(req, res, 'No product found for this barcode', 404);
    return;
  }

  respond(req, res, result);
};

// ============================================================================
// Variant Management
// ============================================================================

export const getProductVariants = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const variants = await manageProductVariantsUseCase.listForProduct(req.params.productId);
  respond(req, res, variants);
};

export const getProductVariant = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const variant = await manageProductVariantsUseCase.findById(req.params.variantId);
  if (!variant) {
    respondError(req, res, 'Variant not found', 404);
    return;
  }
  respond(req, res, variant);
};

export const createProductVariant = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { productId } = req.params;
  const { priceCents, salePriceCents, compareAtPriceCents, costPriceCents, currencyCode, ...variantFields } =
    req.body as VariantBody & { currencyCode?: string };

  try {
    const result = await createCatalogVariantUseCase.execute(
      new CreateCatalogVariantCommand(
        productId,
        { productId, ...variantFields } as CatalogVariantCreateParams,
        priceCents ?? undefined,
        salePriceCents ?? undefined,
        compareAtPriceCents ?? undefined,
        costPriceCents ?? undefined,
        currencyCode ?? undefined,
      ),
    );
    respond(req, res, result, 201);
  } catch (error) {
    respondError(req, res, getErrorMessage(error), getErrorStatusCode(error));
  }
};

export const updateProductVariant = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { variantId } = req.params;
  const { priceCents, salePriceCents, compareAtPriceCents, costPriceCents, currencyCode, ...variantFields } =
    req.body as ProductVariantUpdateProps & VariantBody & { currencyCode?: string };

  try {
    const result = await updateCatalogVariantUseCase.execute(
      new UpdateCatalogVariantCommand(
        req.params.productId ?? '',
        variantId,
        variantFields as CatalogVariantUpdateParams,
        priceCents ?? undefined,
        salePriceCents ?? undefined,
        compareAtPriceCents ?? undefined,
        costPriceCents ?? undefined,
        currencyCode ?? undefined,
      ),
    );
    respond(req, res, result);
  } catch (error) {
    respondError(req, res, getErrorMessage(error), getErrorStatusCode(error));
  }
};

export const updateVariantInventory = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { variantId } = req.params;
  const { inventory } = req.body as InventoryBody;
  if (inventory === undefined || inventory === null) {
    respondError(req, res, 'inventory is required', 400);
    return;
  }
  const variant = (await manageProductVariantsUseCase.findById(variantId)) as Record<string, unknown> | null;
  if (!variant) {
    respondError(req, res, 'Variant not found', 404);
    return;
  }
  // Return variant with the requested inventory value
  // (inventory is managed by the inventory module, not stored on the variant)
  respond(req, res, { ...variant, inventory: parseInt(String(inventory)) });
};

export const deleteProductVariant = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  await manageProductVariantsUseCase.delete(req.params.variantId);
  respond(req, res, { deleted: true });
};

// ============================================================================
// Image Management
// ============================================================================

export const getProductImages = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const images = await manageProductImagesUseCase.listForProduct(req.params.productId);
  respond(req, res, images);
};

export const addProductImage = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const body = req.body as {
    url: string;
    position?: number;
    isPrimary?: boolean;
    productVariantId?: string;
    alt?: string;
    title?: string;
    width?: number;
    height?: number;
    size?: number;
    type?: string;
    isVisible?: boolean;
  };
  const image = await manageProductImagesUseCase.create(req.params.productId, body);
  respond(req, res, image, 201);
};

export const updateProductImage = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const body = req.body as {
    url?: string;
    position?: number;
    isPrimary?: boolean;
    alt?: string;
    altText?: string;
    title?: string;
    width?: number;
    height?: number;
    size?: number;
    type?: string;
    isVisible?: boolean;
  };
  try {
    const image = await manageProductImagesUseCase.update(req.params.imageId, body);
    respond(req, res, image);
  } catch (error) {
    respondError(req, res, getErrorMessage(error), getErrorStatusCode(error));
  }
};

export const deleteProductImage = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  await manageProductImagesUseCase.delete(req.params.imageId);
  respond(req, res, { deleted: true });
};

export const reorderProductImages = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { imageIds } = req.body as ImageReorderBody;
  try {
    await manageProductImagesUseCase.reorder(req.params.productId, imageIds);
    respond(req, res, { reordered: true });
  } catch (error) {
    respondError(req, res, getErrorMessage(error), getErrorStatusCode(error));
  }
};

// ============================================================================
// Review Management (Admin)
// ============================================================================

export const listReviews = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { productId, status, limit, offset } = req.query;
  const filters: ReviewFilters = {};
  if (productId) filters.productId = productId as string;
  if (status) filters.status = status as ReviewFilters['status'];
  const reviews = await manageProductReviewsUseCase.findWithFilters(
    filters,
    parseInt(limit as string) || 50,
    parseInt(offset as string) || 0,
  );
  respond(req, res, reviews);
};

export const getReview = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const review = await manageProductReviewsUseCase.findById(req.params.reviewId);
  if (!review) {
    respondError(req, res, 'Review not found', 404);
    return;
  }
  respond(req, res, review);
};

export const approveReview = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const review = await manageProductReviewsUseCase.approve(req.params.reviewId);
  if (!review) {
    respondError(req, res, 'Review not found', 404);
    return;
  }
  respond(req, res, review);
};

export const rejectReview = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const review = await manageProductReviewsUseCase.reject(req.params.reviewId);
  if (!review) {
    respondError(req, res, 'Review not found', 404);
    return;
  }
  respond(req, res, review);
};

export const respondToReview = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { response } = req.body as ReviewResponseBody;
  if (!response?.trim()) {
    respondError(req, res, 'Response text is required', 400);
    return;
  }
  const review = await manageProductReviewsUseCase.addAdminResponse(req.params.reviewId, response);
  if (!review) {
    respondError(req, res, 'Review not found', 404);
    return;
  }
  respond(req, res, review);
};

export const deleteReview = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  await manageProductReviewsUseCase.delete(req.params.reviewId);
  respond(req, res, { deleted: true });
};

// ============================================================================
// Q&A Management (Business)
// ============================================================================

/**
 * List Q&A for a product (admin/business)
 * GET /products/:productId/qa
 */
export const listProductQa = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { productId } = req.params;
  const { status } = req.query;
  const qa = await manageProductQaUseCase.findByProduct(productId, status as ProductQaStatus | undefined);
  successResponse(res, qa);
};

/**
 * Update Q&A status
 * PATCH /products/:productId/qa/:qaId/status
 */
export const updateQaStatus = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { qaId } = req.params;
  const { status } = req.body as StatusBody;
  if (!status) {
    errorResponse(res, 'status is required', 400);
    return;
  }
  const qa = await manageProductQaUseCase.updateStatus(qaId, status as ProductQaStatus);
  if (!qa) {
    errorResponse(res, 'Q&A not found', 404);
    return;
  }
  successResponse(res, qa);
};

// ============================================================================
// Review Media Management (Business)
// ============================================================================

/**
 * List review media for a product
 * GET /products/:productId/reviews/media
 */
export const listReviewMedia = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { reviewId } = req.query;
  if (!reviewId) {
    errorResponse(res, 'reviewId query param is required', 400);
    return;
  }
  const media = await manageReviewMediaUseCase.findMediaByReview(reviewId as string);
  successResponse(res, media);
};

/**
 * Delete review media
 * DELETE /products/:productId/reviews/media/:mediaId
 */
export const deleteReviewMedia = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { mediaId } = req.params;
  const deleted = await manageReviewMediaUseCase.deleteMedia(mediaId);
  if (!deleted) {
    errorResponse(res, 'Review media not found', 404);
    return;
  }
  successResponse(res, { deleted: true });
};

// ============================================================================
// Collection Management (Business)
// ============================================================================

/**
 * List all collections
 * GET /collections
 */
export const listCollections = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const collections = await manageProductCollectionsUseCase.findAll();
  successResponse(res, collections);
};

/**
 * Create a collection
 * POST /collections
 */
export const createCollection = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const organizationId = req.user?.organizationId || req.user?.id;
  const { name, slug, description, imageUrl, isActive, position, addProducts } = req.body as CollectionBody;
  if (!name?.trim()) {
    errorResponse(res, 'name is required', 400);
    return;
  }
  if (!slug?.trim()) {
    errorResponse(res, 'slug is required', 400);
    return;
  }
  const command = new ManageProductCollectionCommand(
    name,
    slug,
    undefined,
    description,
    imageUrl,
    isActive,
    position,
    organizationId,
    addProducts,
  );
  const useCase = manageProductCollectionUseCase;
  const result = await useCase.execute(command);
  successResponse(res, result, 201);
};

/**
 * Update a collection
 * PUT /collections/:collectionId
 */
export const updateCollection = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { collectionId } = req.params;
  const organizationId = req.user?.organizationId || req.user?.id;
  const { name, slug, description, imageUrl, isActive, position, addProducts, removeMapIds } = req.body as CollectionBody;
  if (!name?.trim()) {
    errorResponse(res, 'name is required', 400);
    return;
  }
  if (!slug?.trim()) {
    errorResponse(res, 'slug is required', 400);
    return;
  }
  const command = new ManageProductCollectionCommand(
    name,
    slug,
    collectionId,
    description,
    imageUrl,
    isActive,
    position,
    organizationId,
    addProducts,
    removeMapIds,
  );
  const useCase = manageProductCollectionUseCase;
  const result = await useCase.execute(command);
  successResponse(res, result);
};

/**
 * Delete a collection
 * DELETE /collections/:collectionId
 */
export const deleteCollection = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { collectionId } = req.params;
  const deleted = await manageProductCollectionsUseCase.softDelete(collectionId);
  if (!deleted) {
    errorResponse(res, 'Collection not found', 404);
    return;
  }
  successResponse(res, { deleted: true });
};

// ============================================================================
// Download Management (Business)
// ============================================================================

export const listDownloads = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { productId } = req.params;
  const { activeOnly } = req.query;
  const downloads = await manageProductDownloadsUseCase.listForProduct(productId, activeOnly === 'true');
  successResponse(res, downloads);
};

export const createDownload = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { productId } = req.params;
  try {
    const download = await manageProductDownloadsUseCase.create(productId, req.body as DownloadBody);
    successResponse(res, download, 201);
  } catch (error) {
    errorResponse(res, getErrorMessage(error), getErrorStatusCode(error));
  }
};

export const updateDownload = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { downloadId } = req.params;
  try {
    const updated = await manageProductDownloadsUseCase.update(downloadId, req.body as DownloadBody);
    successResponse(res, updated);
  } catch (error) {
    errorResponse(res, getErrorMessage(error), getErrorStatusCode(error));
  }
};

export const deleteDownload = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { downloadId } = req.params;
  try {
    await manageProductDownloadsUseCase.delete(downloadId);
    successResponse(res, { deleted: true });
  } catch (error) {
    errorResponse(res, getErrorMessage(error), getErrorStatusCode(error));
  }
};

// ============================================================================
// Product Relationship Management (Business)
// ============================================================================

export const listRelationships = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { productId } = req.params;
  const { type } = req.query;
  const relationships = await manageProductRelationshipsUseCase.listForProduct(productId, type as ProductRelationType | undefined);
  successResponse(res, relationships);
};

export const createRelationship = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { productId } = req.params;
  try {
    const relationship = await manageProductRelationshipsUseCase.create(productId, req.body as RelationshipBody);
    successResponse(res, relationship, 201);
  } catch (error) {
    errorResponse(res, getErrorMessage(error), getErrorStatusCode(error));
  }
};

export const deleteRelationship = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { relationshipId } = req.params;
  try {
    await manageProductRelationshipsUseCase.delete(relationshipId);
    successResponse(res, { deleted: true });
  } catch (error) {
    errorResponse(res, getErrorMessage(error), getErrorStatusCode(error));
  }
};

// ============================================================================
// Configurable Product Management (Business)
// ============================================================================

export const getVariantMatrix = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { productId } = req.params;
  try {
    const result = await getVariantMatrixUseCase.execute(productId);
    successResponse(res, result);
  } catch (error) {
    errorResponse(res, getErrorMessage(error), getErrorStatusCode(error));
  }
};

export const configureVariant = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { productId } = req.params;
  const { options } = req.body as OptionsBody;
  try {
    const match = await configureVariantUseCase.execute(productId, options as CatalogVariantOption[]);
    successResponse(res, match);
  } catch (error) {
    errorResponse(res, getErrorMessage(error), getErrorStatusCode(error));
  }
};

// ============================================================================
// Grouped Product Management (Business)
// ============================================================================

export const listGroupedChildren = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { productId } = req.params;
  const children = await listGroupedChildrenUseCase.execute(productId);
  successResponse(res, children);
};

// ============================================================================
// Attribute Set Management (Business)
// ============================================================================

export const applyAttributeSet = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { productId } = req.params;
  const { attributeSetId } = req.body as AttributeSetBody;

  try {
    const result = await applyAttributeSetUseCase.execute(productId, attributeSetId ?? '');
    successResponse(res, result);
  } catch (error) {
    errorResponse(res, getErrorMessage(error), getErrorStatusCode(error));
  }
};
