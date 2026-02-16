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
  findBlocksByPageId(pageId: string): Promise<any[]>;
  saveBlock(pageId: string, block: any): Promise<any>;
  deleteBlock(blockId: string): Promise<boolean>;
  reorderBlocks(pageId: string, blockIds: string[]): Promise<boolean>;

  // Template operations
  findTemplateById(templateId: string): Promise<any | null>;
  findTemplates(): Promise<any[]>;
  saveTemplate(template: any): Promise<any>;
  deleteTemplate(templateId: string): Promise<boolean>;

  // Category operations
  findCategoryById(categoryId: string): Promise<any | null>;
  findCategories(parentId?: string): Promise<any[]>;
  saveCategory(category: any): Promise<any>;
  deleteCategory(categoryId: string): Promise<boolean>;

  // Navigation operations
  findNavigationById(navigationId: string): Promise<any | null>;
  findNavigations(): Promise<any[]>;
  saveNavigation(navigation: any): Promise<any>;
  deleteNavigation(navigationId: string): Promise<boolean>;

  // Media operations
  findMediaById(mediaId: string): Promise<any | null>;
  findMedia(folderId?: string): Promise<any[]>;
  saveMedia(media: any): Promise<any>;
  deleteMedia(mediaId: string): Promise<boolean>;

  // Redirect operations
  findRedirectBySource(sourcePath: string): Promise<any | null>;
  findRedirects(): Promise<any[]>;
  saveRedirect(redirect: any): Promise<any>;
  deleteRedirect(redirectId: string): Promise<boolean>;
}
