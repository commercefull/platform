/**
 * Storefront Category Controller
 * Handles category navigation and category pages for customers
 */

import { logger } from '../../../libs/logger';
import { Response, NextFunction } from 'express';
import { TypedRequest } from 'libs/types/express';
import { manageCategoriesUseCase } from '../../../modules/product/application/useCases/wired';
import { storefrontRespond } from '../../respond';

// ============================================================================
// Load Categories for Navigation
// ============================================================================

export const loadCategoriesForNavigation = async (req: TypedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const categories = await manageCategoriesUseCase.findForMenu();
    res.locals.categories = categories;
  } catch (error) {
    logger.warning('Failed to load categories for navigation', { error });
    res.locals.categories = [];
  }
  next();
};

// ============================================================================
// Get Category Navigation Data
// ============================================================================

export const getCategoriesForNavigation = async (req: TypedRequest, res: Response): Promise<void> => {
  const categories = await manageCategoriesUseCase.findForMenu();
  res.json({
    success: true,
    categories,
  });
  
};

// ============================================================================
// Get All Categories
// ============================================================================

export const getAllCategories = async (req: TypedRequest, res: Response): Promise<void> => {
  const categories = await manageCategoriesUseCase.findActive();
  res.json({
    success: true,
    categories,
  });
  
};

// ============================================================================
// Get Category Details
// ============================================================================

export const getCategoryDetails = async (req: TypedRequest, res: Response): Promise<void> => {
  const { categoryId } = req.params;

  const category = await manageCategoriesUseCase.findOne(categoryId);
  if (!category) {
    res.status(404).json({
      success: false,
      message: 'Category not found',
    });
    return;
  }

  // Get subcategories if this is a parent category
  const subcategories = await manageCategoriesUseCase.findChildren(categoryId);

  res.json({
    success: true,
    category,
    subcategories,
  });
  
};

// ============================================================================
// Category Landing Page
// ============================================================================

export const getCategoryPage = async (req: TypedRequest, res: Response): Promise<void> => {
  const { categorySlug } = req.params;

  const category = await manageCategoriesUseCase.findBySlug(categorySlug);
  if (!category) {
    return storefrontRespond(req, res, '404', {
      pageName: 'Category Not Found',
    });
  }

  // Get subcategories
  const subcategories = await manageCategoriesUseCase.findChildren(category.productCategoryId);

  // Get featured products in this category (placeholder - would need product filtering)
  const featuredProducts: unknown[] = [];

  storefrontRespond(req, res, 'category/category', {
    pageName: category.name,
    category,
    subcategories,
    featuredProducts,
  });
  
};
