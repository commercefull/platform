import { lazyMock, createContentPage, createContentBlock, createContentBlockType, createContentType } from '../../tests/testUtils';
import { ManageContentUseCase } from './ManageContent';
import type { IContentRepository, ContentTypeCreateParams } from '../../domain/repositories/ContentRepository';

describe('ManageContentUseCase', () => {
  let useCase: ManageContentUseCase;
  let repo: jest.Mocked<IContentRepository>;

  beforeEach(() => {
    repo = lazyMock<IContentRepository>();
    useCase = new ManageContentUseCase(repo);
  });

  it('should find a page by ID', async () => {
    repo.findPageById.mockResolvedValue(createContentPage({ contentPageId: 'p1', title: 'Home' }));

    const result = await useCase.findPageById('p1');

    expect(result?.contentPageId).toBe('p1');
    expect(repo.findPageById).toHaveBeenCalledWith('p1');
  });

  it('should find a page by slug', async () => {
    repo.findPageBySlug.mockResolvedValue(createContentPage({ slug: 'home' }));

    const result = await useCase.findPageBySlug('home');

    expect(result?.slug).toBe('home');
    expect(repo.findPageBySlug).toHaveBeenCalledWith('home');
  });

  it('should find the home page', async () => {
    repo.findHomePage.mockResolvedValue(createContentPage({ contentPageId: 'home', title: 'Home' }));

    const result = await useCase.findHomePage();

    expect(result?.contentPageId).toBe('home');
  });

  it('should create a page', async () => {
    repo.createPage.mockResolvedValue(createContentPage({ contentPageId: 'new', title: 'New' }));
    const params = { title: 'New', slug: 'new', contentTypeId: 'ct-1', status: 'draft', visibility: 'public' };

    const result = await useCase.createPage(params);

    expect(result.contentPageId).toBe('new');
    expect(repo.createPage).toHaveBeenCalledWith(params);
  });

  it('should delete a page', async () => {
    repo.deletePage.mockResolvedValue(true);

    await useCase.deletePage('p1');

    expect(repo.deletePage).toHaveBeenCalledWith('p1');
  });

  it('should publish a page', async () => {
    repo.publishPage.mockResolvedValue(createContentPage({ contentPageId: 'p1', status: 'published' }));

    const result = await useCase.publishPage('p1');

    expect(result.status).toBe('published');
  });

  it('should find blocks by page', async () => {
    repo.findBlocksByPageId.mockResolvedValue([createContentBlock({ contentPageId: 'p1' })]);

    const result = await useCase.findBlocksByPageId('p1');

    expect(result).toHaveLength(1);
  });

  it('should reorder blocks', async () => {
    repo.reorderBlocks.mockResolvedValue(true);

    await useCase.reorderBlocks('p1', [{ id: 'b1', order: 0 }]);

    expect(repo.reorderBlocks).toHaveBeenCalledWith('p1', [{ id: 'b1', order: 0 }]);
  });

  it('should find a block type by ID', async () => {
    repo.findBlockTypeById.mockResolvedValue(createContentBlockType({ contentBlockTypeId: 'bt-1' }));

    const result = await useCase.findBlockTypeById('bt-1');

    expect(result?.contentBlockTypeId).toBe('bt-1');
  });

  it('should manage content types', async () => {
    repo.createContentType.mockResolvedValue(createContentType({ contentTypeId: 'new' }));
    repo.updateContentType.mockResolvedValue(createContentType({ contentTypeId: 'ct-1', name: 'Renamed' }));
    repo.deleteContentType.mockResolvedValue(true);

    const created = await useCase.createContentType({ name: 'New', slug: 'new' } as unknown as ContentTypeCreateParams);
    const updated = await useCase.updateContentType('ct-1', { name: 'Renamed' });
    await useCase.deleteContentType('ct-1');

    expect(created.contentTypeId).toBe('new');
    expect(updated.name).toBe('Renamed');
    expect(repo.deleteContentType).toHaveBeenCalledWith('ct-1');
  });
});
