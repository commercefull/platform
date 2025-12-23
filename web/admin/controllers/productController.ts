/**
 * Product Controller for Admin Hub
 * Uses product use cases directly from modules - no HTTP API calls
 */

import { Request, Response } from 'express';
import ProductRepo from '../../../modules/product/infrastructure/repositories/ProductRepository';
import { ListProductsCommand, ListProductsUseCase } from '../../../modules/product/application/useCases/ListProducts';
import { CreateProductCommand, CreateProductUseCase } from '../../../modules/product/application/useCases/CreateProduct';
import { GetProductCommand, GetProductUseCase } from '../../../modules/product/application/useCases/GetProduct';
import { UpdateProductCommand, UpdateProductUseCase } from '../../../modules/product/application/useCases/UpdateProduct';
import { ProductStatus } from '../../../modules/product/domain/valueObjects/ProductStatus';
import { ProductVisibility } from '../../../modules/product/domain/valueObjects/ProductVisibility';

// ============================================================================
// List Products
// ============================================================================

export const listProducts = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, visibility, categoryId, search, limit, offset, orderBy, orderDirection } = req.query;

    const filters: any = {};
    if (status) filters.status = status as ProductStatus;
    if (visibility) filters.visibility = visibility as ProductVisibility;
    if (categoryId) filters.categoryId = categoryId as string;
    if (search) filters.search = search as string;

    const command = new ListProductsCommand(
      Object.keys(filters).length > 0 ? filters : undefined,
      parseInt(limit as string) || 50,
      parseInt(offset as string) || 0,
      (orderBy as string) || 'createdAt',
      (orderDirection as 'asc' | 'desc') || 'desc'
    );

    const useCase = new ListProductsUseCase(ProductRepo);
    const result = await useCase.execute(command);

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
        hasMore: result.hasMore
      },
      filters: {
        status: status || '',
        visibility: visibility || '',
        categoryId: categoryId || '',
        search: search || '',
        orderBy: orderBy || 'createdAt',
        orderDirection: orderDirection || 'desc'
      },
      
      success: req.query.success || null
    });
  } catch (error: any) {
    console.error('Error listing products:', error);
    adminRespond(req, res, 'error', {
      pageName: 'Error',
      error: error.message || 'Failed to load products',
    });
  }
};

// ============================================================================
// View Product
// ============================================================================

export const viewProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const { productId } = req.params;

    const command = new GetProductCommand(productId, undefined, undefined, true, true);
    const useCase = new GetProductUseCase(ProductRepo);
    const product = await useCase.execute(command);

    if (!product) {
      adminRespond(req, res, 'error', {
        pageName: 'Not Found',
        error: 'Product not found',
      });
      return;
    }

    adminRespond(req, res, 'products/view', {
      pageName: `Product: ${product.name}`,
      product,
      
      success: req.query.success || null
    });
  } catch (error: any) {
    console.error('Error viewing product:', error);
    adminRespond(req, res, 'error', {
      pageName: 'Error',
      error: error.message || 'Failed to load product',
    });
  }
};

// ============================================================================
// Create Product Form
// ============================================================================

export const createProductForm = async (req: Request, res: Response): Promise<void> => {
  try {
    // TODO: Fetch product types, categories, attributes using their respective use cases
    // For now, we'll pass empty arrays - these will be populated when we create the use cases
    adminRespond(req, res, 'products/create', {
      pageName: 'Create Product',
      productTypes: [],
      categories: [],
      attributes: [],
      
      formData: {}
    });
  } catch (error: any) {
    console.error('Error loading create product form:', error);
    adminRespond(req, res, 'error', {
      pageName: 'Error',
      error: error.message || 'Failed to load form',
    });
  }
};

// ============================================================================
// Create Product
// ============================================================================

export const createProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const merchantId = (req as any).user?.merchantId;
    const {
      name, description, productTypeId, sku, slug, shortDescription, categoryId, brandId,
      basePrice, salePrice, cost, currencyCode, weight, weightUnit, length, width, height,
      dimensionUnit, isFeatured, isVirtual, isDownloadable, isSubscription, isTaxable,
      taxClass, metaTitle, metaDescription, metaKeywords, tags, metadata
    } = req.body;

    if (!name?.trim()) {
      adminRespond(req, res, 'products/create', {
        pageName: 'Create Product',
        error: 'Product name is required',
        formData: req.body,
        productTypes: [],
        categories: [],
        attributes: [],
      });
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
      parseFloat(basePrice) || 0,
      salePrice ? parseFloat(salePrice) : undefined,
      cost ? parseFloat(cost) : undefined,
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
      metadata
    );

    const useCase = new CreateProductUseCase(ProductRepo);
    const product = await useCase.execute(command);

    res.redirect(`/hub/products/${product.productId}?success=Product created successfully`);
  } catch (error: any) {
    console.error('Error creating product:', error);
    adminRespond(req, res, 'products/create', {
      pageName: 'Create Product',
      error: error.message || 'Failed to create product',
      formData: req.body,
      productTypes: [],
      categories: [],
      attributes: [],
    });
  }
};

