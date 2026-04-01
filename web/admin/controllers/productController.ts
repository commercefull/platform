/**
 * Product Controller for Admin Hub
 * Uses product use cases directly from modules - no HTTP API calls
 */

import { logger } from '../../../libs/logger';
import { Response } from 'express';
import { TypedRequest } from 'libs/types/express';;
import ProductRepo from '../../../modules/product/infrastructure/repositories/ProductRepository';
import { ListProductsCommand, ListProductsUseCase } from '../../../modules/product/application/useCases/ListProducts';
import { CreateProductCommand, CreateProductUseCase } from '../../../modules/product/application/useCases/CreateProduct';
import { GetProductCommand, GetProductUseCase } from '../../../modules/product/application/useCases/GetProduct';
import { UpdateProductCommand, UpdateProductUseCase } from '../../../modules/product/application/useCases/UpdateProduct';
import { ProductStatus } from '../../../modules/product/domain/valueObjects/ProductStatus';
import { ProductVisibility } from '../../../modules/product/domain/valueObjects/ProductVisibility';
import { adminRespond } from '../../respond';
import productTypeRepo from '../../../modules/product/infrastructure/repositories/ProductTypeRepository';
import categoryRepo from '../../../modules/product/infrastructure/repositories/categoryRepo';
import brandRepository from '../../../modules/brand/infrastructure/repositories/BrandRepository';
import dynamicAttributeRepo from '../../../modules/product/infrastructure/repositories/DynamicAttributeRepository';
import productReviewRepo from '../../../modules/product/infrastructure/repositories/productReviewRepo';
import productImageRepo from '../../../modules/product/infrastructure/repositories/productImageRepo';

// ============================================================================
// List Products
// ============================================================================

export const listProducts = async (req: TypedRequest, res: Response): Promise<void> => {
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
      (orderDirection as 'asc' | 'desc') || 'desc',
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
  } catch (error: any) {
    logger.error('Error:', error);

    adminRespond(req, res, 'error', {
      pageName: 'Error',
      error: error.message || 'Failed to load products',
    });
  }
};

// ============================================================================
// View Product
// ============================================================================

export const viewProduct = async (req: TypedRequest, res: Response): Promise<void> => {
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

    // Load additional rich data in parallel
    const [productAttributes, reviewStats, productType, category, brand] = await Promise.all([
      dynamicAttributeRepo.getProductAttributes(productId).catch(() => []),
      productReviewRepo.getProductStatistics(productId).catch(() => ({ totalReviews: 0, averageRating: 0, distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }, verifiedPurchaseCount: 0 })),
      product.productTypeId ? productTypeRepo.findById(product.productTypeId).catch(() => null) : Promise.resolve(null),
      product.categoryId ? categoryRepo.findOne(product.categoryId).catch(() => null) : Promise.resolve(null),
      product.brandId ? brandRepository.findById(product.brandId).catch(() => null) : Promise.resolve(null),
    ]);

    adminRespond(req, res, 'products/view', {
      pageName: `Product: ${product.name}`,
      product,
      productAttributes,
      reviewStats,
      productTypeName: productType?.name || null,
      categoryName: category?.name || null,
      brandName: brand ? brand.name : null,
      success: req.query.success || null,
    });
  } catch (error: any) {
    logger.error('Error:', error);

    adminRespond(req, res, 'error', {
      pageName: 'Error',
      error: error.message || 'Failed to load product',
    });
  }
};

// ============================================================================
// Create Product Form
// ============================================================================

export const createProductForm = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const [productTypes, categories, brandsResult] = await Promise.all([
      productTypeRepo.findAll(),
      categoryRepo.findActive(),
      brandRepository.findAll({ isActive: true }),
    ]);

    adminRespond(req, res, 'products/create', {
      pageName: 'Create Product',
      productTypes,
      categories,
      brands: brandsResult.data || [],
      attributes: [],

      formData: {},
    });
  } catch (error: any) {
    logger.error('Error:', error);

    adminRespond(req, res, 'error', {
      pageName: 'Error',
      error: error.message || 'Failed to load form',
    });
  }
};

