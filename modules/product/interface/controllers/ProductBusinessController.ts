/**
 * Product Business Controller
 * HTTP interface for business/admin product operations
 */

import { logger } from '../../../../libs/logger';
import { Request, Response } from 'express';
import ProductRepo from '../../infrastructure/repositories/ProductRepository';
import { CreateProductCommand, CreateProductUseCase } from '../../application/useCases/CreateProduct';
import { GetProductCommand, GetProductUseCase } from '../../application/useCases/GetProduct';
import { ListProductsCommand, ListProductsUseCase } from '../../application/useCases/ListProducts';
import { UpdateProductCommand, UpdateProductUseCase } from '../../application/useCases/UpdateProduct';
import { ProductStatus } from '../../domain/valueObjects/ProductStatus';
import { ProductVisibility } from '../../domain/valueObjects/ProductVisibility';

// ============================================================================
// Content Negotiation Helpers
// ============================================================================

function respond(req: Request, res: Response, data: any, statusCode: number = 200, htmlTemplate?: string): void {
  const acceptHeader = req.get('Accept') || 'application/json';
  if (acceptHeader.includes('text/html') && htmlTemplate) {
    res.status(statusCode).render(htmlTemplate, { data, success: true });
  } else {
    res.status(statusCode).json({ success: true, data });
  }
}

function respondError(req: Request, res: Response, message: string, statusCode: number = 500, htmlTemplate?: string): void {
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
export const listProducts = async (req: Request, res: Response): Promise<void> => {
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
export const getProduct = async (req: Request, res: Response): Promise<void> => {
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
export const createProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const merchantId = (req as any).user?.merchantId;
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
export const updateProduct = async (req: Request, res: Response): Promise<void> => {
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
export const updateProductStatus = async (req: Request, res: Response): Promise<void> => {
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
export const updateProductVisibility = async (req: Request, res: Response): Promise<void> => {
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
export const deleteProduct = async (req: Request, res: Response): Promise<void> => {
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
export const publishProduct = async (req: Request, res: Response): Promise<void> => {
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
export const unpublishProduct = async (req: Request, res: Response): Promise<void> => {
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
