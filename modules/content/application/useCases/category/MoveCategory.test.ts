jest.mock('../../../../../libs/events/eventBus', () => ({
  __esModule: true,
  eventBus: { emit: jest.fn() },
}));

import { MoveCategoryUseCase, MoveCategoryCommand } from './MoveCategory';
import { CategoryNotFoundError, ContentValidationError } from '../../../domain/errors/ContentErrors';

describe('MoveCategoryUseCase', () => {
  let useCase: MoveCategoryUseCase;
  let mockRepo: Record<string, jest.Mock>;

  beforeEach(() => {
    mockRepo = {
      findCategoryById: jest.fn().mockResolvedValue(null),
      moveCategory: jest.fn(),
    };
    useCase = new MoveCategoryUseCase(mockRepo as never);
  });

  it('should move category to new parent', async () => {
    mockRepo.findCategoryById.mockImplementation((id: string) =>
      id === 'c1' ? Promise.resolve({ contentCategoryId: 'c1', name: 'Old', slug: 'old', path: 'old', depth: 0 })
      : id === 'c2' ? Promise.resolve({ contentCategoryId: 'c2', name: 'New Parent', slug: 'new-parent', path: 'new-parent', depth: 0 })
      : Promise.resolve(null),
    );
    mockRepo.moveCategory.mockResolvedValue({ contentCategoryId: 'c1', name: 'Old', slug: 'old', parentId: 'c2', path: 'new-parent/old', depth: 1 });

    const result = await useCase.execute(new MoveCategoryCommand('c1', 'c2'));

    expect(result.parentId).toBe('c2');
    expect(result.depth).toBe(1);
  });

  it('should throw ContentValidationError when moving to itself', async () => {
    mockRepo.findCategoryById.mockResolvedValue({ contentCategoryId: 'c1', name: 'Cat', slug: 'cat', path: 'cat', depth: 0 });

    await expect(useCase.execute(new MoveCategoryCommand('c1', 'c1'))).rejects.toThrow(ContentValidationError);
  });

  it('should throw ContentValidationError when moving to descendant', async () => {
    mockRepo.findCategoryById.mockImplementation((id: string) =>
      id === 'c1' ? Promise.resolve({ contentCategoryId: 'c1', name: 'Parent', slug: 'parent', path: 'parent', depth: 0 })
      : id === 'c2' ? Promise.resolve({ contentCategoryId: 'c2', name: 'Child', slug: 'child', path: 'parent/child', depth: 1 })
      : Promise.resolve(null),
    );

    await expect(useCase.execute(new MoveCategoryCommand('c1', 'c2'))).rejects.toThrow(ContentValidationError);
  });

  it('should throw CategoryNotFoundError when category does not exist', async () => {
    await expect(useCase.execute(new MoveCategoryCommand('missing', null))).rejects.toThrow(CategoryNotFoundError);
  });
});