// ============================================================================
// Create Product
// ============================================================================

export const createProduct = async (req: TypedRequest, res: Response): Promise<void> => {
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
      const [productTypes, categories, brandsResult] = await Promise.all([
        productTypeRepo.findAll(),
        categoryRepo.findActive(),
        brandRepository.findAll({ isActive: true }),
      ]);
      adminRespond(req, res, 'products/create', {
        pageName: 'Create Product',
        error: 'Product name is required',
        formData: req.body,
        productTypes,
        categories,
        brands: brandsResult.data || [],
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
      metadata,
    );

    const useCase = new CreateProductUseCase(ProductRepo);
    const product = await useCase.execute(command);

    res.redirect(`/admin/products/${product.productId}?success=Product created successfully`);
  } catch (error: any) {
    logger.error('Error:', error);

    const [productTypes, categories, brandsResult] = await Promise.all([
      productTypeRepo.findAll().catch(() => []),
      categoryRepo.findActive().catch(() => []),
      brandRepository.findAll({ isActive: true }).catch(() => ({ data: [] })),
    ]);
    adminRespond(req, res, 'products/create', {
      pageName: 'Create Product',
      error: error.message || 'Failed to create product',
      formData: req.body,
      productTypes,
      categories,
      brands: (brandsResult as any).data || brandsResult || [],
      attributes: [],
    });
  }
};

// ============================================================================
// Edit Product Form
// ============================================================================

export const editProductForm = async (req: TypedRequest, res: Response): Promise<void> => {
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

    const [productTypes, categories, brandsResult, productAttributes, allAttributes] = await Promise.all([
      productTypeRepo.findAll(),
      categoryRepo.findActive(),
      brandRepository.findAll({ isActive: true }),
      dynamicAttributeRepo.getProductAttributes(productId).catch(() => []),
      dynamicAttributeRepo.findAllAttributes().catch(() => []),
    ]);

    adminRespond(req, res, 'products/edit', {
      pageName: `Edit: ${product.name}`,
      product,
      productTypes,
      categories,
      brands: brandsResult.data || [],
      productAttributes,
      allAttributes,
    });
  } catch (error: any) {
    logger.error('Error:', error);

    adminRespond(req, res, 'error', {
      pageName: 'Error',
      error: error.message || 'Failed to load form',
    });
  }
};

// ============================================================================
// Update Product
// ============================================================================

export const updateProduct = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const { productId } = req.params;
    const updates = req.body;

    const command = new UpdateProductCommand(productId, updates);
    const useCase = new UpdateProductUseCase(ProductRepo);
    await useCase.execute(command);

    res.redirect(`/admin/products/${productId}?success=Product updated successfully`);
  } catch (error: any) {
    logger.error('Error:', error);

    // Reload product and show error
    try {
      const getCommand = new GetProductCommand(req.params.productId);
      const getUseCase = new GetProductUseCase(ProductRepo);
      const product = await getUseCase.execute(getCommand);

      const [productTypes, categories, brandsResult] = await Promise.all([
        productTypeRepo.findAll().catch(() => []),
        categoryRepo.findActive().catch(() => []),
        brandRepository.findAll({ isActive: true }).catch(() => ({ data: [] })),
      ]);
      adminRespond(req, res, 'products/edit', {
        pageName: `Edit: ${product?.name || 'Product'}`,
        product,
        error: error.message || 'Failed to update product',
        productTypes,
        categories,
        brands: (brandsResult as any).data || brandsResult || [],
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

export const deleteProduct = async (req: TypedRequest, res: Response): Promise<void> => {
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
    logger.error('Error:', error);

    res.status(500).json({ success: false, message: error.message || 'Failed to delete product' });
  }
};

// ============================================================================
// Update Product Status (AJAX)
// ============================================================================

export const updateProductStatus = async (req: TypedRequest, res: Response): Promise<void> => {
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
    logger.error('Error:', error);

    res.status(500).json({ success: false, message: error.message || 'Failed to update status' });
  }
};

// ============================================================================
// Publish Product (AJAX)
// ============================================================================

export const publishProduct = async (req: TypedRequest, res: Response): Promise<void> => {
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
    logger.error('Error:', error);

    res.status(500).json({ success: false, message: error.message || 'Failed to publish product' });
  }
};

// ============================================================================
// Unpublish Product (AJAX)
// ============================================================================

export const unpublishProduct = async (req: TypedRequest, res: Response): Promise<void> => {
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
    logger.error('Error:', error);

    res.status(500).json({ success: false, message: error.message || 'Failed to unpublish product' });
  }
};

