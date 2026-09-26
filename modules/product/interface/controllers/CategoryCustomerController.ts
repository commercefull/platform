/**
 * Category Customer Controller
 * HTTP interface for customer-facing category operations
 */

import type { HttpRequest, HttpResponse } from 'libs/http';
import { manageCategoriesUseCase } from '../../application/useCases/wired';



/**
 * List all active categories
 * GET /categories
 */
export const listCategories = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { featured, menu, root } = req.query;

  let categories;
  if (featured === 'true') {
    categories = await manageCategoriesUseCase.findFeatured();
  } else if (menu === 'true') {
    categories = await manageCategoriesUseCase.findForMenu();
  } else if (root === 'true') {
    categories = await manageCategoriesUseCase.findRootCategories();
  } else {
    categories = await manageCategoriesUseCase.findActive();
  }

  res.json({ success: true, data: categories });
};

/**
 * Get category by ID or slug
 * GET /categories/:identifier
 */
export const getCategory = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { identifier } = req.params;

  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identifier);
  const category = isUuid ? await manageCategoriesUseCase.findOne(identifier) : await manageCategoriesUseCase.findBySlug(identifier);

  if (!category || !category.isActive) {
    res.status(404).json({ success: false, error: 'Category not found' });
    return;
  }

  res.json({ success: true, data: category });
};

/**
 * Get subcategories of a parent category
 * GET /categories/:categoryId/children
 */
export const getCategoryChildren = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { categoryId } = req.params;

  const children = await manageCategoriesUseCase.findChildren(categoryId);
  const activeChildren = children.filter(c => c.isActive);

  res.json({ success: true, data: activeChildren });
};
