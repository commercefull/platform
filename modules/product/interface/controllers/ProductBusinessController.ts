/**
 * Product Business Controller
 * HTTP interface for business/admin product operations
 */

import { logger } from '../../../../libs/logger';
import { Response } from 'express';
import { TypedRequest } from 'libs/types/express';
import ProductRepo from '../../infrastructure/repositories/ProductRepository';
import { CreateProductCommand, CreateProductUseCase } from '../../application/useCases/CreateProduct';
import { GetProductCommand, GetProductUseCase } from '../../application/useCases/GetProduct';
import { ListProductsCommand, ListProductsUseCase } from '../../application/useCases/ListProducts';
import { UpdateProductCommand, UpdateProductUseCase } from '../../application/useCases/UpdateProduct';
import { ProductStatus } from '../../domain/valueObjects/ProductStatus';
import { ProductVisibility } from '../../domain/valueObjects/ProductVisibility';
import productVariantRepo from '../../infrastructure/repositories/productVariantRepo';
import productImageRepo from '../../infrastructure/repositories/productImageRepo';
import productReviewRepo from '../../infrastructure/repositories/productReviewRepo';

// ============================================================================
// Content Negotiation Helpers
// ============================================================================

function respond(req: TypedRequest, res: Response, data: any, statusCode: number = 200, htmlTemplate?: string): void {
  const acceptHeader = req.get('Accept') || 'application/json';
  if (acceptHeader.includes('text/html') && htmlTemplate) {
    res.status(statusCode).render(htmlTemplate, { data, success: true });
  } else {
    res.status(statusCode).json({ success: true, data });
  }
}

function respondError(req: TypedRequest, res: Response, message: string, statusCode: number = 500, htmlTemplate?: string): void {
  const acceptHeader = req.get('Accept') || 'application/json';
  if (acceptHeader.includes('text/html') && htmlTemplate) {
    res.status(statusCode).render(htmlTemplate, { error: message, success: false });
  } else {
    res.status(statusCode).json({ success: false, error: message });
  }
}

// ============================================================================
// Controller Actions
// ============================================================================

/**
 * List all products (admin)
 * GET /products
 */
export const listProducts = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const { status, visibility, categoryId, brandId, merchantId, search, limit, offset, orderBy, orderDirection } = req.query;

    const filters: any = {};
    if (status) filters.status = status as ProductStatus;
    if (visibility) filters.visibility = visibility as ProductVisibility;
    if (categoryId) filters.categoryId = categoryId as string;
    if (brandId) filters.brandId = brandId as string;
    if (merchantId) filters.merchantId = merchantId as string;
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

    respond(req, res, result, 200, 'admin/product/list');
  } catch (error: any) {
    logger.error('Error:', error);

    respondError(req, res, error.message || 'Failed to list products', 500, 'admin/product/error');
  }
};

/**
 * Get product details (admin)
 * GET /products/:productId
 */
export const getProduct = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const { productId } = req.params;

    const command = new GetProductCommand(productId, undefined, undefined, true, true);
    const useCase = new GetProductUseCase(ProductRepo);
    const product = await useCase.execute(command);

    if (!product) {
      respondError(req, res, 'Product not found', 404, 'admin/product/error');
      return;
    }

    respond(req, res, product, 200, 'admin/product/detail');
  } catch (error: any) {
    logger.error('Error:', error);

    respondError(req, res, error.message || 'Failed to get product', 500, 'admin/product/error');
  }
};

/**
 * Create a new product
 * POST /products
 */
export const createProduct = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const merchantId = req.user?.merchantId;
    const {
      name,
      description,
      productTypeId,
      sku,
      slug,
      shortDescription,
      categoryId,
      brandId,
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
    } = req.body;

    if (!name?.trim()) {
      respondError(req, res, 'Product name is required', 400, 'admin/product/error');
      return;
    }
    if (!productTypeId) {
      respondError(req, res, 'Product type is required', 400, 'admin/product/error');
      return;
    }

    const command = new CreateProductCommand(
      name,
      description || '',
      productTypeId,
      sku,
      slug,
      shortDescription,
      categoryId,
      brandId,
      merchantId,
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

    respond(req, res, product, 201, 'admin/product/created');
  } catch (error: any) {
    logger.error('Error:', error);

    respondError(req, res, error.message || 'Failed to create product', 500, 'admin/product/error');
  }
};

/**
 * Update a product
 * PUT /products/:productId
 */
