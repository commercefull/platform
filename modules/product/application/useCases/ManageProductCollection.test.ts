jest.mock('../../infrastructure/repositories/productCollectionRepo', () => ({
  __esModule: true,
  default: {
    update: jest.fn().mockResolvedValue({ productCollectionId: 'c1', name: 'Updated', slug: 'updated' }),
    create: jest.fn().mockResolvedValue({ productCollectionId: 'c2', name: 'New', slug: 'new' }),
  },
}));

jest.mock('../../infrastructure/repositories/productCollectionMapRepo', () => ({
  __esModule: true,
  default: {
    findByCollection: jest.fn().mockResolvedValue([{ productCollectionMapId: 'm1', productId: 'p1' }]),
    addProduct: jest.fn().mockResolvedValue({ productCollectionMapId: 'm2' }),
    remove: jest.fn().mockResolvedValue(true),
  },
}));

import { ManageProductCollectionUseCase, ManageProductCollectionCommand } from './ManageProductCollection';
import { ProductValidationError, ProductCollectionNotFoundError } from '../../domain/errors/ProductErrors';
import productCollectionRepo from '../../infrastructure/repositories/productCollectionRepo';
import productCollectionMapRepo from '../../infrastructure/repositories/productCollectionMapRepo';

const mockRepo = productCollectionRepo as unknown as Record<string, jest.Mock>;

describe('ManageProductCollectionUseCase', () => {
  let useCase: ManageProductCollectionUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new ManageProductCollectionUseCase(productCollectionRepo, productCollectionMapRepo);
  });

  it('should create new collection (happy path)', async () => {
    const result = await useCase.execute(new ManageProductCollectionCommand(
      'New Collection', 'new-collection',
    ));

    expect(result.collection.productCollectionId).toBe('c2');
  });

  it('should update existing collection', async () => {
    const result = await useCase.execute(new ManageProductCollectionCommand(
      'Updated', 'updated', 'c1',
    ));

    expect(result.collection.productCollectionId).toBe('c1');
  });

  it('should throw ProductValidationError when name is empty', async () => {
    await expect(useCase.execute(new ManageProductCollectionCommand('', 'slug'))).rejects.toThrow(ProductValidationError);
  });

  it('should throw ProductValidationError when slug is empty', async () => {
    await expect(useCase.execute(new ManageProductCollectionCommand('Name', ''))).rejects.toThrow(ProductValidationError);
  });

  it('should throw ProductCollectionNotFoundError when update fails', async () => {
    mockRepo.update.mockResolvedValueOnce(null);

    await expect(useCase.execute(new ManageProductCollectionCommand(
      'Name', 'slug', 'nonexistent',
    ))).rejects.toThrow(ProductCollectionNotFoundError);
  });
});
