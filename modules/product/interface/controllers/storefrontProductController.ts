/**
 * Storefront Product Controller
 * Handles product listing, detail, and search for customers
 */

import { Response } from 'express';
import { TypedRequest } from 'libs/types/express';
import { storefrontRespond } from '../../../../libs/storefrontRespond';
import { listProductsUseCase, getProductUseCase, brandRepo } from '../../application/useCases/wired';
import { ListProductsCommand } from '../../application/useCases/ListProducts';
import { GetProductCommand } from '../../application/useCases/GetProduct';

// ============================================================================
// Store context helper — reads from res.locals (set by storeResolutionMiddleware)
// ============================================================================

interface StoreContext {
  storeId: string;
  storeSlug: string;
  currency: string;
  locale: string;
  region: string;
  priceDisplayMode: 'inclusive_tax' | 'exclusive_tax';
}

function getStoreContext(res: Response): StoreContext {
  const settings = (res.locals.store as { settings?: Record<string, unknown> } | null)?.settings;
  const priceDisplayMode = (settings?.priceDisplayMode as 'inclusive_tax' | 'exclusive_tax' | undefined) || 'exclusive_tax';
  return {
    storeId: (res.locals.storeId as string) || '',
    storeSlug: (res.locals.storeSlug as string) || 'us',
    currency: (res.locals.currency as string) || 'USD',
    locale: (res.locals.locale as string) || 'en-US',
    region: (res.locals.region as string) || 'US',
    priceDisplayMode,
  };
}

// ============================================================================
// Product Listing (PLP)
// ============================================================================

export const listProducts = async (req: TypedRequest, res: Response): Promise<void> => {
  const {
    category,
    search,
    page = '1',
    limit = '12',
    sort = 'newest',
    order = 'asc',
    brand,
    size,
    colour,
    priceMin,
    priceMax,
    onSale,
    inStock,
  } = req.query;
  const storeCtx = getStoreContext(res);

  // Build filters — scope to current store
  const filters: Record<string, unknown> = {};
  if (storeCtx.storeId) {
    filters.storeId = storeCtx.storeId;
  }
  if (category && category !== 'all') {
    filters.search = category as string;
  }
  if (search) {
    filters.search = search as string;
  }
  if (brand) {
    filters.brandId = brand as string;
  }
  if (priceMin) {
    filters.priceMin = parseFloat(priceMin as string);
  }
  if (priceMax) {
    filters.priceMax = parseFloat(priceMax as string);
  }
  if (onSale === 'true') {
    filters.onSale = true;
  }

  const command = new ListProductsCommand(filters, parseInt(limit as string), (parseInt(page as string) - 1) * parseInt(limit as string));

  const useCase = listProductsUseCase;
  const result = await useCase.execute(command);

  // Fetch available brands for filter sidebar
  let availableBrands: { brandId: string; name: string; slug: string }[] = [];
  try {
    const brandsResult = await brandRepo.findAll({ organizationId: undefined, status: 'active' });
    availableBrands = brandsResult.data.map(b => ({ brandId: b.brandId, name: b.name, slug: b.slug }));
  } catch {
    // Brands are optional — continue without them
  }

  const pagination = {
    currentPage: parseInt(page as string),
    totalPages: Math.ceil(result.total / parseInt(limit as string)),
    totalProducts: result.total,
    hasNext: parseInt(page as string) * parseInt(limit as string) < result.total,
    hasPrev: parseInt(page as string) > 1,
    nextUrl: `/products?${new URLSearchParams({ ...req.query, page: String(parseInt(page as string) + 1) }).toString()}`,
  };

  // JSON response mode for AJAX infinite scroll
  if (req.query.format === 'json' || req.headers.accept?.includes('application/json')) {
    res.json({
      products: result.products.map(p => ({
        productId: p.productId,
        name: p.name,
        slug: p.slug,
        primaryImageUrl: p.primaryImageUrl,
        priceFormatted: p.priceFormatted || null,
        brandName: p.brandName || null,
      })),
      total: result.total,
      pagination,
    });
    return;
  }

  storefrontRespond(req, res, 'product/plp', {
    pageName: category && category !== 'all' ? `Category: ${category}` : 'All Products',
    products: result.products,
    totalProducts: result.total,
    currentCategory: null,
    categoryName: category && category !== 'all' ? (category as string) : null,
    categorySlug: category && category !== 'all' ? (category as string) : null,
    pagination,
    filters: { category, search, sort, order, brand, size, colour, priceMin, priceMax, onSale, inStock },
    availableBrands,
    storeContext: storeCtx,
  });
};

// ============================================================================
// Product Detail (PDP)
// ============================================================================

