/**
 * Product Controller for Admin Hub
 * Uses product use cases directly from modules - no HTTP API calls
 */

import { logger } from '../../../libs/logger';
import { Response } from 'express';
import { TypedRequest, RequestBody } from 'libs/types/express';
import { ListProductsCommand } from '../../../modules/product/application/useCases/ListProducts';
import { CreateProductCommand } from '../../../modules/product/application/useCases/CreateProduct';
import { GetProductCommand } from '../../../modules/product/application/useCases/GetProduct';
import { UpdateProductCommand } from '../../../modules/product/application/useCases/UpdateProduct';
import { ProductStatus } from '../../../modules/product/domain/valueObjects/ProductStatus';
import { ProductVisibility } from '../../../modules/product/domain/valueObjects/ProductVisibility';
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
  manageProductCollectionsUseCase,
  manageProductQaUseCase,
  manageReviewMediaUseCase,
  manageProductPricesUseCase,
  manageCategoriesUseCase,
  getProductAttributesUseCase,
  getReviewStatsUseCase,
} from '../../../modules/product/application/useCases/wired';
import { adminRespond } from '../../respond';

// ============================================================================
// Additional use cases imported from wired.ts
// ============================================================================

// ============================================================================
// List Products
// ============================================================================

export const listProducts = async (req: TypedRequest, res: Response): Promise<void> => {
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

export const viewProduct = async (req: TypedRequest, res: Response): Promise<void> => {
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
    product.productTypeId ? listProductTypesUseCase.execute().then(types => types.find((t: { productTypeId: string }) => t.productTypeId === product.productTypeId) || null).catch(() => null) : Promise.resolve(null),
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

export const createProductForm = async (req: TypedRequest, res: Response): Promise<void> => {
  const [productTypes, categories] = await Promise.all([
    listProductTypesUseCase.execute(),
    manageCategoriesUseCase.findActive(),
  ]);

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

export const createProduct = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const organizationId = req.user?.organizationId;
    const body = req.body as RequestBody;
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
      const [productTypes, categories] = await Promise.all([
        listProductTypesUseCase.execute(),
        manageCategoriesUseCase.findActive(),
      ]);
      adminRespond(req, res, 'products/create', {
        pageName: 'Create Product',
        error: 'Product name is required',
        formData: req.body as RequestBody,
        productTypes,
        categories,
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
      organizationId,
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

    const product = await createProductUseCase.execute(command);

    res.redirect(`/admin/products/${product.productId}?success=Product created successfully`);
  } catch (error: unknown) {
    logger.warn('Error:', error);

    const [productTypes, categories] = await Promise.all([
      listProductTypesUseCase.execute().catch(() => []),
      manageCategoriesUseCase.findActive().catch(() => []),
    ]);
    adminRespond(req, res, 'products/create', {
      pageName: 'Create Product',
      error: (error as Error).message || 'Failed to create product',
      formData: req.body as RequestBody,
      productTypes,
      categories,
      attributes: [],
    });
  }
};

// ============================================================================
// Edit Product Form
// ============================================================================

export const editProductForm = async (req: TypedRequest, res: Response): Promise<void> => {
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

  const [productTypes, categories, productAttributes, allAttributes] = await Promise.all([
    listProductTypesUseCase.execute(),
    manageCategoriesUseCase.findActive(),
    getProductAttributesUseCase.getProductAttributes(productId).catch(() => []),
    getProductAttributesUseCase.findAllAttributes().catch(() => []),
  ]);

  adminRespond(req, res, 'products/edit', {
    pageName: `Edit: ${product?.name || 'Product'}`,
    product,
    productTypes,
    categories,
    productAttributes,
    allAttributes,
  });
  
};

// ============================================================================
// Update Product
// ============================================================================

export const updateProduct = async (req: TypedRequest, res: Response): Promise<void> => {
  const { productId } = req.params;
  const updates = req.body as RequestBody;

  const command = new UpdateProductCommand(productId, updates);
  await updateProductUseCase.execute(command);

  res.redirect(`/admin/products/${productId}?success=Product updated successfully`);
  
};

// ============================================================================
// Delete Product (AJAX)
// ============================================================================

export const deleteProduct = async (req: TypedRequest, res: Response): Promise<void> => {
  const { productId } = req.params;
  const { permanent } = req.query;

  const product = await getProductUseCase.execute(new GetProductCommand(productId));
  if (!product) {
    res.status(404).json({ success: false, message: 'Product not found' });
    return;
  }

  await deleteProductUseCase.execute(productId, permanent === 'true');

  res.json({ success: true, message: 'Product deleted successfully' });
  
};

// ============================================================================
// Update Product Status (AJAX)
// ============================================================================

export const updateProductStatus = async (req: TypedRequest, res: Response): Promise<void> => {
  const { productId } = req.params;
  const body = req.body as RequestBody;
  const { status } = body;

  const validStatuses = Object.values(ProductStatus);
  if (!validStatuses.includes(status)) {
    res.status(400).json({ success: false, message: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
    return;
  }

  try {
    const updatedStatus = await updateProductStatusUseCase.updateStatus(productId, status);
    res.json({ success: true, message: 'Status updated', data: { status: updatedStatus } });
  } catch {
    res.status(404).json({ success: false, message: 'Product not found' });
  }
  
};

// ============================================================================
// Publish Product (AJAX)
// ============================================================================

export const publishProduct = async (req: TypedRequest, res: Response): Promise<void> => {
  const { productId } = req.params;

  try {
    await updateProductStatusUseCase.publish(productId);
    res.json({ success: true, message: 'Product published' });
  } catch {
    res.status(404).json({ success: false, message: 'Product not found' });
  }
  
};

// ============================================================================
// Unpublish Product (AJAX)
// ============================================================================

export const unpublishProduct = async (req: TypedRequest, res: Response): Promise<void> => {
  const { productId } = req.params;

  try {
    await updateProductStatusUseCase.unpublish(productId);
    res.json({ success: true, message: 'Product unpublished' });
  } catch {
    res.status(404).json({ success: false, message: 'Product not found' });
  }
  
};

// ============================================================================
// Product Categories
// ============================================================================

export const listProductCategories = async (req: TypedRequest, res: Response): Promise<void> => {
  const categories = await manageProductCategoriesUseCase.findAll();
  adminRespond(req, res, 'products/categories/index', {
    pageName: 'Product Categories',
    categories,
    success: req.query.success || null,
  });
  
};

export const createProductCategoryForm = async (req: TypedRequest, res: Response): Promise<void> => {
  const categories = await manageProductCategoriesUseCase.findAll();
  adminRespond(req, res, 'products/categories/form', {
    pageName: 'Create Product Category',
    category: null,
    categories,
    formData: {},
  });
  
};

export const createProductCategory = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const body = req.body as RequestBody;
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
    res.redirect('/admin/products/categories?success=Category created successfully');
  } catch (error: unknown) {
    logger.warn('Error:', error);
    res.redirect('/admin/products/categories?error=' + encodeURIComponent((error as Error).message || 'Failed to create category'));
  }
};

export const editProductCategoryForm = async (req: TypedRequest, res: Response): Promise<void> => {
  const { categoryId } = req.params;
  const [category, categories] = await Promise.all([manageProductCategoriesUseCase.findById(categoryId), manageProductCategoriesUseCase.findAll()]);
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

export const updateProductCategory = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const { categoryId } = req.params;
    const body = req.body as RequestBody;
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
    res.redirect('/admin/products/categories?success=Category updated successfully');
  } catch (error: unknown) {
    logger.warn('Error:', error);
    res.redirect('/admin/products/categories?error=' + encodeURIComponent((error as Error).message || 'Failed to update category'));
  }
};

export const deleteProductCategory = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const { categoryId } = req.params;
    await manageProductCategoriesUseCase.softDelete(categoryId);
    res.redirect('/admin/products/categories?success=Category deleted successfully');
  } catch (error: unknown) {
    logger.warn('Error:', error);
    res.redirect('/admin/products/categories?error=' + encodeURIComponent((error as Error).message || 'Failed to delete category'));
  }
};

