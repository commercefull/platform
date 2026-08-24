/**
 * Unit Tests for GetProduct Use Case
 */

import { GetProductUseCase, GetProductCommand } from './GetProduct';
import { Product } from '../../domain/entities/Product';
import { ProductValidationError } from '../../domain/errors/ProductErrors';

import type { ProductRepository } from '../../domain/repositories/ProductRepository';

function createProduct(): Product {
  return Product.create({
    productId: 'p-1',
    name: 'Test Product',
    description: 'desc',
    productTypeId: 'pt-1',
  });
}

function createMockProductRepo(product: Product | null = null): jest.Mocked<ProductRepository> {
  return {
    findById: jest.fn().mockResolvedValue(product),
    findBySlug: jest.fn().mockResolvedValue(product),
    findBySku: jest.fn().mockResolvedValue(product),
    findByBarcode: jest.fn().mockResolvedValue(null),
    findAll: jest.fn().mockResolvedValue({ data: [], total: 0, limit: 20, offset: 0, hasMore: false, length: 0 }),
    save: jest.fn().mockResolvedValue(product),
    delete: jest.fn().mockResolvedValue(undefined),
    hardDelete: jest.fn().mockResolvedValue(undefined),
    count: jest.fn().mockResolvedValue(0),
    findByCategory: jest.fn().mockResolvedValue({ data: [], total: 0, limit: 20, offset: 0, hasMore: false, length: 0 }),
    findByMerchant: jest.fn().mockResolvedValue({ data: [], total: 0, limit: 20, offset: 0, hasMore: false, length: 0 }),
    findByBusiness: jest.fn().mockResolvedValue({ data: [], total: 0, limit: 20, offset: 0, hasMore: false, length: 0 }),
    findByStore: jest.fn().mockResolvedValue({ data: [], total: 0, limit: 20, offset: 0, hasMore: false, length: 0 }),
    findByBusinessAndStore: jest.fn().mockResolvedValue({ data: [], total: 0, limit: 20, offset: 0, hasMore: false, length: 0 }),
    findFeatured: jest.fn().mockResolvedValue({ data: [], total: 0, limit: 20, offset: 0, hasMore: false, length: 0 }),
    findRelated: jest.fn().mockResolvedValue([]),
    search: jest.fn().mockResolvedValue({ data: [], total: 0, limit: 20, offset: 0, hasMore: false, length: 0 }),
    findVariantsByProductId: jest.fn().mockResolvedValue([]),
    findVariantById: jest.fn().mockResolvedValue(null),
    saveVariant: jest.fn(),
    deleteVariant: jest.fn(),
    getProductImages: jest.fn().mockResolvedValue([]),
    addProductImage: jest.fn(),
    updateProductImage: jest.fn(),
    deleteProductImage: jest.fn(),
    getCategories: jest.fn().mockResolvedValue([]),
    setProductCategories: jest.fn(),
    getTags: jest.fn().mockResolvedValue([]),
    setProductTags: jest.fn(),
  } as never as jest.Mocked<ProductRepository>;
}

describe('GetProductUseCase', () => {
  it('should return product by ID', async () => {
    const product = createProduct();
    const repo = createMockProductRepo(product);
    const useCase = new GetProductUseCase(repo);

    const result = await useCase.execute(new GetProductCommand('p-1'));

    expect(result).not.toBeNull();
    expect(result!.productId).toBe('p-1');
    expect(result!.name).toBe('Test Product');
  });

  it('should return product by slug', async () => {
    const product = createProduct();
    const repo = createMockProductRepo(product);
    const useCase = new GetProductUseCase(repo);

    const result = await useCase.execute(new GetProductCommand(undefined, 'test-product'));

    expect(result).not.toBeNull();
    expect(repo.findBySlug).toHaveBeenCalledWith('test-product');
  });

  it('should return product by SKU', async () => {
    const product = createProduct();
    const repo = createMockProductRepo(product);
    const useCase = new GetProductUseCase(repo);

    const result = await useCase.execute(
      new GetProductCommand(undefined, undefined, 'SKU-1'),
    );

    expect(result).not.toBeNull();
    expect(repo.findBySku).toHaveBeenCalledWith('SKU-1');
  });

  it('should return null when product does not exist', async () => {
    const repo = createMockProductRepo(null);
    const useCase = new GetProductUseCase(repo);

    const result = await useCase.execute(new GetProductCommand('nonexistent'));

    expect(result).toBeNull();
  });

  it('should throw ProductValidationError when no identifier provided', () => {
    expect(() => new GetProductCommand()).toThrow(ProductValidationError);
  });

  it('should include variants when requested', async () => {
    const product = createProduct();
    const repo = createMockProductRepo(product);
    const useCase = new GetProductUseCase(repo);

    await useCase.execute(new GetProductCommand('p-1', undefined, undefined, true));

    expect(repo.findVariantsByProductId).toHaveBeenCalledWith('p-1');
  });

  it('should not include variants when not requested', async () => {
    const product = createProduct();
    const repo = createMockProductRepo(product);
    const useCase = new GetProductUseCase(repo);

    await useCase.execute(new GetProductCommand('p-1', undefined, undefined, false));

    expect(repo.findVariantsByProductId).not.toHaveBeenCalled();
  });
});