export const getProduct = async (req: TypedRequest, res: Response): Promise<void> => {
  const { _categorySlug, productId } = req.params;
  const storeCtx = getStoreContext(res);

  const command = new GetProductCommand(productId);
  const useCase = getProductUseCase;
  const product = await useCase.execute(command);

  if (!product) {
    storefrontRespond(req, res, '404', {
      pageName: 'Product Not Found',
      user: req.user,
    });
    return;
  }

  // Get related products from same category
  const relatedFilters: Record<string, unknown> = { categoryId: product.categoryId };
  if (storeCtx.storeId) {
    relatedFilters.storeId = storeCtx.storeId;
  }
  const relatedCommand = new ListProductsCommand(relatedFilters, 5, 0);
  const relatedUseCase = listProductsUseCase;
  const relatedResult = await relatedUseCase.execute(relatedCommand);
  // Filter out the current product
  const relatedProducts = (relatedResult.products || []).filter(p => p.productId !== product.productId).slice(0, 4);

  // Get complementary products (accessories category) for "Complete the look"
  let complementaryProducts: typeof relatedProducts = [];
  try {
    const complementaryFilters: Record<string, unknown> = { search: 'accessories' };
    if (storeCtx.storeId) {
      complementaryFilters.storeId = storeCtx.storeId;
    }
    const complementaryCommand = new ListProductsCommand(complementaryFilters, 5, 0);
    const complementaryResult = await listProductsUseCase.execute(complementaryCommand);
    complementaryProducts = (complementaryResult.products || []).filter(p => p.productId !== product.productId).slice(0, 4);
  } catch {
    // Complementary products are optional
  }

  storefrontRespond(req, res, 'product/pdp', {
    pageName: product.name,
    product,
    relatedProducts,
    complementaryProducts,
    storeContext: storeCtx,
  });
};

// ============================================================================
// Category Products
// ============================================================================

export const getCategoryProducts = async (req: TypedRequest, res: Response): Promise<void> => {
  const { categorySlug } = req.params;
  const { page = '1', limit = '12', sort = 'newest', order = 'asc', brand, size, colour, priceMin, priceMax, onSale, inStock } = req.query;
  const storeCtx = getStoreContext(res);

  // Build filters — scope to current store
  const filters: Record<string, unknown> = { search: categorySlug as string };
  if (storeCtx.storeId) {
    filters.storeId = storeCtx.storeId;
  }
  if (brand) {
    filters.brandId = brand as string;
  }
  if (priceMin) {
    filters.priceMin = parseFloat(priceMin as string);
  }
  if (priceMax) {
    filters.priceMax = parseFloat(priceMax as string);
  }
  if (onSale === 'true') {
    filters.onSale = true;
  }

  const command = new ListProductsCommand(filters, parseInt(limit as string), (parseInt(page as string) - 1) * parseInt(limit as string));

  const useCase = listProductsUseCase;
  const result = await useCase.execute(command);

  // Fetch available brands for filter sidebar
  let availableBrands: { brandId: string; name: string; slug: string }[] = [];
  try {
    const brandsResult = await brandRepo.findAll({ organizationId: undefined, status: 'active' });
    availableBrands = brandsResult.data.map(b => ({ brandId: b.brandId, name: b.name, slug: b.slug }));
  } catch {
    // Brands are optional — continue without them
  }

  const pagination = {
    currentPage: parseInt(page as string),
    totalPages: Math.ceil(result.total / parseInt(limit as string)),
    totalProducts: result.total,
    hasNext: parseInt(page as string) * parseInt(limit as string) < result.total,
    hasPrev: parseInt(page as string) > 1,
    nextUrl: `/categories/${categorySlug}?${new URLSearchParams({ ...req.query, page: String(parseInt(page as string) + 1) }).toString()}`,
  };

  // JSON response mode for AJAX infinite scroll
  if (req.query.format === 'json' || req.headers.accept?.includes('application/json')) {
    res.json({
      products: result.products.map(p => ({
        productId: p.productId,
        name: p.name,
        slug: p.slug,
        primaryImageUrl: p.primaryImageUrl,
        priceFormatted: p.priceFormatted || null,
        brandName: p.brandName || null,
      })),
      total: result.total,
      pagination,
    });
    return;
  }

  storefrontRespond(req, res, 'product/plp', {
    pageName: `Category: ${categorySlug}`,
    products: result.products,
    totalProducts: result.total,
    currentCategory: null,
    categoryName: categorySlug,
    categorySlug,
    pagination,
    filters: { category: categorySlug, sort, order, brand, size, colour, priceMin, priceMax, onSale, inStock },
    availableBrands,
    storeContext: storeCtx,
  });
};

// ============================================================================
// Search Products
// ============================================================================

