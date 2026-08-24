jest.mock('../../infrastructure/repositories/ContentDataRepository', () => ({
  __esModule: true,
  default: {
    pages: {
      findPageById: jest.fn().mockResolvedValue({ pageId: 'p1', title: 'Home' } as never),
      findPageBySlug: jest.fn().mockResolvedValue({ pageId: 'p1', title: 'Home' } as never),
      findHomePage: jest.fn().mockResolvedValue({ pageId: 'home', title: 'Home' } as never),
      findAllPages: jest.fn().mockResolvedValue([{ pageId: 'p1' }, { pageId: 'p2' }] as never),
      createPage: jest.fn().mockResolvedValue({ pageId: 'new', title: 'New' } as never),
      updatePage: jest.fn().mockResolvedValue({ pageId: 'p1', title: 'Updated' } as never),
      deletePage: jest.fn().mockResolvedValue(true),
      publishPage: jest.fn().mockResolvedValue({ pageId: 'p1', status: 'published' } as never),
      findBlockById: jest.fn().mockResolvedValue({ blockId: 'b1' } as never),
      findAllBlockTypes: jest.fn().mockResolvedValue([] as never),
      findContentTypeById: jest.fn().mockResolvedValue({ contentTypeId: 'ct1' } as never),
      findAllContentTypes: jest.fn().mockResolvedValue([] as never),
      createContentType: jest.fn().mockResolvedValue({ contentTypeId: 'new' } as never),
      updateContentType: jest.fn().mockResolvedValue({ contentTypeId: 'ct1' } as never),
      deleteContentType: jest.fn().mockResolvedValue(true),
    },
  },
}));

import { ManageContentUseCase } from './ManageContent';
import contentDataRepository from '../../infrastructure/repositories/ContentDataRepository';

const mockRepo = contentDataRepository.pages as unknown as Record<string, jest.Mock>;

describe('ManageContentUseCase', () => {
  let useCase: ManageContentUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new ManageContentUseCase();
  });

  it('should find page by ID', async () => {
    const result = await useCase.findPageById('p1') as unknown as { pageId: string };

    expect(result.pageId).toBe('p1');
    expect(mockRepo.findPageById).toHaveBeenCalledWith('p1');
  });

  it('should find page by slug', async () => {
    const result = await useCase.findPageBySlug('home') as unknown as { pageId: string };

    expect(result.pageId).toBe('p1');
    expect(mockRepo.findPageBySlug).toHaveBeenCalledWith('home');
  });

  it('should find home page', async () => {
    const result = await useCase.findHomePage() as unknown as { pageId: string };

    expect(result.pageId).toBe('home');
  });

  it('should create a page', async () => {
    const result = await useCase.createPage({ title: 'New', slug: 'new' } as never) as unknown as { pageId: string };

    expect(result.pageId).toBe('new');
    expect(mockRepo.createPage).toHaveBeenCalled();
  });

  it('should delete a page', async () => {
    await useCase.deletePage('p1');

    expect(mockRepo.deletePage).toHaveBeenCalledWith('p1');
  });

  it('should publish a page', async () => {
    const result = await useCase.publishPage('p1') as unknown as { status: string };

    expect(result.status).toBe('published');
  });
});
