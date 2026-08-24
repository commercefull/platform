import { GetPageWithBlocksUseCase, GetPageWithBlocksQuery } from './GetPageWithBlocks';
import { ContentValidationError } from '../../../domain/errors/ContentErrors';

describe('GetPageWithBlocksUseCase', () => {
  let useCase: GetPageWithBlocksUseCase;
  let mockRepo: Record<string, jest.Mock>;

  beforeEach(() => {
    mockRepo = {
      findPageById: jest.fn().mockResolvedValue(null),
      findPageBySlug: jest.fn().mockResolvedValue(null),
      findBlocksByPageId: jest.fn().mockResolvedValue([]),
      findBlockTypeById: jest.fn().mockResolvedValue({ contentBlockTypeId: 'bt-1', name: 'Text', slug: 'text' }),
      findContentTypeById: jest.fn().mockResolvedValue({ contentTypeId: 'ct-1', name: 'Blog', slug: 'blog' }),
    };
    useCase = new GetPageWithBlocksUseCase(mockRepo as never);
  });

  it('should get page with blocks by ID', async () => {
    mockRepo.findPageById.mockResolvedValue({
      contentPageId: 'p1', title: 'About', slug: 'about', status: 'published', visibility: 'public',
      summary: 'About us', featuredImage: null, metaTitle: null, metaDescription: null, publishedAt: null,
      contentTypeId: 'ct-1', templateId: null, createdAt: new Date(), updatedAt: new Date(),
    });
    mockRepo.findBlocksByPageId.mockResolvedValue([
      { contentBlockId: 'b1', blockTypeId: 'bt-1', title: 'Hero', sortOrder: 0, content: {}, isVisible: true },
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
    mockRepo.findPageById.mockResolvedValue({
      contentPageId: 'p1', title: 'About', slug: 'about', status: 'published', visibility: 'public',
      summary: null, featuredImage: null, metaTitle: null, metaDescription: null, publishedAt: null,
      contentTypeId: 'ct-1', templateId: null, createdAt: new Date(), updatedAt: new Date(),
    });
    mockRepo.findBlocksByPageId.mockResolvedValue([
      { contentBlockId: 'b1', blockTypeId: 'bt-1', title: 'Visible', sortOrder: 0, content: {}, isVisible: true },
      { contentBlockId: 'b2', blockTypeId: 'bt-1', title: 'Hidden', sortOrder: 1, content: {}, isVisible: false },
    ]);

    const result = await useCase.execute(new GetPageWithBlocksQuery('p1'));

    expect(result!.blocks).toHaveLength(1);
    expect(result!.blocks[0].title).toBe('Visible');
  });
});
