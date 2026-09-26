/**
 * Unit Tests for DeletePageTranslation Use Case
 */

import { lazyMock, emitMock } from '../../../tests/testUtils';
import { DeletePageTranslationUseCase } from './DeletePageTranslation';
import { PageTranslationNotFoundError } from '../../../domain/errors/ContentErrors';

describe('DeletePageTranslationUseCase', () => {
  let useCase: DeletePageTranslationUseCase;
  let mockRepo: jest.Mocked<ConstructorParameters<typeof DeletePageTranslationUseCase>[0]>;

  beforeEach(() => {
    mockRepo = lazyMock<ConstructorParameters<typeof DeletePageTranslationUseCase>[0]>();
    useCase = new DeletePageTranslationUseCase(mockRepo);
    emitMock.mockClear();
  });

  it('should delete the translation and emit the deleted event', async () => {
    mockRepo.findTranslationById.mockResolvedValue({
      contentPageTranslationId: 'tr-1',
      contentPageId: 'page-1',
      localeId: 'fr',
      title: 'Bonjour',
    });
    mockRepo.deleteTranslation.mockResolvedValue(true);

    await useCase.execute('tr-1');

    expect(mockRepo.deleteTranslation).toHaveBeenCalledWith('tr-1');
    expect(emitMock).toHaveBeenCalledWith('content.page.translation_deleted', {
      translationId: 'tr-1',
      pageId: 'page-1',
    });
  });

  it('should throw PageTranslationNotFoundError when the translation does not exist', async () => {
    mockRepo.findTranslationById.mockResolvedValue(null);

    await expect(useCase.execute('missing')).rejects.toThrow(PageTranslationNotFoundError);
    expect(mockRepo.deleteTranslation).not.toHaveBeenCalled();
    expect(emitMock).not.toHaveBeenCalled();
  });
});
