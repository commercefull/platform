
import { ManageCategoriesUseCase } from './ManageCategories';
import { createCategoryRow, lazyMock } from '../../tests/testUtils';


describe('ManageCategoriesUseCase', () => {
  let useCase: ManageCategoriesUseCase;
  let mockRepo: jest.Mocked<ConstructorParameters<typeof ManageCategoriesUseCase>[0]>;

  beforeEach(() => {
    jest.clearAllMocks();
        mockRepo = lazyMock<ConstructorParameters<typeof ManageCategoriesUseCase>[0]>();
    mockRepo.findOne.mockResolvedValue(createCategoryRow({ productCategoryId: 'c1' }));
    mockRepo.findBySlug.mockResolvedValue(createCategoryRow({ productCategoryId: 'c1' }));
    mockRepo.findAll.mockResolvedValue([createCategoryRow()]);
    mockRepo.findActive.mockResolvedValue([createCategoryRow()]);
    mockRepo.findChildren.mockResolvedValue([createCategoryRow({ productCategoryId: 'c2' })]);
    mockRepo.findForMenu.mockResolvedValue([createCategoryRow()]);
    mockRepo.create.mockResolvedValue(createCategoryRow({ productCategoryId: 'c2', name: 'Books' }));
    mockRepo.update.mockResolvedValue(createCategoryRow({ productCategoryId: 'c1', name: 'Updated' }));
    mockRepo.delete.mockResolvedValue(true);
    useCase = new ManageCategoriesUseCase(mockRepo);
  });

  it('should find one', async () => {
    const result = await useCase.findOne('c1');
    expect(result).toEqual(createCategoryRow({ productCategoryId: 'c1' }));
  });

  it('should find by slug', async () => {
    const result = await useCase.findBySlug('electronics');
    expect(result).toEqual(createCategoryRow({ productCategoryId: 'c1' }));
  });

  it('should find all', async () => {
    const result = await useCase.findAll();
    expect(result).toHaveLength(1);
  });

  it('should find active', async () => {
    const result = await useCase.findActive();
    expect(result).toHaveLength(1);
  });

  it('should find children', async () => {
    const result = await useCase.findChildren('c1');
    expect(result).toHaveLength(1);
  });

  it('should create category', async () => {
    const result = await useCase.create({ name: 'Books' });
    expect(result).toEqual(createCategoryRow({ productCategoryId: 'c2', name: 'Books' }));
  });

  it('should update category', async () => {
    const result = await useCase.update('c1', { name: 'Updated' });
    expect(result).toEqual(createCategoryRow({ productCategoryId: 'c1', name: 'Updated' }));
  });

  it('should delete category', async () => {
    await useCase.delete('c1');
    expect(mockRepo.delete).toHaveBeenCalledWith('c1');
  });

  it('should reorder categories', async () => {
    await useCase.reorder([
      { categoryId: 'c1', position: 1 },
      { categoryId: 'c2', position: 2 },
    ]);
    expect(mockRepo.update).toHaveBeenCalledTimes(2);
  });
});
