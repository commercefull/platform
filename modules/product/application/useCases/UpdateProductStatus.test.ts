/**
 * Unit Tests for UpdateProductStatus Use Case
 */

import { UpdateProductStatusUseCase } from './UpdateProductStatus';
import { Product } from '../../domain/entities/Product';
import { ProductStatus } from '../../domain/valueObjects/ProductStatus';
import { ProductNotFoundError } from '../../domain/errors/ProductErrors';

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
    findBySlug: jest.fn().mockResolvedValue(null),
    findBySku: jest.fn().mockResolvedValue(null),
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

    await expect(
      useCase.updateStatus('nonexistent', ProductStatus.ACTIVE),
    ).rejects.toThrow(ProductNotFoundError);
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

    await expect(
      useCase.publish('nonexistent'),
    ).rejects.toThrow(ProductNotFoundError);
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

    await expect(
      useCase.unpublish('nonexistent'),
    ).rejects.toThrow(ProductNotFoundError);
  });
});
