/**
 * Unit Tests for UnpublishPage Use Case
 */

import { lazyMock, createContentPage, emitMock } from '../../../tests/testUtils';
import { UnpublishPageUseCase, UnpublishPageCommand } from './UnpublishPage';
import { ContentPageNotFoundError, ContentValidationError } from '../../../domain/errors/ContentErrors';

describe('UnpublishPageUseCase', () => {
  let useCase: UnpublishPageUseCase;
  let mockRepo: jest.Mocked<ConstructorParameters<typeof UnpublishPageUseCase>[0]>;

  beforeEach(() => {
    mockRepo = lazyMock<ConstructorParameters<typeof UnpublishPageUseCase>[0]>();
    useCase = new UnpublishPageUseCase(mockRepo);
    emitMock.mockClear();
  });

  it('should revert a published page to draft and emit the unpublished event', async () => {
    mockRepo.findPageById.mockResolvedValue(createContentPage({ contentPageId: 'page-1', status: 'published' }));
    mockRepo.updatePage.mockResolvedValue(createContentPage({ contentPageId: 'page-1', status: 'draft' }));

    const result = await useCase.execute(new UnpublishPageCommand('page-1'));

    expect(result.status).toBe('draft');
    expect(mockRepo.updatePage).toHaveBeenCalledWith('page-1', { status: 'draft' });
    expect(emitMock).toHaveBeenCalledWith(
      'content.page.unpublished',
      expect.objectContaining({ pageId: 'page-1', title: 'Test Page', slug: 'test-page' }),
    );
  });

  it('should throw ContentValidationError when pageId is empty', async () => {
    await expect(useCase.execute(new UnpublishPageCommand(''))).rejects.toThrow(ContentValidationError);
  });

  it('should throw ContentPageNotFoundError when the page does not exist', async () => {
    mockRepo.findPageById.mockResolvedValue(null);

    await expect(useCase.execute(new UnpublishPageCommand('missing'))).rejects.toThrow(ContentPageNotFoundError);
    expect(mockRepo.updatePage).not.toHaveBeenCalled();
  });
});
