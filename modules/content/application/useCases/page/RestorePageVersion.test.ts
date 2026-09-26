/**
 * Unit Tests for RestorePageVersion Use Case
 */

import { lazyMock, createContentPage, emitMock } from '../../../tests/testUtils';
import { RestorePageVersionUseCase, RestorePageVersionCommand } from './RestorePageVersion';
import { ContentPageNotFoundError, ContentValidationError } from '../../../domain/errors/ContentErrors';
import { NotFoundError } from '../../../../../libs/errors';

const versionSnapshot = {
  contentPageVersionId: 'version-1',
  contentPageId: 'page-1',
  version: 2,
  title: 'Old Title',
  status: 'published',
  summary: 'old summary',
  customFields: { hero: 'old' },
};

describe('RestorePageVersionUseCase', () => {
  let useCase: RestorePageVersionUseCase;
  let mockContentRepo: jest.Mocked<ConstructorParameters<typeof RestorePageVersionUseCase>[0]>;
  let mockVersionRepo: jest.Mocked<ConstructorParameters<typeof RestorePageVersionUseCase>[1]>;

  beforeEach(() => {
    mockContentRepo = lazyMock<ConstructorParameters<typeof RestorePageVersionUseCase>[0]>();
    mockVersionRepo = lazyMock<ConstructorParameters<typeof RestorePageVersionUseCase>[1]>();
    useCase = new RestorePageVersionUseCase(mockContentRepo, mockVersionRepo);
    emitMock.mockClear();
  });

  it('should restore the page fields from the version and emit the restored event', async () => {
    mockContentRepo.findPageById.mockResolvedValue(createContentPage({ contentPageId: 'page-1' }));
    mockVersionRepo.findVersionById.mockResolvedValue(versionSnapshot);
    mockContentRepo.updatePage.mockResolvedValue(createContentPage({ contentPageId: 'page-1', title: 'Old Title' }));

    const { restoredPage, version } = await useCase.execute(new RestorePageVersionCommand('page-1', 'version-1'));

    expect(version).toBe(2);
    expect(restoredPage.title).toBe('Old Title');
    expect(mockContentRepo.updatePage).toHaveBeenCalledWith(
      'page-1',
      expect.objectContaining({
        title: 'Old Title',
        status: 'published',
        summary: 'old summary',
        customFields: { hero: 'old' },
      }),
    );
    expect(emitMock).toHaveBeenCalledWith(
      'content.page.version_restored',
      expect.objectContaining({ pageId: 'page-1', versionId: 'version-1', version: 2 }),
    );
  });

  it('should throw ContentValidationError when ids are missing', async () => {
    await expect(useCase.execute(new RestorePageVersionCommand('', 'version-1'))).rejects.toThrow(ContentValidationError);
    await expect(useCase.execute(new RestorePageVersionCommand('page-1', ''))).rejects.toThrow(ContentValidationError);
  });

  it('should throw ContentPageNotFoundError when the page does not exist', async () => {
    mockContentRepo.findPageById.mockResolvedValue(null);

    await expect(useCase.execute(new RestorePageVersionCommand('missing', 'version-1'))).rejects.toThrow(ContentPageNotFoundError);
  });

  it('should throw NotFoundError when the version does not exist', async () => {
    mockContentRepo.findPageById.mockResolvedValue(createContentPage({ contentPageId: 'page-1' }));
    mockVersionRepo.findVersionById.mockResolvedValue(null);

    await expect(useCase.execute(new RestorePageVersionCommand('page-1', 'missing'))).rejects.toThrow(NotFoundError);
    expect(mockContentRepo.updatePage).not.toHaveBeenCalled();
  });

  it('should throw NotFoundError when the version belongs to a different page', async () => {
    mockContentRepo.findPageById.mockResolvedValue(createContentPage({ contentPageId: 'page-1' }));
    mockVersionRepo.findVersionById.mockResolvedValue({ ...versionSnapshot, contentPageId: 'other-page' });

    await expect(useCase.execute(new RestorePageVersionCommand('page-1', 'version-1'))).rejects.toThrow(NotFoundError);
    expect(mockContentRepo.updatePage).not.toHaveBeenCalled();
  });
});
