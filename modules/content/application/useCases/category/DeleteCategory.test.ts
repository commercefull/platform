/**
 * Unit Tests for DeleteCategory Use Case
 */

import { lazyMock, createContentCategory, emitMock } from '../../../tests/testUtils';
import { DeleteCategoryUseCase } from './DeleteCategory';
import { CategoryNotFoundError } from '../../../domain/errors/ContentErrors';

describe('DeleteCategoryUseCase', () => {
  let useCase: DeleteCategoryUseCase;
  let mockRepo: jest.Mocked<ConstructorParameters<typeof DeleteCategoryUseCase>[0]>;

  beforeEach(() => {
    mockRepo = lazyMock<ConstructorParameters<typeof DeleteCategoryUseCase>[0]>();
    useCase = new DeleteCategoryUseCase(mockRepo);
    emitMock.mockClear();
  });

  it('should delete the category and emit the deleted event', async () => {
    mockRepo.findCategoryById.mockResolvedValue(createContentCategory({ contentCategoryId: 'cat-1', name: 'Cat' }));
    mockRepo.deleteCategory.mockResolvedValue(true);

    await useCase.execute('cat-1');

    expect(mockRepo.deleteCategory).toHaveBeenCalledWith('cat-1');
    expect(emitMock).toHaveBeenCalledWith('content.category.deleted', { categoryId: 'cat-1', name: 'Cat' });
  });

  it('should throw CategoryNotFoundError when the category does not exist', async () => {
    mockRepo.findCategoryById.mockResolvedValue(null);

    await expect(useCase.execute('missing')).rejects.toThrow(CategoryNotFoundError);
    expect(mockRepo.deleteCategory).not.toHaveBeenCalled();
    expect(emitMock).not.toHaveBeenCalled();
  });
});
