/**
 * Storefront Category Controller
 * Handles category navigation and category pages for customers
 */

import { Request, Response, NextFunction } from 'express';
import CategoryRepo from '../../../modules/product/repos/categoryRepo';
import { storefrontRespond } from '../../respond';

// ============================================================================
// Load Categories for Navigation
// ============================================================================

export const loadCategoriesForNavigation = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const categories = await CategoryRepo.findForMenu();
    res.locals.categories = categories;
  } catch (error) {
    console.warn('Failed to load categories for navigation:', error);
    res.locals.categories = [];
  }
  next();
};

// ============================================================================
// Get Category Navigation Data
// ============================================================================

export const getCategoriesForNavigation = async (req: Request, res: Response): Promise<void> => {
  try {
    const categories = await CategoryRepo.findForMenu();
    res.json({
      success: true,
      categories
    });
  } catch (error: any) {
    console.error('Error loading categories:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to load categories'
    });
  }
};

// ============================================================================
// Get All Categories
// ============================================================================

export const getAllCategories = async (req: Request, res: Response): Promise<void> => {
  try {
    const categories = await CategoryRepo.findActive();
    res.json({
      success: true,
      categories
    });
  } catch (error: any) {
    console.error('Error loading categories:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to load categories'
    });
  }
};

// ============================================================================
// Get Category Details
// ============================================================================

export const getCategoryDetails = async (req: Request, res: Response): Promise<void> => {
  try {
    const { categoryId } = req.params;

    const category = await CategoryRepo.findOne(categoryId);
    if (!category) {
      res.status(404).json({
        success: false,
        message: 'Category not found'
      });
      return;
    }

    // Get subcategories if this is a parent category
    const subcategories = await CategoryRepo.findChildren(categoryId);

    res.json({
      success: true,
      category,
      subcategories
    });
  } catch (error: any) {
    console.error('Error loading category details:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to load category details'
    });
  }
};

// ============================================================================
// Category Landing Page
// ============================================================================

export const getCategoryPage = async (req: Request, res: Response): Promise<void> => {
  try {
    const { categorySlug } = req.params;

    const category = await CategoryRepo.findBySlug(categorySlug);
    if (!category) {
      return storefrontRespond(req, res, '404', {
        pageName: 'Category Not Found'
      });
    }

    // Get subcategories
    const subcategories = await CategoryRepo.findChildren(category.productCategoryId);

    // Get featured products in this category (placeholder - would need product filtering)
    const featuredProducts:any[] = [];

    storefrontRespond(req, res, 'category/category', {
      pageName: category.name,
      category,
      subcategories,
      featuredProducts
    });
  } catch (error: any) {
    console.error('Error loading category page:', error);
    storefrontRespond(req, res, 'error', {
      pageName: 'Error',
      error: error.message || 'Failed to load category'
    });
  }
};
