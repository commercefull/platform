/**
 * Storefront Brand Controller
 * Handles brand listing and brand landing pages for customers
 */

import { Response } from 'express';
import { TypedRequest } from 'libs/types/express';
import { storefrontRespond } from '../../../../libs/storefrontRespond';
import { brandRepo, listProductsUseCase } from '../../application/useCases/wired';
import { ListProductsCommand } from '../../application/useCases/ListProducts';

// ============================================================================
// All Brands Listing
// ============================================================================

export const listBrands = async (req: TypedRequest, res: Response): Promise<void> => {
  const brands = await brandRepo.findActive();

  storefrontRespond(req, res, 'brand/index', {
    pageName: 'All Brands',
    brands,
  });
};

// ============================================================================
// Brand Landing Page
// ============================================================================

export const getBrand = async (req: TypedRequest, res: Response): Promise<void> => {
  const { slug } = req.params;

  const brand = await brandRepo.findBySlug(slug);

  if (!brand) {
    storefrontRespond(req, res, '404', {
      pageName: 'Brand Not Found',
      user: req.user,
    });
    return;
  }

  // Get featured products from this brand (up to 8)
  const storeId = (res.locals.storeId as string) || undefined;
  const filters: Record<string, unknown> = {};
  if (storeId) {
    filters.storeId = storeId;
  }

  const featuredCommand = new ListProductsCommand(filters, 8, 0);
  const featuredResult = await listProductsUseCase.execute(featuredCommand);
  const products = (featuredResult.products || []).filter(p => p.brandId === brand.brandId).slice(0, 8);

  storefrontRespond(req, res, 'brand/show', {
    pageName: brand.name,
    brand,
    products,
  });
};

// ============================================================================
// Brand Products (PLP filtered by brand)
// ============================================================================

export const getBrandProducts = async (req: TypedRequest, res: Response): Promise<void> => {
  const { slug } = req.params;
  const { page = '1', limit = '12' } = req.query;

  const brand = await brandRepo.findBySlug(slug);

  if (!brand) {
    storefrontRespond(req, res, '404', {
      pageName: 'Brand Not Found',
      user: req.user,
    });
    return;
  }

  const storeId = (res.locals.storeId as string) || undefined;
  const filters: Record<string, unknown> = {};
  if (storeId) {
    filters.storeId = storeId;
  }

  const command = new ListProductsCommand(filters, parseInt(limit as string), (parseInt(page as string) - 1) * parseInt(limit as string));
  const result = await listProductsUseCase.execute(command);
  const products = (result.products || []).filter(p => p.brandId === brand.brandId);

  storefrontRespond(req, res, 'product/plp', {
    pageName: brand.name,
    products,
    currentCategory: null,
    brand,
    pagination: {
      currentPage: parseInt(page as string),
      totalPages: Math.ceil(products.length / parseInt(limit as string)),
      totalProducts: products.length,
      hasNext: parseInt(page as string) * parseInt(limit as string) < products.length,
      hasPrev: parseInt(page as string) > 1,
    },
    filters: { brand: slug, sort: 'name', order: 'asc' },
  });
};
