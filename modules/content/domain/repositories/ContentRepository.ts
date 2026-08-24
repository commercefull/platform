/**
 * Content Repository Interface
 *
 * Defines the contract for Content persistence operations.
 */

import { PaginatedResult, PaginationOptions } from 'libs/types/shared';
import type { ContentPage as ContentPageData } from '../../../../libs/db/types';
import { ContentStatus } from '../entities/ContentPage';

export interface ContentPageFilters {
  status?: ContentStatus;
  locale?: string;
  templateId?: string;
  parentId?: string;
  author?: string;
  isHomepage?: boolean;
  search?: string;
}

export interface ContentPageUpdateParams {
  status?: string;
  publishedAt?: Date | null;
  title?: string;
  slug?: string;
  body?: string;
  templateId?: string;
  visibility?: string;
  summary?: string;
  featuredImage?: string;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
  customFields?: Record<string, unknown>;
  scheduledAt?: Date | null;
  isHomePage?: boolean;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  canonicalUrl?: string;
  robotsMeta?: string;
  author?: string;
  parentId?: string;
  locale?: string;
  isHomepage?: boolean;
}

export interface ContentPageCreateParams {
  title: string;
  slug: string;
  contentTypeId: string;
  templateId?: string;
  status?: string;
  visibility?: string;
  summary?: string;
  featuredImage?: string;
  parentId?: string;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
  customFields?: Record<string, unknown>;
  publishedAt?: Date;
  scheduledAt?: Date;
  isHomePage?: boolean;
}

export interface ContentType {
  contentTypeId: string;
  name: string;
  slug: string;
  isActive: boolean;
  [key: string]: unknown;
}

export interface IContentRepository {
  // Page operations
  findPageById(pageId: string): Promise<ContentPageData | null>;
  findPageBySlug(slug: string, locale?: string): Promise<ContentPageData | null>;
  findPages(filters?: ContentPageFilters, pagination?: PaginationOptions): Promise<PaginatedResult<ContentPageData>>;
  findPublishedPages(locale?: string, pagination?: PaginationOptions): Promise<PaginatedResult<ContentPageData>>;
  savePage(page: ContentPageData): Promise<ContentPageData>;
  createPage(params: ContentPageCreateParams): Promise<ContentPageData>;
  updatePage(pageId: string, params: ContentPageUpdateParams): Promise<ContentPageData>;
  deletePage(pageId: string): Promise<boolean>;

  // Content type operations
  findContentTypeById(id: string): Promise<ContentType | null>;

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
