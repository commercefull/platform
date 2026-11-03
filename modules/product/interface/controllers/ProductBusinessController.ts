import { jsonResponse } from 'libs/apiResponse';
/**
 * Product Business Controller
 * HTTP interface for business/admin product operations
 */

import type { HttpRequest, HttpResponse } from 'libs/http';
import { CreateProductCommand } from '../../application/useCases/CreateProduct';
import { GetProductCommand } from '../../application/useCases/GetProduct';
import { ListProductsCommand } from '../../application/useCases/ListProducts';
import { UpdateProductCommand } from '../../application/useCases/UpdateProduct';
import { ProductStatus } from '../../domain/valueObjects/ProductStatus';
import { ProductVisibility } from '../../domain/valueObjects/ProductVisibility';
import {
  listProductsUseCase,
  getProductUseCase,
  createProductUseCase,
  updateProductUseCase,
  updateProductStatusUseCase,
  deleteProductUseCase,
  getProductStoreAvailabilityUseCase,
} from '../../application/useCases/wired';

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
  isInventoryManaged?: boolean;
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
  isInventoryManaged?: boolean;
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

// ============================================================================
// Content Negotiation Helpers
// ============================================================================

function respond(req: HttpRequest, res: HttpResponse, data: unknown, statusCode: number = 200): void {
  jsonResponse(res, statusCode, { success: true, data });
}

function respondError(req: HttpRequest, res: HttpResponse, message: string, statusCode: number = 500): void {
  jsonResponse(res, statusCode, { success: false, error: message });
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
    isInventoryManaged,
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

  const command = new CreateProductCommand({
    name: name,
    description: description || '',
    productTypeId: resolvedProductTypeId,
    sku: sku,
    slug: slug,
    shortDescription: shortDescription,
    categoryId: categoryId,
    organizationId: organizationId,
    basePriceCents: basePriceCents,
    salePriceCents: salePriceCents,
    costPriceCents: costPriceCents,
    compareAtPriceCents: compareAtPriceCents,
    currencyCode: currencyCode,
    weight: weight,
    weightUnit: weightUnit,
    length: length,
    width: width,
    height: height,
    dimensionUnit: dimensionUnit,
    isFeatured: isFeatured,
    isVirtual: isVirtual,
    isDownloadable: isDownloadable,
    isSubscription: isSubscription,
    isTaxable: isTaxable,
    taxClass: taxClass,
    metaTitle: metaTitle,
    metaDescription: metaDescription,
    metaKeywords: metaKeywords,
    tags: tags,
    metadata: metadata,
    isInventoryManaged: isInventoryManaged,
  });

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

  const product = await updateProductStatusUseCase.updateStatus(productId, status as ProductStatus);
  respond(req, res, { productId, status: product.status, updatedAt: product.updatedAt.toISOString() }, 200);
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

  const product = await updateProductStatusUseCase.updateVisibility(productId, visibility as ProductVisibility);
  respond(req, res, { productId, visibility: product.visibility, updatedAt: product.updatedAt.toISOString() }, 200);
};

/**
 * Delete a product
 * DELETE /products/:productId
 */
export const deleteProduct = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { productId } = req.params;
  const { permanent } = req.query;

  await deleteProductUseCase.execute(productId, permanent === 'true');
  respond(req, res, { productId, deleted: true, permanent: permanent === 'true' }, 200);
};

/**
 * Publish a product
 * POST /products/:productId/publish
 */
export const publishProduct = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { productId } = req.params;

  const product = await updateProductStatusUseCase.publish(productId);
  respond(
    req,
    res,
    { productId, status: product.status, visibility: product.visibility, publishedAt: product.publishedAt?.toISOString() },
    200,
  );
};

/**
 * Unpublish a product
 * POST /products/:productId/unpublish
 */
export const unpublishProduct = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { productId } = req.params;

  const product = await updateProductStatusUseCase.unpublish(productId);
  respond(req, res, { productId, visibility: product.visibility, updatedAt: product.updatedAt.toISOString() }, 200);
};

// Re-exports — handlers live in productBusinessOpsController.ts
export {
  findByBarcode,
  getProductVariants,
  getProductVariant,
  createProductVariant,
  updateProductVariant,
  updateVariantInventory,
  deleteProductVariant,
  getProductImages,
  addProductImage,
  updateProductImage,
  deleteProductImage,
  reorderProductImages,
  listReviews,
  getReview,
  approveReview,
  rejectReview,
  respondToReview,
  deleteReview,
  listProductQa,
  updateQaStatus,
  listReviewMedia,
  deleteReviewMedia,
  listDownloads,
  createDownload,
  updateDownload,
  deleteDownload,
  listRelationships,
  createRelationship,
  reorderRelationships,
  deleteRelationship,
  getVariantMatrix,
  configureVariant,
  listGroupedChildren,
  applyAttributeSet,
} from './productBusinessOpsController';
