import type {
  IContentRepository,
  ContentPageCreateParams,
  ContentPageUpdateParams,
  ContentTypeCreateParams,
  ContentTypeUpdateParams,
  ContentBlockCreateParams,
  ContentBlockUpdateParams,
} from '../../domain/repositories/ContentRepository';

export class ManageContentUseCase {
  constructor(private readonly contentRepo: IContentRepository) {}

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
}
