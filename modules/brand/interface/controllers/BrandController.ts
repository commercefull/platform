/**
 * Brand Controller
 *
 * HTTP interface for brand management.
 */

import { logger } from '../../../../libs/logger';
import { Request, Response } from 'express';
import { brandRepository } from '../../infrastructure/repositories/BrandRepository';
import { CreateBrandUseCase, GetBrandUseCase, ListBrandsUseCase, UpdateBrandUseCase, DeleteBrandUseCase } from '../../application/useCases';

export const createBrand = async (req: Request, res: Response): Promise<void> => {
  try {
    const useCase = new CreateBrandUseCase(brandRepository);
    const result = await useCase.execute({
      name: req.body.name,
      slug: req.body.slug,
      description: req.body.description,
      logoMediaId: req.body.logoMediaId,
      coverImageMediaId: req.body.coverImageMediaId,
      website: req.body.website,
      countryOfOrigin: req.body.countryOfOrigin,
      isActive: req.body.isActive,
      isFeatured: req.body.isFeatured,
      metadata: req.body.metadata,
    });
    res.status(201).json({ success: true, data: result.brand });
  } catch (error: any) {
    logger.error('Error:', error);
    res.status(400).json({ success: false, error: error.message });
  }
};

export const getBrand = async (req: Request, res: Response): Promise<void> => {
  try {
    const useCase = new GetBrandUseCase(brandRepository);
    const result = await useCase.execute({
      brandId: req.params.brandId,
      slug: req.query.slug as string | undefined,
    });
    if (!result.brand) {
      res.status(404).json({ success: false, error: 'Brand not found' });
      return;
    }
    res.json({ success: true, data: result.brand });
  } catch (error: any) {
    logger.error('Error:', error);
    const status = error.message.includes('not found') ? 404 : 400;
    res.status(status).json({ success: false, error: error.message });
  }
};

export const updateBrand = async (req: Request, res: Response): Promise<void> => {
  try {
    const useCase = new UpdateBrandUseCase(brandRepository);
    const result = await useCase.execute({
      brandId: req.params.brandId,
      name: req.body.name,
      slug: req.body.slug,
      description: req.body.description,
      logoMediaId: req.body.logoMediaId,
      coverImageMediaId: req.body.coverImageMediaId,
      website: req.body.website,
      countryOfOrigin: req.body.countryOfOrigin,
      isActive: req.body.isActive,
      isFeatured: req.body.isFeatured,
      metadata: req.body.metadata,
    });
    res.json({ success: true, data: result.brand });
  } catch (error: any) {
    logger.error('Error:', error);
    res.status(400).json({ success: false, error: error.message });
  }
};

export const deleteBrand = async (req: Request, res: Response): Promise<void> => {
  try {
    const useCase = new DeleteBrandUseCase(brandRepository);
    await useCase.execute({ brandId: req.params.brandId });
    res.json({ success: true, message: 'Brand deleted' });
  } catch (error: any) {
    logger.error('Error:', error);
    res.status(400).json({ success: false, error: error.message });
  }
};

export const listBrands = async (req: Request, res: Response): Promise<void> => {
  try {
    const useCase = new ListBrandsUseCase(brandRepository);
    const result = await useCase.execute({
      isActive: req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined,
      isFeatured: req.query.isFeatured === 'true' ? true : req.query.isFeatured === 'false' ? false : undefined,
      search: req.query.search as string | undefined,
      page: req.query.page ? parseInt(req.query.page as string, 10) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string, 10) : undefined,
    });
    res.json({ success: true, data: result });
  } catch (error: any) {
    logger.error('Error:', error);
    res.status(400).json({ success: false, error: error.message });
  }
};

export default {
  createBrand,
  getBrand,
  updateBrand,
  deleteBrand,
  listBrands,
};
