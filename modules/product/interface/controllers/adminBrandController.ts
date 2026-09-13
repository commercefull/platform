/**
 * Brand Controller for Admin Hub
 * Manages brand CRUD operations using the brand repository directly.
 */

import { Response } from 'express';
import { TypedRequest } from 'libs/types/express';
import { adminRespond } from '../../../../libs/adminRespond';
import { brandRepo } from '../../application/useCases/wired';
import { Brand } from '../../domain/entities/Brand';

// Default organization ID — in production this would come from the authenticated admin's session
const DEFAULT_ORG_ID = process.env.DEFAULT_ORGANIZATION_ID || '01911000-0000-7000-8000-000000000001';

// ============================================================================
// List Brands
// ============================================================================

export const listBrands = async (req: TypedRequest, res: Response): Promise<void> => {
  const { search, status } = req.query;

  const result = await brandRepo.findAll({
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

export const viewBrand = async (req: TypedRequest, res: Response): Promise<void> => {
  const { brandId } = req.params;
  const brand = await brandRepo.findById(brandId);

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

export const createBrandForm = async (req: TypedRequest, res: Response): Promise<void> => {
  adminRespond(req, res, 'catalog/brands/create', {
    pageName: 'Create Brand',
    brand: { name: '', slug: '', description: '', logoUrl: '', website: '', countryOfOrigin: '' },
  });
};

// ============================================================================
// Create Brand
// ============================================================================

export const createBrand = async (req: TypedRequest, res: Response): Promise<void> => {
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
    const brand = Brand.create({
      organizationId: DEFAULT_ORG_ID,
      name,
      slug: slug || undefined,
      description: description || undefined,
      logoUrl: logoUrl || undefined,
      website: website || undefined,
      countryOfOrigin: countryOfOrigin || undefined,
    });
    await brandRepo.create(brand);
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

export const editBrandForm = async (req: TypedRequest, res: Response): Promise<void> => {
  const { brandId } = req.params;
  const brand = await brandRepo.findById(brandId);

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

export const updateBrand = async (req: TypedRequest, res: Response): Promise<void> => {
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

  const brand = await brandRepo.findById(brandId);
  if (!brand) {
    req.flash('error', 'Brand not found');
    return res.redirect('/hub/catalog/brands');
  }

  try {
    brand.updateProfile({
      name: name || undefined,
      description: description || undefined,
      logoUrl: logoUrl || undefined,
      website: website || undefined,
      countryOfOrigin: countryOfOrigin || undefined,
    });

    if (status === 'active') {
      brand.activate();
    } else if (status === 'inactive') {
      brand.deactivate();
    } else if (status === 'archived') {
      brand.archive();
    }

    await brandRepo.update(brand);
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

export const deleteBrand = async (req: TypedRequest, res: Response): Promise<void> => {
  const { brandId } = req.params;

  try {
    await brandRepo.delete(brandId);
    req.flash('success', 'Brand archived successfully');
  } catch (err) {
    req.flash('error', `Failed to delete brand: ${(err as Error).message}`);
  }

  res.redirect('/hub/catalog/brands');
};
