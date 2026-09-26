import type {
  IContentRepository,
  ContentPageCreateParams,
  ContentPageUpdateParams,
  ContentTypeCreateParams,
  ContentTypeUpdateParams,
  ContentBlockCreateParams,
  ContentBlockUpdateParams,
  ContentTemplateUpdateParams,
} from '../../domain/repositories/ContentRepository';
import type { IContentCategoryRepository } from '../../domain/repositories/ContentCategoryRepository';
import type { IContentNavigationRepository } from '../../domain/repositories/ContentNavigationRepository';
import type { IContentMediaRepository } from '../../domain/repositories/ContentMediaRepository';
import type { IContentRedirectRepository } from '../../domain/repositories/ContentRedirectRepository';
import type {
  ContentPageVersion,
  ContentPageTranslation,
  ContentCategorization,
  ContentMediaUsage,
} from '../../../../libs/db/types';

export interface ContentVersionReadPort {
  findVersionsByPageId(pageId: string, limit?: number, offset?: number): Promise<ContentPageVersion[]>;
  findVersionById(id: string): Promise<ContentPageVersion | null>;
  deleteVersion(id: string): Promise<boolean>;
}

export interface ContentTranslationReadPort {
  findTranslationsByPageId(pageId: string): Promise<ContentPageTranslation[]>;
  findTranslationByPageAndLocale(pageId: string, localeId: string): Promise<ContentPageTranslation | null>;
}

export interface ContentCategorizationReadPort {
  findCategorizationsByPageId(pageId: string): Promise<ContentCategorization[]>;
  findCategorizationsByCategoryId(categoryId: string, limit?: number, offset?: number): Promise<ContentCategorization[]>;
}

export interface ContentMediaUsageReadPort {
  getUsageCount(mediaId: string): Promise<number>;
  findUsageByMediaId(mediaId: string): Promise<ContentMediaUsage[]>;
  findUsageByEntity(entityType: string, entityId: string): Promise<ContentMediaUsage[]>;
  deleteUsage(id: string): Promise<boolean>;
}

export interface ManageContentDeps {
  categories?: IContentCategoryRepository;
  navigation?: IContentNavigationRepository;
  media?: IContentMediaRepository;
  redirects?: IContentRedirectRepository;
  versions?: ContentVersionReadPort;
  translations?: ContentTranslationReadPort;
  categorization?: ContentCategorizationReadPort;
  mediaUsage?: ContentMediaUsageReadPort;
}

export class ManageContentUseCase {
  constructor(private readonly contentRepo: IContentRepository, private readonly deps: ManageContentDeps = {}) {}

  async findPageById(id: string) {
    return this.contentRepo.findPageById(id);
  }
  async findPageBySlug(slug: string) {
    return this.contentRepo.findPageBySlug(slug);
  }
  async findHomePage() {
    return this.contentRepo.findHomePage();
  }
  async findAllPages(...args: Parameters<IContentRepository['findAllPages']>) {
    return this.contentRepo.findAllPages(...args);
  }
  async createPage(params: ContentPageCreateParams) {
    return this.contentRepo.createPage(params);
  }
  async updatePage(id: string, params: ContentPageUpdateParams) {
    return this.contentRepo.updatePage(id, params);
  }
  async deletePage(id: string) {
    return this.contentRepo.deletePage(id);
  }
  async publishPage(id: string) {
    return this.contentRepo.publishPage(id);
  }
  async findBlockById(id: string) {
    return this.contentRepo.findBlockById(id);
  }
  async findBlocksByPageId(pageId: string) {
    return this.contentRepo.findBlocksByPageId(pageId);
  }
  async createBlock(params: ContentBlockCreateParams) {
    return this.contentRepo.createBlock(params);
  }
  async updateBlock(id: string, params: ContentBlockUpdateParams) {
    return this.contentRepo.updateBlock(id, params);
  }
  async deleteBlock(id: string) {
    return this.contentRepo.deleteBlock(id);
  }
  async reorderBlocks(pageId: string, blockOrders: Array<{ id: string; order: number }>) {
    return this.contentRepo.reorderBlocks(pageId, blockOrders);
  }
  async findBlockTypeById(id: string) {
    return this.contentRepo.findBlockTypeById(id);
  }
  async findAllBlockTypes(...args: Parameters<IContentRepository['findAllBlockTypes']>) {
    return this.contentRepo.findAllBlockTypes(...args);
  }
  async findAllTemplates(...args: Parameters<IContentRepository['findAllTemplates']>) {
    return this.contentRepo.findAllTemplates(...args);
  }
  async findTemplateById(id: string) {
    return this.contentRepo.findTemplateById(id);
  }
  async findContentTypeById(id: string) {
    return this.contentRepo.findContentTypeById(id);
  }
  async findAllContentTypes(...args: Parameters<IContentRepository['findAllContentTypes']>) {
    return this.contentRepo.findAllContentTypes(...args);
  }
  async createContentType(params: ContentTypeCreateParams) {
    return this.contentRepo.createContentType(params);
  }
  async updateContentType(id: string, params: ContentTypeUpdateParams) {
    return this.contentRepo.updateContentType(id, params);
  }
  async deleteContentType(id: string) {
    return this.contentRepo.deleteContentType(id);
  }

