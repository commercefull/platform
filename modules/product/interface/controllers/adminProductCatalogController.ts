import { redirectResponse, renderResponse } from 'libs/apiResponse';
/**
 * Product catalog controllers for Admin Hub — categories, tags, Q&A,
 * review media, prices, and variant inventory policy.
 */

import { logger } from '../../../../libs/logger';
import type { HttpRequest, HttpRequestBody, HttpResponse } from 'libs/http';
import type { ProductQaStatus } from '../../domain/repositories/ProductCatalogPorts';
import {
  manageProductCategoriesUseCase,
  manageProductTagsUseCase,
  manageProductQaUseCase,
  manageReviewMediaUseCase,
  productPricingPort,
  updateVariantInventoryPolicyUseCase,
} from '../../application/useCases/wired';
import { UpdateVariantInventoryPolicyCommand } from '../../application/useCases/UpdateVariantInventoryPolicy';
import type { InventoryPolicy } from '../../domain/entities/ProductVariant';
import { adminRespond } from '../../../../libs/adminRespond';

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