// ============================================================================
// Product Tags
// ============================================================================

export const listProductTags = async (req: TypedRequest, res: Response): Promise<void> => {
  const tags = await manageProductTagsUseCase.findAll();
  adminRespond(req, res, 'products/tags/index', {
    pageName: 'Product Tags',
    tags,
    success: req.query.success || null,
  });
  
};

export const createProductTag = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const body = req.body as RequestBody;
    const { name, slug, description } = body;
    await manageProductTagsUseCase.create({
      name,
      slug: slug || name.toLowerCase().replace(/\s+/g, '-'),
      description: description || null,
    });
    res.redirect('/admin/products/tags?success=Tag created successfully');
  } catch (error: unknown) {
    logger.warn('Error:', error);
    res.redirect('/admin/products/tags?error=' + encodeURIComponent((error as Error).message || 'Failed to create tag'));
  }
};

export const deleteProductTag = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const { tagId } = req.params;
    await manageProductTagsUseCase.softDelete(tagId);
    res.redirect('/admin/products/tags?success=Tag deleted successfully');
  } catch (error: unknown) {
    logger.warn('Error:', error);
    res.redirect('/admin/products/tags?error=' + encodeURIComponent((error as Error).message || 'Failed to delete tag'));
  }
};

// ============================================================================
// Product Collections
// ============================================================================

export const listProductCollections = async (req: TypedRequest, res: Response): Promise<void> => {
  const collections = await manageProductCollectionsUseCase.findAll();
  adminRespond(req, res, 'products/collections/index', {
    pageName: 'Product Collections',
    collections,
    success: req.query.success || null,
  });
  
};

export const createProductCollectionForm = async (req: TypedRequest, res: Response): Promise<void> => {
  adminRespond(req, res, 'products/collections/form', {
    pageName: 'Create Product Collection',
    collection: null,
    formData: {},
  });
  
};