// ============================================================================
// Additional imports for new handlers
// ============================================================================
import productCategoryRepo from '../../../modules/product/infrastructure/repositories/productCategoryRepo';
import productTagRepo from '../../../modules/product/infrastructure/repositories/productTagRepo';
import productCollectionRepo from '../../../modules/product/infrastructure/repositories/productCollectionRepo';
import productQaRepo from '../../../modules/product/infrastructure/repositories/productQaRepo';
import productReviewMediaRepo from '../../../modules/product/infrastructure/repositories/productReviewMediaRepo';
import productPriceRepo from '../../../modules/product/infrastructure/repositories/productPriceRepo';

// ============================================================================
// Product Categories
// ============================================================================

export const listProductCategories = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const categories = await productCategoryRepo.findAll();
    adminRespond(req, res, 'products/categories/index', {
      pageName: 'Product Categories',
      categories,
      success: req.query.success || null,
    });
  } catch (error: any) {
    logger.error('Error:', error);
    adminRespond(req, res, 'error', { pageName: 'Error', error: error.message || 'Failed to load categories' });
  }
};

export const createProductCategoryForm = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const categories = await productCategoryRepo.findAll();
    adminRespond(req, res, 'products/categories/form', {
      pageName: 'Create Product Category',
      category: null,
      categories,
      formData: {},
    });
  } catch (error: any) {
    logger.error('Error:', error);
    adminRespond(req, res, 'error', { pageName: 'Error', error: error.message || 'Failed to load form' });
  }
};

export const createProductCategory = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const { name, slug, description, parentId, position, isActive, imageUrl, metaTitle, metaDescription } = req.body;
    await productCategoryRepo.create({
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
    res.redirect('/admin/products/categories?success=Category created successfully');
  } catch (error: any) {
    logger.error('Error:', error);
    res.redirect('/admin/products/categories?error=' + encodeURIComponent(error.message || 'Failed to create category'));
  }
};

export const editProductCategoryForm = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const { categoryId } = req.params;
    const [category, categories] = await Promise.all([
      productCategoryRepo.findById(categoryId),
      productCategoryRepo.findAll(),
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
  } catch (error: any) {
    logger.error('Error:', error);
    adminRespond(req, res, 'error', { pageName: 'Error', error: error.message || 'Failed to load form' });
  }
};

export const updateProductCategory = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const { categoryId } = req.params;
    const { name, slug, description, parentId, position, isActive, imageUrl, metaTitle, metaDescription } = req.body;
    await productCategoryRepo.update(categoryId, {
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
    res.redirect('/admin/products/categories?success=Category updated successfully');
  } catch (error: any) {
    logger.error('Error:', error);
    res.redirect('/admin/products/categories?error=' + encodeURIComponent(error.message || 'Failed to update category'));
  }
};

export const deleteProductCategory = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const { categoryId } = req.params;
    await productCategoryRepo.softDelete(categoryId);
    res.redirect('/admin/products/categories?success=Category deleted successfully');
  } catch (error: any) {
    logger.error('Error:', error);
    res.redirect('/admin/products/categories?error=' + encodeURIComponent(error.message || 'Failed to delete category'));
  }
};

// ============================================================================
// Product Tags
// ============================================================================

