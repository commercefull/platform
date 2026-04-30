import { logger } from '../../../../libs/logger';
import { Response } from 'express';
import { TypedRequest } from 'libs/types/express';
import categoryRepo from '../../infrastructure/repositories/categoryRepo';

export const listCategories = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const categories = await categoryRepo.findAll();
    res.json({ success: true, data: categories });
  } catch (error: any) {
    logger.error('Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getRootCategories = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const categories = await categoryRepo.findRootCategories();
    res.json({ success: true, data: categories });
  } catch (error: any) {
    logger.error('Error:', error);
    res.status(500).json({ success: false, error: error.message });
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
  } catch (error: any) {
    logger.error('Error:', error);
    res.status(500).json({ success: false, error: error.message });
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
  } catch (error: any) {
    logger.error('Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getCategoryChildren = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const children = await categoryRepo.findChildren(id);
    res.json({ success: true, data: children });
  } catch (error: any) {
    logger.error('Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const createCategory = async (req: TypedRequest, res: Response): Promise<void> => {
  try {
    const { name, description, parentId, isActive, isFeatured, includeInMenu, position,
            imageUrl, bannerUrl, iconUrl, metaTitle, metaDescription, metaKeywords,
            merchantId, isGlobal, customLayout, displaySettings } = req.body;

    if (!name?.trim()) {
      res.status(400).json({ success: false, error: 'name is required' });
      return;
    }

    const category = await categoryRepo.create({
      name, description, parentId, isActive, isFeatured, includeInMenu, position,
      imageUrl, bannerUrl, iconUrl, metaTitle, metaDescription, metaKeywords,
      merchantId, isGlobal, customLayout, displaySettings,
    });

    res.status(201).json({ success: true, data: category });
  } catch (error: any) {
    logger.error('Error:', error);
    res.status(400).json({ success: false, error: error.message });
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
    const updated = await categoryRepo.update(id, req.body);
    res.json({ success: true, data: updated });
  } catch (error: any) {
    logger.error('Error:', error);
    res.status(400).json({ success: false, error: error.message });
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
  } catch (error: any) {
    logger.error('Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};
