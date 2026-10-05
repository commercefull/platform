import { jsonResponse, redirectResponse } from 'libs/apiResponse';
/**
 * Catalog Controller for Admin Panel
 * Handles Categories management.
 *
 * NOTE: Despite the file name, categories are backed by
 * `modules/product/infrastructure/repositories/categoryRepo`.
 * Collections moved to modules/assortment (adminCollectionController).
 */

import { logger } from '../../../../libs/logger';
import type { HttpRequest, HttpRequestBody, HttpResponse } from 'libs/http';
import { manageCategoriesUseCase } from '../../application/useCases/wired';
import { adminRespond } from '../../../../libs/adminRespond';

// ============================================================================
// Categories
// ============================================================================

export const listCategories = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
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

export const createCategoryForm = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const parentCategories = await manageCategoriesUseCase.findAll();

  adminRespond(req, res, 'catalog/categories/create', {
    pageName: 'Create Category',
    parentCategories,
  });
};

export const createCategory = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  try {
    const body = req.body as HttpRequestBody;
    const { name, slug, description, parentId, isActive, position, metaTitle, metaDescription } = body as {
      name: string;
      slug: string;
      description: string;
      parentId?: string;
      isActive?: string | boolean;
      position: string;
      metaTitle: string;
      metaDescription: string;
    };

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

    redirectResponse(res, `/admin/catalog/categories/${category.productCategoryId}?success=Category created successfully`);
  } catch (error: unknown) {
    logger.warn('Error creating category:', error);
    const parentCategories = await manageCategoriesUseCase.findAll();
    adminRespond(req, res, 'catalog/categories/create', {
      pageName: 'Create Category',
      parentCategories,
      error: (error as Error).message || 'Failed to create category',
      formData: req.body as HttpRequestBody,
    });
  }
};

export const viewCategory = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
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

export const editCategoryForm = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
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

export const updateCategory = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  try {
    const { categoryId } = req.params;
    const body = req.body as HttpRequestBody;
    const { name, slug, description, parentId, isActive, position, metaTitle, metaDescription } = body as {
      name: string;
      slug: string;
      description: string;
      parentId?: string;
      isActive?: string | boolean;
      position: string;
      metaTitle: string;
      metaDescription: string;
    };

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

    redirectResponse(res, `/admin/catalog/categories/${categoryId}?success=Category updated successfully`);
  } catch (error: unknown) {
    logger.warn('Error updating category:', error);
    const category = await manageCategoriesUseCase.findOne(req.params.categoryId);
    const parentCategories = await manageCategoriesUseCase.findAll();
    adminRespond(req, res, 'catalog/categories/edit', {
      pageName: `Edit: ${category?.name || 'Category'}`,
      category,
      parentCategories,
      error: (error as Error).message || 'Failed to update category',
      formData: req.body as HttpRequestBody,
    });
  }
};

export const deleteCategory = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { categoryId } = req.params;
  await manageCategoriesUseCase.delete(categoryId);
  jsonResponse(res, 200, { success: true, message: 'Category deleted successfully' });
};

export const reorderCategories = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const body = req.body as HttpRequestBody;
  const { categories } = body as { categories: { categoryId: string; position: number }[] }; // Array of { categoryId, position }

  await manageCategoriesUseCase.reorder(categories);

  jsonResponse(res, 200, { success: true, message: 'Categories reordered successfully' });
};

// ============================================================================
