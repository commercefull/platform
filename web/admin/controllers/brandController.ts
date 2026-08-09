/**
 * Brand Controller for Admin Hub
 * Handles Brand management
 */

import { logger } from '../../../libs/logger';
import { Response } from 'express';
import { TypedRequest, RequestBody } from 'libs/types/express';
import { adminRespond } from '../../respond';

// Note: Brand repository would need to be created or imported from modules/brand

export const listBrands = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    adminRespond(req, res, 'catalog/brands/index', {
      pageName: 'Brands',
      brands: [],
      pagination: { total: 0, page: 1, pages: 1 },
      success: req.query.success || null,
    });
  } catch (error: unknown) {
    logger.error('Error listing brands:', error);
    adminRespond(req, res, 'error', {
      pageName: 'Error',
      error: (error as Error).message || 'Failed to load brands',
    });
  }
};

export const createBrandForm = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    adminRespond(req, res, 'catalog/brands/create', {
      pageName: 'Create Brand',
    });
  } catch (error: unknown) {
    logger.error('Error:', error);
    adminRespond(req, res, 'error', {
      pageName: 'Error',
      error: (error as Error).message || 'Failed to load form',
    });
  }
};

export const createBrand = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    res.redirect('/admin/catalog/brands?success=Brand created successfully');
  } catch (error: unknown) {
    logger.error('Error creating brand:', error);
    adminRespond(req, res, 'catalog/brands/create', {
      pageName: 'Create Brand',
      error: (error as Error).message || 'Failed to create brand',
      formData: req.body as RequestBody,
    });
  }
};

export const viewBrand = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    adminRespond(req, res, 'catalog/brands/view', {
      pageName: 'Brand Details',
      brand: null,
      success: req.query.success || null,
    });
  } catch (error: unknown) {
    logger.error('Error:', error);
    adminRespond(req, res, 'error', {
      pageName: 'Error',
      error: (error as Error).message || 'Failed to load brand',
    });
  }
};

export const editBrandForm = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    adminRespond(req, res, 'catalog/brands/edit', {
      pageName: 'Edit Brand',
      brand: null,
    });
  } catch (error: unknown) {
    logger.error('Error:', error);
    adminRespond(req, res, 'error', {
      pageName: 'Error',
      error: (error as Error).message || 'Failed to load form',
    });
  }
};

export const updateBrand = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const { brandId } = req.params;
    res.redirect(`/admin/catalog/brands/${brandId}?success=Brand updated successfully`);
  } catch (error: unknown) {
    logger.error('Error updating brand:', error);
    adminRespond(req, res, 'catalog/brands/edit', {
      pageName: 'Edit Brand',
      brand: null,
      error: (error as Error).message || 'Failed to update brand',
      formData: req.body as RequestBody,
    });
  }
};

export const deleteBrand = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    res.json({ success: true, message: 'Brand deleted successfully' });
  } catch (error: unknown) {
    logger.error('Error deleting brand:', error);
    res.status(500).json({ success: false, message: (error as Error).message || 'Failed to delete brand' });
  }
};
