import { DeleteProductUseCase } from './DeleteProduct';
import { Product } from '../../domain/entities/Product';
import { ProductNotFoundError } from '../../domain/errors/ProductErrors';
import { lazyMock } from '../../tests/testUtils';

function createProduct(): Product {
  return Product.create({
    productId: 'p1',
    name: 'Test Product',
    description: 'desc',
    productTypeId: 'pt-1',
  });
}

describe('DeleteProductUseCase', () => {
  let useCase: DeleteProductUseCase;
  let mockRepo: jest.Mocked<ConstructorParameters<typeof DeleteProductUseCase>[0]>;

  beforeEach(() => {
    mockRepo = lazyMock<ConstructorParameters<typeof DeleteProductUseCase>[0]>();
    mockRepo.findById.mockResolvedValue(createProduct());
    useCase = new DeleteProductUseCase(mockRepo);
  });

  it('should soft delete product (happy path)', async () => {
    await useCase.execute('p1');

    expect(mockRepo.delete).toHaveBeenCalledWith('p1');
    expect(mockRepo.hardDelete).not.toHaveBeenCalled();
  });

  it('should hard delete when permanent=true', async () => {
    await useCase.execute('p1', true);

    expect(mockRepo.hardDelete).toHaveBeenCalledWith('p1');
    expect(mockRepo.delete).not.toHaveBeenCalled();
  });

  it('should throw ProductNotFoundError when the product does not exist', async () => {
    mockRepo.findById.mockResolvedValue(null);

    await expect(useCase.execute('missing')).rejects.toThrow(ProductNotFoundError);
    expect(mockRepo.delete).not.toHaveBeenCalled();
    expect(mockRepo.hardDelete).not.toHaveBeenCalled();
  });
});
