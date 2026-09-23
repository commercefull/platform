

import { ManageProductCollectionUseCase, ManageProductCollectionCommand } from './ManageProductCollection';
import { ProductValidationError, ProductCollectionNotFoundError } from '../../domain/errors/ProductErrors';
import { createProductCollection, createProductCollectionMap, lazyMock } from '../../tests/testUtils';


describe('ManageProductCollectionUseCase', () => {
  let useCase: ManageProductCollectionUseCase;
  let mockRepo1: jest.Mocked<ConstructorParameters<typeof ManageProductCollectionUseCase>[0]>;
  let mockRepo2: jest.Mocked<ConstructorParameters<typeof ManageProductCollectionUseCase>[1]>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockRepo1 = lazyMock<ConstructorParameters<typeof ManageProductCollectionUseCase>[0]>();
    mockRepo1.update.mockResolvedValue(createProductCollection({ productCollectionId: 'c1', name: 'Updated', slug: 'updated' }));
    mockRepo1.create.mockResolvedValue(createProductCollection({ productCollectionId: 'c2', name: 'New', slug: 'new' }));
    mockRepo2 = lazyMock<ConstructorParameters<typeof ManageProductCollectionUseCase>[1]>();
    mockRepo2.findByCollection.mockResolvedValue([createProductCollectionMap({ productCollectionMapId: 'm1' })]);
    mockRepo2.create.mockResolvedValue(createProductCollectionMap({ productCollectionMapId: 'm2' }));
    mockRepo2.delete.mockResolvedValue(true);
    useCase = new ManageProductCollectionUseCase(mockRepo1, mockRepo2);
  });

  it('should create new collection (happy path)', async () => {
    const result = await useCase.execute(new ManageProductCollectionCommand('New Collection', 'new-collection'));

    expect(result.collection.productCollectionId).toBe('c2');
  });

  it('should update existing collection', async () => {
    const result = await useCase.execute(new ManageProductCollectionCommand('Updated', 'updated', 'c1'));

    expect(result.collection.productCollectionId).toBe('c1');
  });

  it('should throw ProductValidationError when name is empty', async () => {
    await expect(useCase.execute(new ManageProductCollectionCommand('', 'slug'))).rejects.toThrow(ProductValidationError);
  });

  it('should throw ProductValidationError when slug is empty', async () => {
    await expect(useCase.execute(new ManageProductCollectionCommand('Name', ''))).rejects.toThrow(ProductValidationError);
  });

  it('should throw ProductCollectionNotFoundError when update fails', async () => {
    mockRepo1.update.mockResolvedValueOnce(null);

    await expect(useCase.execute(new ManageProductCollectionCommand('Name', 'slug', 'nonexistent'))).rejects.toThrow(
      ProductCollectionNotFoundError,
    );
  });
});
