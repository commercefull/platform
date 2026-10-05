import { jsonResponse, redirectResponse, renderResponse } from 'libs/apiResponse';
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
import type { ProductQaStatus } from '../../domain/repositories/ProductCatalogPorts';
import { ProductVisibility } from '../../domain/valueObjects/ProductVisibility';
import {
  deleteProductUseCase,
  updateProductStatusUseCase,
  listProductTypesUseCase,
  listProductsUseCase,
  createProductUseCase,
  getProductUseCase,
  updateProductUseCase,
  manageProductCategoriesUseCase,
  manageProductTagsUseCase,
  manageProductQaUseCase,
  manageReviewMediaUseCase,
  productPricingPort,
  manageCategoriesUseCase,
  getProductAttributesUseCase,
  getReviewStatsUseCase,
  manageProductRelationshipsUseCase,
  getProductCardsUseCase,
  updateVariantInventoryPolicyUseCase,
} from '../../application/useCases/wired';
import { GetProductCardsCommand } from '../../application/useCases/GetProductCards';
import { UpdateVariantInventoryPolicyCommand } from '../../application/useCases/UpdateVariantInventoryPolicy';
import type { InventoryPolicy } from '../../domain/entities/ProductVariant';
import { adminRespond } from '../../../../libs/adminRespond';

// ============================================================================
// Additional use cases imported from wired.ts
// ============================================================================

// ============================================================================
// List Products
// ============================================================================

export const listProducts = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { status, visibility, categoryId, search, limit, offset, orderBy, orderDirection } = req.query;

  const filters: Record<string, unknown> = {};
  if (status) filters.status = status as ProductStatus;
  if (visibility) filters.visibility = visibility as ProductVisibility;
  if (categoryId) filters.categoryId = categoryId as string;
  if (search) filters.search = search as string;

  const command = new ListProductsCommand(
    Object.keys(filters).length > 0 ? filters : undefined,
    parseInt(limit as string) || 50,
    parseInt(offset as string) || 0,
    (orderBy as string) || 'createdAt',
    (orderDirection as 'asc' | 'desc') || 'desc',
  );

  const result = await listProductsUseCase.execute(command);

  // Calculate pagination info
  const page = Math.floor(result.offset / result.limit) + 1;
  const pages = Math.ceil(result.total / result.limit);

  adminRespond(req, res, 'products/index', {
    pageName: 'Products',
    products: result.products,
    pagination: {
      total: result.total,
      limit: result.limit,
      offset: result.offset,
      page,
      pages,
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

export const createProduct = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  try {
    const organizationId = req.user?.organizationId;
    const body = req.body as {
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
    };
    const {
      name,
      description,
      productTypeId,
      sku,
      slug,
      shortDescription,
      categoryId,
      basePrice,
      salePrice,
      cost,
      compareAtPrice,
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
      const [productTypes, categories] = await Promise.all([listProductTypesUseCase.execute(), manageCategoriesUseCase.findActive()]);
      adminRespond(req, res, 'products/create', {
        pageName: 'Create Product',
        error: 'Product name is required',
        formData: req.body as HttpRequestBody,
        productTypes,
        categories,
        attributes: [],
      });
      return;
    }

    // Form prices are major units (dollars) — the domain works in integer cents
    const basePriceCents = basePrice !== undefined && basePrice !== '' ? Math.round(parseFloat(basePrice) * 100) : undefined;
    const salePriceCents = salePrice ? Math.round(parseFloat(salePrice) * 100) : undefined;
    const costPriceCents = cost ? Math.round(parseFloat(cost) * 100) : undefined;
    const compareAtPriceCents = compareAtPrice ? Math.round(parseFloat(compareAtPrice) * 100) : undefined;

    const command = new CreateProductCommand(
      name,
      description || '',
      productTypeId,
      sku,
      slug,
      shortDescription,
      categoryId,
      organizationId,
      basePriceCents,
      salePriceCents,
      costPriceCents,
      compareAtPriceCents,
      currencyCode || 'USD',
      weight ? parseFloat(weight) : undefined,
      weightUnit,
      length ? parseFloat(length) : undefined,
      width ? parseFloat(width) : undefined,
      height ? parseFloat(height) : undefined,
      dimensionUnit,
      isFeatured === 'true' || isFeatured === true,
      isVirtual === 'true' || isVirtual === true,
      isDownloadable === 'true' || isDownloadable === true,
      isSubscription === 'true' || isSubscription === true,
      isTaxable !== 'false' && isTaxable !== false,
      taxClass,
      metaTitle,
      metaDescription,
      metaKeywords ? (Array.isArray(metaKeywords) ? metaKeywords.join(', ') : metaKeywords) : undefined,
      tags ? (Array.isArray(tags) ? tags : [tags]) : undefined,
      metadata,
    );

    const product = await createProductUseCase.execute(command);

    redirectResponse(res, `/admin/products/${product.productId}?success=Product created successfully`);
  } catch (error: unknown) {
    logger.warn('Error:', error);

    const [productTypes, categories] = await Promise.all([
      listProductTypesUseCase.execute().catch(() => []),
      manageCategoriesUseCase.findActive().catch(() => []),
    ]);
    adminRespond(req, res, 'products/create', {
      pageName: 'Create Product',
      error: (error as Error).message || 'Failed to create product',
      formData: req.body as HttpRequestBody,
      productTypes,
      categories,
      attributes: [],
    });
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

// ============================================================================
// Product Categories
// ============================================================================

export const listProductCategories = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const categories = await manageProductCategoriesUseCase.findAll();
  adminRespond(req, res, 'products/categories/index', {
    pageName: 'Product Categories',
    categories,
    success: req.query.success || null,
  });
};

export const createProductCategoryForm = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const categories = await manageProductCategoriesUseCase.findAll();
  adminRespond(req, res, 'products/categories/form', {
    pageName: 'Create Product Category',
    category: null,
    categories,
    formData: {},
  });
};

export const createProductCategory = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  try {
    const body = req.body as {
      name: string;
      slug?: string;
      description?: string;
      parentId?: string;
      position: string;
      isActive?: string;
      imageUrl?: string;
      metaTitle?: string;
      metaDescription?: string;
    };
    const { name, slug, description, parentId, position, isActive, imageUrl, metaTitle, metaDescription } = body;
    await manageProductCategoriesUseCase.create({
      name,
      slug: slug || name.toLowerCase().replace(/\s+/g, '-'),
      description: description || null,
      parentId: parentId || null,
      position: parseInt(position) || 0,
      isActive: isActive !== 'false',
      imageUrl: imageUrl || null,
      metaTitle: metaTitle || null,
      metaDescription: metaDescription || null,
    });
    redirectResponse(res, '/admin/products/categories?success=Category created successfully');
  } catch (error: unknown) {
    logger.warn('Error:', error);
    redirectResponse(
      res,
      '/admin/products/categories?error=' + encodeURIComponent((error as Error).message || 'Failed to create category'),
    );
  }
};

export const editProductCategoryForm = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { categoryId } = req.params;
  const [category, categories] = await Promise.all([
    manageProductCategoriesUseCase.findById(categoryId),
    manageProductCategoriesUseCase.findAll(),
  ]);
  if (!category) {
    adminRespond(req, res, 'error', { pageName: 'Not Found', error: 'Category not found' });
    return;
  }
  adminRespond(req, res, 'products/categories/form', {
    pageName: `Edit Category: ${category.name}`,
    category,
    categories: categories.filter(c => c.productCategoryId !== categoryId),
    formData: category,
  });
};

