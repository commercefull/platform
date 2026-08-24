/**
 * Unit Tests for CreateProduct Use Case
 */

import { CreateProductUseCase, CreateProductCommand } from './CreateProduct';
import { Product } from '../../domain/entities/Product';
import {
  ProductSkuAlreadyExistsError,
  ProductSlugAlreadyExistsError,
  ProductValidationError,
} from '../../domain/errors/ProductErrors';

import type { ProductRepository } from '../../domain/repositories/ProductRepository';

jest.mock('../../../../libs/events/eventBus', () => ({
  eventBus: { emit: jest.fn() },
}));

jest.mock('../../../../libs/uuid', () => ({
  generateUUID: jest.fn(() => 'test-uuid-123'),
}));

jest.mock('../../infrastructure/repositories/ProductAttributeSetRepository', () => ({
  ProductAttributeSetRepository: jest.fn().mockImplementation(() => ({
    getAttributesForProductType: jest.fn().mockResolvedValue([]),
  })),
}));

jest.mock('../../infrastructure/repositories/DynamicAttributeRepository', () => ({
  DynamicAttributeRepository: jest.fn().mockImplementation(() => ({
    setProductAttributes: jest.fn().mockResolvedValue(undefined),
  })),
}));

function createProduct(): Product {
  return Product.create({
    productId: 'p-1',
    name: 'Test Product',
    description: 'A test product',
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
    save: jest.fn().mockResolvedValue(createProduct()),
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

describe('CreateProductUseCase', () => {
  it('should create a product successfully', async () => {
    const repo = createMockProductRepo();
    const useCase = new CreateProductUseCase(repo);

    const result = await useCase.execute(
      new CreateProductCommand('Test Product', 'A test product', 'pt-1'),
    );

    expect(result.productId).toBe('p-1');
    expect(result.name).toBe('Test Product');
    expect(result.status).toBe('draft');
    expect(repo.save).toHaveBeenCalled();
  });

  it('should throw ProductValidationError when name is empty', async () => {
    const repo = createMockProductRepo();
    const useCase = new CreateProductUseCase(repo);

    await expect(
      useCase.execute(new CreateProductCommand('', 'desc', 'pt-1')),
    ).rejects.toThrow(ProductValidationError);
  });

  it('should throw ProductValidationError when productTypeId is empty', async () => {
    const repo = createMockProductRepo();
    const useCase = new CreateProductUseCase(repo);

    await expect(
      useCase.execute(new CreateProductCommand('Test', 'desc', '')),
    ).rejects.toThrow(ProductValidationError);
  });

  it('should throw ProductSkuAlreadyExistsError when SKU exists', async () => {
    const existingProduct = createProduct();
    const repo = createMockProductRepo();
    repo.findBySku = jest.fn().mockResolvedValue(existingProduct);
    const useCase = new CreateProductUseCase(repo);

    await expect(
      useCase.execute(new CreateProductCommand('Test', 'desc', 'pt-1', 'SKU-1')),
    ).rejects.toThrow(ProductSkuAlreadyExistsError);
  });

  it('should throw ProductSlugAlreadyExistsError when slug exists', async () => {
    const existingProduct = createProduct();
    const repo = createMockProductRepo();
    repo.findBySlug = jest.fn().mockResolvedValue(existingProduct);
    const useCase = new CreateProductUseCase(repo);

    await expect(
      useCase.execute(new CreateProductCommand('Test', 'desc', 'pt-1', undefined, 'test-slug')),
    ).rejects.toThrow(ProductSlugAlreadyExistsError);
  });
});
