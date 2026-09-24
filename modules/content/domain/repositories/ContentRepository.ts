/**
 * Content Repository Interface
 *
 * Defines the contract for Content persistence operations.
 */

import type {
  ContentBlockRecord as ContentBlock,
  ContentBlockType,
  ContentPageRecord as ContentPage,
  ContentTemplate,
  ContentTypeRecord as ContentType,
} from '../entities/ContentModel';

// Create / Update params derived from generated types
export type ContentPageCreateParams = Partial<
  Omit<ContentPage, 'contentPageId' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy' | 'publishedBy' | 'path' | 'depth'>
> & { title: string; slug: string; contentTypeId: string; status: string; visibility: string };
export type ContentPageUpdateParams = Partial<
  Omit<ContentPage, 'contentPageId' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy' | 'publishedBy'>
>;
export type ContentBlockCreateParams = Omit<
  ContentBlock,
  | 'contentBlockId'
  | 'createdAt'
  | 'updatedAt'
  | 'createdBy'
  | 'updatedBy'
  | 'parentBlockId'
  | 'cssClasses'
  | 'conditions'
  | 'settings'
  | 'area'
>;
export type ContentBlockUpdateParams = Partial<Omit<ContentBlock, 'contentBlockId' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy'>>;
export type ContentTemplateCreateParams = Omit<ContentTemplate, 'contentTemplateId' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy'>;
export type ContentTemplateUpdateParams = Partial<
  Omit<ContentTemplate, 'contentTemplateId' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy'>
>;
export type ContentTypeCreateParams = Omit<ContentType, 'contentTypeId' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy'>;
export type ContentTypeUpdateParams = Partial<Omit<ContentType, 'contentTypeId' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy'>>;

export interface IContentRepository {
  // Content Block Type methods
  findBlockTypeById(id: string): Promise<ContentBlockType | null>;
  findAllBlockTypes(isActive?: boolean, limit?: number, offset?: number): Promise<ContentBlockType[]>;

  // Content Type methods
  findContentTypeById(id: string): Promise<ContentType | null>;
  findContentTypeBySlug(slug: string): Promise<ContentType | null>;
  findAllContentTypes(isActive?: boolean, limit?: number, offset?: number): Promise<ContentType[]>;
  createContentType(params: ContentTypeCreateParams): Promise<ContentType>;
  updateContentType(id: string, params: ContentTypeUpdateParams): Promise<ContentType>;
  deleteContentType(id: string): Promise<boolean>;

  // Content Page methods
  findPageById(id: string): Promise<ContentPage | null>;
  findPageBySlug(slug: string): Promise<ContentPage | null>;
  findHomePage(): Promise<ContentPage | null>;
  findAllPages(status?: ContentPage['status'], contentTypeId?: string, limit?: number, offset?: number, search?: string): Promise<ContentPage[]>;
  createPage(params: ContentPageCreateParams): Promise<ContentPage>;
  updatePage(id: string, params: ContentPageUpdateParams): Promise<ContentPage>;
  deletePage(id: string): Promise<boolean>;
  publishPage(id: string): Promise<ContentPage>;

  // Content Block methods
  findBlockById(id: string): Promise<ContentBlock | null>;
  findBlocksByPageId(pageId: string): Promise<ContentBlock[]>;
  createBlock(params: ContentBlockCreateParams): Promise<ContentBlock>;
  updateBlock(id: string, params: ContentBlockUpdateParams): Promise<ContentBlock>;
  deleteBlock(id: string): Promise<boolean>;
  reorderBlocks(pageId: string, blockOrders: Array<{ id: string; order: number }>): Promise<boolean>;

  // Content Template methods
  findTemplateById(id: string): Promise<ContentTemplate | null>;
  findAllTemplates(isActive?: boolean, limit?: number, offset?: number): Promise<ContentTemplate[]>;
  createTemplate(params: ContentTemplateCreateParams): Promise<ContentTemplate>;
  updateTemplate(id: string, params: ContentTemplateUpdateParams): Promise<ContentTemplate>;
  deleteTemplate(id: string): Promise<boolean>;
}
