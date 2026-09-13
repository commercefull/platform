/**
 * Content Category Repository Interface
 *
 * Defines the contract for Content Category persistence operations.
 */

import type { ContentCategory } from '../../../../libs/db/types';

export type ContentCategoryCreateParams = Omit<ContentCategory, 'contentCategoryId' | 'createdAt' | 'updatedAt'>;
export type ContentCategoryUpdateParams = Partial<Omit<ContentCategory, 'contentCategoryId' | 'createdAt' | 'updatedAt'>>;

export interface IContentCategoryRepository {
  findCategoryById(id: string): Promise<ContentCategory | null>;
  findCategoryBySlug(slug: string): Promise<ContentCategory | null>;
  findAllCategories(parentId?: string, isActive?: boolean, limit?: number, offset?: number): Promise<ContentCategory[]>;
  findRootCategories(isActive?: boolean): Promise<ContentCategory[]>;
  findChildCategories(parentId: string, isActive?: boolean): Promise<ContentCategory[]>;
  getCategoryTree(isActive?: boolean): Promise<ContentCategory[]>;
  createCategory(params: ContentCategoryCreateParams): Promise<ContentCategory>;
  updateCategory(id: string, params: ContentCategoryUpdateParams): Promise<ContentCategory>;
  deleteCategory(id: string): Promise<boolean>;
  moveCategory(id: string, newParentId: string | null): Promise<ContentCategory>;
}
