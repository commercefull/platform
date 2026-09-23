import { ProductPriceDataAdapter } from './ProductPriceDataAdapter';
import type productCatalogRepository from '../../../product/infrastructure/repositories/ProductCatalogRepository';
import type { Product as RepoProduct } from '../../../product/infrastructure/repositories/productRepo';
import type { ProductVariant as RepoVariant } from '../../../product/infrastructure/repositories/productVariantRepo';
import { ProductType, ProductStatus, ProductVisibility } from '../../../product/infrastructure/repositories/productRepo';
import { InventoryPolicy } from '../../../product/infrastructure/repositories/productVariantRepo';

const productRow = (overrides: Partial<RepoProduct> = {}): RepoProduct => ({
  productId: 'p1',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  sku: 'SKU-1',
  name: 'Widget',
  slug: 'widget',
  type: ProductType.SIMPLE,
  status: ProductStatus.ACTIVE,
  visibility: ProductVisibility.VISIBLE,
  price: 10,
  isTaxable: true,
  currency: 'USD',
  isInventoryManaged: true,
  isFeatured: false,
  ...overrides,
} as RepoProduct);

const variantRow = (overrides: Partial<RepoVariant> = {}): RepoVariant => ({
  id: 'v1',
  productId: 'p1',
  sku: 'VAR-1',
  name: 'Variant',
  price: 19.99,
  inventory: 5,
  inventoryPolicy: InventoryPolicy.DENY,
  isDefault: false,
  position: 0,
  options: [],
  isActive: true,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  ...overrides,
});

describe('ProductPriceDataAdapter', () => {
  let adapter: ProductPriceDataAdapter;
  let mockProductRepo: jest.Mocked<Pick<typeof productCatalogRepository.products, 'findById'>>;
  let mockVariantRepo: jest.Mocked<Pick<typeof productCatalogRepository.variants, 'findById' | 'findDefaultForProduct'>>;

  beforeEach(() => {
    mockProductRepo = { findById: jest.fn() };
    mockVariantRepo = { findById: jest.fn(), findDefaultForProduct: jest.fn() };
    adapter = new ProductPriceDataAdapter(mockProductRepo, mockVariantRepo);
  });

  it('implements ProductPriceDataPort', () => {
    expect(typeof adapter.findProductById).toBe('function');
    expect(typeof adapter.findVariantById).toBe('function');
    expect(typeof adapter.findDefaultVariantForProduct).toBe('function');
  });

  it('should map product to ProductPriceData', async () => {
    mockProductRepo.findById.mockResolvedValue(productRow({ categoryId: 'cat1' }));

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
    mockVariantRepo.findById.mockResolvedValue(variantRow({ sku: 'WIDGET-S' }));

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
    mockVariantRepo.findDefaultForProduct.mockResolvedValue(variantRow({ id: 'v0', price: 10.0, isDefault: true }));

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
