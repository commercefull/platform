import { lazyMock, createContentPage, createContentType, createContentBlockType, createContentTemplate, emitMock } from '../../tests/testUtils';
import { CreatePageUseCase, CreatePageCommand } from './CreatePage';
import { ContentTypeNotFoundError, ContentTemplateNotFoundError, ContentValidationError } from '../../domain/errors/ContentErrors';
import type { IContentRepository } from '../../domain/repositories/ContentRepository';

function makeContentRepo(overrides?: (repo: jest.Mocked<IContentRepository>) => void): jest.Mocked<IContentRepository> {
  const repo = lazyMock<IContentRepository>();
  repo.findContentTypeById.mockResolvedValue(createContentType({ contentTypeId: 'ct-1', name: 'Blog', slug: 'blog' }));
  repo.findBlockTypeById.mockResolvedValue(createContentBlockType({ contentBlockTypeId: 'bt-1', name: 'Text', slug: 'text' }));
  repo.findTemplateById.mockResolvedValue(createContentTemplate({ contentTemplateId: 't-1', name: 'Default', slug: 'default' }));
  repo.findPageById.mockResolvedValue(null);
  repo.findPageBySlug.mockResolvedValue(null);
  repo.findBlocksByPageId.mockResolvedValue([]);
  repo.reorderBlocks.mockResolvedValue(true);
  overrides?.(repo);
  return repo;
}

beforeEach(() => {
  emitMock.mockClear();
});

describe('CreatePageUseCase', () => {
  it('should create a page successfully', async () => {
    const repo = makeContentRepo((r) =>
      r.createPage.mockResolvedValue(createContentPage({ contentPageId: 'p1', title: 'About', slug: 'about' })),
    );
    const useCase = new CreatePageUseCase(repo);

    const result = await useCase.execute(new CreatePageCommand('About', 'about', 'ct-1'));

    expect(result.contentPageId).toBe('p1');
    expect(result.title).toBe('About');
    expect(emitMock).toHaveBeenCalledWith('content.page.created', expect.objectContaining({ pageId: 'p1' }));
  });

  it('should throw ContentValidationError when title or slug missing', async () => {
    const repo = makeContentRepo();
    const useCase = new CreatePageUseCase(repo);

    await expect(useCase.execute(new CreatePageCommand('', 'slug', 'ct-1'))).rejects.toThrow(ContentValidationError);
    await expect(useCase.execute(new CreatePageCommand('Title', '', 'ct-1'))).rejects.toThrow(ContentValidationError);
  });

  it('should throw ContentTypeNotFoundError when content type does not exist', async () => {
    const repo = makeContentRepo((r) => r.findContentTypeById.mockResolvedValue(null));
    const useCase = new CreatePageUseCase(repo);

    await expect(useCase.execute(new CreatePageCommand('Title', 'slug', 'missing'))).rejects.toThrow(ContentTypeNotFoundError);
  });

  it('should throw ContentTemplateNotFoundError when template does not exist', async () => {
    const repo = makeContentRepo((r) => r.findTemplateById.mockResolvedValue(null));
    const useCase = new CreatePageUseCase(repo);

    await expect(useCase.execute(new CreatePageCommand('Title', 'slug', 'ct-1', 'missing-tmpl'))).rejects.toThrow(
      ContentTemplateNotFoundError,
    );
  });
});