export const updateProductCategory = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  try {
    const { categoryId } = req.params;
    const body = req.body as {
      name?: string;
      slug?: string;
      description?: string;
      parentId?: string;
      position: string;
      isActive?: string;
      imageUrl?: string;
      metaTitle?: string;
      metaDescription?: string;
    };
    const { name, slug, description, parentId, position, isActive, imageUrl, metaTitle, metaDescription } = body;
    await manageProductCategoriesUseCase.update(categoryId, {
      name,
      slug,
      description: description || null,
      parentId: parentId || null,
      position: parseInt(position) || 0,
      isActive: isActive !== 'false',
      imageUrl: imageUrl || null,
      metaTitle: metaTitle || null,
      metaDescription: metaDescription || null,
    });
    redirectResponse(res, '/admin/products/categories?success=Category updated successfully');
  } catch (error: unknown) {
    logger.warn('Error:', error);
    redirectResponse(
      res,
      '/admin/products/categories?error=' + encodeURIComponent((error as Error).message || 'Failed to update category'),
    );
  }
};

export const deleteProductCategory = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  try {
    const { categoryId } = req.params;
    await manageProductCategoriesUseCase.softDelete(categoryId);
    redirectResponse(res, '/admin/products/categories?success=Category deleted successfully');
  } catch (error: unknown) {
    logger.warn('Error:', error);
    redirectResponse(
      res,
      '/admin/products/categories?error=' + encodeURIComponent((error as Error).message || 'Failed to delete category'),
    );
  }
};

// ============================================================================
// Product Tags
// ============================================================================

export const listProductTags = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const tags = await manageProductTagsUseCase.findAll();
  adminRespond(req, res, 'products/tags/index', {
    pageName: 'Product Tags',
    tags,
    success: req.query.success || null,
  });
};

export const createProductTag = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  try {
    const body = req.body as { name: string; slug?: string; description?: string };
    const { name, slug, description } = body;
    await manageProductTagsUseCase.create({
      name,
      slug: slug || name.toLowerCase().replace(/\s+/g, '-'),
      description: description || null,
    });
    redirectResponse(res, '/admin/products/tags?success=Tag created successfully');
  } catch (error: unknown) {
    logger.warn('Error:', error);
    redirectResponse(res, '/admin/products/tags?error=' + encodeURIComponent((error as Error).message || 'Failed to create tag'));
  }
};

