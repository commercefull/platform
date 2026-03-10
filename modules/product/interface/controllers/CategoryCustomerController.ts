/**
 * Category Customer Controller
 * HTTP interface for customer-facing category operations
 */

import { logger } from '../../../../libs/logger';
import { Response } from 'express';
import { TypedRequest } from 'libs/types/express';
import categoryRepo from '../../infrastructure/repositories/categoryRepo';

/**
 * List all active categories
 * GET /categories
 */
export const listCategories = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const { featured, menu, root } = req.query;

    let categories;
    if (featured === 'true') {
      categories = await categoryRepo.findFeatured();
    } else if (menu === 'true') {
      categories = await categoryRepo.findForMenu();
    } else if (root === 'true') {
      categories = await categoryRepo.findRootCategories();
    } else {
      categories = await categoryRepo.findActive();
    }

    res.json({ success: true, data: categories });
  } catch (error: any) {
    logger.error('Error:', error);
    res.status(500).json({ success: false, error: error.message || 'Failed to list categories' });
  }
};

/**
 * Get category by ID or slug
 * GET /categories/:identifier
 */
export const getCategory = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const { identifier } = req.params;

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identifier);
    const category = isUuid
      ? await categoryRepo.findOne(identifier)
      : await categoryRepo.findBySlug(identifier);

    if (!category || !category.isActive) {
      res.status(404).json({ success: false, error: 'Category not found' });
      return;
    }

    res.json({ success: true, data: category });
  } catch (error: any) {
    logger.error('Error:', error);
    res.status(500).json({ success: false, error: error.message || 'Failed to get category' });
  }
};

/**
 * Get subcategories of a parent category
 * GET /categories/:categoryId/children
 */
export const getCategoryChildren = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const { categoryId } = req.params;

    const children = await categoryRepo.findChildren(categoryId);
    const activeChildren = children.filter(c => c.isActive);

    res.json({ success: true, data: activeChildren });
  } catch (error: any) {
    logger.error('Error:', error);
    res.status(500).json({ success: false, error: error.message || 'Failed to get subcategories' });
  }
};
