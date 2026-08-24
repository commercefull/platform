/**
 * Product Business Controller
 * HTTP interface for business/admin product operations
 */

import { Response } from 'express';
import { TypedRequest } from 'libs/types/express';
import productCatalogRepository from '../../infrastructure/repositories/ProductCatalogRepository';
import productAttributeRepository from '../../infrastructure/repositories/ProductAttributeRepository';
import productEngagementRepository from '../../infrastructure/repositories/ProductEngagementRepository';
import { CreateProductCommand, CreateProductUseCase } from '../../application/useCases/CreateProduct';
import { GetProductCommand, GetProductUseCase } from '../../application/useCases/GetProduct';
import { GetProductStoreAvailabilityUseCase } from '../../application/useCases/GetProductStoreAvailability';
import { ListProductsCommand, ListProductsUseCase } from '../../application/useCases/ListProducts';
import { UpdateProductCommand, UpdateProductUseCase } from '../../application/useCases/UpdateProduct';
import { ProductStatus } from '../../domain/valueObjects/ProductStatus';
import { ProductVisibility } from '../../domain/valueObjects/ProductVisibility';
import type { ProductVariantCreateProps, ProductVariantUpdateProps } from '../../infrastructure/repositories/productVariantRepo';
import { ManageProductCollectionCommand, ManageProductCollectionUseCase } from '../../application/useCases/ManageProductCollection';
import { successResponse, errorResponse } from '../../../../libs/apiResponse';
import type { ProductQaStatus } from '../../infrastructure/repositories/ProductEngagementRepository';
import type { RelationType } from '../../infrastructure/repositories/ProductEngagementRepository';
import type { ReviewFilters } from '../../infrastructure/repositories/ProductEngagementRepository';

const ProductRepo = productCatalogRepository.productRepository;
const productVariantRepo = productCatalogRepository.variants;
const productImageRepo = productEngagementRepository.images;
const productReviewRepo = productEngagementRepository.reviews;
const productQaRepo = productEngagementRepository.qa;
const productReviewMediaRepo = productEngagementRepository.reviewMedia;
const productCollectionRepo = productEngagementRepository.collections;
const productDownloadRepo = productCatalogRepository.downloads;
const productRelationshipRepo = productEngagementRepository.relationships;
const ProductAttributeSetRepository = productAttributeRepository.sets;
const DynamicAttributeRepository = productAttributeRepository.dynamic;

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
  basePrice?: number;
  salePrice?: number;
  cost?: number;
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
  basePrice?: number;
  salePrice?: number | null;
  cost?: number;
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
  price?: number;
  salePrice?: number;
  compareAtPrice?: number | null;
  costPrice?: number | null;
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

function respond(req: TypedRequest, res: Response, data: unknown, statusCode: number = 200): void {
  res.status(statusCode).json({ success: true, data });
}

function respondError(req: TypedRequest, res: Response, message: string, statusCode: number = 500): void {
  res.status(statusCode).json({ success: false, error: message });
}

// ============================================================================
// Controller Actions
// ============================================================================

/**
 * List all products (admin)
 * GET /products
 */
export const listProducts = async (req: TypedRequest, res: Response): Promise<void> => {
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

  const useCase = new ListProductsUseCase(ProductRepo);
  const result = await useCase.execute(command);

  respond(req, res, result, 200);
  
};

/**
 * Get product details (admin)
 * GET /products/:productId
 */
export const getProduct = async (req: TypedRequest, res: Response): Promise<void> => {
  const { productId } = req.params;

  // Guard: reject obviously non-UUID values that would cause a DB error
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidPattern.test(productId)) {
    respondError(req, res, 'Product not found', 404);
    return;
  }

  const command = new GetProductCommand(productId, undefined, undefined, true, true);
  const useCase = new GetProductUseCase(ProductRepo);
  const product = await useCase.execute(command);

  if (!product) {
    respondError(req, res, 'Product not found', 404);
    return;
  }

  respond(req, res, product, 200);
  
};