export const updateProduct = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const { productId } = req.params;
    const updates = req.body;

    const command = new UpdateProductCommand(productId, updates);
    const useCase = new UpdateProductUseCase(ProductRepo);
    const result = await useCase.execute(command);

    respond(req, res, result, 200, 'admin/product/updated');
  } catch (error: any) {
    logger.error('Error:', error);

    if (error.message.includes('not found')) {
      respondError(req, res, error.message, 404, 'admin/product/error');
      return;
    }
    respondError(req, res, error.message || 'Failed to update product', 500, 'admin/product/error');
  }
};

/**
 * Update product status
 * PUT /products/:productId/status
 */
export const updateProductStatus = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const { productId } = req.params;
    const { status } = req.body;

    const validStatuses = Object.values(ProductStatus);
    if (!validStatuses.includes(status)) {
      respondError(req, res, `Invalid status. Must be one of: ${validStatuses.join(', ')}`, 400, 'admin/product/error');
      return;
    }

    const product = await ProductRepo.findById(productId);
    if (!product) {
      respondError(req, res, 'Product not found', 404, 'admin/product/error');
      return;
    }

    product.updateStatus(status);
    await ProductRepo.save(product);

    respond(req, res, { productId, status: product.status, updatedAt: product.updatedAt.toISOString() }, 200, 'admin/product/updated');
  } catch (error: any) {
    logger.error('Error:', error);

    respondError(req, res, error.message || 'Failed to update product status', 500, 'admin/product/error');
  }
};

/**
 * Update product visibility
 * PUT /products/:productId/visibility
 */
export const updateProductVisibility = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const { productId } = req.params;
    const { visibility } = req.body;

    const validVisibilities = Object.values(ProductVisibility);
    if (!validVisibilities.includes(visibility)) {
      respondError(req, res, `Invalid visibility. Must be one of: ${validVisibilities.join(', ')}`, 400, 'admin/product/error');
      return;
    }

    const product = await ProductRepo.findById(productId);
    if (!product) {
      respondError(req, res, 'Product not found', 404, 'admin/product/error');
      return;
    }

    product.updateVisibility(visibility);
    await ProductRepo.save(product);

    respond(
      req,
      res,
      { productId, visibility: product.visibility, updatedAt: product.updatedAt.toISOString() },
      200,
      'admin/product/updated',
    );
  } catch (error: any) {
    logger.error('Error:', error);

    respondError(req, res, error.message || 'Failed to update product visibility', 500, 'admin/product/error');
  }
};

/**
 * Delete a product
 * DELETE /products/:productId
 */
export const deleteProduct = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const { productId } = req.params;
    const { permanent } = req.query;

    const product = await ProductRepo.findById(productId);
    if (!product) {
      respondError(req, res, 'Product not found', 404, 'admin/product/error');
      return;
    }

    if (permanent === 'true') {
      await ProductRepo.hardDelete(productId);
    } else {
      await ProductRepo.delete(productId);
    }

    respond(req, res, { productId, deleted: true, permanent: permanent === 'true' }, 200, 'admin/product/deleted');
  } catch (error: any) {
    logger.error('Error:', error);

    respondError(req, res, error.message || 'Failed to delete product', 500, 'admin/product/error');
  }
};

/**
 * Publish a product
 * POST /products/:productId/publish
 */
export const publishProduct = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const { productId } = req.params;

    const product = await ProductRepo.findById(productId);
    if (!product) {
      respondError(req, res, 'Product not found', 404, 'admin/product/error');
      return;
    }

    product.publish();
    await ProductRepo.save(product);

    respond(
      req,
      res,
      { productId, status: product.status, visibility: product.visibility, publishedAt: product.publishedAt?.toISOString() },
      200,
      'admin/product/published',
    );
  } catch (error: any) {
    logger.error('Error:', error);

    respondError(req, res, error.message || 'Failed to publish product', 500, 'admin/product/error');
  }
};

/**
 * Unpublish a product
 * POST /products/:productId/unpublish
 */
export const unpublishProduct = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const { productId } = req.params;

    const product = await ProductRepo.findById(productId);
    if (!product) {
      respondError(req, res, 'Product not found', 404, 'admin/product/error');
      return;
    }

    product.unpublish();
    await ProductRepo.save(product);

    respond(
      req,
      res,
      { productId, visibility: product.visibility, updatedAt: product.updatedAt.toISOString() },
      200,
      'admin/product/unpublished',
    );
  } catch (error: any) {
    logger.error('Error:', error);

    respondError(req, res, error.message || 'Failed to unpublish product', 500, 'admin/product/error');
  }
};

// ============================================================================
// Variant Management
// ============================================================================

export const getProductVariants = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const variants = await productVariantRepo.findByProductId(req.params.productId);
    respond(req, res, variants);
  } catch (error: any) {
    logger.error('Error:', error);
    respondError(req, res, error.message || 'Failed to get variants');
  }
};

