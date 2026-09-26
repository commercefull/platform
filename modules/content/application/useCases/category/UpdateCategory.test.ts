/**
 * Unit Tests for UpdateCategory Use Case
 */

import { lazyMock, createContentCategory, emitMock } from '../../../tests/testUtils';
import { UpdateCategoryUseCase, UpdateCategoryCommand } from './UpdateCategory';
import { CategoryNotFoundError } from '../../../domain/errors/ContentErrors';

describe('UpdateCategoryUseCase', () => {
  let useCase: UpdateCategoryUseCase;
  let mockRepo: jest.Mocked<ConstructorParameters<typeof UpdateCategoryUseCase>[0]>;

  beforeEach(() => {
    mockRepo = lazyMock<ConstructorParameters<typeof UpdateCategoryUseCase>[0]>();
    useCase = new UpdateCategoryUseCase(mockRepo);
    emitMock.mockClear();
  });

  it('should update the category and emit the updated event', async () => {
    mockRepo.findCategoryById.mockResolvedValue(createContentCategory({ contentCategoryId: 'cat-1' }));
    mockRepo.updateCategory.mockResolvedValue(createContentCategory({ contentCategoryId: 'cat-1', name: 'Renamed' }));

    const result = await useCase.execute(new UpdateCategoryCommand('cat-1', { name: 'Renamed' }));

    expect(result.name).toBe('Renamed');
    expect(mockRepo.updateCategory).toHaveBeenCalledWith('cat-1', { name: 'Renamed' });
    expect(emitMock).toHaveBeenCalledWith(
      'content.category.updated',
      expect.objectContaining({ categoryId: 'cat-1', name: 'Renamed' }),
    );
  });

  it('should throw CategoryNotFoundError when the category does not exist', async () => {
    mockRepo.findCategoryById.mockResolvedValue(null);

    await expect(useCase.execute(new UpdateCategoryCommand('missing', { name: 'x' }))).rejects.toThrow(CategoryNotFoundError);
    expect(mockRepo.updateCategory).not.toHaveBeenCalled();
    expect(emitMock).not.toHaveBeenCalled();
  });
});
