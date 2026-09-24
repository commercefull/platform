
import { ManageProductCollectionsUseCase } from './ManageProductCollections';
import { createProductCollection, lazyMock } from '../../tests/testUtils';

;

describe('ManageProductCollectionsUseCase', () => {
  let useCase: ManageProductCollectionsUseCase;
  let mockRepo: jest.Mocked<ConstructorParameters<typeof ManageProductCollectionsUseCase>[0]>;

  beforeEach(() => {
    jest.clearAllMocks();
        mockRepo = lazyMock<ConstructorParameters<typeof ManageProductCollectionsUseCase>[0]>();
    mockRepo.findAll.mockResolvedValue([createProductCollection({ productCollectionId: 'c1' })]);
    mockRepo.findById.mockResolvedValue(createProductCollection({ productCollectionId: 'c1' }));
    mockRepo.create.mockResolvedValue(createProductCollection({ productCollectionId: 'c2', name: 'Winter', slug: 'winter' }));
    mockRepo.update.mockResolvedValue(createProductCollection({ productCollectionId: 'c1', name: 'Updated' }));
    mockRepo.softDelete.mockResolvedValue(true);
    useCase = new ManageProductCollectionsUseCase(mockRepo);
  });

  it('should find all', async () => {
    const result = await useCase.findAll();
    expect(result).toHaveLength(1);
  });

  it('should find by ID', async () => {
    const result = await useCase.findById('c1');
    expect(result).toEqual(createProductCollection({ productCollectionId: 'c1' }));
  });

  it('should create', async () => {
    const result = await useCase.create({ name: 'Winter', slug: 'winter', isActive: true });
    expect(result).toEqual(createProductCollection({ productCollectionId: 'c2', name: 'Winter', slug: 'winter' }));
  });

  it('should update', async () => {
    const result = await useCase.update('c1', { name: 'Updated' });
    expect(result).toEqual(createProductCollection({ productCollectionId: 'c1', name: 'Updated' }));
  });

  it('should soft delete', async () => {
    const result = await useCase.softDelete('c1');
    expect(result).toBe(true);
    expect(mockRepo.softDelete).toHaveBeenCalledWith('c1');
  });
});
