import { jsonResponse, redirectResponse } from 'libs/apiResponse';
/**
 * Product Controller for Admin Hub
 * Uses product use cases directly from modules - no HTTP API calls
 */

import { logger } from '../../../../libs/logger';
import type { HttpRequest, HttpRequestBody, HttpResponse } from 'libs/http';
import { ListProductsCommand } from '../../application/useCases/ListProducts';
import { CreateProductCommand } from '../../application/useCases/CreateProduct';
import { GetProductCommand } from '../../application/useCases/GetProduct';
import { UpdateProductCommand } from '../../application/useCases/UpdateProduct';
import { ProductStatus } from '../../domain/valueObjects/ProductStatus';
import { ProductVisibility } from '../../domain/valueObjects/ProductVisibility';
import {
  deleteProductUseCase,
  updateProductStatusUseCase,
  listProductTypesUseCase,
  listProductsUseCase,
  createProductUseCase,
  getProductUseCase,
  updateProductUseCase,
  manageCategoriesUseCase,
  getProductAttributesUseCase,
  getReviewStatsUseCase,
  manageProductRelationshipsUseCase,
  getProductCardsUseCase,
} from '../../application/useCases/wired';
import { GetProductCardsCommand } from '../../application/useCases/GetProductCards';
import { adminRespond } from '../../../../libs/adminRespond';

// ============================================================================
// Additional use cases imported from wired.ts
// ============================================================================

// ============================================================================
// List Products
// ============================================================================

function buildProductFilters(query: HttpRequest['query']): Record<string, unknown> | undefined {
  const filters: Record<string, unknown> = {};
  if (query.status) filters.status = query.status as ProductStatus;
  if (query.visibility) filters.visibility = query.visibility as ProductVisibility;
  if (query.categoryId) filters.categoryId = query.categoryId as string;
  if (query.search) filters.search = query.search as string;
  return Object.keys(filters).length > 0 ? filters : undefined;
}

export const listProducts = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { status, visibility, categoryId, search, limit, offset, orderBy, orderDirection } = req.query;

  const command = new ListProductsCommand(
    buildProductFilters(req.query),
    parseInt(limit as string) || 50,
    parseInt(offset as string) || 0,
    (orderBy as string) || 'createdAt',
    (orderDirection as 'asc' | 'desc') || 'desc',
  );

  const result = await listProductsUseCase.execute(command);

  adminRespond(req, res, 'products/index', {
    pageName: 'Products',
    products: result.products,
    pagination: {
      total: result.total,
      limit: result.limit,
      offset: result.offset,
      page: Math.floor(result.offset / result.limit) + 1,
      pages: Math.ceil(result.total / result.limit),
      hasMore: result.hasMore,
    },
    filters: {
      status: status || '',
      visibility: visibility || '',
      categoryId: categoryId || '',
      search: search || '',
      orderBy: orderBy || 'createdAt',
      orderDirection: orderDirection || 'desc',
    },

    success: req.query.success || null,
  });
};

// ============================================================================
// View Product
// ============================================================================

export const viewProduct = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { productId } = req.params;

  const command = new GetProductCommand(productId, undefined, undefined, true, true);
  const product = await getProductUseCase.execute(command);

  if (!product) {
    adminRespond(req, res, 'error', {
      pageName: 'Not Found',
      error: 'Product not found',
    });
    return;
  }

  // Load additional rich data in parallel
  const [productAttributes, reviewStats, productType, category] = await Promise.all([
    getProductAttributesUseCase.getProductAttributes(productId).catch(() => []),
    getReviewStatsUseCase
      .execute(productId)
      .catch(() => ({ totalReviews: 0, averageRating: 0, distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }, verifiedPurchaseCount: 0 })),
    product.productTypeId
      ? listProductTypesUseCase
          .execute()
          .then(types => types.find((t: { productTypeId: string }) => t.productTypeId === product.productTypeId) || null)
          .catch(() => null)
      : Promise.resolve(null),
    product.categoryId ? manageCategoriesUseCase.findOne(product.categoryId).catch(() => null) : Promise.resolve(null),
  ]);

  adminRespond(req, res, 'products/view', {
    pageName: `Product: ${product.name}`,
    product,
    productAttributes,
    reviewStats,
    productTypeName: productType?.name || null,
    categoryName: category?.name || null,
    brandName: null,
    success: req.query.success || null,
  });
};

// ============================================================================
// Create Product Form
// ============================================================================

export const createProductForm = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const [productTypes, categories] = await Promise.all([listProductTypesUseCase.execute(), manageCategoriesUseCase.findActive()]);

  adminRespond(req, res, 'products/create', {
    pageName: 'Create Product',
    productTypes,
    categories,
    attributes: [],

    formData: {},
  });
};

// ============================================================================
// Create Product
// ============================================================================

