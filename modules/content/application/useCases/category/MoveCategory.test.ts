import { MoveCategoryUseCase, MoveCategoryCommand } from './MoveCategory';
import { CategoryNotFoundError, ContentValidationError } from '../../../domain/errors/ContentErrors';
import { lazyMock, createContentCategory } from '../../../tests/testUtils';

describe('MoveCategoryUseCase', () => {
  let useCase: MoveCategoryUseCase;
  let mockRepo: jest.Mocked<ConstructorParameters<typeof MoveCategoryUseCase>[0]>;

  beforeEach(() => {
    mockRepo = lazyMock<ConstructorParameters<typeof MoveCategoryUseCase>[0]>();
    mockRepo.findCategoryById.mockResolvedValue(null);
    useCase = new MoveCategoryUseCase(mockRepo);
  });

  it('should move category to new parent', async () => {
    mockRepo.findCategoryById.mockImplementation((id: string) =>
      Promise.resolve(
        id === 'c1'
          ? createContentCategory({ contentCategoryId: 'c1', name: 'Old', slug: 'old', path: 'old' })
          : id === 'c2'
            ? createContentCategory({ contentCategoryId: 'c2', name: 'New Parent', slug: 'new-parent', path: 'new-parent' })
            : null,
      ),
    );
    mockRepo.moveCategory.mockResolvedValue(
      createContentCategory({ contentCategoryId: 'c1', name: 'Old', slug: 'old', parentId: 'c2', path: 'new-parent/old', depth: 1 }),
    );

    const result = await useCase.execute(new MoveCategoryCommand('c1', 'c2'));

    expect(result.parentId).toBe('c2');
    expect(result.depth).toBe(1);
  });

  it('should throw ContentValidationError when moving to itself', async () => {
    mockRepo.findCategoryById.mockResolvedValue(createContentCategory({ contentCategoryId: 'c1', name: 'Cat', slug: 'cat', path: 'cat' }));

    await expect(useCase.execute(new MoveCategoryCommand('c1', 'c1'))).rejects.toThrow(ContentValidationError);
  });

  it('should throw ContentValidationError when moving to descendant', async () => {
    mockRepo.findCategoryById.mockImplementation((id: string) =>
      Promise.resolve(
        id === 'c1'
          ? createContentCategory({ contentCategoryId: 'c1', name: 'Parent', slug: 'parent', path: 'parent' })
          : id === 'c2'
            ? createContentCategory({ contentCategoryId: 'c2', name: 'Child', slug: 'child', path: 'parent/child', depth: 1 })
            : null,
      ),
    );

    await expect(useCase.execute(new MoveCategoryCommand('c1', 'c2'))).rejects.toThrow(ContentValidationError);
  });

  it('should throw CategoryNotFoundError when category does not exist', async () => {
    await expect(useCase.execute(new MoveCategoryCommand('missing', null))).rejects.toThrow(CategoryNotFoundError);
  });
});