export const deleteProductTag = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  try {
    const { tagId } = req.params;
    await manageProductTagsUseCase.softDelete(tagId);
    redirectResponse(res, '/admin/products/tags?success=Tag deleted successfully');
  } catch (error: unknown) {
    logger.warn('Error:', error);
    redirectResponse(res, '/admin/products/tags?error=' + encodeURIComponent((error as Error).message || 'Failed to delete tag'));
  }
};

// ============================================================================
// Product Q&A
// ============================================================================

export const listProductQa = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { productId } = req.params;
  const qaList = await manageProductQaUseCase.findByProduct(productId);
  renderResponse(res, 'admin/views/products/partials/qa', { qaList, productId });
};

export const updateQaStatus = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  try {
    const { productId, qaId } = req.params;
    const body = req.body as { status: ProductQaStatus };
    const { status } = body;
    await manageProductQaUseCase.updateStatus(qaId, status);
    redirectResponse(res, `/admin/products/${productId}?success=Q%26A status updated`);
  } catch (error: unknown) {
    logger.warn('Error:', error);
    redirectResponse(
      res,
      `/admin/products/${req.params.productId}?error=` + encodeURIComponent((error as Error).message || 'Failed to update Q&A status'),
    );
  }
};

// ============================================================================
// Product Review Media
// ============================================================================

export const listReviewMedia = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { productId } = req.params;
  const mediaByReview = await manageReviewMediaUseCase.findMediaByProduct(productId);
  renderResponse(res, 'admin/views/products/partials/review-media', { mediaByReview, productId });
};

export const deleteReviewMedia = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  try {
    const { productId, mediaId } = req.params;
    await manageReviewMediaUseCase.deleteMedia(mediaId);
    redirectResponse(res, `/admin/products/${productId}?success=Media deleted`);
  } catch (error: unknown) {
    logger.warn('Error:', error);
    redirectResponse(
      res,
      `/admin/products/${req.params.productId}?error=` + encodeURIComponent((error as Error).message || 'Failed to delete media'),
    );
  }
};

// ============================================================================
// Product Prices
// ============================================================================

export const listProductPrices = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { productId } = req.params;
  const prices = await productPricingPort.listProductPrices(productId);
  renderResponse(res, 'admin/views/products/partials/prices', { prices, productId });
};

/**
 * Upserts a base price into the pricing-owned productBasePrice store.
 * Form amounts are major units (dollars); they are converted to integer cents here.
 */
export const upsertProductPrice = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  try {
    const { productId } = req.params;
    const body = req.body as {
      currencyCode: string;
      amount: string;
      saleAmount?: string;
      compareAtAmount?: string;
      costAmount?: string;
      productVariantId?: string;
    };
    const { currencyCode, amount, saleAmount, compareAtAmount, costAmount, productVariantId } = body;

    const priceCents = Math.round(parseFloat(amount) * 100);
    if (!Number.isInteger(priceCents) || priceCents < 0) {
      throw new Error('A non-negative price is required');
    }

    await productPricingPort.setBasePrice({
      productId,
      productVariantId: productVariantId || null,
      currencyCode: (currencyCode || 'USD').toUpperCase(),
      priceCents,
      salePriceCents: saleAmount ? Math.round(parseFloat(saleAmount) * 100) : null,
      compareAtPriceCents: compareAtAmount ? Math.round(parseFloat(compareAtAmount) * 100) : null,
      costPriceCents: costAmount ? Math.round(parseFloat(costAmount) * 100) : null,
    });
    redirectResponse(res, `/admin/products/${productId}?success=Price saved`);
  } catch (error: unknown) {
    logger.warn('Error:', error);
    redirectResponse(
      res,
      `/admin/products/${req.params.productId}?error=` + encodeURIComponent((error as Error).message || 'Failed to save price'),
    );
  }
};

/**
 * Update a variant's inventory policy from the product admin screen.
 * POST /admin/products/:productId/variants/:variantId/inventory-policy
 */
export const updateVariantInventoryPolicy = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { productId, variantId } = req.params;
  try {
    const { inventoryPolicy } = req.body as HttpRequestBody as { inventoryPolicy?: string };
    if (!['tracked', 'unlimited', 'backorderable'].includes(inventoryPolicy || '')) {
      throw new Error('inventoryPolicy must be tracked, unlimited, or backorderable');
    }
    await updateVariantInventoryPolicyUseCase.execute(
      new UpdateVariantInventoryPolicyCommand(variantId, inventoryPolicy as InventoryPolicy),
    );
    redirectResponse(res, `/admin/products/${productId}/edit?success=` + encodeURIComponent('Variant inventory policy updated'));
  } catch (error: unknown) {
    logger.warn('Error updating variant inventory policy:', error);
    redirectResponse(res, `/admin/products/${productId}/edit?error=` + encodeURIComponent((error as Error).message));
  }
};