  async findContentTypeBySlug(slug: string) {
    return this.contentRepo.findContentTypeBySlug(slug);
  }
  async updateTemplate(id: string, params: ContentTemplateUpdateParams) {
    return this.contentRepo.updateTemplate(id, params);
  }
  async deleteTemplate(id: string) {
    return this.contentRepo.deleteTemplate(id);
  }

  // ============================================================================
  // Categories
  // ============================================================================

  private requireDep<K extends keyof ManageContentDeps>(key: K): NonNullable<ManageContentDeps[K]> {
    const dep = this.deps[key];
    if (!dep) throw new Error(`ManageContentUseCase: '${key}' repository not wired`);
    return dep;
  }

  async getCategoryTree(isActive?: boolean) {
    return this.requireDep('categories').getCategoryTree(isActive);
  }
  async findCategoryById(id: string) {
    return this.requireDep('categories').findCategoryById(id);
  }
  async findAllCategories(parentId?: string, isActive?: boolean, limit?: number, offset?: number) {
    return this.requireDep('categories').findAllCategories(parentId, isActive, limit, offset);
  }

  // ============================================================================
  // Navigation
  // ============================================================================

  async findNavigationById(id: string) {
    return this.requireDep('navigation').findNavigationById(id);
  }
  async findAllNavigations(isActive?: boolean) {
    return this.requireDep('navigation').findAllNavigations(isActive);
  }
  async deleteNavigation(id: string) {
    return this.requireDep('navigation').deleteNavigation(id);
  }
  async findAllNavigationItems(navigationId: string) {
    return this.requireDep('navigation').findAllNavigationItems(navigationId);
  }
  async updateNavigationItem(id: string, params: Parameters<IContentNavigationRepository['updateNavigationItem']>[1]) {
    return this.requireDep('navigation').updateNavigationItem(id, params);
  }
  async deleteNavigationItem(id: string) {
    return this.requireDep('navigation').deleteNavigationItem(id);
  }
  async reorderNavigationItems(navigationId: string, itemOrders: Array<{ id: string; order: number }>) {
    return this.requireDep('navigation').reorderNavigationItems(navigationId, itemOrders);
  }

  // ============================================================================
  // Media
  // ============================================================================

  async findMediaById(id: string) {
    return this.requireDep('media').findMediaById(id);
  }
  async findAllMedia(folderId?: string, fileType?: string, limit?: number, offset?: number) {
    return this.requireDep('media').findAllMedia(folderId, fileType, limit, offset);
  }
  async updateMedia(id: string, params: Parameters<IContentMediaRepository['updateMedia']>[1]) {
    return this.requireDep('media').updateMedia(id, params);
  }
  async findAllFolders(parentId?: string) {
    return this.requireDep('media').findAllFolders(parentId);
  }
  async updateFolder(id: string, params: Parameters<IContentMediaRepository['updateFolder']>[1]) {
    return this.requireDep('media').updateFolder(id, params);
  }
  async deleteFolder(id: string) {
    return this.requireDep('media').deleteFolder(id);
  }

  // ============================================================================
  // Redirects
  // ============================================================================

  async findRedirectById(id: string) {
    return this.requireDep('redirects').findRedirectById(id);
  }
  async findAllRedirects(isActive?: boolean, limit?: number, offset?: number) {
    return this.requireDep('redirects').findAllRedirects(isActive, limit, offset);
  }

  // ============================================================================
  // Page Versions
  // ============================================================================

  async findVersionsByPageId(pageId: string, limit?: number, offset?: number) {
    return this.requireDep('versions').findVersionsByPageId(pageId, limit, offset);
  }
  async findVersionById(id: string) {
    return this.requireDep('versions').findVersionById(id);
  }
  async deleteVersion(id: string) {
    return this.requireDep('versions').deleteVersion(id);
  }

  // ============================================================================
  // Page Translations
  // ============================================================================

  async findTranslationsByPageId(pageId: string) {
    return this.requireDep('translations').findTranslationsByPageId(pageId);
  }
  async findTranslationByPageAndLocale(pageId: string, localeId: string) {
    return this.requireDep('translations').findTranslationByPageAndLocale(pageId, localeId);
  }

  // ============================================================================
  // Categorization
  // ============================================================================

  async findCategorizationsByPageId(pageId: string) {
    return this.requireDep('categorization').findCategorizationsByPageId(pageId);
  }
  async findCategorizationsByCategoryId(categoryId: string, limit?: number, offset?: number) {
    return this.requireDep('categorization').findCategorizationsByCategoryId(categoryId, limit, offset);
  }

  // ============================================================================
  // Media Usage
  // ============================================================================

  async getMediaUsageCount(mediaId: string) {
    return this.requireDep('mediaUsage').getUsageCount(mediaId);
  }
  async findUsageByMediaId(mediaId: string) {
    return this.requireDep('mediaUsage').findUsageByMediaId(mediaId);
  }
  async findUsageByEntity(entityType: string, entityId: string) {
    return this.requireDep('mediaUsage').findUsageByEntity(entityType, entityId);
  }
  async deleteMediaUsage(id: string) {
    return this.requireDep('mediaUsage').deleteUsage(id);
  }
}