export const searchProducts = async (req: TypedRequest, res: Response): Promise<void> => {
  const { q: search, page = '1', limit = '12', sort = 'relevance', brand, size, colour, priceMin, priceMax, onSale, inStock } = req.query;
  const storeCtx = getStoreContext(res);

  if (!search || (search as string).trim().length < 2) {
    return res.redirect('/');
  }

  // Build filters — scope to current store
  const filters: Record<string, unknown> = { search: search as string };
  if (storeCtx.storeId) {
    filters.storeId = storeCtx.storeId;
  }
  if (brand) {
    filters.brandId = brand as string;
  }
  if (priceMin) {
    filters.priceMin = parseFloat(priceMin as string);
  }
  if (priceMax) {
    filters.priceMax = parseFloat(priceMax as string);
  }
  if (onSale === 'true') {
    filters.onSale = true;
  }

  const command = new ListProductsCommand(filters, parseInt(limit as string), (parseInt(page as string) - 1) * parseInt(limit as string));

  const useCase = listProductsUseCase;
  const result = await useCase.execute(command);

  // Fetch available brands for filter sidebar
  let availableBrands: { brandId: string; name: string; slug: string }[] = [];
  try {
    const brandsResult = await brandRepo.findAll({ organizationId: undefined, status: 'active' });
    availableBrands = brandsResult.data.map(b => ({ brandId: b.brandId, name: b.name, slug: b.slug }));
  } catch {
    // Brands are optional — continue without them
  }

  storefrontRespond(req, res, 'search/search', {
    pageName: `Search Results for "${search}"`,
    products: result.products,
    totalProducts: result.total,
    pagination: {
      currentPage: parseInt(page as string),
      totalPages: Math.ceil(result.total / parseInt(limit as string)),
      totalProducts: result.total,
      hasNext: parseInt(page as string) * parseInt(limit as string) < result.total,
      hasPrev: parseInt(page as string) > 1,
    },
    filters: { search, sort, brand, size, colour, priceMin, priceMax, onSale, inStock },
    availableBrands,
    searchQuery: search,
    storeContext: storeCtx,
  });
};

// ============================================================================
// Search Autocomplete (JSON API)
// ============================================================================

export const searchAutocomplete = async (req: TypedRequest, res: Response): Promise<void> => {
  const { q: search } = req.query;
  const storeCtx = getStoreContext(res);

  if (!search || (search as string).trim().length < 2) {
    res.json({ products: [], brands: [], categories: [], total: 0 });
    return;
  }

  // Product suggestions
  const filters: Record<string, unknown> = { search: search as string };
  if (storeCtx.storeId) {
    filters.storeId = storeCtx.storeId;
  }
  const command = new ListProductsCommand(filters, 5, 0);
  const result = await listProductsUseCase.execute(command);

  const products = (result.products || []).map(p => ({
    productId: p.productId,
    name: p.name,
    slug: p.slug,
    primaryImageUrl: p.primaryImageUrl,
    brandName: p.brandName,
    categorySlug: p.categorySlug,
  }));

  // Brand suggestions
  let brands: { name: string; slug: string }[] = [];
  try {
    const brandsResult = await brandRepo.findAll({ search: search as string });
    brands = brandsResult.data.slice(0, 3).map(b => ({ name: b.name, slug: b.slug }));
  } catch {
    // Brands are optional
  }

  // Category suggestions (from res.locals.categories, set by storefrontRespond)
  const allCategories = (res.locals.categories || []) as { name: string; slug: string; title?: string }[];
  const searchLower = (search as string).toLowerCase();
  const categories = allCategories
    .filter(c => (c.name || c.title || '').toLowerCase().includes(searchLower))
    .slice(0, 3)
    .map(c => ({ name: c.name || c.title || '', slug: c.slug }));

  res.json({
    products,
    brands,
    categories,
    total: result.total,
  });
};

// ============================================================================
// Sitemap Generation
// ============================================================================

export const generateSitemap = async (req: TypedRequest, res: Response): Promise<void> => {
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  const urls: { loc: string; lastmod?: string; changefreq: string; priority: string }[] = [];

  // Static pages
  urls.push({ loc: `${baseUrl}/`, changefreq: 'daily', priority: '1.0' });
  urls.push({ loc: `${baseUrl}/products`, changefreq: 'daily', priority: '0.9' });
  urls.push({ loc: `${baseUrl}/brands`, changefreq: 'weekly', priority: '0.8' });
  urls.push({ loc: `${baseUrl}/search`, changefreq: 'weekly', priority: '0.6' });

  // Products
  try {
    const productCommand = new ListProductsCommand({}, 1000, 0);
    const productResult = await listProductsUseCase.execute(productCommand);
    (productResult.products || []).forEach(p => {
      urls.push({
        loc: `${baseUrl}/products/${p.categorySlug || 'all'}/${p.productId}`,
        lastmod: p.updatedAt || undefined,
        changefreq: 'weekly',
        priority: '0.7',
      });
    });
  } catch {
    // Products are optional
  }

  // Brands
  try {
    const brandsResult = await brandRepo.findAll({ organizationId: undefined, status: 'active' });
    brandsResult.data.forEach(b => {
      urls.push({
        loc: `${baseUrl}/brands/${b.slug}`,
        changefreq: 'monthly',
        priority: '0.6',
      });
    });
  } catch {
    // Brands are optional
  }

  // Categories (from res.locals)
  const categories = (res.locals.categories || []) as { slug: string }[];
  categories.forEach(c => {
    if (c.slug) {
      urls.push({
        loc: `${baseUrl}/products/category/${c.slug}`,
        changefreq: 'weekly',
        priority: '0.7',
      });
    }
  });

  // Build XML
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    u => `  <url>
    <loc>${u.loc}</loc>
    ${u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : ''}
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`,
  )
  .join('\n')}
</urlset>`;

  res.set('Content-Type', 'application/xml');
  res.send(xml);
};
