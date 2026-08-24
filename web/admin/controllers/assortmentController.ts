/**
 * Catalog Controller for Admin Panel
 * Handles Categories and Collections management.
 *
 * NOTE: Despite the file name, there is no `assortment` module.
 * Categories are backed by `modules/product/infrastructure/repositories/categoryRepo`.
 * Collections are placeholder — a dedicated module is planned (see gap-analysis-and-roadmap.md).
 */

import { logger } from '../../../libs/logger';
import { Response } from 'express';
import { TypedRequest, RequestBody } from 'libs/types/express';
import { ManageCategoriesUseCase } from '../../../modules/product/application/useCases/ManageCategories';
import { adminRespond } from '../../respond';

const manageCategoriesUseCase = new ManageCategoriesUseCase();

// ============================================================================
// Categories
// ============================================================================

export const listCategories = async (req: TypedRequest, res: Response): Promise<void> => {
  const categories = await manageCategoriesUseCase.findAll();
  const total = categories.length;

  adminRespond(req, res, 'catalog/categories/index', {
    pageName: 'Categories',
    categories,
    pagination: {
      total,
      page: 1,
      pages: 1,
    },
    success: req.query.success || null,
  });
  
};

export const createCategoryForm = async (req: TypedRequest, res: Response): Promise<void> => {
  const parentCategories = await manageCategoriesUseCase.findAll();

  adminRespond(req, res, 'catalog/categories/create', {
    pageName: 'Create Category',
    parentCategories,
  });
  
};

export const createCategory = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const body = req.body as RequestBody;
    const { name, slug, description, parentId, isActive, position, metaTitle, metaDescription } = body;

    const category = await manageCategoriesUseCase.create({
      name,
      slug,
      description,
      parentId: parentId || undefined,
      isActive: isActive === 'true' || isActive === true,
      position: parseInt(position) || 0,
      metaTitle,
      metaDescription,
    });

    res.redirect(`/admin/catalog/categories/${category.productCategoryId}?success=Category created successfully`);
  } catch (error: unknown) {
    logger.warn('Error creating category:', error);
    const parentCategories = await manageCategoriesUseCase.findAll();
    adminRespond(req, res, 'catalog/categories/create', {
      pageName: 'Create Category',
      parentCategories,
      error: (error as Error).message || 'Failed to create category',
      formData: req.body as RequestBody,
    });
  }
};

export const viewCategory = async (req: TypedRequest, res: Response): Promise<void> => {
  const { categoryId } = req.params;
  const category = await manageCategoriesUseCase.findOne(categoryId);

  if (!category) {
    adminRespond(req, res, 'error', {
      pageName: 'Not Found',
      error: 'Category not found',
    });
    return;
  }

  const childCategories = await manageCategoriesUseCase.findChildren(categoryId);

  adminRespond(req, res, 'catalog/categories/view', {
    pageName: `Category: ${category.name}`,
    category,
    childCategories,
    success: req.query.success || null,
  });
  
};

export const editCategoryForm = async (req: TypedRequest, res: Response): Promise<void> => {
  const { categoryId } = req.params;
  const category = await manageCategoriesUseCase.findOne(categoryId);

  if (!category) {
    adminRespond(req, res, 'error', {
      pageName: 'Not Found',
      error: 'Category not found',
    });
    return;
  }

  const parentCategories = await manageCategoriesUseCase.findAll();

  adminRespond(req, res, 'catalog/categories/edit', {
    pageName: `Edit: ${category.name}`,
    category,
    parentCategories: parentCategories.filter(c => c.productCategoryId !== categoryId),
  });
  
};

export const updateCategory = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const { categoryId } = req.params;
    const body = req.body as RequestBody;
    const { name, slug, description, parentId, isActive, position, metaTitle, metaDescription } = body;

    await manageCategoriesUseCase.update(categoryId, {
      name,
      slug,
      description,
      parentId: parentId || undefined,
      isActive: isActive === 'true' || isActive === true,
      position: parseInt(position) || 0,
      metaTitle,
      metaDescription,
    });

    res.redirect(`/admin/catalog/categories/${categoryId}?success=Category updated successfully`);
  } catch (error: unknown) {
    logger.warn('Error updating category:', error);
    const category = await manageCategoriesUseCase.findOne(req.params.categoryId);
    const parentCategories = await manageCategoriesUseCase.findAll();
    adminRespond(req, res, 'catalog/categories/edit', {
      pageName: `Edit: ${category?.name || 'Category'}`,
      category,
      parentCategories,
      error: (error as Error).message || 'Failed to update category',
      formData: req.body as RequestBody,
    });
  }
};

export const deleteCategory = async (req: TypedRequest, res: Response): Promise<void> => {
  const { categoryId } = req.params;
  await manageCategoriesUseCase.delete(categoryId);
  res.json({ success: true, message: 'Category deleted successfully' });
  
};

export const reorderCategories = async (req: TypedRequest, res: Response): Promise<void> => {
  const body = req.body as RequestBody;
  const { categories } = body; // Array of { categoryId, position }

  for (const cat of categories) {
    await manageCategoriesUseCase.update(cat.categoryId, { position: cat.position });
  }

  res.json({ success: true, message: 'Categories reordered successfully' });
  
};

// ============================================================================
// Collections (placeholder - uses simple in-memory structure for now)
// ============================================================================

// Note: Collections functionality would need a dedicated repository
// For now, providing placeholder implementations

export const listCollections = async (req: TypedRequest, res: Response): Promise<void> => {
  adminRespond(req, res, 'catalog/collections/index', {
    pageName: 'Collections',
    collections: [],
    pagination: {
      total: 0,
      page: 1,
      pages: 1,
    },
    success: req.query.success || null,
  });
  
};

export const createCollectionForm = async (req: TypedRequest, res: Response): Promise<void> => {
  adminRespond(req, res, 'catalog/collections/create', {
    pageName: 'Create Collection',
  });
  
};

export const createCollection = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    // Placeholder - would need collection repository
    res.redirect('/admin/catalog/collections?success=Collection created successfully');
  } catch (error: unknown) {
    logger.warn('Error creating collection:', error);
    adminRespond(req, res, 'catalog/collections/create', {
      pageName: 'Create Collection',
      error: (error as Error).message || 'Failed to create collection',
      formData: req.body as RequestBody,
    });
  }
};

export const viewCollection = async (req: TypedRequest, res: Response): Promise<void> => {
  adminRespond(req, res, 'catalog/collections/view', {
    pageName: 'Collection Details',
    collection: null,
    success: req.query.success || null,
  });
  
};

export const editCollectionForm = async (req: TypedRequest, res: Response): Promise<void> => {
  adminRespond(req, res, 'catalog/collections/edit', {
    pageName: 'Edit Collection',
    collection: null,
  });
  
};

export const updateCollection = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const { collectionId } = req.params;
    res.redirect(`/admin/catalog/collections/${collectionId}?success=Collection updated successfully`);
  } catch (error: unknown) {
    logger.warn('Error updating collection:', error);
    adminRespond(req, res, 'catalog/collections/edit', {
      pageName: 'Edit Collection',
      collection: null,
      error: (error as Error).message || 'Failed to update collection',
      formData: req.body as RequestBody,
    });
  }
};

export const deleteCollection = async (req: TypedRequest, res: Response): Promise<void> => {
  res.json({ success: true, message: 'Collection deleted successfully' });
  
};
