import { GetProductAttributesUseCase } from './GetProductAttributes';
import type { DynamicAttributePort } from '../../../domain/repositories/ProductCatalogPorts';
import { createAttribute, createAttributeData, lazyMock } from '../../../tests/testUtils';

describe('GetProductAttributesUseCase', () => {
  let useCase: GetProductAttributesUseCase;
  let mockRepo: jest.Mocked<DynamicAttributePort>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockRepo = lazyMock<DynamicAttributePort>();
    useCase = new GetProductAttributesUseCase(mockRepo);
  });

  it('should map repository rows to attribute-with-value shape', async () => {
    mockRepo.getProductAttributes.mockResolvedValue([
      {
        ...createAttributeData({ attributeId: 'a1', value: 'Red' }),
        attribute: createAttribute({ productAttributeId: 'a1', code: 'color', name: 'Color', type: 'select', isFilterable: true, isSearchable: false }),
      },
    ]);

    const result = await useCase.execute({ productId: 'p1' });

    expect(result.success).toBe(true);
    expect(result.data).toEqual([
      expect.objectContaining({
        attributeId: 'a1',
        attributeCode: 'color',
        attributeName: 'Color',
        attributeType: 'select',
        value: 'Red',
        isFilterable: true,
        isSearchable: false,
      }),
    ]);
    expect(mockRepo.getProductAttributes).toHaveBeenCalledWith('p1');
  });

  it('should return failure when the repository throws', async () => {
    mockRepo.getProductAttributes.mockRejectedValue(new Error('join failed'));

    const result = await useCase.execute({ productId: 'p1' });

    expect(result.success).toBe(false);
    expect(result.error).toContain('join failed');
  });
});
