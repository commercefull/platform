/**
 * Unit Tests for RemovePageFromCategory Use Case
 */

import { lazyMock, emitMock } from '../../../tests/testUtils';
import { RemovePageFromCategoryUseCase, RemovePageFromCategoryCommand } from './RemovePageFromCategory';
import { CategorizationNotFoundError } from '../../../domain/errors/ContentErrors';

describe('RemovePageFromCategoryUseCase', () => {
  let useCase: RemovePageFromCategoryUseCase;
  let mockRepo: jest.Mocked<ConstructorParameters<typeof RemovePageFromCategoryUseCase>[0]>;

  beforeEach(() => {
    mockRepo = lazyMock<ConstructorParameters<typeof RemovePageFromCategoryUseCase>[0]>();
    useCase = new RemovePageFromCategoryUseCase(mockRepo);
    emitMock.mockClear();
  });

  it('should remove the categorization and emit the uncategorized event', async () => {
    mockRepo.deleteCategorizationByPageAndCategory.mockResolvedValue(true);

    await useCase.execute(new RemovePageFromCategoryCommand('page-1', 'cat-1'));

    expect(mockRepo.deleteCategorizationByPageAndCategory).toHaveBeenCalledWith('page-1', 'cat-1');
    expect(emitMock).toHaveBeenCalledWith('content.page.uncategorized', { pageId: 'page-1', categoryId: 'cat-1' });
  });

  it('should throw CategorizationNotFoundError when the link does not exist', async () => {
    mockRepo.deleteCategorizationByPageAndCategory.mockResolvedValue(false);

    await expect(useCase.execute(new RemovePageFromCategoryCommand('page-1', 'cat-9'))).rejects.toThrow(
      CategorizationNotFoundError,
    );
    expect(emitMock).not.toHaveBeenCalled();
  });
});
