/**
 * Storefront Product Controller
 * Handles product listing, detail, and search for customers
 */

import { Request, Response } from 'express';
import { storefrontRespond } from '../../respond';
import ProductRepo from '../../../modules/product/infrastructure/repositories/ProductRepository';
import { ListProductsCommand, ListProductsUseCase } from '../../../modules/product/application/useCases/ListProducts';
import { GetProductCommand, GetProductUseCase } from '../../../modules/product/application/useCases/GetProduct';

// ============================================================================
// Product Listing (PLP)
// ============================================================================

export const listProducts = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      category,
      search,
      page = '1',
      limit = '12',
      sort = 'name',
      order = 'asc'
    } = req.query;

    // Build filters
    const filters: any = {};
    if (category && category !== 'all') {
      // Use search as fallback since categorySlug filter doesn't exist
      filters.search = category as string;
    }
    if (search) {
      filters.search = search as string;
    }

    const command = new ListProductsCommand(
      filters,
      parseInt(limit as string),
      (parseInt(page as string) - 1) * parseInt(limit as string)
    );

    const useCase = new ListProductsUseCase(ProductRepo);
    const result = await useCase.execute(command);

    // Categories are now loaded automatically by storefrontRespond
    const currentCategory = null;

    storefrontRespond(req, res, 'product/plp', {
      pageName: category && category !== 'all' ? `Category: ${category}` : 'All Products',
      products: result.products,
      currentCategory,
      pagination: {
        currentPage: parseInt(page as string),
        totalPages: Math.ceil(result.total / parseInt(limit as string)),
        totalProducts: result.total,
        hasNext: (parseInt(page as string) * parseInt(limit as string)) < result.total,
        hasPrev: parseInt(page as string) > 1
      },
      filters: { category, search, sort, order }
    });
  } catch (error: any) {
    console.error('Error listing products:', error);
    storefrontRespond(req, res, 'error', {
      pageName: 'Error',
      error: error.message || 'Failed to load products'
    });
  }
};

// ============================================================================
// Product Detail (PDP)
// ============================================================================

export const getProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const { categorySlug, productId } = req.params;

    const command = new GetProductCommand(productId);
    const useCase = new GetProductUseCase(ProductRepo);
    const product = await useCase.execute(command);

    if (!product) {
      storefrontRespond(req, res, '404', {
        pageName: 'Product Not Found',
        user: req.user
      });
      return;
    }

    // Get related products from same category
    const relatedCommand = new ListProductsCommand(
      { categoryId: product.categoryId },
      5,
      0
    );
    const relatedUseCase = new ListProductsUseCase(ProductRepo);
    const relatedResult = await relatedUseCase.execute(relatedCommand);
    // Filter out the current product
    const relatedProducts = (relatedResult.products || []).filter(
      (p: any) => p.productId !== product.productId
    ).slice(0, 4);

    storefrontRespond(req, res, 'product/pdp', {
      pageName: product.name,
      product,
      relatedProducts
    });
  } catch (error: any) {
    console.error('Error getting product:', error);
    storefrontRespond(req, res, 'error', {
      pageName: 'Error',
      error: error.message || 'Failed to load product'
    });
  }
};

// ============================================================================
// Category Products
// ============================================================================

export const getCategoryProducts = async (req: Request, res: Response): Promise<void> => {
  try {
    const { categorySlug } = req.params;
    const { page = '1', limit = '12', sort = 'name', order = 'asc' } = req.query;

    // Use search as fallback since category use cases don't exist yet
    const command = new ListProductsCommand(
      { search: categorySlug as string },
      parseInt(limit as string),
      (parseInt(page as string) - 1) * parseInt(limit as string)
    );

    const useCase = new ListProductsUseCase(ProductRepo);
    const result = await useCase.execute(command);

    // Categories are now loaded automatically by storefrontRespond

    storefrontRespond(req, res, 'product/plp', {
      pageName: `Category: ${categorySlug}`,
      products: result.products,
      currentCategory: null,
      pagination: {
        currentPage: parseInt(page as string),
        totalPages: Math.ceil(result.total / parseInt(limit as string)),
        totalProducts: result.total,
        hasNext: (parseInt(page as string) * parseInt(limit as string)) < result.total,
        hasPrev: parseInt(page as string) > 1
      },
      filters: { category: categorySlug, sort, order }
    });
  } catch (error: any) {
    console.error('Error getting category products:', error);
    storefrontRespond(req, res, 'error', {
      pageName: 'Error',
      error: error.message || 'Failed to load category products'
    });
  }
};

// ============================================================================
// Search Products
// ============================================================================

export const searchProducts = async (req: Request, res: Response): Promise<void> => {
  try {
    const { q: search, page = '1', limit = '12' } = req.query;

    if (!search || (search as string).trim().length < 2) {
      return res.redirect('/');
    }

    const command = new ListProductsCommand(
      { search: search as string },
      parseInt(limit as string),
      (parseInt(page as string) - 1) * parseInt(limit as string)
    );

    const useCase = new ListProductsUseCase(ProductRepo);
    const result = await useCase.execute(command);

    // Categories are now loaded automatically by storefrontRespond

    storefrontRespond(req, res, 'product/plp', {
      pageName: `Search Results for "${search}"`,
      products: result.products,
      pagination: {
        currentPage: parseInt(page as string),
        totalPages: Math.ceil(result.total / parseInt(limit as string)),
        totalProducts: result.total,
        hasNext: (parseInt(page as string) * parseInt(limit as string)) < result.total,
        hasPrev: parseInt(page as string) > 1
      },
      filters: { search, sort: 'relevance' },
      searchQuery: search
    });
  } catch (error: any) {
    console.error('Error searching products:', error);
    storefrontRespond(req, res, 'error', {
      pageName: 'Error',
      error: error.message || 'Failed to search products'
    });
  }
};
