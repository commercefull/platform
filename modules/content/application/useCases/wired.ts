import contentDataRepository from '../../infrastructure/repositories/ContentDataRepository';
import { CreatePageUseCase } from './CreatePage';
import { UpdatePageUseCase } from './UpdatePage';
import { PublishPageUseCase } from './PublishPage';

const contentRepo = contentDataRepository.pages;

export const createPageUseCase = new CreatePageUseCase(contentRepo);
export const updatePageUseCase = new UpdatePageUseCase(contentRepo);
export const publishPageUseCase = new PublishPageUseCase(contentRepo);

export const manageContentUseCase = new (class {
  findPageById = (id: string) => contentRepo.findPageById(id);
  findPageBySlug = (slug: string) => contentRepo.findPageBySlug(slug);
  findHomePage = () => contentRepo.findHomePage();
  findAllPages = (...args: Parameters<typeof contentRepo.findAllPages>) => contentRepo.findAllPages(...args);
  deletePage = (id: string) => contentRepo.deletePage(id);
  findBlockById = (id: string) => contentRepo.findBlockById(id);
  findAllBlockTypes = (...args: Parameters<typeof contentRepo.findAllBlockTypes>) => contentRepo.findAllBlockTypes(...args);
  findBlocksByPageId = (pageId: string) => contentRepo.findBlocksByPageId(pageId);
  createBlock = (params: Parameters<typeof contentRepo.createBlock>[0]) => contentRepo.createBlock(params);
  updateBlock = (id: string, params: Parameters<typeof contentRepo.updateBlock>[1]) => contentRepo.updateBlock(id, params);
  deleteBlock = (id: string) => contentRepo.deleteBlock(id);
  reorderBlocks = (pageId: string, blockOrders: Parameters<typeof contentRepo.reorderBlocks>[1]) => contentRepo.reorderBlocks(pageId, blockOrders);
  findAllContentTypes = (...args: Parameters<typeof contentRepo.findAllContentTypes>) => contentRepo.findAllContentTypes(...args);
  findContentTypeById = (id: string) => contentRepo.findContentTypeById(id);
  findAllTemplates = (...args: Parameters<typeof contentRepo.findAllTemplates>) => contentRepo.findAllTemplates(...args);
  findBlockTypeById = (id: string) => contentRepo.findBlockTypeById(id);
})();
