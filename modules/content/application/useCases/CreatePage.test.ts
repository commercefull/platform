jest.mock('../../../../libs/events/eventBus', () => ({
  __esModule: true,
  eventBus: { emit: jest.fn() },
}));

import { CreatePageUseCase, CreatePageCommand } from './CreatePage';
import { ContentTypeNotFoundError, ContentTemplateNotFoundError, ContentValidationError } from '../../domain/errors/ContentErrors';
import { eventBus } from '../../../../libs/events/eventBus';

function makeContentRepo(overrides?: Partial<Record<string, jest.Mock>>): Record<string, jest.Mock> {
  return {
    findContentTypeById: jest.fn().mockResolvedValue({ contentTypeId: 'ct-1', name: 'Blog', slug: 'blog' }),
    findBlockTypeById: jest.fn().mockResolvedValue({ contentBlockTypeId: 'bt-1', name: 'Text', slug: 'text' }),
    findTemplateById: jest.fn().mockResolvedValue({ contentTemplateId: 't-1', name: 'Default', slug: 'default' }),
    findPageById: jest.fn().mockResolvedValue(null),
    findPageBySlug: jest.fn().mockResolvedValue(null),
    createPage: jest.fn(),
    updatePage: jest.fn(),
    findBlocksByPageId: jest.fn().mockResolvedValue([]),
    createBlock: jest.fn(),
    reorderBlocks: jest.fn().mockResolvedValue(undefined),
    createTemplate: jest.fn(),
    ...overrides,
  };
}

beforeEach(() => { jest.mocked(eventBus.emit).mockClear(); });

describe('CreatePageUseCase', () => {
  it('should create a page successfully', async () => {
    const repo = makeContentRepo({
      createPage: jest.fn().mockResolvedValue({
        contentPageId: 'p1', title: 'About', slug: 'about', contentTypeId: 'ct-1',
        templateId: null, status: 'draft', visibility: 'public', summary: null,
        isHomePage: false, createdAt: new Date(), updatedAt: new Date(),
      }),
    });
    const useCase = new CreatePageUseCase(repo as never);

    const result = await useCase.execute(new CreatePageCommand('About', 'about', 'ct-1'));

    expect(result.contentPageId).toBe('p1');
    expect(result.title).toBe('About');
    expect(eventBus.emit).toHaveBeenCalledWith('content.page.created', expect.objectContaining({ pageId: 'p1' }));
  });

  it('should throw ContentValidationError when title or slug missing', async () => {
    const repo = makeContentRepo();
    const useCase = new CreatePageUseCase(repo as never);

    await expect(useCase.execute(new CreatePageCommand('', 'slug', 'ct-1'))).rejects.toThrow(ContentValidationError);
    await expect(useCase.execute(new CreatePageCommand('Title', '', 'ct-1'))).rejects.toThrow(ContentValidationError);
  });

  it('should throw ContentTypeNotFoundError when content type does not exist', async () => {
    const repo = makeContentRepo({ findContentTypeById: jest.fn().mockResolvedValue(null) });
    const useCase = new CreatePageUseCase(repo as never);

    await expect(useCase.execute(new CreatePageCommand('Title', 'slug', 'missing'))).rejects.toThrow(ContentTypeNotFoundError);
  });

  it('should throw ContentTemplateNotFoundError when template does not exist', async () => {
    const repo = makeContentRepo({ findTemplateById: jest.fn().mockResolvedValue(null) });
    const useCase = new CreatePageUseCase(repo as never);

    await expect(useCase.execute(new CreatePageCommand('Title', 'slug', 'ct-1', 'missing-tmpl'))).rejects.toThrow(ContentTemplateNotFoundError);
  });
});