export const listProductTags = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const tags = await productTagRepo.findAll();
    adminRespond(req, res, 'products/tags/index', {
      pageName: 'Product Tags',
      tags,
      success: req.query.success || null,
    });
  } catch (error: any) {
    logger.error('Error:', error);
    adminRespond(req, res, 'error', { pageName: 'Error', error: error.message || 'Failed to load tags' });
  }
};

export const createProductTag = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const { name, slug, description } = req.body;
    await productTagRepo.create({
      name,
      slug: slug || name.toLowerCase().replace(/\s+/g, '-'),
      description: description || null,
    });
    res.redirect('/admin/products/tags?success=Tag created successfully');
  } catch (error: any) {
    logger.error('Error:', error);
    res.redirect('/admin/products/tags?error=' + encodeURIComponent(error.message || 'Failed to create tag'));
  }
};

export const deleteProductTag = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const { tagId } = req.params;
    await productTagRepo.softDelete(tagId);
    res.redirect('/admin/products/tags?success=Tag deleted successfully');
  } catch (error: any) {
    logger.error('Error:', error);
    res.redirect('/admin/products/tags?error=' + encodeURIComponent(error.message || 'Failed to delete tag'));
  }
};

// ============================================================================
// Product Collections
// ============================================================================

export const listProductCollections = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const collections = await productCollectionRepo.findAll();
    adminRespond(req, res, 'products/collections/index', {
      pageName: 'Product Collections',
      collections,
      success: req.query.success || null,
    });
  } catch (error: any) {
    logger.error('Error:', error);
    adminRespond(req, res, 'error', { pageName: 'Error', error: error.message || 'Failed to load collections' });
  }
};

export const createProductCollectionForm = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    adminRespond(req, res, 'products/collections/form', {
      pageName: 'Create Product Collection',
      collection: null,
      formData: {},
    });
  } catch (error: any) {
    logger.error('Error:', error);
    adminRespond(req, res, 'error', { pageName: 'Error', error: error.message || 'Failed to load form' });
  }
};

export const createProductCollection = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const { name, slug, description, imageUrl, isActive, position } = req.body;
    await productCollectionRepo.create({
      name,
      slug: slug || name.toLowerCase().replace(/\s+/g, '-'),
      description: description || null,
      imageUrl: imageUrl || null,
      isActive: isActive !== 'false',
      position: parseInt(position) || 0,
      merchantId: null,
    });
    res.redirect('/admin/products/collections?success=Collection created successfully');
  } catch (error: any) {
    logger.error('Error:', error);
    res.redirect('/admin/products/collections?error=' + encodeURIComponent(error.message || 'Failed to create collection'));
  }
};

export const editProductCollectionForm = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const { collectionId } = req.params;
    const collection = await productCollectionRepo.findById(collectionId);
    if (!collection) {
      adminRespond(req, res, 'error', { pageName: 'Not Found', error: 'Collection not found' });
      return;
    }
    adminRespond(req, res, 'products/collections/form', {
      pageName: `Edit Collection: ${collection.name}`,
      collection,
      formData: collection,
    });
  } catch (error: any) {
    logger.error('Error:', error);
    adminRespond(req, res, 'error', { pageName: 'Error', error: error.message || 'Failed to load form' });
  }
};

export const updateProductCollection = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const { collectionId } = req.params;
    const { name, slug, description, imageUrl, isActive, position } = req.body;
    await productCollectionRepo.update(collectionId, {
      name,
      slug,
      description: description || null,
      imageUrl: imageUrl || null,
      isActive: isActive !== 'false',
      position: parseInt(position) || 0,
    });
    res.redirect('/admin/products/collections?success=Collection updated successfully');
  } catch (error: any) {
    logger.error('Error:', error);
    res.redirect('/admin/products/collections?error=' + encodeURIComponent(error.message || 'Failed to update collection'));
  }
};

