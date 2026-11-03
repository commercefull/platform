import type {
  ContentBlock,
  ContentBlockType,
  ContentPage,
  ContentPagePublication,
  ContentTemplate,
  ContentType,
} from '../../../../libs/db/types';
import type { ContentPublicationContext, IContentRepository } from '../../domain/repositories/ContentRepository';
import { ContentTypeRepo, ContentTypeCreateParams, ContentTypeUpdateParams } from './contentTypeRepo';
import { ContentPageRepo, ContentPageCreateParams, ContentPageUpdateParams } from './contentPageRepo';
import { ContentBlockRepo, ContentBlockCreateParams, ContentBlockUpdateParams } from './contentBlockRepo';
import { ContentTemplateRepo, ContentTemplateCreateParams, ContentTemplateUpdateParams } from './contentTemplateRepo';

/**
 * Content repository facade — preserves the original ContentRepo surface while
 * delegating to per-aggregate repositories (types, pages, blocks, templates).
 */
class ContentRepo implements IContentRepository {
  private readonly types = new ContentTypeRepo();
  private readonly pages = new ContentPageRepo();
  private readonly blocks = new ContentBlockRepo();
  private readonly templates = new ContentTemplateRepo();

  // Content Block Type methods
  findBlockTypeById(id: string): Promise<ContentBlockType | null> {
    return this.types.findBlockTypeById(id);
  }

  findAllBlockTypes(isActive?: boolean, limit?: number, offset?: number): Promise<ContentBlockType[]> {
    return this.types.findAllBlockTypes(isActive, limit, offset);
  }

  // Content Type methods
  findContentTypeById(id: string): Promise<ContentType | null> {
    return this.types.findContentTypeById(id);
  }

  findContentTypeBySlug(slug: string): Promise<ContentType | null> {
    return this.types.findContentTypeBySlug(slug);
  }

  findAllContentTypes(isActive?: boolean, limit?: number, offset?: number): Promise<ContentType[]> {
    return this.types.findAllContentTypes(isActive, limit, offset);
  }

  createContentType(params: ContentTypeCreateParams): Promise<ContentType> {
    return this.types.createContentType(params);
  }

  updateContentType(id: string, params: ContentTypeUpdateParams): Promise<ContentType> {
    return this.types.updateContentType(id, params);
  }

  deleteContentType(id: string): Promise<boolean> {
    return this.types.deleteContentType(id);
  }

  // Content Page methods
  findPageById(id: string): Promise<ContentPage | null> {
    return this.pages.findPageById(id);
  }

  findPageBySlug(slug: string): Promise<ContentPage | null> {
    return this.pages.findPageBySlug(slug);
  }

  findHomePage(): Promise<ContentPage | null> {
    return this.pages.findHomePage();
  }

  findAllPages(
    status?: ContentPage['status'],
    contentTypeId?: string,
    limit?: number,
    offset?: number,
    search?: string,
  ): Promise<ContentPage[]> {
    return this.pages.findAllPages(status, contentTypeId, limit, offset, search);
  }

  createPage(params: ContentPageCreateParams): Promise<ContentPage> {
    return this.pages.createPage(params);
  }

  updatePage(id: string, params: ContentPageUpdateParams): Promise<ContentPage> {
    return this.pages.updatePage(id, params);
  }

  deletePage(id: string): Promise<boolean> {
    return this.pages.deletePage(id);
  }

  publishPage(id: string): Promise<ContentPage> {
    return this.pages.publishPage(id);
  }

  // Content Page Publication methods
  findPagePublications(contentPageId: string): Promise<ContentPagePublication[]> {
    return this.pages.findPagePublications(contentPageId);
  }

  createPagePublication(params: {
    contentPageId: string;
    storeId: string;
    channelId?: string | null;
    locale?: string | null;
  }): Promise<ContentPagePublication> {
    return this.pages.createPagePublication(params);
  }

  deletePagePublication(contentPagePublicationId: string): Promise<boolean> {
    return this.pages.deletePagePublication(contentPagePublicationId);
  }

  findPagePublicationByContext(
    contentPageId: string,
    storeId: string,
    channelId?: string | null,
    locale?: string | null,
  ): Promise<ContentPagePublication | null> {
    return this.pages.findPagePublicationByContext(contentPageId, storeId, channelId, locale);
  }

  findPublishedPageBySlugForContext(slug: string, context: ContentPublicationContext): Promise<ContentPage | null> {
    return this.pages.findPublishedPageBySlugForContext(slug, context);
  }

  findPublishedPagesForContext(context: ContentPublicationContext, limit?: number, offset?: number): Promise<ContentPage[]> {
    return this.pages.findPublishedPagesForContext(context, limit, offset);
  }

  // Content Block methods
  findBlockById(id: string): Promise<ContentBlock | null> {
    return this.blocks.findBlockById(id);
  }

  findBlocksByPageId(pageId: string): Promise<ContentBlock[]> {
    return this.blocks.findBlocksByPageId(pageId);
  }

  createBlock(params: ContentBlockCreateParams): Promise<ContentBlock> {
    return this.blocks.createBlock(params);
  }

  updateBlock(id: string, params: ContentBlockUpdateParams): Promise<ContentBlock> {
    return this.blocks.updateBlock(id, params);
  }

  deleteBlock(id: string): Promise<boolean> {
    return this.blocks.deleteBlock(id);
  }

  reorderBlocks(pageId: string, blockOrders: Array<{ id: string; order: number }>): Promise<boolean> {
    return this.blocks.reorderBlocks(pageId, blockOrders);
  }

  // Content Template methods
  findTemplateById(id: string): Promise<ContentTemplate | null> {
    return this.templates.findTemplateById(id);
  }

  findAllTemplates(isActive?: boolean, limit?: number, offset?: number): Promise<ContentTemplate[]> {
    return this.templates.findAllTemplates(isActive, limit, offset);
  }

  createTemplate(params: ContentTemplateCreateParams): Promise<ContentTemplate> {
    return this.templates.createTemplate(params);
  }

  updateTemplate(id: string, params: ContentTemplateUpdateParams): Promise<ContentTemplate> {
    return this.templates.updateTemplate(id, params);
  }

  deleteTemplate(id: string): Promise<boolean> {
    return this.templates.deleteTemplate(id);
  }
}

export default new ContentRepo();
