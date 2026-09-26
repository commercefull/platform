/**
 * Unit Tests for AssignPageToCategory Use Case
 */

import { lazyMock, createContentPage, createContentCategory, emitMock } from '../../../tests/testUtils';
import { AssignPageToCategoryUseCase, AssignPageToCategoryCommand } from './AssignPageToCategory';
import {
  ContentPageNotFoundError,
  CategoryNotFoundError,
  ContentValidationError,
} from '../../../domain/errors/ContentErrors';

describe('AssignPageToCategoryUseCase', () => {
  let useCase: AssignPageToCategoryUseCase;
  let mockContentRepo: jest.Mocked<ConstructorParameters<typeof AssignPageToCategoryUseCase>[0]>;
  let mockCategoryRepo: jest.Mocked<ConstructorParameters<typeof AssignPageToCategoryUseCase>[1]>;
  let mockCategorizationRepo: jest.Mocked<ConstructorParameters<typeof AssignPageToCategoryUseCase>[2]>;

  beforeEach(() => {
    mockContentRepo = lazyMock<ConstructorParameters<typeof AssignPageToCategoryUseCase>[0]>();
    mockCategoryRepo = lazyMock<ConstructorParameters<typeof AssignPageToCategoryUseCase>[1]>();
    mockCategorizationRepo = lazyMock<ConstructorParameters<typeof AssignPageToCategoryUseCase>[2]>();
    useCase = new AssignPageToCategoryUseCase(mockContentRepo, mockCategoryRepo, mockCategorizationRepo);
    emitMock.mockClear();
  });

  it('should create the categorization and emit the categorized event', async () => {
    mockContentRepo.findPageById.mockResolvedValue(createContentPage({ contentPageId: 'page-1' }));
    mockCategoryRepo.findCategoryById.mockResolvedValue(createContentCategory({ contentCategoryId: 'cat-1' }));
    mockCategorizationRepo.createCategorization.mockResolvedValue({
      contentCategorizationId: 'cg-1',
      contentPageId: 'page-1',
      categoryId: 'cat-1',
      isPrimary: true,
    });

    const result = await useCase.execute(new AssignPageToCategoryCommand('page-1', 'cat-1', true));

    expect(result.contentCategorizationId).toBe('cg-1');
    expect(mockCategorizationRepo.createCategorization).toHaveBeenCalledWith({
      contentPageId: 'page-1',
      categoryId: 'cat-1',
      isPrimary: true,
    });
    expect(emitMock).toHaveBeenCalledWith('content.page.categorized', {
      pageId: 'page-1',
      categoryId: 'cat-1',
      isPrimary: true,
    });
  });

  it('should throw ContentValidationError when categoryId is missing', async () => {
    await expect(useCase.execute(new AssignPageToCategoryCommand('page-1', ''))).rejects.toThrow(ContentValidationError);
    expect(mockCategorizationRepo.createCategorization).not.toHaveBeenCalled();
  });

  it('should throw ContentPageNotFoundError when the page does not exist', async () => {
    mockContentRepo.findPageById.mockResolvedValue(null);

    await expect(useCase.execute(new AssignPageToCategoryCommand('missing', 'cat-1'))).rejects.toThrow(
      ContentPageNotFoundError,
    );
  });

  it('should throw CategoryNotFoundError when the category does not exist', async () => {
    mockContentRepo.findPageById.mockResolvedValue(createContentPage({ contentPageId: 'page-1' }));
    mockCategoryRepo.findCategoryById.mockResolvedValue(null);

    await expect(useCase.execute(new AssignPageToCategoryCommand('page-1', 'missing'))).rejects.toThrow(
      CategoryNotFoundError,
    );
    expect(mockCategorizationRepo.createCategorization).not.toHaveBeenCalled();
  });
});
