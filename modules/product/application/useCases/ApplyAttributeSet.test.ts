/**
 * Unit Tests for ApplyAttributeSet Use Case
 */

import { lazyMock } from '../../tests/testUtils';
import { ApplyAttributeSetUseCase } from './ApplyAttributeSet';
import { Product } from '../../domain/entities/Product';
import { ProductNotFoundError, AttributeSetNotFoundError, ProductValidationError } from '../../domain/errors/ProductErrors';

function createProduct(): Product {
  return Product.create({ productId: 'p-1', name: 'Test Product', description: 'd', productTypeId: 'pt-1' });
}

describe('ApplyAttributeSetUseCase', () => {
  let useCase: ApplyAttributeSetUseCase;
  let mockProductRepo: jest.Mocked<ConstructorParameters<typeof ApplyAttributeSetUseCase>[0]>;
  let mockSetRepo: jest.Mocked<ConstructorParameters<typeof ApplyAttributeSetUseCase>[1]>;
  let mockDynamicRepo: jest.Mocked<ConstructorParameters<typeof ApplyAttributeSetUseCase>[2]>;

  beforeEach(() => {
    mockProductRepo = lazyMock();
    mockSetRepo = lazyMock();
    mockDynamicRepo = lazyMock();
    useCase = new ApplyAttributeSetUseCase(mockProductRepo, mockSetRepo, mockDynamicRepo);
  });

  it('should apply the set attributes with their default values', async () => {
    mockProductRepo.findById.mockResolvedValue(createProduct());
    mockSetRepo.findByIdWithAttributes.mockResolvedValue({
      attributes: [
        { productAttributeId: 'attr-1', defaultValue: 'cotton' },
        { productAttributeId: 'attr-2', defaultValue: null },
      ],
    });

    const result = await useCase.execute('p-1', 'set-1');

    expect(result).toEqual({ applied: true, attributeSetId: 'set-1', attributesAssigned: 2 });
    expect(mockDynamicRepo.setProductAttributes).toHaveBeenCalledWith('p-1', [
      { attributeId: 'attr-1', value: 'cotton' },
      { attributeId: 'attr-2', value: '' },
    ]);
  });

  it('should skip the write when the set has no attributes', async () => {
    mockProductRepo.findById.mockResolvedValue(createProduct());
    mockSetRepo.findByIdWithAttributes.mockResolvedValue({ attributes: [] });

    const result = await useCase.execute('p-1', 'set-1');

    expect(result.attributesAssigned).toBe(0);
    expect(mockDynamicRepo.setProductAttributes).not.toHaveBeenCalled();
  });

  it('should throw ProductValidationError when attributeSetId is missing', async () => {
    await expect(useCase.execute('p-1', '')).rejects.toThrow(ProductValidationError);
  });

  it('should throw ProductNotFoundError when the product does not exist', async () => {
    mockProductRepo.findById.mockResolvedValue(null);

    await expect(useCase.execute('missing', 'set-1')).rejects.toThrow(ProductNotFoundError);
  });

  it('should throw AttributeSetNotFoundError when the set does not exist', async () => {
    mockProductRepo.findById.mockResolvedValue(createProduct());
    mockSetRepo.findByIdWithAttributes.mockResolvedValue(null);

    await expect(useCase.execute('p-1', 'missing')).rejects.toThrow(AttributeSetNotFoundError);
    expect(mockDynamicRepo.setProductAttributes).not.toHaveBeenCalled();
  });
});