interface CreateProductFormBody {
  name: string;
  description?: string;
  productTypeId: string;
  sku?: string;
  slug?: string;
  shortDescription?: string;
  categoryId?: string;
  basePrice: string;
  salePrice?: string;
  cost?: string;
  compareAtPrice?: string;
  currencyCode?: string;
  weight?: string;
  weightUnit?: 'kg' | 'lb' | 'oz' | 'g';
  length?: string;
  width?: string;
  height?: string;
  dimensionUnit?: 'cm' | 'in' | 'm' | 'mm';
  isFeatured?: string | boolean;
  isVirtual?: string | boolean;
  isDownloadable?: string | boolean;
  isSubscription?: string | boolean;
  isTaxable?: string | boolean;
  taxClass?: string;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
  tags?: string[];
  metadata?: Record<string, unknown>;
}

const toCents = (amount: string | undefined): number | undefined => (amount ? Math.round(parseFloat(amount) * 100) : undefined);

const truthy = (value: string | boolean | undefined): boolean => value === 'true' || value === true;

function buildCreateProductCommand(body: CreateProductFormBody, organizationId: string | undefined): CreateProductCommand {
  return new CreateProductCommand({
    name: body.name,
    description: body.description || '',
    productTypeId: body.productTypeId,
    sku: body.sku,
    slug: body.slug,
    shortDescription: body.shortDescription,
    categoryId: body.categoryId,
    organizationId: organizationId,
    // Form prices are major units (dollars) — the domain works in integer cents
    basePriceCents: body.basePrice !== undefined && body.basePrice !== '' ? toCents(body.basePrice) : undefined,
    salePriceCents: toCents(body.salePrice),
    costPriceCents: toCents(body.cost),
    compareAtPriceCents: toCents(body.compareAtPrice),
    currencyCode: body.currencyCode || 'USD',
    weight: body.weight ? parseFloat(body.weight) : undefined,
    weightUnit: body.weightUnit,
    length: body.length ? parseFloat(body.length) : undefined,
    width: body.width ? parseFloat(body.width) : undefined,
    height: body.height ? parseFloat(body.height) : undefined,
    dimensionUnit: body.dimensionUnit,
    isFeatured: truthy(body.isFeatured),
    isVirtual: truthy(body.isVirtual),
    isDownloadable: truthy(body.isDownloadable),
    isSubscription: truthy(body.isSubscription),
    isTaxable: body.isTaxable !== 'false' && body.isTaxable !== false,
    taxClass: body.taxClass,
    metaTitle: body.metaTitle,
    metaDescription: body.metaDescription,
    metaKeywords: body.metaKeywords ? (Array.isArray(body.metaKeywords) ? body.metaKeywords.join(', ') : body.metaKeywords) : undefined,
    tags: body.tags ? (Array.isArray(body.tags) ? body.tags : [body.tags]) : undefined,
    metadata: body.metadata,
  });
}

async function renderCreateFormError(req: HttpRequest, res: HttpResponse, message: string): Promise<void> {
  const [productTypes, categories] = await Promise.all([
    listProductTypesUseCase.execute().catch(() => []),
    manageCategoriesUseCase.findActive().catch(() => []),
  ]);
  adminRespond(req, res, 'products/create', {
    pageName: 'Create Product',
    error: message,
    formData: req.body as HttpRequestBody,
    productTypes,
    categories,
    attributes: [],
  });
}

export const createProduct = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  try {
    const body = req.body as CreateProductFormBody;

    if (!body.name?.trim()) {
      await renderCreateFormError(req, res, 'Product name is required');
      return;
    }

    const product = await createProductUseCase.execute(buildCreateProductCommand(body, req.user?.organizationId));

    redirectResponse(res, `/admin/products/${product.productId}?success=Product created successfully`);
  } catch (error: unknown) {
    logger.warn('Error:', error);
    await renderCreateFormError(req, res, (error as Error).message || 'Failed to create product');
  }
};

// ============================================================================
// Edit Product Form
// ============================================================================

export const editProductForm = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { productId } = req.params;

  const command = new GetProductCommand(productId, undefined, undefined, true, true);
  const product = await getProductUseCase.execute(command);

  if (!product) {
    adminRespond(req, res, 'error', {
      pageName: 'Not Found',
      error: 'Product not found',
    });
    return;
  }

  const [productTypes, categories, productAttributes, allAttributes, relationships] = await Promise.all([
    listProductTypesUseCase.execute(),
    manageCategoriesUseCase.findActive(),
    getProductAttributesUseCase.getProductAttributes(productId).catch(() => []),
    getProductAttributesUseCase.findAllAttributes().catch(() => []),
    manageProductRelationshipsUseCase.listForProduct(productId).catch(() => []),
  ]);

  const relatedCards = await getProductCardsUseCase
    .execute(new GetProductCardsCommand(relationships.map(r => r.relatedProductId)))
    .catch(() => []);
  const cardById = new Map(relatedCards.map(c => [c.productId, c]));
  const productRelationships = relationships.map(r => ({
    productRelatedId: r.productRelatedId,
    relatedProductId: r.relatedProductId,
    type: r.type,
    position: r.position,
    isAutomated: r.isAutomated,
    relatedProduct: cardById.get(r.relatedProductId) || null,
  }));

  adminRespond(req, res, 'products/edit', {
    pageName: `Edit: ${product?.name || 'Product'}`,
    product,
    productTypes,
    categories,
    productAttributes,
    allAttributes,
    productRelationships,
    success: req.query.success || null,
    error: req.query.error || null,
  });
};

