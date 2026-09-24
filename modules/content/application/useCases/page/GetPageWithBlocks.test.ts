import { GetPageWithBlocksUseCase, GetPageWithBlocksQuery } from './GetPageWithBlocks';
import { ContentValidationError } from '../../../domain/errors/ContentErrors';
import { lazyMock, createContentPage, createContentBlock, createContentBlockType, createContentType } from '../../../tests/testUtils';

describe('GetPageWithBlocksUseCase', () => {
  let useCase: GetPageWithBlocksUseCase;
  let mockRepo: jest.Mocked<ConstructorParameters<typeof GetPageWithBlocksUseCase>[0]>;

  beforeEach(() => {
    mockRepo = lazyMock<ConstructorParameters<typeof GetPageWithBlocksUseCase>[0]>();
    mockRepo.findPageById.mockResolvedValue(null);
    mockRepo.findPageBySlug.mockResolvedValue(null);
    mockRepo.findBlocksByPageId.mockResolvedValue([]);
    mockRepo.findBlockTypeById.mockResolvedValue(createContentBlockType({ contentBlockTypeId: 'bt-1', name: 'Text', slug: 'text' }));
    mockRepo.findContentTypeById.mockResolvedValue(createContentType({ contentTypeId: 'ct-1', name: 'Blog', slug: 'blog' }));
    useCase = new GetPageWithBlocksUseCase(mockRepo);
  });

  it('should get page with blocks by ID', async () => {
    mockRepo.findPageById.mockResolvedValue(
      createContentPage({ contentPageId: 'p1', title: 'About', slug: 'about', status: 'published', visibility: 'public', summary: 'About us', contentTypeId: 'ct-1' }),
    );
    mockRepo.findBlocksByPageId.mockResolvedValue([
      createContentBlock({ contentBlockId: 'b1', title: 'Hero', sortOrder: 0, isVisible: true }),
    ]);

    const result = await useCase.execute(new GetPageWithBlocksQuery('p1'));

    expect(result).not.toBeNull();
    expect(result!.page.title).toBe('About');
    expect(result!.blocks).toHaveLength(1);
    expect(result!.blocks[0].contentType.name).toBe('Text');
  });

  it('should return null when page not found', async () => {
    const result = await useCase.execute(new GetPageWithBlocksQuery('missing'));

    expect(result).toBeNull();
  });

  it('should throw ContentValidationError when no identifier provided', async () => {
    await expect(useCase.execute(new GetPageWithBlocksQuery())).rejects.toThrow(ContentValidationError);
  });

  it('should filter inactive blocks by default', async () => {
    mockRepo.findPageById.mockResolvedValue(
      createContentPage({ contentPageId: 'p1', title: 'About', slug: 'about', status: 'published', visibility: 'public', summary: null, contentTypeId: 'ct-1' }),
    );
    mockRepo.findBlocksByPageId.mockResolvedValue([
      createContentBlock({ contentBlockId: 'b1', title: 'Visible', sortOrder: 0, isVisible: true }),
      createContentBlock({ contentBlockId: 'b2', title: 'Hidden', sortOrder: 1, isVisible: false }),
    ]);

    const result = await useCase.execute(new GetPageWithBlocksQuery('p1'));

    expect(result!.blocks).toHaveLength(1);
    expect(result!.blocks[0].title).toBe('Visible');
  });
});