export const createProductCollection = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const body = req.body as RequestBody;
    const { name, slug, description, imageUrl, isActive, _position } = body;
    await manageProductCollectionsUseCase.create({
      name,
      slug: slug || name.toLowerCase().replace(/\s+/g, '-'),
      description: description || null,
      imageUrl: imageUrl || null,
      isActive: isActive !== 'false',
      organizationId: null,
    });
    res.redirect('/admin/products/collections?success=Collection created successfully');
  } catch (error: unknown) {
    logger.warn('Error:', error);
    res.redirect('/admin/products/collections?error=' + encodeURIComponent((error as Error).message || 'Failed to create collection'));
  }
};

export const editProductCollectionForm = async (req: TypedRequest, res: Response): Promise<void> => {
  const { collectionId } = req.params;
  const collection = await manageProductCollectionsUseCase.findById(collectionId);
  if (!collection) {
    adminRespond(req, res, 'error', { pageName: 'Not Found', error: 'Collection not found' });
    return;
  }
  adminRespond(req, res, 'products/collections/form', {
    pageName: `Edit Collection: ${collection.name}`,
    collection,
    formData: collection,
  });
  
};

export const updateProductCollection = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const { collectionId } = req.params;
    const body = req.body as RequestBody;
    const { name, slug, description, imageUrl, isActive, _position } = body;
    await manageProductCollectionsUseCase.update(collectionId, {
      name,
      slug,
      description: description || null,
      imageUrl: imageUrl || null,
      isActive: isActive !== 'false',
    });
    res.redirect('/admin/products/collections?success=Collection updated successfully');
  } catch (error: unknown) {
    logger.warn('Error:', error);
    res.redirect('/admin/products/collections?error=' + encodeURIComponent((error as Error).message || 'Failed to update collection'));
  }
};

export const deleteProductCollection = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const { collectionId } = req.params;
    await manageProductCollectionsUseCase.softDelete(collectionId);
    res.redirect('/admin/products/collections?success=Collection deleted successfully');
  } catch (error: unknown) {
    logger.warn('Error:', error);
    res.redirect('/admin/products/collections?error=' + encodeURIComponent((error as Error).message || 'Failed to delete collection'));
  }
};

// ============================================================================
// Product Q&A
// ============================================================================

export const listProductQa = async (req: TypedRequest, res: Response): Promise<void> => {
  const { productId } = req.params;
  const qaList = await manageProductQaUseCase.findByProduct(productId);
  res.render('admin/views/products/partials/qa', { qaList, productId });
  
};

export const updateQaStatus = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const { productId, qaId } = req.params;
    const body = req.body as RequestBody;
    const { status } = body;
    await manageProductQaUseCase.updateStatus(qaId, status);
    res.redirect(`/admin/products/${productId}?success=Q%26A status updated`);
  } catch (error: unknown) {
    logger.warn('Error:', error);
    res.redirect(`/admin/products/${req.params.productId}?error=` + encodeURIComponent((error as Error).message || 'Failed to update Q&A status'));
  }
};

// ============================================================================
// Product Review Media
// ============================================================================

export const listReviewMedia = async (req: TypedRequest, res: Response): Promise<void> => {
  const { productId } = req.params;
  const reviews = await manageReviewMediaUseCase.findReviewsByProduct(productId);
  const mediaByReview = await Promise.all(
    reviews.map(async (r: { productReviewId: string }) => ({
      review: r,
      media: await manageReviewMediaUseCase.findMediaByReview(r.productReviewId),
    })),
  );
  res.render('admin/views/products/partials/review-media', { mediaByReview, productId });
  
};

export const deleteReviewMedia = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const { productId, mediaId } = req.params;
    await manageReviewMediaUseCase.deleteMedia(mediaId);
    res.redirect(`/admin/products/${productId}?success=Media deleted`);
  } catch (error: unknown) {
    logger.warn('Error:', error);
    res.redirect(`/admin/products/${req.params.productId}?error=` + encodeURIComponent((error as Error).message || 'Failed to delete media'));
  }
};

// ============================================================================
// Product Prices
// ============================================================================

export const listProductPrices = async (req: TypedRequest, res: Response): Promise<void> => {
  const { productId } = req.params;
  const prices = await manageProductPricesUseCase.findByProduct(productId);
  res.render('admin/views/products/partials/prices', { prices, productId });
  
};

export const upsertProductPrice = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const { productId } = req.params;
    const body = req.body as RequestBody;
    const {
      productPriceId,
      currencyCode,
      amount,
      compareAtAmount,
      minQuantity,
      maxQuantity,
      startsAt,
      endsAt,
      priceListId,
      productVariantId,
    } = body;

    if (productPriceId) {
      await manageProductPricesUseCase.update(productPriceId, {
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
      await manageProductPricesUseCase.create({
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
  } catch (error: unknown) {
    logger.warn('Error:', error);
    res.redirect(`/admin/products/${req.params.productId}?error=` + encodeURIComponent((error as Error).message || 'Failed to save price'));
  }
};
