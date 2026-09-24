/**
 * Unit Tests for PublishPage Use Case
 */

import { lazyMock, createContentPage, emitMock } from '../../tests/testUtils';
import { PublishPageUseCase, PublishPageCommand } from './PublishPage';
import { ContentPageNotFoundError, ContentValidationError } from '../../domain/errors/ContentErrors';

describe('PublishPageUseCase', () => {
  let useCase: PublishPageUseCase;
  let mockRepo: jest.Mocked<ConstructorParameters<typeof PublishPageUseCase>[0]>;

  beforeEach(() => {
    mockRepo = lazyMock<ConstructorParameters<typeof PublishPageUseCase>[0]>();
    useCase = new PublishPageUseCase(mockRepo);
    emitMock.mockClear();
  });

  it('should publish a draft page', async () => {
    mockRepo.findPageById.mockResolvedValue(createContentPage({ contentPageId: 'page-1', title: 'About Us', slug: 'about-us' }));
    mockRepo.updatePage.mockResolvedValue(
      createContentPage({ contentPageId: 'page-1', title: 'About Us', slug: 'about-us', status: 'published', publishedAt: new Date('2024-06-01') }),
    );

    const result = await useCase.execute(new PublishPageCommand('page-1', 'user-1'));

    expect(result.contentPageId).toBe('page-1');
    expect(result.status).toBe('published');
    expect(result.publishedAt).toBeDefined();
    expect(mockRepo.updatePage).toHaveBeenCalledWith(
      'page-1',
      expect.objectContaining({
        status: 'published',
      }),
    );
    expect(emitMock).toHaveBeenCalledWith(
      'content.page.published',
      expect.objectContaining({
        pageId: 'page-1',
        title: 'About Us',
      }),
    );
  });

  it('should throw ContentValidationError when pageId is empty', async () => {
    await expect(useCase.execute(new PublishPageCommand(''))).rejects.toThrow(ContentValidationError);
  });

  it('should throw ContentPageNotFoundError when page does not exist', async () => {
    mockRepo.findPageById.mockResolvedValue(null);

    await expect(useCase.execute(new PublishPageCommand('page-x'))).rejects.toThrow(ContentPageNotFoundError);
  });

  it('should throw ContentValidationError when page is already published', async () => {
    mockRepo.findPageById.mockResolvedValue(createContentPage({ contentPageId: 'page-1', title: 'About Us', slug: 'about-us', status: 'published' }));

    await expect(useCase.execute(new PublishPageCommand('page-1'))).rejects.toThrow(ContentValidationError);
  });
});
