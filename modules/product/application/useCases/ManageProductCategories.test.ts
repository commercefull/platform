
import { ManageProductCategoriesUseCase } from './ManageProductCategories';
import { createProductCategory, lazyMock } from '../../tests/testUtils';

;

describe('ManageProductCategoriesUseCase', () => {
  let useCase: ManageProductCategoriesUseCase;
  let mockRepo: jest.Mocked<ConstructorParameters<typeof ManageProductCategoriesUseCase>[0]>;

  beforeEach(() => {
    jest.clearAllMocks();
        mockRepo = lazyMock<ConstructorParameters<typeof ManageProductCategoriesUseCase>[0]>();
    mockRepo.findAll.mockResolvedValue([createProductCategory()]);
    mockRepo.findById.mockResolvedValue(createProductCategory({ productCategoryId: 'c1' }));
    mockRepo.create.mockResolvedValue(createProductCategory({ productCategoryId: 'c2', name: 'Books' }));
    mockRepo.update.mockResolvedValue(createProductCategory({ productCategoryId: 'c1', name: 'Updated' }));
    mockRepo.softDelete.mockResolvedValue(true);
    useCase = new ManageProductCategoriesUseCase(mockRepo);
  });

  it('should find all', async () => {
    const result = await useCase.findAll();
    expect(result).toHaveLength(1);
  });

  it('should find by ID', async () => {
    const result = await useCase.findById('c1');
    expect(result).toEqual(createProductCategory({ productCategoryId: 'c1' }));
  });

  it('should create', async () => {
    const result = await useCase.create({ name: 'Books', slug: 'books', position: 0, isActive: true });
    expect(result).toEqual(createProductCategory({ productCategoryId: 'c2', name: 'Books' }));
  });

  it('should update', async () => {
    const result = await useCase.update('c1', { name: 'Updated' });
    expect(result).toEqual(createProductCategory({ productCategoryId: 'c1', name: 'Updated' }));
  });

  it('should soft delete', async () => {
    const result = await useCase.softDelete('c1');
    expect(result).toBe(true);
    expect(mockRepo.softDelete).toHaveBeenCalledWith('c1');
  });
});
