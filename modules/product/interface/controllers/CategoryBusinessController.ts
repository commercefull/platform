import { Response } from 'express';
import { TypedRequest } from 'libs/types/express';
import productCatalogRepository from '../../infrastructure/repositories/ProductCatalogRepository';
import type { CategoryUpdateProps } from '../../infrastructure/repositories/ProductCatalogRepository';

const categoryRepo = productCatalogRepository.categories;

export const listCategories = async (req: TypedRequest, res: Response): Promise<void> => {
  const categories = await categoryRepo.findAll();
  res.json({ success: true, data: categories });
  
};

export const getRootCategories = async (req: TypedRequest, res: Response): Promise<void> => {
  const categories = await categoryRepo.findRootCategories();
  res.json({ success: true, data: categories });
  
};

export const getCategory = async (req: TypedRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const category = await categoryRepo.findOne(id);
  if (!category) {
    res.status(404).json({ success: false, error: 'Category not found' });
    return;
  }
  res.json({ success: true, data: category });
  
};

export const getCategoryBySlug = async (req: TypedRequest, res: Response): Promise<void> => {
  const { slug } = req.params;
  const category = await categoryRepo.findBySlug(slug);
  if (!category) {
    res.status(404).json({ success: false, error: 'Category not found' });
    return;
  }
  res.json({ success: true, data: category });
  
};

export const getCategoryChildren = async (req: TypedRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const children = await categoryRepo.findChildren(id);
  res.json({ success: true, data: children });
  
};

export const createCategory = async (req: TypedRequest, res: Response): Promise<void> => {
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
  
};

export const updateCategory = async (req: TypedRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const existing = await categoryRepo.findOne(id);
  if (!existing) {
    res.status(404).json({ success: false, error: 'Category not found' });
    return;
  }
  const updated = await categoryRepo.update(id, req.body as CategoryUpdateProps);
  res.json({ success: true, data: updated });
  
};

export const deleteCategory = async (req: TypedRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const existing = await categoryRepo.findOne(id);
  if (!existing) {
    res.status(404).json({ success: false, error: 'Category not found' });
    return;
  }
  await categoryRepo.delete(id);
  res.json({ success: true, message: 'Category deleted' });
  
};
