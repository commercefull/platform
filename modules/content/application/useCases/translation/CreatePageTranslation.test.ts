/**
 * Unit Tests for CreatePageTranslation Use Case
 */

import { lazyMock, createContentPage, emitMock } from '../../../tests/testUtils';
import { CreatePageTranslationUseCase, CreatePageTranslationCommand } from './CreatePageTranslation';
import { ContentPageNotFoundError, ContentValidationError } from '../../../domain/errors/ContentErrors';

describe('CreatePageTranslationUseCase', () => {
  let useCase: CreatePageTranslationUseCase;
  let mockContentRepo: jest.Mocked<ConstructorParameters<typeof CreatePageTranslationUseCase>[0]>;
  let mockTranslationRepo: jest.Mocked<ConstructorParameters<typeof CreatePageTranslationUseCase>[1]>;

  beforeEach(() => {
    mockContentRepo = lazyMock<ConstructorParameters<typeof CreatePageTranslationUseCase>[0]>();
    mockTranslationRepo = lazyMock<ConstructorParameters<typeof CreatePageTranslationUseCase>[1]>();
    useCase = new CreatePageTranslationUseCase(mockContentRepo, mockTranslationRepo);
    emitMock.mockClear();
  });

  it('should create the translation and emit the created event', async () => {
    mockContentRepo.findPageById.mockResolvedValue(createContentPage({ contentPageId: 'page-1' }));
    mockTranslationRepo.createTranslation.mockResolvedValue({
      contentPageTranslationId: 'tr-1',
      contentPageId: 'page-1',
      localeId: 'fr',
      title: 'Bonjour',
    });

    const result = await useCase.execute(new CreatePageTranslationCommand('page-1', 'fr', 'Bonjour', { slug: 'bonjour' }));

    expect(result.contentPageTranslationId).toBe('tr-1');
    expect(mockTranslationRepo.createTranslation).toHaveBeenCalledWith(
      expect.objectContaining({ contentPageId: 'page-1', localeId: 'fr', title: 'Bonjour', slug: 'bonjour' }),
    );
    expect(emitMock).toHaveBeenCalledWith('content.page.translation_created', {
      pageId: 'page-1',
      translationId: 'tr-1',
      localeId: 'fr',
    });
  });

  it('should throw ContentValidationError when localeId or title is missing', async () => {
    await expect(useCase.execute(new CreatePageTranslationCommand('page-1', '', 'x'))).rejects.toThrow(
      ContentValidationError,
    );
    expect(mockContentRepo.findPageById).not.toHaveBeenCalled();
  });

  it('should throw ContentPageNotFoundError when the page does not exist', async () => {
    mockContentRepo.findPageById.mockResolvedValue(null);

    await expect(useCase.execute(new CreatePageTranslationCommand('missing', 'fr', 'Bonjour'))).rejects.toThrow(
      ContentPageNotFoundError,
    );
    expect(mockTranslationRepo.createTranslation).not.toHaveBeenCalled();
  });
});
