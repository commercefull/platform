import { SetProductAttributesUseCase } from './SetProductAttributes';
import type { DynamicAttributePort } from '../../../domain/repositories/ProductCatalogPorts';
import { createAttribute, createAttributeData, lazyMock } from '../../../tests/testUtils';

describe('SetProductAttributesUseCase', () => {
  let useCase: SetProductAttributesUseCase;
  let mockRepo: jest.Mocked<DynamicAttributePort>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockRepo = lazyMock<DynamicAttributePort>();
    mockRepo.findAttributeById.mockResolvedValue(createAttribute({ productAttributeId: 'a1', code: 'color' }));
    mockRepo.findAttributeByCode.mockResolvedValue(createAttribute({ productAttributeId: 'a2', code: 'size' }));
    mockRepo.setProductAttribute.mockResolvedValue(createAttributeData());
    useCase = new SetProductAttributesUseCase(mockRepo);
  });

  it('should set all resolvable attributes and report the count', async () => {
    const result = await useCase.execute({
      productId: 'p1',
      attributes: [
        { attributeId: 'a1', value: 'Red' },
        { attributeCode: 'size', value: 'L' },
      ],
    });

    expect(result.success).toBe(true);
    expect(result.data).toEqual({ set: 2, failed: [] });
    expect(mockRepo.setProductAttribute).toHaveBeenCalledTimes(2);
    expect(mockRepo.clearProductAttributes).not.toHaveBeenCalled();
  });

  it('should clear existing attributes when clearExisting is set', async () => {
    await useCase.execute({
      productId: 'p1',
      clearExisting: true,
      attributes: [{ attributeId: 'a1', value: 'Red' }],
    });

    expect(mockRepo.clearProductAttributes).toHaveBeenCalledWith('p1');
  });

  it('should collect failures for unresolvable attributes and continue', async () => {
    mockRepo.findAttributeByCode.mockResolvedValueOnce(createAttribute({ productAttributeId: 'a2', code: 'size' })).mockResolvedValueOnce(null);

    const result = await useCase.execute({
      productId: 'p1',
      attributes: [
        { attributeCode: 'size', value: 'L' },
        { attributeCode: 'missing', value: 'x' },
      ],
    });

    expect(result.success).toBe(true);
    expect(result.data?.set).toBe(1);
    expect(result.data?.failed).toEqual([{ attribute: 'missing', error: 'Attribute not found' }]);
  });

  it('should collect failures when a set call throws and continue', async () => {
    mockRepo.setProductAttribute.mockRejectedValueOnce(new Error('value too long'));

    const result = await useCase.execute({
      productId: 'p1',
      attributes: [
        { attributeId: 'a1', value: 'x'.repeat(500) },
        { attributeCode: 'size', value: 'L' },
      ],
    });

    expect(result.success).toBe(true);
    expect(result.data?.set).toBe(1);
    expect(result.data?.failed).toEqual([{ attribute: 'color', error: 'value too long' }]);
  });

  it('should return failure when the repository throws outside the attribute loop', async () => {
    mockRepo.clearProductAttributes.mockRejectedValue(new Error('clear failed'));

    const result = await useCase.execute({ productId: 'p1', clearExisting: true, attributes: [] });

    expect(result.success).toBe(false);
    expect(result.error).toContain('clear failed');
  });
});
