/**
 * Unit Tests for CreatePageVersion Use Case
 */

import { lazyMock, createContentPage, emitMock } from '../../../tests/testUtils';
import { CreatePageVersionUseCase, CreatePageVersionCommand } from './CreatePageVersion';
import { ContentPageNotFoundError, ContentValidationError } from '../../../domain/errors/ContentErrors';

const versionRecord = {
  contentPageVersionId: 'version-1',
  contentPageId: 'page-1',
  version: 3,
  title: 'Test Page',
  status: 'draft',
};

describe('CreatePageVersionUseCase', () => {
  let useCase: CreatePageVersionUseCase;
  let mockContentRepo: jest.Mocked<ConstructorParameters<typeof CreatePageVersionUseCase>[0]>;
  let mockVersionRepo: jest.Mocked<ConstructorParameters<typeof CreatePageVersionUseCase>[1]>;

  beforeEach(() => {
    mockContentRepo = lazyMock<ConstructorParameters<typeof CreatePageVersionUseCase>[0]>();
    mockVersionRepo = lazyMock<ConstructorParameters<typeof CreatePageVersionUseCase>[1]>();
    useCase = new CreatePageVersionUseCase(mockContentRepo, mockVersionRepo);
    emitMock.mockClear();
  });

  it('should snapshot the page and emit the version_created event', async () => {
    mockContentRepo.findPageById.mockResolvedValue(
      createContentPage({ contentPageId: 'page-1', title: 'Test Page', status: 'published', summary: 'A summary', customFields: { hero: 'x' } }),
    );
    mockVersionRepo.createVersion.mockResolvedValue(versionRecord);

    const result = await useCase.execute(new CreatePageVersionCommand('page-1', 'my comment'));

    expect(result.contentPageVersionId).toBe('version-1');
    expect(mockVersionRepo.createVersion).toHaveBeenCalledWith(
      expect.objectContaining({
        contentPageId: 'page-1',
        title: 'Test Page',
        status: 'published',
        summary: 'A summary',
        content: { hero: 'x' },
        customFields: { hero: 'x' },
        comment: 'my comment',
      }),
    );
    expect(emitMock).toHaveBeenCalledWith(
      'content.page.version_created',
      expect.objectContaining({ pageId: 'page-1', versionId: 'version-1', version: 3 }),
    );
  });

  it('should default the comment when none is provided', async () => {
    mockContentRepo.findPageById.mockResolvedValue(createContentPage({ contentPageId: 'page-1', title: 'Test Page' }));
    mockVersionRepo.createVersion.mockResolvedValue(versionRecord);

    await useCase.execute(new CreatePageVersionCommand('page-1'));

    expect(mockVersionRepo.createVersion).toHaveBeenCalledWith(
      expect.objectContaining({ comment: 'Version snapshot of "Test Page"' }),
    );
  });

  it('should throw ContentValidationError when pageId is empty', async () => {
    await expect(useCase.execute(new CreatePageVersionCommand(''))).rejects.toThrow(ContentValidationError);
  });

  it('should throw ContentPageNotFoundError when the page does not exist', async () => {
    mockContentRepo.findPageById.mockResolvedValue(null);

    await expect(useCase.execute(new CreatePageVersionCommand('missing'))).rejects.toThrow(ContentPageNotFoundError);
    expect(mockVersionRepo.createVersion).not.toHaveBeenCalled();
  });
});