export const getProductStoreAvailability = async (req: TypedRequest, res: Response): Promise<void> => {
  const useCase = new GetProductStoreAvailabilityUseCase(ProductRepo);
  const result = await useCase.execute({
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
export const createProduct = async (req: TypedRequest, res: Response): Promise<void> => {
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
    basePrice,
    salePrice,
    cost,
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
    basePrice,
    salePrice,
    cost,
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

  const useCase = new CreateProductUseCase(ProductRepo);
  const product = await useCase.execute(command);

  respond(req, res, product, 201);
};

/**
 * Update a product
 * PUT /products/:productId
 */
export const updateProduct = async (req: TypedRequest, res: Response): Promise<void> => {
  const { productId } = req.params;
  const updates = req.body as UpdateProductBody;

  const command = new UpdateProductCommand(productId, updates);
  const useCase = new UpdateProductUseCase(ProductRepo);
  await useCase.execute(command);

  // Fetch the full updated product to return complete data
  const command2 = new GetProductCommand(productId, undefined, undefined, false, false);
  const useCase2 = new GetProductUseCase(ProductRepo);
  const result = await useCase2.execute(command2);

  respond(req, res, result, 200);
};

/**
 * Update product status
 * PUT /products/:productId/status
 */
export const updateProductStatus = async (req: TypedRequest, res: Response): Promise<void> => {
  const { productId } = req.params;
  const { status } = req.body as StatusBody;

  const validStatuses = Object.values(ProductStatus) as string[];
  if (!status || !validStatuses.includes(status)) {
    respondError(req, res, `Invalid status. Must be one of: ${validStatuses.join(', ')}`, 400);
    return;
  }

  const product = await ProductRepo.findById(productId);
  if (!product) {
    respondError(req, res, 'Product not found', 404);
    return;
  }

  product.updateStatus(status as ProductStatus);
  await ProductRepo.save(product);

  respond(req, res, { productId, status: product.status, updatedAt: product.updatedAt.toISOString() }, 200);
  
};

/**
 * Update product visibility
 * PUT /products/:productId/visibility
 */
export const updateProductVisibility = async (req: TypedRequest, res: Response): Promise<void> => {
  const { productId } = req.params;
  const { visibility } = req.body as VisibilityBody;

  const validVisibilities = Object.values(ProductVisibility) as string[];
  if (!visibility || !validVisibilities.includes(visibility)) {
    respondError(req, res, `Invalid visibility. Must be one of: ${validVisibilities.join(', ')}`, 400);
    return;
  }

  const product = await ProductRepo.findById(productId);
  if (!product) {
    respondError(req, res, 'Product not found', 404);
    return;
  }

  product.updateVisibility(visibility as ProductVisibility);
  await ProductRepo.save(product);

  respond(req, res, { productId, visibility: product.visibility, updatedAt: product.updatedAt.toISOString() }, 200);
  
};

/**
 * Delete a product
 * DELETE /products/:productId
 */
export const deleteProduct = async (req: TypedRequest, res: Response): Promise<void> => {
  const { productId } = req.params;
  const { permanent } = req.query;

  const product = await ProductRepo.findById(productId);
  if (!product) {
    respondError(req, res, 'Product not found', 404);
    return;
  }

  if (permanent === 'true') {
    await ProductRepo.hardDelete(productId);
  } else {
    await ProductRepo.delete(productId);
  }

  respond(req, res, { productId, deleted: true, permanent: permanent === 'true' }, 200);
  
};

/**
 * Publish a product
 * POST /products/:productId/publish
 */
export const publishProduct = async (req: TypedRequest, res: Response): Promise<void> => {
  const { productId } = req.params;

  const product = await ProductRepo.findById(productId);
  if (!product) {
    respondError(req, res, 'Product not found', 404);
    return;
  }

  product.publish();
  await ProductRepo.save(product);

  respond(req, res, { productId, status: product.status, visibility: product.visibility, publishedAt: product.publishedAt?.toISOString() }, 200);
  
};

/**
 * Unpublish a product
 * POST /products/:productId/unpublish
 */
export const unpublishProduct = async (req: TypedRequest, res: Response): Promise<void> => {
  const { productId } = req.params;

  const product = await ProductRepo.findById(productId);
  if (!product) {
    respondError(req, res, 'Product not found', 404);
    return;
  }

  product.unpublish();
  await ProductRepo.save(product);

  respond(req, res, { productId, visibility: product.visibility, updatedAt: product.updatedAt.toISOString() }, 200);
  
};

// ============================================================================
// Barcode Lookup
// ============================================================================

/**
 * Get product by variant barcode
 * GET /products/barcode/:barcode
 */
export const findByBarcode = async (req: TypedRequest, res: Response): Promise<void> => {
  const { barcode } = req.params;

  if (!barcode?.trim()) {
    respondError(req, res, 'Barcode is required', 400);
    return;
  }

  const result = await ProductRepo.findByBarcode(barcode);
  if (!result) {
    respondError(req, res, 'No product found for this barcode', 404);
    return;
  }

  respond(req, res, result);
  
};

// ============================================================================
// Variant Management
// ============================================================================

export const getProductVariants = async (req: TypedRequest, res: Response): Promise<void> => {
  const variants = await productVariantRepo.findByProductId(req.params.productId);
  respond(req, res, variants);
  
};

export const getProductVariant = async (req: TypedRequest, res: Response): Promise<void> => {
  const variant = await productVariantRepo.findById(req.params.variantId);
  if (!variant) {
    respondError(req, res, 'Variant not found', 404);
    return;
  }
  respond(req, res, variant);
  
};

export const createProductVariant = async (req: TypedRequest, res: Response): Promise<void> => {
  const body = req.body as VariantBody;
  const variant = await productVariantRepo.create({
    productId: req.params.productId,
    ...body,
  } as ProductVariantCreateProps);
  respond(req, res, variant, 201);
  
};

export const updateProductVariant = async (req: TypedRequest, res: Response): Promise<void> => {
  const body = req.body as ProductVariantUpdateProps;
  const variant = await productVariantRepo.update(req.params.variantId, body);
  respond(req, res, variant);
  
};

export const updateVariantInventory = async (req: TypedRequest, res: Response): Promise<void> => {
  const { variantId } = req.params;
  const { inventory } = req.body as InventoryBody;
  if (inventory === undefined || inventory === null) {
    respondError(req, res, 'inventory is required', 400);
    return;
  }
  const variant = await productVariantRepo.findById(variantId);
  if (!variant) {
    respondError(req, res, 'Variant not found', 404);
    return;
  }
  // Return variant with the requested inventory value
  // (inventory is managed by the inventory module, not stored on the variant)
  respond(req, res, { ...variant, inventory: parseInt(String(inventory)) });
  
};

export const deleteProductVariant = async (req: TypedRequest, res: Response): Promise<void> => {
  await productVariantRepo.delete(req.params.variantId);
  respond(req, res, { deleted: true });
  
};

// ============================================================================
// Image Management
// ============================================================================

export const getProductImages = async (req: TypedRequest, res: Response): Promise<void> => {
  const images = await productImageRepo.findByProductId(req.params.productId);
  respond(req, res, images);
  
};

export const addProductImage = async (req: TypedRequest, res: Response): Promise<void> => {
  const body = req.body as { url: string; position?: number; isPrimary?: boolean; productVariantId?: string; alt?: string; title?: string; width?: number; height?: number; size?: number; type?: string; isVisible?: boolean };
  const image = await productImageRepo.create({
    productId: req.params.productId,
    url: body.url,
    position: body.position ?? 0,
    isPrimary: body.isPrimary ?? false,
    productVariantId: body.productVariantId,
    alt: body.alt,
    title: body.title,
    width: body.width,
    height: body.height,
    size: body.size,
    type: body.type,
    isVisible: body.isVisible,
  });
  respond(req, res, image, 201);
  
};

export const updateProductImage = async (req: TypedRequest, res: Response): Promise<void> => {
  const body = req.body as { url?: string; position?: number; isPrimary?: boolean; alt?: string; altText?: string; title?: string; width?: number; height?: number; size?: number; type?: string; isVisible?: boolean };
  const image = await productImageRepo.update(req.params.imageId, body);
  respond(req, res, image);
  
};

export const deleteProductImage = async (req: TypedRequest, res: Response): Promise<void> => {
  await productImageRepo.delete(req.params.imageId);
  respond(req, res, { deleted: true });
  
};

export const reorderProductImages = async (req: TypedRequest, res: Response): Promise<void> => {
  const { imageIds } = req.body as ImageReorderBody;
  if (!Array.isArray(imageIds)) {
    respondError(req, res, 'imageIds must be an array', 400);
    return;
  }
  await productImageRepo.reorder(req.params.productId, imageIds);
  respond(req, res, { reordered: true });
  
};

// ============================================================================
// Review Management (Admin)
// ============================================================================

export const listReviews = async (req: TypedRequest, res: Response): Promise<void> => {
  const { productId, status, limit, offset } = req.query;
  const filters: ReviewFilters = {};
  if (productId) filters.productId = productId as string;
  if (status) filters.status = status as ReviewFilters['status'];
  const reviews = await productReviewRepo.findWithFilters(filters, parseInt(limit as string) || 50, parseInt(offset as string) || 0);
  respond(req, res, reviews);
  
};

export const getReview = async (req: TypedRequest, res: Response): Promise<void> => {
  const review = await productReviewRepo.findById(req.params.reviewId);
  if (!review) {
    respondError(req, res, 'Review not found', 404);
    return;
  }
  respond(req, res, review);
  
};

export const approveReview = async (req: TypedRequest, res: Response): Promise<void> => {
  const review = await productReviewRepo.approve(req.params.reviewId);
  if (!review) {
    respondError(req, res, 'Review not found', 404);
    return;
  }
  respond(req, res, review);
  
};

export const rejectReview = async (req: TypedRequest, res: Response): Promise<void> => {
  const review = await productReviewRepo.reject(req.params.reviewId);
  if (!review) {
    respondError(req, res, 'Review not found', 404);
    return;
  }
  respond(req, res, review);
  
};

export const respondToReview = async (req: TypedRequest, res: Response): Promise<void> => {
  const { response } = req.body as ReviewResponseBody;
  if (!response?.trim()) {
    respondError(req, res, 'Response text is required', 400);
    return;
  }
  const review = await productReviewRepo.addAdminResponse(req.params.reviewId, response);
  if (!review) {
    respondError(req, res, 'Review not found', 404);
    return;
  }
  respond(req, res, review);
  
};

export const deleteReview = async (req: TypedRequest, res: Response): Promise<void> => {
  await productReviewRepo.delete(req.params.reviewId);
  respond(req, res, { deleted: true });
  
};

// ============================================================================
// Q&A Management (Business)
// ============================================================================

/**
 * List Q&A for a product (admin/business)
 * GET /products/:productId/qa
 */
export const listProductQa = async (req: TypedRequest, res: Response): Promise<void> => {
  const { productId } = req.params;
  const { status } = req.query;
  const qa = await productQaRepo.findByProduct(productId, status as ProductQaStatus | undefined);
  successResponse(res, qa);
};

/**
 * Update Q&A status
 * PATCH /products/:productId/qa/:qaId/status
 */
export const updateQaStatus = async (req: TypedRequest, res: Response): Promise<void> => {
  const { qaId } = req.params;
  const { status } = req.body as StatusBody;
  if (!status) {
    errorResponse(res, 'status is required', 400);
    return;
  }
  const qa = await productQaRepo.updateStatus(qaId, status as ProductQaStatus);
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
export const listReviewMedia = async (req: TypedRequest, res: Response): Promise<void> => {
  const { reviewId } = req.query;
  if (!reviewId) {
    errorResponse(res, 'reviewId query param is required', 400);
    return;
  }
  const media = await productReviewMediaRepo.findByReview(reviewId as string);
  successResponse(res, media);
};

/**
 * Delete review media
 * DELETE /products/:productId/reviews/media/:mediaId
 */
export const deleteReviewMedia = async (req: TypedRequest, res: Response): Promise<void> => {
  const { mediaId } = req.params;
  const deleted = await productReviewMediaRepo.delete(mediaId);
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
export const listCollections = async (req: TypedRequest, res: Response): Promise<void> => {
  const collections = await productCollectionRepo.findAll();
  successResponse(res, collections);
};

/**
 * Create a collection
 * POST /collections
 */
export const createCollection = async (req: TypedRequest, res: Response): Promise<void> => {
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
  const useCase = new ManageProductCollectionUseCase();
  const result = await useCase.execute(command);
  successResponse(res, result, 201);
};

/**
 * Update a collection
 * PUT /collections/:collectionId
 */
export const updateCollection = async (req: TypedRequest, res: Response): Promise<void> => {
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
  const useCase = new ManageProductCollectionUseCase();
  const result = await useCase.execute(command);
  successResponse(res, result);
};

/**
 * Delete a collection
 * DELETE /collections/:collectionId
 */
export const deleteCollection = async (req: TypedRequest, res: Response): Promise<void> => {
  const { collectionId } = req.params;
  const deleted = await productCollectionRepo.softDelete(collectionId);
  if (!deleted) {
    errorResponse(res, 'Collection not found', 404);
    return;
  }
  successResponse(res, { deleted: true });
};

// ============================================================================
// Download Management (Business)
// ============================================================================

export const listDownloads = async (req: TypedRequest, res: Response): Promise<void> => {
  const { productId } = req.params;
  const { activeOnly } = req.query;
  const downloads = await productDownloadRepo.findByProductId(productId, undefined, activeOnly === 'true');
  successResponse(res, downloads);
};

export const createDownload = async (req: TypedRequest, res: Response): Promise<void> => {
  const { productId } = req.params;
  const { name, fileUrl, filePath, fileSize, mimeType, maxDownloads, daysValid, isActive, sampleUrl, sortOrder, productVariantId } = req.body as DownloadBody;
  if (!name?.trim()) {
    errorResponse(res, 'name is required', 400);
    return;
  }
  if (!fileUrl?.trim()) {
    errorResponse(res, 'fileUrl is required', 400);
    return;
  }
  const download = await productDownloadRepo.create({
    productId,
    productVariantId,
    name,
    fileUrl,
    filePath,
    fileSize,
    mimeType,
    maxDownloads,
    daysValid,
    isActive: isActive !== false,
    sampleUrl,
    sortOrder: sortOrder || 0,
  });
  successResponse(res, download, 201);
};

export const updateDownload = async (req: TypedRequest, res: Response): Promise<void> => {
  const { downloadId } = req.params;
  const body = req.body as DownloadBody;
  const updated = await productDownloadRepo.update(downloadId, body);
  if (!updated) {
    errorResponse(res, 'Download not found', 404);
    return;
  }
  successResponse(res, updated);
};

export const deleteDownload = async (req: TypedRequest, res: Response): Promise<void> => {
  const { downloadId } = req.params;
  const deleted = await productDownloadRepo.delete(downloadId);
  if (!deleted) {
    errorResponse(res, 'Download not found', 404);
    return;
  }
  successResponse(res, { deleted: true });
};

// ============================================================================
// Product Relationship Management (Business)
// ============================================================================

export const listRelationships = async (req: TypedRequest, res: Response): Promise<void> => {
  const { productId } = req.params;
  const { type } = req.query;
  const relationships = await productRelationshipRepo.findByProductId(productId, type as RelationType | undefined);
  successResponse(res, relationships);
};

export const createRelationship = async (req: TypedRequest, res: Response): Promise<void> => {
  const { productId } = req.params;
  const { relatedProductId, type, position, isAutomated } = req.body as RelationshipBody;
  if (!relatedProductId) {
    errorResponse(res, 'relatedProductId is required', 400);
    return;
  }
  if (!type) {
    errorResponse(res, 'type is required (related, accessory, cross_sell, up_sell, grouped)', 400);
    return;
  }
  const relationship = await productRelationshipRepo.create({
    productId,
    relatedProductId,
    type: type as RelationType,
    position: position || 0,
    isAutomated: isAutomated || false,
  });
  successResponse(res, relationship, 201);
};

export const deleteRelationship = async (req: TypedRequest, res: Response): Promise<void> => {
  const { relationshipId } = req.params;
  const deleted = await productRelationshipRepo.delete(relationshipId);
  if (!deleted) {
    errorResponse(res, 'Relationship not found', 404);
    return;
  }
  successResponse(res, { deleted: true });
};

// ============================================================================
// Configurable Product Management (Business)
// ============================================================================

export const getVariantMatrix = async (req: TypedRequest, res: Response): Promise<void> => {
  const { productId } = req.params;
  const variants = await productVariantRepo.findByProductId(productId);
  const product = await ProductRepo.findById(productId);
  if (!product) {
    errorResponse(res, 'Product not found', 404);
    return;
  }
  const matrix = variants.map(v => ({
    variantId: v.id,
    sku: v.sku,
    name: v.name,
    price: v.price,
    compareAtPrice: v.compareAtPrice,
    inventory: v.inventory,
    isDefault: v.isDefault,
    position: v.position,
    options: v.options,
    isActive: v.isActive,
  }));
  const optionAxes = matrix.length > 0
    ? [...new Set(matrix.flatMap(v => v.options.map(o => o.name)))]
    : [];
  successResponse(res, { productId, productName: product.name, hasVariants: product.hasVariants, optionAxes, variants: matrix });
};

export const configureVariant = async (req: TypedRequest, res: Response): Promise<void> => {
  const { productId } = req.params;
  const { options } = req.body as OptionsBody;
  if (!options || !Array.isArray(options) || options.length === 0) {
    errorResponse(res, 'options array is required', 400);
    return;
  }
  const variants = await productVariantRepo.findByProductId(productId);
  const match = variants.find(v =>
    options.every((reqOpt: { name: string; value: string }) =>
      v.options.some((vOpt: { name: string; value: string }) => vOpt.name === reqOpt.name && vOpt.value === reqOpt.value),
    ),
  );
  if (!match) {
    errorResponse(res, 'No matching variant found for the given options', 404);
    return;
  }
  successResponse(res, match);
};

// ============================================================================
// Grouped Product Management (Business)
// ============================================================================

export const listGroupedChildren = async (req: TypedRequest, res: Response): Promise<void> => {
  const { productId } = req.params;
  const relationships = await productRelationshipRepo.findByProductId(productId, 'grouped' as RelationType);
  const childIds = relationships.map(r => r.relatedProductId);
  const children: unknown[] = [];
  for (const id of childIds) {
    const p = await ProductRepo.findById(id);
    if (p) children.push(p.toJSON());
  }
  successResponse(res, children);
};

// ============================================================================
// Attribute Set Management (Business)
// ============================================================================

export const applyAttributeSet = async (req: TypedRequest, res: Response): Promise<void> => {
  const { productId } = req.params;
  const { attributeSetId } = req.body as AttributeSetBody;
  if (!attributeSetId) {
    errorResponse(res, 'attributeSetId is required', 400);
    return;
  }

  const product = await ProductRepo.findById(productId);
  if (!product) {
    errorResponse(res, 'Product not found', 404);
    return;
  }

  const setWithAttrs = await ProductAttributeSetRepository.findByIdWithAttributes(attributeSetId);
  if (!setWithAttrs) {
    errorResponse(res, 'Attribute set not found', 404);
    return;
  }

  const attrsToSet = setWithAttrs.attributes.map(attr => ({
    attributeId: attr.productAttributeId,
    value: attr.defaultValue || '',
  }));

  if (attrsToSet.length > 0) {
    await DynamicAttributeRepository.setProductAttributes(productId, attrsToSet);
  }

  successResponse(res, { applied: true, attributeSetId, attributesAssigned: attrsToSet.length });
};
