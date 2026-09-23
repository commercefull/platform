/**
 * Unit Tests for CreateProduct Use Case
 */

import { lazyMock } from '../../tests/testUtils';
import { CreateProductUseCase, CreateProductCommand } from './CreateProduct';
import { Product } from '../../domain/entities/Product';
import { ProductSkuAlreadyExistsError, ProductSlugAlreadyExistsError, ProductValidationError } from '../../domain/errors/ProductErrors';

import type { ProductRepository } from '../../domain/repositories/ProductRepository';

function createProduct(): Product {
  return Product.create({
    productId: 'p-1',
    name: 'Test Product',
    description: 'A test product',
    productTypeId: 'pt-1',
  });
}

function createMockProductRepo(product: Product | null = null): jest.Mocked<ProductRepository> {
  const repo = lazyMock<ProductRepository>();
  repo.findById.mockResolvedValue(product);
  repo.findBySlug.mockResolvedValue(null);
  repo.findBySku.mockResolvedValue(null);
  repo.save.mockResolvedValue(createProduct());
  return repo;
}

describe('CreateProductUseCase', () => {
  it('should create a product successfully', async () => {
    const repo = createMockProductRepo();
    const attributeSetRepo = lazyMock<ConstructorParameters<typeof CreateProductUseCase>[1]>();
    attributeSetRepo.getAttributesForProductType.mockResolvedValue([]);
    const dynamicAttributeRepo = lazyMock<ConstructorParameters<typeof CreateProductUseCase>[2]>();
    const useCase = new CreateProductUseCase(repo, attributeSetRepo, dynamicAttributeRepo);

    const result = await useCase.execute(new CreateProductCommand('Test Product', 'A test product', 'pt-1'));

    expect(result.productId).toBe('p-1');
    expect(result.name).toBe('Test Product');
    expect(result.status).toBe('draft');
    expect(repo.save).toHaveBeenCalled();
  });

  it('should throw ProductValidationError when name is empty', async () => {
    const repo = createMockProductRepo();
    const attributeSetRepo = lazyMock<ConstructorParameters<typeof CreateProductUseCase>[1]>();
    attributeSetRepo.getAttributesForProductType.mockResolvedValue([]);
    const dynamicAttributeRepo = lazyMock<ConstructorParameters<typeof CreateProductUseCase>[2]>();
    const useCase = new CreateProductUseCase(repo, attributeSetRepo, dynamicAttributeRepo);

    await expect(useCase.execute(new CreateProductCommand('', 'desc', 'pt-1'))).rejects.toThrow(ProductValidationError);
  });

  it('should throw ProductValidationError when productTypeId is empty', async () => {
    const repo = createMockProductRepo();
    const attributeSetRepo = lazyMock<ConstructorParameters<typeof CreateProductUseCase>[1]>();
    attributeSetRepo.getAttributesForProductType.mockResolvedValue([]);
    const dynamicAttributeRepo = lazyMock<ConstructorParameters<typeof CreateProductUseCase>[2]>();
    const useCase = new CreateProductUseCase(repo, attributeSetRepo, dynamicAttributeRepo);

    await expect(useCase.execute(new CreateProductCommand('Test', 'desc', ''))).rejects.toThrow(ProductValidationError);
  });

  it('should throw ProductSkuAlreadyExistsError when SKU exists', async () => {
    const existingProduct = createProduct();
    const repo = createMockProductRepo();
    repo.findBySku.mockResolvedValue(existingProduct);
    const attributeSetRepo = lazyMock<ConstructorParameters<typeof CreateProductUseCase>[1]>();
    attributeSetRepo.getAttributesForProductType.mockResolvedValue([]);
    const dynamicAttributeRepo = lazyMock<ConstructorParameters<typeof CreateProductUseCase>[2]>();
    const useCase = new CreateProductUseCase(repo, attributeSetRepo, dynamicAttributeRepo);

    await expect(useCase.execute(new CreateProductCommand('Test', 'desc', 'pt-1', 'SKU-1'))).rejects.toThrow(ProductSkuAlreadyExistsError);
  });

  it('should throw ProductSlugAlreadyExistsError when slug exists', async () => {
    const existingProduct = createProduct();
    const repo = createMockProductRepo();
    repo.findBySlug.mockResolvedValue(existingProduct);
    const attributeSetRepo = lazyMock<ConstructorParameters<typeof CreateProductUseCase>[1]>();
    attributeSetRepo.getAttributesForProductType.mockResolvedValue([]);
    const dynamicAttributeRepo = lazyMock<ConstructorParameters<typeof CreateProductUseCase>[2]>();
    const useCase = new CreateProductUseCase(repo, attributeSetRepo, dynamicAttributeRepo);

    await expect(useCase.execute(new CreateProductCommand('Test', 'desc', 'pt-1', undefined, 'test-slug'))).rejects.toThrow(
      ProductSlugAlreadyExistsError,
    );
  });
});