// ============================================================================
// Product Relationships (manual recommendation links)
// ============================================================================

export const addProductRelationship = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { productId } = req.params;
  try {
    const body = req.body as { relatedProductId?: string; type?: string; position?: string; bidirectional?: string };
    await manageProductRelationshipsUseCase.create(productId, {
      relatedProductId: body.relatedProductId?.trim(),
      type: body.type,
      position: body.position ? parseInt(body.position, 10) : 0,
      bidirectional: body.bidirectional === 'on' || body.bidirectional === 'true',
    });
    redirectResponse(res, `/admin/products/${productId}/edit?success=Product link added`);
  } catch (error: unknown) {
    logger.warn('Error:', error);
    redirectResponse(
      res,
      `/admin/products/${productId}/edit?error=` + encodeURIComponent((error as Error).message || 'Failed to add product link'),
    );
  }
};

export const removeProductRelationship = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { productId, relationshipId } = req.params;
  try {
    await manageProductRelationshipsUseCase.delete(relationshipId);
    redirectResponse(res, `/admin/products/${productId}/edit?success=Product link removed`);
  } catch (error: unknown) {
    logger.warn('Error:', error);
    redirectResponse(
      res,
      `/admin/products/${productId}/edit?error=` + encodeURIComponent((error as Error).message || 'Failed to remove product link'),
    );
  }
};

// ============================================================================
// Update Product
// ============================================================================

export const updateProduct = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { productId } = req.params;
  const body = req.body as HttpRequestBody & {
    basePrice?: string;
    salePrice?: string;
    cost?: string;
    compareAtPrice?: string;
    currencyCode?: string;
  };

  // Form prices are major units (dollars) — the domain works in integer cents
  const updates: Record<string, unknown> = { ...body };
  delete updates.basePrice;
  delete updates.salePrice;
  delete updates.cost;
  delete updates.compareAtPrice;
  if (body.basePrice !== undefined && body.basePrice !== '') updates.basePriceCents = Math.round(parseFloat(body.basePrice) * 100);
  if (body.salePrice !== undefined) updates.salePriceCents = body.salePrice === '' ? null : Math.round(parseFloat(body.salePrice) * 100);
  if (body.cost !== undefined) updates.costPriceCents = body.cost === '' ? null : Math.round(parseFloat(body.cost) * 100);
  if (body.compareAtPrice !== undefined)
    updates.compareAtPriceCents = body.compareAtPrice === '' ? null : Math.round(parseFloat(body.compareAtPrice) * 100);

  const command = new UpdateProductCommand(productId, updates as UpdateProductCommand['updates']);
  await updateProductUseCase.execute(command);

  redirectResponse(res, `/admin/products/${productId}?success=Product updated successfully`);
};

// ============================================================================
// Delete Product (AJAX)
// ============================================================================

export const deleteProduct = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { productId } = req.params;
  const { permanent } = req.query;

  const product = await getProductUseCase.execute(new GetProductCommand(productId));
  if (!product) {
    jsonResponse(res, 404, { success: false, message: 'Product not found' });
    return;
  }

  await deleteProductUseCase.execute(productId, permanent === 'true');

  jsonResponse(res, 200, { success: true, message: 'Product deleted successfully' });
};

// ============================================================================
// Update Product Status (AJAX)
// ============================================================================

export const updateProductStatus = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { productId } = req.params;
  const body = req.body as { status: ProductStatus };
  const { status } = body;

  const validStatuses = Object.values(ProductStatus);
  if (!validStatuses.includes(status)) {
    jsonResponse(res, 400, { success: false, message: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
    return;
  }

  try {
    const product = await updateProductStatusUseCase.updateStatus(productId, status);
    jsonResponse(res, 200, { success: true, message: 'Status updated', data: { status: product.status } });
  } catch {
    jsonResponse(res, 404, { success: false, message: 'Product not found' });
  }
};

// ============================================================================
// Publish Product (AJAX)
// ============================================================================

export const publishProduct = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { productId } = req.params;

  try {
    await updateProductStatusUseCase.publish(productId);
    jsonResponse(res, 200, { success: true, message: 'Product published' });
  } catch {
    jsonResponse(res, 404, { success: false, message: 'Product not found' });
  }
};

// ============================================================================
// Unpublish Product (AJAX)
// ============================================================================

export const unpublishProduct = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { productId } = req.params;

  try {
    await updateProductStatusUseCase.unpublish(productId);
    jsonResponse(res, 200, { success: true, message: 'Product unpublished' });
  } catch {
    jsonResponse(res, 404, { success: false, message: 'Product not found' });
  }
};