export const getProductVariant = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const variant = await productVariantRepo.findById(req.params.variantId);
    if (!variant) {
      respondError(req, res, 'Variant not found', 404);
      return;
    }
    respond(req, res, variant);
  } catch (error: any) {
    logger.error('Error:', error);
    respondError(req, res, error.message || 'Failed to get variant');
  }
};

export const createProductVariant = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const variant = await productVariantRepo.create({
      productId: req.params.productId,
      ...req.body,
    });
    respond(req, res, variant, 201);
  } catch (error: any) {
    logger.error('Error:', error);
    respondError(req, res, error.message || 'Failed to create variant', 400);
  }
};

export const updateProductVariant = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const variant = await productVariantRepo.update(req.params.variantId, req.body);
    respond(req, res, variant);
  } catch (error: any) {
    logger.error('Error:', error);
    respondError(req, res, error.message || 'Failed to update variant', 400);
  }
};

export const deleteProductVariant = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    await productVariantRepo.delete(req.params.variantId);
    respond(req, res, { deleted: true });
  } catch (error: any) {
    logger.error('Error:', error);
    respondError(req, res, error.message || 'Failed to delete variant');
  }
};

// ============================================================================
// Image Management
// ============================================================================

export const getProductImages = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const images = await productImageRepo.findByProductId(req.params.productId);
    respond(req, res, images);
  } catch (error: any) {
    logger.error('Error:', error);
    respondError(req, res, error.message || 'Failed to get images');
  }
};

export const addProductImage = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const image = await productImageRepo.create({
      productId: req.params.productId,
      ...req.body,
    });
    respond(req, res, image, 201);
  } catch (error: any) {
    logger.error('Error:', error);
    respondError(req, res, error.message || 'Failed to add image', 400);
  }
};

export const updateProductImage = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const image = await productImageRepo.update(req.params.imageId, req.body);
    respond(req, res, image);
  } catch (error: any) {
    logger.error('Error:', error);
    respondError(req, res, error.message || 'Failed to update image', 400);
  }
};

export const deleteProductImage = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    await productImageRepo.delete(req.params.imageId);
    respond(req, res, { deleted: true });
  } catch (error: any) {
    logger.error('Error:', error);
    respondError(req, res, error.message || 'Failed to delete image');
  }
};

export const reorderProductImages = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const { imageIds } = req.body;
    if (!Array.isArray(imageIds)) {
      respondError(req, res, 'imageIds must be an array', 400);
      return;
    }
    await productImageRepo.reorder(req.params.productId, imageIds);
    respond(req, res, { reordered: true });
  } catch (error: any) {
    logger.error('Error:', error);
    respondError(req, res, error.message || 'Failed to reorder images');
  }
};

// ============================================================================
// Review Management (Admin)
// ============================================================================

export const listReviews = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const { productId, status, limit, offset } = req.query;
    const filters: any = {};
    if (productId) filters.productId = productId as string;
    if (status) filters.status = status as string;
    const reviews = await productReviewRepo.findWithFilters(
      filters,
      parseInt(limit as string) || 50,
      parseInt(offset as string) || 0,
    );
    respond(req, res, reviews);
  } catch (error: any) {
    logger.error('Error:', error);
    respondError(req, res, error.message || 'Failed to list reviews');
  }
};

export const getReview = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const review = await productReviewRepo.findById(req.params.reviewId);
    if (!review) {
      respondError(req, res, 'Review not found', 404);
      return;
    }
    respond(req, res, review);
  } catch (error: any) {
    logger.error('Error:', error);
    respondError(req, res, error.message || 'Failed to get review');
  }
};

export const approveReview = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const review = await productReviewRepo.approve(req.params.reviewId);
    if (!review) {
      respondError(req, res, 'Review not found', 404);
      return;
    }
    respond(req, res, review);
  } catch (error: any) {
    logger.error('Error:', error);
    respondError(req, res, error.message || 'Failed to approve review');
  }
};

export const rejectReview = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const review = await productReviewRepo.reject(req.params.reviewId);
    if (!review) {
      respondError(req, res, 'Review not found', 404);
      return;
    }
    respond(req, res, review);
  } catch (error: any) {
    logger.error('Error:', error);
    respondError(req, res, error.message || 'Failed to reject review');
  }
};

export const respondToReview = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const { response } = req.body;
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
  } catch (error: any) {
    logger.error('Error:', error);
    respondError(req, res, error.message || 'Failed to respond to review');
  }
};

export const deleteReview = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    await productReviewRepo.delete(req.params.reviewId);
    respond(req, res, { deleted: true });
  } catch (error: any) {
    logger.error('Error:', error);
    respondError(req, res, error.message || 'Failed to delete review');
  }
};
