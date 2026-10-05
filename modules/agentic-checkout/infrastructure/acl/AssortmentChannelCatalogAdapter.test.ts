/**
 * Tests for AssortmentChannelCatalogAdapter — bridges the channel catalog port
 * to assortment's ResolveStoreCatalog + product hydration.
 */

import type { ResolveStoreCatalogUseCase } from '../../../assortment/application/useCases/ResolveStoreCatalog';
import type { ProductRepository } from '../../../product/domain/repositories/ProductRepository';
import { Product, type ProductProps } from '../../../product/domain/entities/Product';
import { ProductStatus } from '../../../product/domain/valueObjects/ProductStatus';
import { ProductVisibility } from '../../../product/domain/valueObjects/ProductVisibility';
import { Dimensions } from '../../../product/domain/valueObjects/Dimensions';
import { AssortmentChannelCatalogAdapter } from './AssortmentChannelCatalogAdapter';

const STORE_ID = 'store-1';
const PRODUCT_ID = 'prod-1';

function makeProduct(overrides: Partial<ProductProps> = {}): Product {
  const now = new Date();
  return Product.reconstitute({
    productId: PRODUCT_ID,
    name: 'Test Product',
    description: 'A test product',
    sku: 'SKU-1',
    slug: 'test-product',
    productTypeId: 'type-1',
    status: ProductStatus.ACTIVE,
    visibility: ProductVisibility.VISIBLE,
    dimensions: Dimensions.create({}),
    isFeatured: false,
    isVirtual: false,
    isDownloadable: false,
    isSubscription: false,
    isTaxable: true,
    hasVariants: false,
    images: [{ imageId: 'img-1', url: 'https://cdn.example.com/p.png', position: 0, isPrimary: true }],
    minOrderQuantity: 1,
    tags: [],
    createdAt: now,
    updatedAt: now,
    ...overrides,
  });
}

function catalogResponse(productIds: string[] = [PRODUCT_ID]) {
  return {
    storeId: STORE_ID,
    mode: 'all' as const,
    products: productIds.map(productId => ({
      productId,
      slug: 'test-product',
      name: 'Test Product',
      effectivePriceCents: 1999,
      isFeatured: false,
    })),
    total: productIds.length,
  };
}

describe('AssortmentChannelCatalogAdapter', () => {
  const resolveStoreCatalog = { execute: jest.fn() };
  const productRepo = { findByIds: jest.fn() };
  const adapter = new AssortmentChannelCatalogAdapter(
    resolveStoreCatalog as unknown as Pick<ResolveStoreCatalogUseCase, 'execute'>,
    productRepo as unknown as Pick<ProductRepository, 'findByIds'>,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    resolveStoreCatalog.execute.mockResolvedValue(catalogResponse());
    productRepo.findByIds.mockResolvedValue([makeProduct()]);
  });

  describe('resolveStoreCatalog', () => {
    it('should return hydrated channel products with assortment pricing', async () => {
      const products = await adapter.resolveStoreCatalog(STORE_ID);

      expect(resolveStoreCatalog.execute).toHaveBeenCalledWith(expect.objectContaining({ storeId: STORE_ID }));
      expect(products).toHaveLength(1);
      expect(products[0]).toEqual({
        productId: PRODUCT_ID,
        name: 'Test Product',
        slug: 'test-product',
        description: 'A test product',
        sku: 'SKU-1',
        imageUrl: 'https://cdn.example.com/p.png',
        effectivePriceCents: 1999,
        isAvailable: true,
      });
    });

    it('should mark non-active products as unavailable', async () => {
      productRepo.findByIds.mockResolvedValueOnce([makeProduct({ status: ProductStatus.DISCONTINUED })]);

      const products = await adapter.resolveStoreCatalog(STORE_ID);

      expect(products[0].isAvailable).toBe(false);
    });

    it('should return an empty list when the store catalog is empty', async () => {
      resolveStoreCatalog.execute.mockResolvedValueOnce(catalogResponse([]));

      const products = await adapter.resolveStoreCatalog(STORE_ID);

      expect(products).toEqual([]);
      expect(productRepo.findByIds).not.toHaveBeenCalled();
    });
  });

  describe('findProducts', () => {
    it('should only return requested products that are sellable in the store', async () => {
      const products = await adapter.findProducts(STORE_ID, [PRODUCT_ID, 'prod-not-sold']);

      expect(productRepo.findByIds).toHaveBeenCalledWith([PRODUCT_ID]);
      expect(products).toHaveLength(1);
      expect(products[0].productId).toBe(PRODUCT_ID);
    });

    it('should return an empty list when none of the requested ids are sellable', async () => {
      const products = await adapter.findProducts(STORE_ID, ['prod-not-sold']);

      expect(products).toEqual([]);
      expect(productRepo.findByIds).not.toHaveBeenCalled();
    });

    it('should drop products the repository returns that are not sellable', async () => {
      productRepo.findByIds.mockResolvedValueOnce([makeProduct(), makeProduct({ productId: 'prod-other' })]);

      const products = await adapter.findProducts(STORE_ID, [PRODUCT_ID]);

      expect(products.map(p => p.productId)).toEqual([PRODUCT_ID]);
    });
  });
});
