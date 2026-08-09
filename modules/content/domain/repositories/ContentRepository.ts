/**
 * Content Repository Interface
 *
 * Defines the contract for Content persistence operations.
 */

import { ContentPage, ContentStatus } from '../entities/ContentPage';

export interface ContentPageFilters {
  status?: ContentStatus;
  locale?: string;
  templateId?: string;
  parentId?: string;
  author?: string;
  isHomepage?: boolean;
  search?: string;
}

export interface PaginationOptions {
  page: number;
  limit: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface IContentRepository {
  // Page operations
  findPageById(pageId: string): Promise<ContentPage | null>;
  findPageBySlug(slug: string, locale?: string): Promise<ContentPage | null>;
  findPages(filters?: ContentPageFilters, pagination?: PaginationOptions): Promise<PaginatedResult<ContentPage>>;
  findPublishedPages(locale?: string, pagination?: PaginationOptions): Promise<PaginatedResult<ContentPage>>;
  savePage(page: ContentPage): Promise<ContentPage>;
  deletePage(pageId: string): Promise<boolean>;

  // Block operations
  findBlocksByPageId(pageId: string): Promise<unknown[]>;
  saveBlock(pageId: string, block: unknown): Promise<unknown>;
  deleteBlock(blockId: string): Promise<boolean>;
  reorderBlocks(pageId: string, blockIds: string[]): Promise<boolean>;

  // Template operations
  findTemplateById(templateId: string): Promise<unknown | null>;
  findTemplates(): Promise<unknown[]>;
  saveTemplate(template: unknown): Promise<unknown>;
  deleteTemplate(templateId: string): Promise<boolean>;

  // Category operations
  findCategoryById(categoryId: string): Promise<unknown | null>;
  findCategories(parentId?: string): Promise<unknown[]>;
  saveCategory(category: unknown): Promise<unknown>;
  deleteCategory(categoryId: string): Promise<boolean>;

  // Navigation operations
  findNavigationById(navigationId: string): Promise<unknown | null>;
  findNavigations(): Promise<unknown[]>;
  saveNavigation(navigation: unknown): Promise<unknown>;
  deleteNavigation(navigationId: string): Promise<boolean>;

  // Media operations
  findMediaById(mediaId: string): Promise<unknown | null>;
  findMedia(folderId?: string): Promise<unknown[]>;
  saveMedia(media: unknown): Promise<unknown>;
  deleteMedia(mediaId: string): Promise<boolean>;

  // Redirect operations
  findRedirectBySource(sourcePath: string): Promise<unknown | null>;
  findRedirects(): Promise<unknown[]>;
  saveRedirect(redirect: unknown): Promise<unknown>;
  deleteRedirect(redirectId: string): Promise<boolean>;
}
