import { lazyMock, createContentCategory, emitMock } from '../../../tests/testUtils';
import { CreateCategoryUseCase, CreateCategoryCommand } from './CreateCategory';
import { CategoryNotFoundError, ContentValidationError } from '../../../domain/errors/ContentErrors';

beforeEach(() => {
  emitMock.mockClear();
});

describe('CreateCategoryUseCase', () => {
  let useCase: CreateCategoryUseCase;
  let mockRepo: jest.Mocked<ConstructorParameters<typeof CreateCategoryUseCase>[0]>;

  beforeEach(() => {
    mockRepo = lazyMock<ConstructorParameters<typeof CreateCategoryUseCase>[0]>();
    mockRepo.findCategoryById.mockResolvedValue(null);
    mockRepo.createCategory.mockImplementation(async (params) => createContentCategory({ ...params, contentCategoryId: 'c1' }));
    useCase = new CreateCategoryUseCase(mockRepo);
  });

  it('should create a category successfully', async () => {
    const result = await useCase.execute(new CreateCategoryCommand('News', 'news'));

    expect(result.id).toBe('c1');
    expect(emitMock).toHaveBeenCalledWith('content.category.created', expect.objectContaining({ categoryId: 'c1' }));
  });

  it('should throw ContentValidationError when name or slug missing', async () => {
    await expect(useCase.execute(new CreateCategoryCommand('', 'slug'))).rejects.toThrow(ContentValidationError);
    await expect(useCase.execute(new CreateCategoryCommand('Name', ''))).rejects.toThrow(ContentValidationError);
  });

  it('should throw CategoryNotFoundError when parent does not exist', async () => {
    await expect(useCase.execute(new CreateCategoryCommand('Child', 'child', 'missing-parent'))).rejects.toThrow(CategoryNotFoundError);
  });
});
