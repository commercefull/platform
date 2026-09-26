/**
 * Unit Tests for UpdateCatalogVariant Use Case
 */

import { lazyMock } from '../../tests/testUtils';
import { UpdateCatalogVariantUseCase, UpdateCatalogVariantCommand } from './UpdateCatalogVariant';
import type { CatalogVariantRecord } from '../ports/CatalogVariantPort';

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

describe('UpdateCatalogVariantUseCase', () => {
  let useCase: UpdateCatalogVariantUseCase;
  let mockVariantRepo: jest.Mocked<ConstructorParameters<typeof UpdateCatalogVariantUseCase>[0]>;
  let mockPricingPort: jest.Mocked<ConstructorParameters<typeof UpdateCatalogVariantUseCase>[1]>;

  beforeEach(() => {
    mockVariantRepo = lazyMock();
    mockPricingPort = lazyMock();
    useCase = new UpdateCatalogVariantUseCase(mockVariantRepo, mockPricingPort);
  });

  it('should update the variant without touching pricing when no price fields are given', async () => {
    mockVariantRepo.update.mockResolvedValue(createVariantRecord({ name: 'Renamed' }));

    const result = await useCase.execute(new UpdateCatalogVariantCommand('p-1', 'var-1', { name: 'Renamed' }));

    expect(result.name).toBe('Renamed');
    expect(mockPricingPort.setBasePrice).not.toHaveBeenCalled();
  });

  it('should merge new price fields onto the existing price row', async () => {
    mockVariantRepo.update.mockResolvedValue(createVariantRecord());
    mockPricingPort.getBasePrice.mockResolvedValue({
      productBasePriceId: 'bp-1',
      productId: 'p-1',
      productVariantId: 'var-1',
      currencyCode: 'EUR',
      priceCents: 1500,
      salePriceCents: 999,
      compareAtPriceCents: null,
      costPriceCents: null,
      updatedAt: new Date(),
    });
    mockPricingPort.setBasePrice.mockResolvedValue({
      productBasePriceId: 'bp-1',
      productId: 'p-1',
      productVariantId: 'var-1',
      currencyCode: 'EUR',
      priceCents: 2000,
      salePriceCents: 999,
      compareAtPriceCents: null,
      costPriceCents: null,
      updatedAt: new Date(),
    });

    const result = await useCase.execute(new UpdateCatalogVariantCommand('p-1', 'var-1', {}, 2000));

    expect(result.priceCents).toBe(2000);
    // salePriceCents falls back to the existing row, currencyCode preserved
    expect(mockPricingPort.setBasePrice).toHaveBeenCalledWith(
      expect.objectContaining({ currencyCode: 'EUR', priceCents: 2000, salePriceCents: 999 }),
    );
  });
});
