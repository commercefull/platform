/**
 * Unit Tests for UpdateProductStatus Use Case
 */

import { UpdateProductStatusUseCase } from './UpdateProductStatus';
import { Product } from '../../domain/entities/Product';
import { ProductStatus } from '../../domain/valueObjects/ProductStatus';
import { ProductNotFoundError } from '../../domain/errors/ProductErrors';

import type { ProductRepository } from '../../domain/repositories/ProductRepository';
import { lazyMock } from '../../tests/testUtils';

function createProduct(): Product {
  return Product.create({
    productId: 'p-1',
    name: 'Test Product',
    description: 'desc',
    productTypeId: 'pt-1',
  });
}

function createMockProductRepo(product: Product | null = null): jest.Mocked<ProductRepository> {
  const repo = lazyMock<ProductRepository>();
  repo.findById.mockResolvedValue(product);
  repo.save.mockImplementation(async (item) => item);
  return repo;
}

describe('UpdateProductStatusUseCase', () => {
  it('should update product status to active', async () => {
    const product = createProduct();
    const repo = createMockProductRepo(product);
    const useCase = new UpdateProductStatusUseCase(repo);

    const result = await useCase.updateStatus('p-1', ProductStatus.ACTIVE);

    expect(result).toBe(ProductStatus.ACTIVE);
    expect(repo.save).toHaveBeenCalled();
  });

  it('should throw ProductNotFoundError when product does not exist', async () => {
    const repo = createMockProductRepo(null);
    const useCase = new UpdateProductStatusUseCase(repo);

    await expect(useCase.updateStatus('nonexistent', ProductStatus.ACTIVE)).rejects.toThrow(ProductNotFoundError);
  });

  it('should publish an active product', async () => {
    const product = createProduct();
    product.updateStatus(ProductStatus.ACTIVE);
    const repo = createMockProductRepo(product);
    const useCase = new UpdateProductStatusUseCase(repo);

    await useCase.publish('p-1');

    expect(repo.save).toHaveBeenCalled();
  });

  it('should throw ProductNotFoundError when publishing nonexistent product', async () => {
    const repo = createMockProductRepo(null);
    const useCase = new UpdateProductStatusUseCase(repo);

    await expect(useCase.publish('nonexistent')).rejects.toThrow(ProductNotFoundError);
  });

  it('should unpublish a published product', async () => {
    const product = createProduct();
    product.updateStatus(ProductStatus.ACTIVE);
    product.publish();
    const repo = createMockProductRepo(product);
    const useCase = new UpdateProductStatusUseCase(repo);

    await useCase.unpublish('p-1');

    expect(repo.save).toHaveBeenCalled();
  });

  it('should throw ProductNotFoundError when unpublishing nonexistent product', async () => {
    const repo = createMockProductRepo(null);
    const useCase = new UpdateProductStatusUseCase(repo);

    await expect(useCase.unpublish('nonexistent')).rejects.toThrow(ProductNotFoundError);
  });
});
