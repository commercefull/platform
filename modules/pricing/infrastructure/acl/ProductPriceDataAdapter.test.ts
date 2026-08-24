/* eslint-disable @typescript-eslint/no-explicit-any */

jest.mock('../../../product/infrastructure/repositories/ProductCatalogRepository', () => ({
  __esModule: true,
  default: {
    products: { findById: jest.fn() },
    variants: { findById: jest.fn(), findDefaultForProduct: jest.fn() },
  },
}));

import productCatalogRepository from '../../../product/infrastructure/repositories/ProductCatalogRepository';
import { ProductPriceDataAdapter } from './ProductPriceDataAdapter';

describe('ProductPriceDataAdapter', () => {
  let adapter: ProductPriceDataAdapter;
  let mockProductRepo: any;
  let mockVariantRepo: any;

  beforeEach(() => {
    mockProductRepo = productCatalogRepository.products;
    mockVariantRepo = productCatalogRepository.variants;
    mockProductRepo.findById.mockClear();
    mockVariantRepo.findById.mockClear();
    mockVariantRepo.findDefaultForProduct.mockClear();
    adapter = new ProductPriceDataAdapter();
  });

  it('implements ProductPriceDataPort', () => {
    expect(typeof adapter.findProductById).toBe('function');
    expect(typeof adapter.findVariantById).toBe('function');
    expect(typeof adapter.findDefaultVariantForProduct).toBe('function');
  });

  it('should map product to ProductPriceData', async () => {
    mockProductRepo.findById.mockResolvedValue({ productId: 'p1', categoryId: 'cat1', name: 'Widget' });

    const result = await adapter.findProductById('p1');

    expect(result).not.toBeNull();
    expect(result!.productId).toBe('p1');
    expect(result!.categoryId).toBe('cat1');
  });

  it('should return null when product not found', async () => {
    mockProductRepo.findById.mockResolvedValue(null);

    const result = await adapter.findProductById('nonexistent');

    expect(result).toBeNull();
  });

  it('should map variant to VariantPriceData', async () => {
    mockVariantRepo.findById.mockResolvedValue({ id: 'v1', productId: 'p1', price: 19.99, sku: 'WIDGET-S' });

    const result = await adapter.findVariantById('v1');

    expect(result).not.toBeNull();
    expect(result!.variantId).toBe('v1');
    expect(result!.productId).toBe('p1');
    expect(result!.price).toBe(19.99);
  });

  it('should return null when variant not found', async () => {
    mockVariantRepo.findById.mockResolvedValue(null);

    const result = await adapter.findVariantById('nonexistent');

    expect(result).toBeNull();
  });

  it('should map default variant to VariantPriceData', async () => {
    mockVariantRepo.findDefaultForProduct.mockResolvedValue({ id: 'v0', productId: 'p1', price: 10.0, isDefault: true });

    const result = await adapter.findDefaultVariantForProduct('p1');

    expect(result).not.toBeNull();
    expect(result!.variantId).toBe('v0');
    expect(result!.price).toBe(10.0);
  });

  it('should return null when no default variant exists', async () => {
    mockVariantRepo.findDefaultForProduct.mockResolvedValue(null);

    const result = await adapter.findDefaultVariantForProduct('p1');

    expect(result).toBeNull();
  });
});
