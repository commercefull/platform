import { createProduct, lazyMock, emitMock } from '../../tests/testUtils';
import { UpdateProductUseCase, UpdateProductCommand } from './UpdateProduct';
import { ProductNotFoundError } from '../../domain/errors/ProductErrors';
import { Product } from '../../domain/entities/Product';

beforeEach(() => {
  emitMock.mockClear();
});

describe('UpdateProductUseCase', () => {
  let useCase: UpdateProductUseCase;
  let mockRepo: jest.Mocked<ConstructorParameters<typeof UpdateProductUseCase>[0]>;
  let mockProduct: Product;

  beforeEach(() => {
    mockProduct = createProduct({ productId: 'p1', name: 'Old', slug: 'old', basePrice: 10 });
    mockRepo = lazyMock<ConstructorParameters<typeof UpdateProductUseCase>[0]>();
    mockRepo.findById.mockResolvedValue(mockProduct);
    mockRepo.save.mockResolvedValue(mockProduct);
    useCase = new UpdateProductUseCase(mockRepo);
  });

  it('should update product name (happy path)', async () => {
    const result = await useCase.execute(new UpdateProductCommand('p1', { name: 'New Name' }));

    expect(result.productId).toBe('p1');
    expect(result.updatedFields).toContain('name');
    expect(emitMock).toHaveBeenCalledWith('product.updated', expect.objectContaining({ productId: 'p1' }));
  });

  it('should throw ProductNotFoundError when product does not exist', async () => {
    mockRepo.findById.mockResolvedValue(null);

    await expect(useCase.execute(new UpdateProductCommand('missing', { name: 'X' }))).rejects.toThrow(ProductNotFoundError);
  });

  it('should update price when basePrice provided', async () => {
    const updatePrice = jest.spyOn(mockProduct, 'updatePrice');
    await useCase.execute(new UpdateProductCommand('p1', { basePrice: 99.99 }));

    expect(updatePrice).toHaveBeenCalled();
  });

  it('should update tags', async () => {
    const addTag = jest.spyOn(mockProduct, 'addTag');
    await useCase.execute(new UpdateProductCommand('p1', { tags: ['new', 'hot'] }));

    expect(addTag).toHaveBeenCalledWith('new');
    expect(addTag).toHaveBeenCalledWith('hot');
  });
});
