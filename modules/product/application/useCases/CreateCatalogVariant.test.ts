/**
 * Unit Tests for CreateCatalogVariant Use Case
 */

import { lazyMock } from '../../tests/testUtils';
import { CreateCatalogVariantUseCase, CreateCatalogVariantCommand } from './CreateCatalogVariant';
import type { CatalogVariantRecord, CatalogVariantCreateParams } from '../ports/CatalogVariantPort';

function createVariantRecord(overrides: Partial<CatalogVariantRecord> = {}): CatalogVariantRecord {
  return {
    id: 'var-1',
    productId: 'p-1',
    sku: 'SKU-1',
    name: 'Variant 1',
    inventory: 0,
    inventoryPolicy: 'deny',
    isDefault: false,
    position: 0,
    options: [],
    isActive: true,
    ...overrides,
  };
}

function createParams(): CatalogVariantCreateParams {
  return {
    productId: 'p-1',
    sku: 'SKU-1',
    name: 'Variant 1',
    inventory: 0,
    inventoryPolicy: 'deny',
    isDefault: false,
    position: 0,
    options: [],
    isActive: true,
  };
}

describe('CreateCatalogVariantUseCase', () => {
  let useCase: CreateCatalogVariantUseCase;
  let mockVariantRepo: jest.Mocked<ConstructorParameters<typeof CreateCatalogVariantUseCase>[0]>;
  let mockPricingPort: jest.Mocked<ConstructorParameters<typeof CreateCatalogVariantUseCase>[1]>;

  beforeEach(() => {
    mockVariantRepo = lazyMock();
    mockPricingPort = lazyMock();
    useCase = new CreateCatalogVariantUseCase(mockVariantRepo, mockPricingPort);
  });

  it('should create the variant without touching pricing when no price fields are given', async () => {
    mockVariantRepo.create.mockResolvedValue(createVariantRecord());

    const result = await useCase.execute(new CreateCatalogVariantCommand('p-1', createParams()));

    expect(result.id).toBe('var-1');
    expect(mockPricingPort.setBasePrice).not.toHaveBeenCalled();
  });

  it('should write the variant base price when price fields are given', async () => {
    mockVariantRepo.create.mockResolvedValue(createVariantRecord({ id: 'var-9' }));
    mockPricingPort.getBasePrice.mockResolvedValue(null);
    mockPricingPort.setBasePrice.mockResolvedValue({
      productBasePriceId: 'bp-1',
      productId: 'p-1',
      productVariantId: 'var-9',
      currencyCode: 'USD',
      priceCents: 1999,
      salePriceCents: null,
      compareAtPriceCents: null,
      costPriceCents: null,
      updatedAt: new Date(),
    });

    const result = await useCase.execute(
      new CreateCatalogVariantCommand('p-1', createParams(), 1999, undefined, undefined, undefined, 'USD'),
    );

    expect(result.priceCents).toBe(1999);
    expect(mockPricingPort.setBasePrice).toHaveBeenCalledWith(
      expect.objectContaining({ productId: 'p-1', productVariantId: 'var-9', priceCents: 1999 }),
    );
  });
});
