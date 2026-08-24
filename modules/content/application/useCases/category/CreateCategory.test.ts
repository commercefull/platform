jest.mock('../../../../../libs/events/eventBus', () => ({
  __esModule: true,
  eventBus: { emit: jest.fn() },
}));

import { CreateCategoryUseCase, CreateCategoryCommand } from './CreateCategory';
import { CategoryNotFoundError, ContentValidationError } from '../../../domain/errors/ContentErrors';
import { eventBus } from '../../../../../libs/events/eventBus';

beforeEach(() => { jest.mocked(eventBus.emit).mockClear(); });

describe('CreateCategoryUseCase', () => {
  let useCase: CreateCategoryUseCase;
  let mockRepo: Record<string, jest.Mock>;

  beforeEach(() => {
    mockRepo = {
      findCategoryById: jest.fn().mockResolvedValue(null),
      createCategory: jest.fn().mockResolvedValue({
        contentCategoryId: 'c1', name: 'News', slug: 'news', parentId: null,
        path: 'news', depth: 0, isActive: true, createdAt: new Date(),
      }),
    };
    useCase = new CreateCategoryUseCase(mockRepo as never);
  });

  it('should create a category successfully', async () => {
    const result = await useCase.execute(new CreateCategoryCommand('News', 'news'));

    expect(result.id).toBe('c1');
    expect(eventBus.emit).toHaveBeenCalledWith('content.category.created', expect.objectContaining({ categoryId: 'c1' }));
  });

  it('should throw ContentValidationError when name or slug missing', async () => {
    await expect(useCase.execute(new CreateCategoryCommand('', 'slug'))).rejects.toThrow(ContentValidationError);
    await expect(useCase.execute(new CreateCategoryCommand('Name', ''))).rejects.toThrow(ContentValidationError);
  });

  it('should throw CategoryNotFoundError when parent does not exist', async () => {
    await expect(useCase.execute(new CreateCategoryCommand('Child', 'child', 'missing-parent'))).rejects.toThrow(CategoryNotFoundError);
  });
});
