/**
 * Brand Controller for Admin Hub
 * Manages brand CRUD operations using the brand repository directly.
 */

import type { HttpRequest, HttpResponse } from 'libs/http';
import { adminRespond } from '../../../../libs/adminRespond';
import { manageBrandsUseCase } from '../../application/useCases/wired';

// Default organization ID — in production this would come from the authenticated admin's session
const DEFAULT_ORG_ID = process.env.DEFAULT_ORGANIZATION_ID || '01911000-0000-7000-8000-000000000001';

// ============================================================================
// List Brands
// ============================================================================

export const listBrands = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { search, status } = req.query;

  const result = await manageBrandsUseCase.findAll({
    organizationId: DEFAULT_ORG_ID,
    search: search as string | undefined,
    status: status as 'active' | 'inactive' | 'archived' | undefined,
  });

  adminRespond(req, res, 'catalog/brands/index', {
    pageName: 'Brands',
    brands: result.data,
    pagination: {
      total: result.total,
      limit: result.limit,
      offset: result.offset,
      hasMore: result.hasMore,
    },
    filters: { search: search || '', status: status || '' },
  });
};

// ============================================================================
// View Brand
// ============================================================================

export const viewBrand = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { brandId } = req.params;
  const brand = await manageBrandsUseCase.findById(brandId);

  if (!brand) {
    req.flash('error', 'Brand not found');
    return res.redirect('/hub/catalog/brands');
  }

  adminRespond(req, res, 'catalog/brands/view', {
    pageName: brand.name,
    brand,
  });
};

// ============================================================================
// Create Brand Form
// ============================================================================

export const createBrandForm = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  adminRespond(req, res, 'catalog/brands/create', {
    pageName: 'Create Brand',
    brand: { name: '', slug: '', description: '', logoUrl: '', website: '', countryOfOrigin: '' },
  });
};

// ============================================================================
// Create Brand
// ============================================================================

export const createBrand = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const body = (req.body || {}) as {
    name?: string;
    slug?: string;
    description?: string;
    logoUrl?: string;
    website?: string;
    countryOfOrigin?: string;
  };
  const { name, slug, description, logoUrl, website, countryOfOrigin } = body;

  if (!name) {
    req.flash('error', 'Brand name is required');
    return res.redirect('/hub/catalog/brands/new');
  }

  try {
    await manageBrandsUseCase.create({
      organizationId: DEFAULT_ORG_ID,
      name,
      slug: slug || undefined,
      description: description || undefined,
      logoUrl: logoUrl || undefined,
      website: website || undefined,
      countryOfOrigin: countryOfOrigin || undefined,
    });
    req.flash('success', `Brand "${name}" created successfully`);
    res.redirect('/hub/catalog/brands');
  } catch (err) {
    req.flash('error', `Failed to create brand: ${(err as Error).message}`);
    res.redirect('/hub/catalog/brands/new');
  }
};

// ============================================================================
// Edit Brand Form
// ============================================================================

export const editBrandForm = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { brandId } = req.params;
  const brand = await manageBrandsUseCase.findById(brandId);

  if (!brand) {
    req.flash('error', 'Brand not found');
    return res.redirect('/hub/catalog/brands');
  }

  adminRespond(req, res, 'catalog/brands/edit', {
    pageName: `Edit ${brand.name}`,
    brand,
  });
};

// ============================================================================
// Update Brand
// ============================================================================

export const updateBrand = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { brandId } = req.params;
  const body = (req.body || {}) as {
    name?: string;
    description?: string;
    logoUrl?: string;
    website?: string;
    countryOfOrigin?: string;
    status?: string;
  };
  const { name, description, logoUrl, website, countryOfOrigin, status } = body;

  const brand = await manageBrandsUseCase.findById(brandId);
  if (!brand) {
    req.flash('error', 'Brand not found');
    return res.redirect('/hub/catalog/brands');
  }

  try {
    await manageBrandsUseCase.updateDetails(
      brandId,
      {
        name: name || undefined,
        description: description || undefined,
        logoUrl: logoUrl || undefined,
        website: website || undefined,
        countryOfOrigin: countryOfOrigin || undefined,
      },
      status === 'active' || status === 'inactive' || status === 'archived' ? status : undefined,
    );
    req.flash('success', 'Brand updated successfully');
    res.redirect('/hub/catalog/brands');
  } catch (err) {
    req.flash('error', `Failed to update brand: ${(err as Error).message}`);
    res.redirect(`/hub/catalog/brands/${brandId}/edit`);
  }
};

// ============================================================================
// Delete Brand (soft delete — archives)
// ============================================================================

export const deleteBrand = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { brandId } = req.params;

  try {
    await manageBrandsUseCase.delete(brandId);
    req.flash('success', 'Brand archived successfully');
  } catch (err) {
    req.flash('error', `Failed to delete brand: ${(err as Error).message}`);
  }

  res.redirect('/hub/catalog/brands');
};
