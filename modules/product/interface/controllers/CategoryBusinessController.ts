import { logger } from '../../../../libs/logger';
import { Response } from 'express';
import { TypedRequest } from 'libs/types/express';
import categoryRepo from '../../infrastructure/repositories/categoryRepo';
import type { CategoryUpdateProps } from '../../infrastructure/repositories/categoryRepo';

export const listCategories = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const categories = await categoryRepo.findAll();
    res.json({ success: true, data: categories });
  } catch (error: unknown) {
    logger.error('Error:', error);
    res.status(500).json({ success: false, error: (error as Error).message });
  }
};

export const getRootCategories = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const categories = await categoryRepo.findRootCategories();
    res.json({ success: true, data: categories });
  } catch (error: unknown) {
    logger.error('Error:', error);
    res.status(500).json({ success: false, error: (error as Error).message });
  }
};

export const getCategory = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const category = await categoryRepo.findOne(id);
    if (!category) {
      res.status(404).json({ success: false, error: 'Category not found' });
      return;
    }
    res.json({ success: true, data: category });
  } catch (error: unknown) {
    logger.error('Error:', error);
    res.status(500).json({ success: false, error: (error as Error).message });
  }
};

export const getCategoryBySlug = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const { slug } = req.params;
    const category = await categoryRepo.findBySlug(slug);
    if (!category) {
      res.status(404).json({ success: false, error: 'Category not found' });
      return;
    }
    res.json({ success: true, data: category });
  } catch (error: unknown) {
    logger.error('Error:', error);
    res.status(500).json({ success: false, error: (error as Error).message });
  }
};

export const getCategoryChildren = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const children = await categoryRepo.findChildren(id);
    res.json({ success: true, data: children });
  } catch (error: unknown) {
    logger.error('Error:', error);
    res.status(500).json({ success: false, error: (error as Error).message });
  }
};

export const createCategory = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const { name, description, parentId, isActive, isFeatured, includeInMenu, position,
            imageUrl, bannerUrl, iconUrl, metaTitle, metaDescription, metaKeywords,
            organizationId, isGlobal, customLayout, displaySettings } = req.body as {
      name?: string; description?: string; parentId?: string; isActive?: boolean; isFeatured?: boolean;
      includeInMenu?: boolean; position?: number; imageUrl?: string; bannerUrl?: string; iconUrl?: string;
      metaTitle?: string; metaDescription?: string; metaKeywords?: string; organizationId?: string;
      isGlobal?: boolean; customLayout?: string; displaySettings?: Record<string, unknown>;
    };

    if (!name?.trim()) {
      res.status(400).json({ success: false, error: 'name is required' });
      return;
    }

    const category = await categoryRepo.create({
      name, description, parentId, isActive, isFeatured, includeInMenu, position,
      imageUrl, bannerUrl, iconUrl, metaTitle, metaDescription, metaKeywords,
      organizationId, isGlobal, customLayout, displaySettings,
    });

    res.status(201).json({ success: true, data: category });
  } catch (error: unknown) {
    logger.error('Error:', error);
    res.status(400).json({ success: false, error: (error as Error).message });
  }
};

export const updateCategory = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const existing = await categoryRepo.findOne(id);
    if (!existing) {
      res.status(404).json({ success: false, error: 'Category not found' });
      return;
    }
    const updated = await categoryRepo.update(id, req.body as CategoryUpdateProps);
    res.json({ success: true, data: updated });
  } catch (error: unknown) {
    logger.error('Error:', error);
    res.status(400).json({ success: false, error: (error as Error).message });
  }
};

export const deleteCategory = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const existing = await categoryRepo.findOne(id);
    if (!existing) {
      res.status(404).json({ success: false, error: 'Category not found' });
      return;
    }
    await categoryRepo.delete(id);
    res.json({ success: true, message: 'Category deleted' });
  } catch (error: unknown) {
    logger.error('Error:', error);
    res.status(500).json({ success: false, error: (error as Error).message });
  }
};
