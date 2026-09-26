/**
 * Unit Tests for GetVariantMatrix Use Case
 */

import { lazyMock } from '../../tests/testUtils';
import { GetVariantMatrixUseCase } from './GetVariantMatrix';
import { Product } from '../../domain/entities/Product';
import { ProductNotFoundError } from '../../domain/errors/ProductErrors';
import type { CatalogVariantRecord } from '../ports/CatalogVariantPort';

function createProduct(): Product {
  return Product.create({ productId: 'p-1', name: 'Test Product', description: 'd', productTypeId: 'pt-1' });
}

function createVariantRecord(overrides: Partial<CatalogVariantRecord> = {}): CatalogVariantRecord {
  return {
    id: 'var-1',
    productId: 'p-1',
    sku: 'SKU-1',
    name: 'Small',
    inventory: 3,
    inventoryPolicy: 'deny',
    isDefault: true,
    position: 0,
    options: [{ name: 'Size', value: 'S' }],
    isActive: true,
    ...overrides,
  };
}

describe('GetVariantMatrixUseCase', () => {
  let useCase: GetVariantMatrixUseCase;
  let mockProductRepo: jest.Mocked<ConstructorParameters<typeof GetVariantMatrixUseCase>[0]>;
  let mockVariantRepo: jest.Mocked<ConstructorParameters<typeof GetVariantMatrixUseCase>[1]>;
  let mockPricingPort: jest.Mocked<ConstructorParameters<typeof GetVariantMatrixUseCase>[2]>;

  beforeEach(() => {
    mockProductRepo = lazyMock();
    mockVariantRepo = lazyMock();
    mockPricingPort = lazyMock();
    useCase = new GetVariantMatrixUseCase(mockProductRepo, mockVariantRepo, mockPricingPort);
  });

  it('should join variant rows with their prices and derive option axes', async () => {
    mockProductRepo.findById.mockResolvedValue(createProduct());
    mockVariantRepo.findByProductId.mockResolvedValue([
      createVariantRecord({ id: 'var-1', options: [{ name: 'Size', value: 'S' }] }),
      createVariantRecord({ id: 'var-2', sku: 'SKU-2', name: 'Large', options: [{ name: 'Size', value: 'L' }] }),
    ]);
    mockPricingPort.listProductPrices.mockResolvedValue([
      {
        productBasePriceId: 'bp-0',
        productId: 'p-1',
        productVariantId: null,
        currencyCode: 'USD',
        priceCents: 1000,
        salePriceCents: null,
        compareAtPriceCents: null,
        costPriceCents: null,
        updatedAt: new Date(),
      },
      {
        productBasePriceId: 'bp-1',
        productId: 'p-1',
        productVariantId: 'var-2',
        currencyCode: 'USD',
        priceCents: 2500,
        salePriceCents: null,
        compareAtPriceCents: null,
        costPriceCents: null,
        updatedAt: new Date(),
      },
    ]);

    const result = await useCase.execute('p-1');

    expect(result.optionAxes).toEqual(['Size']);
    expect(result.variants).toHaveLength(2);
    // var-1 falls back to the product-level price; var-2 has its own
    expect(result.variants[0].priceCents).toBe(1000);
    expect(result.variants[1].priceCents).toBe(2500);
  });

  it('should throw ProductNotFoundError when the product does not exist', async () => {
    mockProductRepo.findById.mockResolvedValue(null);

    await expect(useCase.execute('missing')).rejects.toThrow(ProductNotFoundError);
    expect(mockVariantRepo.findByProductId).not.toHaveBeenCalled();
  });
});
