import { jsonResponse } from 'libs/apiResponse';
import type { HttpRequest, HttpResponse } from 'libs/http';
import { manageCategoriesUseCase } from '../../application/useCases/wired';
import type { CategoryUpdateProps } from '../../domain/repositories/ProductCatalogPorts';

export const listCategories = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const categories = await manageCategoriesUseCase.findAll();
  jsonResponse(res, 200, { success: true, data: categories });
};

export const getRootCategories = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const categories = await manageCategoriesUseCase.findRootCategories();
  jsonResponse(res, 200, { success: true, data: categories });
};

export const getCategory = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { id } = req.params;
  const category = await manageCategoriesUseCase.findOne(id);
  if (!category) {
    jsonResponse(res, 404, { success: false, error: 'Category not found' });
    return;
  }
  jsonResponse(res, 200, { success: true, data: category });
};

export const getCategoryBySlug = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { slug } = req.params;
  const category = await manageCategoriesUseCase.findBySlug(slug);
  if (!category) {
    jsonResponse(res, 404, { success: false, error: 'Category not found' });
    return;
  }
  jsonResponse(res, 200, { success: true, data: category });
};

export const getCategoryChildren = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { id } = req.params;
  const children = await manageCategoriesUseCase.findChildren(id);
  jsonResponse(res, 200, { success: true, data: children });
};

export const createCategory = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const {
    name,
    description,
    parentId,
    isActive,
    isFeatured,
    includeInMenu,
    position,
    imageUrl,
    bannerUrl,
    iconUrl,
    metaTitle,
    metaDescription,
    metaKeywords,
    organizationId,
    isGlobal,
    customLayout,
    displaySettings,
  } = req.body as {
    name?: string;
    description?: string;
    parentId?: string;
    isActive?: boolean;
    isFeatured?: boolean;
    includeInMenu?: boolean;
    position?: number;
    imageUrl?: string;
    bannerUrl?: string;
    iconUrl?: string;
    metaTitle?: string;
    metaDescription?: string;
    metaKeywords?: string;
    organizationId?: string;
    isGlobal?: boolean;
    customLayout?: string;
    displaySettings?: Record<string, unknown>;
  };

  if (!name?.trim()) {
    jsonResponse(res, 400, { success: false, error: 'name is required' });
    return;
  }

  const category = await manageCategoriesUseCase.create({
    name,
    description,
    parentId,
    isActive,
    isFeatured,
    includeInMenu,
    position,
    imageUrl,
    bannerUrl,
    iconUrl,
    metaTitle,
    metaDescription,
    metaKeywords,
    organizationId,
    isGlobal,
    customLayout,
    displaySettings,
  });

  jsonResponse(res, 201, { success: true, data: category });
};

export const updateCategory = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { id } = req.params;
  const existing = await manageCategoriesUseCase.findOne(id);
  if (!existing) {
    jsonResponse(res, 404, { success: false, error: 'Category not found' });
    return;
  }
  const updated = await manageCategoriesUseCase.update(id, req.body as CategoryUpdateProps);
  jsonResponse(res, 200, { success: true, data: updated });
};

export const deleteCategory = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { id } = req.params;
  const existing = await manageCategoriesUseCase.findOne(id);
  if (!existing) {
    jsonResponse(res, 404, { success: false, error: 'Category not found' });
    return;
  }
  await manageCategoriesUseCase.delete(id);
  jsonResponse(res, 200, { success: true, message: 'Category deleted' });
};
