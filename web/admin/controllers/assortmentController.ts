/**
 * Assortment Controller for Admin Hub
 * Handles Categories and Collections management
 */

import { logger } from '../../../libs/logger';
import { Request, Response } from 'express';
import CategoryRepo from '../../../modules/product/repos/categoryRepo';
import { adminRespond } from '../../respond';

// ============================================================================
// Categories
// ============================================================================

export const listCategories = async (req: Request, res: Response): Promise<void> => {
  try {
    const categories = await CategoryRepo.findAll();
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
  } catch (error: any) {
    logger.error('Error listing categories:', error);
    adminRespond(req, res, 'error', {
      pageName: 'Error',
      error: error.message || 'Failed to load categories',
    });
  }
};

export const createCategoryForm = async (req: Request, res: Response): Promise<void> => {
  try {
    const parentCategories = await CategoryRepo.findAll();

    adminRespond(req, res, 'catalog/categories/create', {
      pageName: 'Create Category',
      parentCategories,
    });
  } catch (error: any) {
    logger.error('Error:', error);
    adminRespond(req, res, 'error', {
      pageName: 'Error',
      error: error.message || 'Failed to load form',
    });
  }
};

export const createCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, slug, description, parentId, isActive, position, metaTitle, metaDescription } = req.body;

    const category = await CategoryRepo.create({
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
  } catch (error: any) {
    logger.error('Error creating category:', error);
    const parentCategories = await CategoryRepo.findAll();
    adminRespond(req, res, 'catalog/categories/create', {
      pageName: 'Create Category',
      parentCategories,
      error: error.message || 'Failed to create category',
      formData: req.body,
    });
  }
};

export const viewCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { categoryId } = req.params;
    const category = await CategoryRepo.findOne(categoryId);

    if (!category) {
      adminRespond(req, res, 'error', {
        pageName: 'Not Found',
        error: 'Category not found',
      });
      return;
    }

    const childCategories = await CategoryRepo.findChildren(categoryId);

    adminRespond(req, res, 'catalog/categories/view', {
      pageName: `Category: ${category.name}`,
      category,
      childCategories,
      success: req.query.success || null,
    });
  } catch (error: any) {
    logger.error('Error:', error);
    adminRespond(req, res, 'error', {
      pageName: 'Error',
      error: error.message || 'Failed to load category',
    });
  }
};

export const editCategoryForm = async (req: Request, res: Response): Promise<void> => {
  try {
    const { categoryId } = req.params;
    const category = await CategoryRepo.findOne(categoryId);

    if (!category) {
      adminRespond(req, res, 'error', {
        pageName: 'Not Found',
        error: 'Category not found',
      });
      return;
    }

    const parentCategories = await CategoryRepo.findAll();

    adminRespond(req, res, 'catalog/categories/edit', {
      pageName: `Edit: ${category.name}`,
      category,
      parentCategories: parentCategories.filter((c) => c.productCategoryId !== categoryId),
    });
  } catch (error: any) {
    logger.error('Error:', error);
    adminRespond(req, res, 'error', {
      pageName: 'Error',
      error: error.message || 'Failed to load form',
    });
  }
};

export const updateCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { categoryId } = req.params;
    const { name, slug, description, parentId, isActive, position, metaTitle, metaDescription } = req.body;

    await CategoryRepo.update(categoryId, {
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
  } catch (error: any) {
    logger.error('Error updating category:', error);
    const category = await CategoryRepo.findOne(req.params.categoryId);
    const parentCategories = await CategoryRepo.findAll();
    adminRespond(req, res, 'catalog/categories/edit', {
      pageName: `Edit: ${category?.name || 'Category'}`,
      category,
      parentCategories,
      error: error.message || 'Failed to update category',
      formData: req.body,
    });
  }
};

export const deleteCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { categoryId } = req.params;
    await CategoryRepo.delete(categoryId);
    res.json({ success: true, message: 'Category deleted successfully' });
  } catch (error: any) {
    logger.error('Error deleting category:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to delete category' });
  }
};

export const reorderCategories = async (req: Request, res: Response): Promise<void> => {
  try {
    const { categories } = req.body; // Array of { categoryId, position }

    for (const cat of categories) {
      await CategoryRepo.update(cat.categoryId, { position: cat.position });
    }

    res.json({ success: true, message: 'Categories reordered successfully' });
  } catch (error: any) {
    logger.error('Error reordering categories:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to reorder categories' });
  }
};

// ============================================================================
// Collections (placeholder - uses simple in-memory structure for now)
// ============================================================================

// Note: Collections functionality would need a dedicated repository
// For now, providing placeholder implementations

export const listCollections = async (req: Request, res: Response): Promise<void> => {
  try {
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
  } catch (error: any) {
    logger.error('Error listing collections:', error);
    adminRespond(req, res, 'error', {
      pageName: 'Error',
      error: error.message || 'Failed to load collections',
    });
  }
};

export const createCollectionForm = async (req: Request, res: Response): Promise<void> => {
  try {
    adminRespond(req, res, 'catalog/collections/create', {
      pageName: 'Create Collection',
    });
  } catch (error: any) {
    logger.error('Error:', error);
    adminRespond(req, res, 'error', {
      pageName: 'Error',
      error: error.message || 'Failed to load form',
    });
  }
};

export const createCollection = async (req: Request, res: Response): Promise<void> => {
  try {
    // Placeholder - would need collection repository
    res.redirect('/admin/catalog/collections?success=Collection created successfully');
  } catch (error: any) {
    logger.error('Error creating collection:', error);
    adminRespond(req, res, 'catalog/collections/create', {
      pageName: 'Create Collection',
      error: error.message || 'Failed to create collection',
      formData: req.body,
    });
  }
};

export const viewCollection = async (req: Request, res: Response): Promise<void> => {
  try {
    adminRespond(req, res, 'catalog/collections/view', {
      pageName: 'Collection Details',
      collection: null,
      success: req.query.success || null,
    });
  } catch (error: any) {
    logger.error('Error:', error);
    adminRespond(req, res, 'error', {
      pageName: 'Error',
      error: error.message || 'Failed to load collection',
    });
  }
};

export const editCollectionForm = async (req: Request, res: Response): Promise<void> => {
  try {
    adminRespond(req, res, 'catalog/collections/edit', {
      pageName: 'Edit Collection',
      collection: null,
    });
  } catch (error: any) {
    logger.error('Error:', error);
    adminRespond(req, res, 'error', {
      pageName: 'Error',
      error: error.message || 'Failed to load form',
    });
  }
};

export const updateCollection = async (req: Request, res: Response): Promise<void> => {
  try {
    const { collectionId } = req.params;
    res.redirect(`/admin/catalog/collections/${collectionId}?success=Collection updated successfully`);
  } catch (error: any) {
    logger.error('Error updating collection:', error);
    adminRespond(req, res, 'catalog/collections/edit', {
      pageName: 'Edit Collection',
      collection: null,
      error: error.message || 'Failed to update collection',
      formData: req.body,
    });
  }
};

export const deleteCollection = async (req: Request, res: Response): Promise<void> => {
  try {
    res.json({ success: true, message: 'Collection deleted successfully' });
  } catch (error: any) {
    logger.error('Error deleting collection:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to delete collection' });
  }
};
