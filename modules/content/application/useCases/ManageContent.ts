import contentDataRepository from '../../infrastructure/repositories/ContentDataRepository';

const contentRepo = contentDataRepository.pages;

export class ManageContentUseCase {
  async findPageById(id: string) {
    return contentRepo.findPageById(id);
  }
  async findPageBySlug(slug: string) {
    return contentRepo.findPageBySlug(slug);
  }
  async findHomePage() {
    return contentRepo.findHomePage();
  }
  async findAllPages(...args: Parameters<typeof contentRepo.findAllPages>) {
    return contentRepo.findAllPages(...args);
  }
  async createPage(params: Parameters<typeof contentRepo.createPage>[0]) {
    return contentRepo.createPage(params);
  }
  async updatePage(id: string, params: Parameters<typeof contentRepo.updatePage>[1]) {
    return contentRepo.updatePage(id, params);
  }
  async deletePage(id: string) {
    return contentRepo.deletePage(id);
  }
  async publishPage(id: string) {
    return contentRepo.publishPage(id);
  }
  async findBlockById(id: string) {
    return contentRepo.findBlockById(id);
  }
  async findAllBlockTypes(...args: Parameters<typeof contentRepo.findAllBlockTypes>) {
    return contentRepo.findAllBlockTypes(...args);
  }
  async findContentTypeById(id: string) {
    return contentRepo.findContentTypeById(id);
  }
  async findAllContentTypes(...args: Parameters<typeof contentRepo.findAllContentTypes>) {
    return contentRepo.findAllContentTypes(...args);
  }
  async createContentType(params: Parameters<typeof contentRepo.createContentType>[0]) {
    return contentRepo.createContentType(params);
  }
  async updateContentType(id: string, params: Parameters<typeof contentRepo.updateContentType>[1]) {
    return contentRepo.updateContentType(id, params);
  }
  async deleteContentType(id: string) {
    return contentRepo.deleteContentType(id);
  }
}