// ============================================================================
// Edit Product Form
// ============================================================================

export const editProductForm = async (req: Request, res: Response): Promise<void> => {
  try {
    const { productId } = req.params;

    const command = new GetProductCommand(productId, undefined, undefined, true, true);
    const useCase = new GetProductUseCase(ProductRepo);
    const product = await useCase.execute(command);

    if (!product) {
      adminRespond(req, res, 'error', {
        pageName: 'Not Found',
        error: 'Product not found',
      });
      return;
    }

    adminRespond(req, res, 'products/edit', {
      pageName: `Edit: ${product.name}`,
      product,
      productTypes: [],
      categories: [],
      attributes: [],
    });
  } catch (error: any) {
    console.error('Error loading edit product form:', error);
    adminRespond(req, res, 'error', {
      pageName: 'Error',
      error: error.message || 'Failed to load form',
    });
  }
};

// ============================================================================
// Update Product
// ============================================================================

export const updateProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const { productId } = req.params;
    const updates = req.body;

    const command = new UpdateProductCommand(productId, updates);
    const useCase = new UpdateProductUseCase(ProductRepo);
    await useCase.execute(command);

    res.redirect(`/hub/products/${productId}?success=Product updated successfully`);
  } catch (error: any) {
    console.error('Error updating product:', error);
    
    // Reload product and show error
    try {
      const getCommand = new GetProductCommand(req.params.productId);
      const getUseCase = new GetProductUseCase(ProductRepo);
      const product = await getUseCase.execute(getCommand);

      adminRespond(req, res, 'products/edit', {
        pageName: `Edit: ${product?.name || 'Product'}`,
        product,
        error: error.message || 'Failed to update product',
        productTypes: [],
        categories: [],
        attributes: [],
      });
    } catch {
      adminRespond(req, res, 'error', {
        pageName: 'Error',
        error: error.message || 'Failed to update product',
      });
    }
  }
};

// ============================================================================
// Delete Product (AJAX)
// ============================================================================

export const deleteProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const { productId } = req.params;
    const { permanent } = req.query;

    const product = await ProductRepo.findById(productId);
    if (!product) {
      res.status(404).json({ success: false, message: 'Product not found' });
      return;
    }

    if (permanent === 'true') {
      await ProductRepo.hardDelete(productId);
    } else {
      await ProductRepo.delete(productId);
    }

    res.json({ success: true, message: 'Product deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting product:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to delete product' });
  }
};

// ============================================================================
// Update Product Status (AJAX)
// ============================================================================

export const updateProductStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { productId } = req.params;
    const { status } = req.body;

    const validStatuses = Object.values(ProductStatus);
    if (!validStatuses.includes(status)) {
      res.status(400).json({ success: false, message: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
      return;
    }

    const product = await ProductRepo.findById(productId);
    if (!product) {
      res.status(404).json({ success: false, message: 'Product not found' });
      return;
    }

    product.updateStatus(status);
    await ProductRepo.save(product);

    res.json({ success: true, message: 'Status updated', data: { status: product.status } });
  } catch (error: any) {
    console.error('Error updating product status:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to update status' });
  }
};

// ============================================================================
// Publish Product (AJAX)
// ============================================================================

export const publishProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const { productId } = req.params;

    const product = await ProductRepo.findById(productId);
    if (!product) {
      res.status(404).json({ success: false, message: 'Product not found' });
      return;
    }

    product.publish();
    await ProductRepo.save(product);

    res.json({ success: true, message: 'Product published' });
  } catch (error: any) {
    console.error('Error publishing product:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to publish product' });
  }
};

// ============================================================================
// Unpublish Product (AJAX)
// ============================================================================

export const unpublishProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const { productId } = req.params;

    const product = await ProductRepo.findById(productId);
    if (!product) {
      res.status(404).json({ success: false, message: 'Product not found' });
      return;
    }

    product.unpublish();
    await ProductRepo.save(product);

    res.json({ success: true, message: 'Product unpublished' });
  } catch (error: any) {
    console.error('Error unpublishing product:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to unpublish product' });
  }
};