export const deleteProductCollection = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const { collectionId } = req.params;
    await productCollectionRepo.softDelete(collectionId);
    res.redirect('/admin/products/collections?success=Collection deleted successfully');
  } catch (error: any) {
    logger.error('Error:', error);
    res.redirect('/admin/products/collections?error=' + encodeURIComponent(error.message || 'Failed to delete collection'));
  }
};

// ============================================================================
// Product Q&A
// ============================================================================

export const listProductQa = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const { productId } = req.params;
    const qaList = await productQaRepo.findByProduct(productId);
    res.render('admin/views/products/partials/qa', { qaList, productId });
  } catch (error: any) {
    logger.error('Error:', error);
    res.status(500).send(error.message || 'Failed to load Q&A');
  }
};

export const updateQaStatus = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const { productId, qaId } = req.params;
    const { status } = req.body;
    await productQaRepo.updateStatus(qaId, status);
    res.redirect(`/admin/products/${productId}?success=Q%26A status updated`);
  } catch (error: any) {
    logger.error('Error:', error);
    res.redirect(`/admin/products/${req.params.productId}?error=` + encodeURIComponent(error.message || 'Failed to update Q&A status'));
  }
};

// ============================================================================
// Product Review Media
// ============================================================================

export const listReviewMedia = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const { productId } = req.params;
    const reviews = await productReviewRepo.findByProductId(productId);
    const mediaByReview = await Promise.all(
      reviews.map(async r => ({
        review: r,
        media: await productReviewMediaRepo.findByReview(r.productReviewId),
      })),
    );
    res.render('admin/views/products/partials/review-media', { mediaByReview, productId });
  } catch (error: any) {
    logger.error('Error:', error);
    res.status(500).send(error.message || 'Failed to load review media');
  }
};

export const deleteReviewMedia = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const { productId, mediaId } = req.params;
    await productReviewMediaRepo.delete(mediaId);
    res.redirect(`/admin/products/${productId}?success=Media deleted`);
  } catch (error: any) {
    logger.error('Error:', error);
    res.redirect(`/admin/products/${req.params.productId}?error=` + encodeURIComponent(error.message || 'Failed to delete media'));
  }
};

// ============================================================================
// Product Prices
// ============================================================================

export const listProductPrices = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const { productId } = req.params;
    const prices = await productPriceRepo.findByProduct(productId);
    res.render('admin/views/products/partials/prices', { prices, productId });
  } catch (error: any) {
    logger.error('Error:', error);
    res.status(500).send(error.message || 'Failed to load prices');
  }
};

export const upsertProductPrice = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const { productId } = req.params;
    const { productPriceId, currencyCode, amount, compareAtAmount, minQuantity, maxQuantity, startsAt, endsAt, priceListId, productVariantId } = req.body;

    if (productPriceId) {
      await productPriceRepo.update(productPriceId, {
        currencyCode,
        amount: parseFloat(amount),
        compareAtAmount: compareAtAmount ? parseFloat(compareAtAmount) : null,
        minQuantity: minQuantity ? parseInt(minQuantity) : null,
        maxQuantity: maxQuantity ? parseInt(maxQuantity) : null,
        startsAt: startsAt || null,
        endsAt: endsAt || null,
        priceListId: priceListId || null,
      });
    } else {
      await productPriceRepo.create({
        productId,
        productVariantId: productVariantId || null,
        priceListId: priceListId || null,
        currencyCode,
        amount: parseFloat(amount),
        compareAtAmount: compareAtAmount ? parseFloat(compareAtAmount) : null,
        minQuantity: minQuantity ? parseInt(minQuantity) : null,
        maxQuantity: maxQuantity ? parseInt(maxQuantity) : null,
        startsAt: startsAt || null,
        endsAt: endsAt || null,
      });
    }
    res.redirect(`/admin/products/${productId}?success=Price saved`);
  } catch (error: any) {
    logger.error('Error:', error);
    res.redirect(`/admin/products/${req.params.productId}?error=` + encodeURIComponent(error.message || 'Failed to save price'));
  }
};
