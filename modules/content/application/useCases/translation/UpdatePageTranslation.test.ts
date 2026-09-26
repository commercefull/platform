/**
 * Unit Tests for UpdatePageTranslation Use Case
 */

import { lazyMock, emitMock } from '../../../tests/testUtils';
import { UpdatePageTranslationUseCase, UpdatePageTranslationCommand } from './UpdatePageTranslation';
import { PageTranslationNotFoundError } from '../../../domain/errors/ContentErrors';

describe('UpdatePageTranslationUseCase', () => {
  let useCase: UpdatePageTranslationUseCase;
  let mockRepo: jest.Mocked<ConstructorParameters<typeof UpdatePageTranslationUseCase>[0]>;

  beforeEach(() => {
    mockRepo = lazyMock<ConstructorParameters<typeof UpdatePageTranslationUseCase>[0]>();
    useCase = new UpdatePageTranslationUseCase(mockRepo);
    emitMock.mockClear();
  });

  it('should update the translation and emit the updated event', async () => {
    mockRepo.findTranslationById.mockResolvedValue({
      contentPageTranslationId: 'tr-1',
      contentPageId: 'page-1',
      localeId: 'fr',
      title: 'Bonjour',
    });
    mockRepo.updateTranslation.mockResolvedValue({
      contentPageTranslationId: 'tr-1',
      contentPageId: 'page-1',
      localeId: 'fr',
      title: 'Salut',
    });

    const result = await useCase.execute(new UpdatePageTranslationCommand('tr-1', { title: 'Salut' }));

    expect(result.title).toBe('Salut');
    expect(mockRepo.updateTranslation).toHaveBeenCalledWith('tr-1', { title: 'Salut' });
    expect(emitMock).toHaveBeenCalledWith('content.page.translation_updated', {
      translationId: 'tr-1',
      pageId: 'page-1',
    });
  });

  it('should throw PageTranslationNotFoundError when the translation does not exist', async () => {
    mockRepo.findTranslationById.mockResolvedValue(null);

    await expect(useCase.execute(new UpdatePageTranslationCommand('missing', {}))).rejects.toThrow(
      PageTranslationNotFoundError,
    );
    expect(mockRepo.updateTranslation).not.toHaveBeenCalled();
    expect(emitMock).not.toHaveBeenCalled();
  });
});
