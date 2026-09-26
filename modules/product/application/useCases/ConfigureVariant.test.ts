/**
 * Unit Tests for ConfigureVariant Use Case
 */

import { lazyMock } from '../../tests/testUtils';
import { ConfigureVariantUseCase } from './ConfigureVariant';
import { ProductVariantNotFoundError, ProductValidationError } from '../../domain/errors/ProductErrors';
import type { CatalogVariantRecord } from '../ports/CatalogVariantPort';

function createVariantRecord(overrides: Partial<CatalogVariantRecord> = {}): CatalogVariantRecord {
  return {
    id: 'var-1',
    productId: 'p-1',
    sku: 'SKU-1',
    name: 'Variant',
    inventory: 0,
    inventoryPolicy: 'deny',
    isDefault: false,
    position: 0,
    options: [
      { name: 'Size', value: 'S' },
      { name: 'Color', value: 'Red' },
    ],
    isActive: true,
    ...overrides,
  };
}

describe('ConfigureVariantUseCase', () => {
  let useCase: ConfigureVariantUseCase;
  let mockVariantRepo: jest.Mocked<ConstructorParameters<typeof ConfigureVariantUseCase>[0]>;

  beforeEach(() => {
    mockVariantRepo = lazyMock();
    useCase = new ConfigureVariantUseCase(mockVariantRepo);
  });

  it('should return the variant matching all requested options', async () => {
    mockVariantRepo.findByProductId.mockResolvedValue([
      createVariantRecord({ id: 'var-1', options: [{ name: 'Size', value: 'S' }, { name: 'Color', value: 'Red' }] }),
      createVariantRecord({ id: 'var-2', options: [{ name: 'Size', value: 'L' }, { name: 'Color', value: 'Blue' }] }),
    ]);

    const result = await useCase.execute('p-1', [
      { name: 'Size', value: 'L' },
      { name: 'Color', value: 'Blue' },
    ]);

    expect(result.id).toBe('var-2');
  });

  it('should throw ProductVariantNotFoundError when no variant matches', async () => {
    mockVariantRepo.findByProductId.mockResolvedValue([createVariantRecord()]);

    await expect(useCase.execute('p-1', [{ name: 'Size', value: 'XL' }])).rejects.toThrow(ProductVariantNotFoundError);
  });

  it('should throw ProductValidationError when options are empty', async () => {
    await expect(useCase.execute('p-1', [])).rejects.toThrow(ProductValidationError);
    expect(mockVariantRepo.findByProductId).not.toHaveBeenCalled();
  });
});
