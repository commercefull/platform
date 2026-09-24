
import { SetProductAttributeUseCase } from './SetProductAttribute';
import type { DynamicAttributePort } from '../../../domain/repositories/ProductCatalogPorts';
import { createAttribute, createAttributeData, lazyMock } from '../../../tests/testUtils';

describe('SetProductAttributeUseCase', () => {
  let useCase: SetProductAttributeUseCase;
  let mockRepo: jest.Mocked<DynamicAttributePort>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockRepo = lazyMock<DynamicAttributePort>();
    mockRepo.findAttributeById.mockResolvedValue(createAttribute({ type: 'text' }));
    mockRepo.findAttributeByCode.mockResolvedValue(createAttribute({ type: 'text' }));
    mockRepo.findAttributeValues.mockResolvedValue([]);
    mockRepo.setProductAttribute.mockResolvedValue(createAttributeData({ productId: 'p1', attributeId: 'a1', value: 'Red' }));
    useCase = new SetProductAttributeUseCase(mockRepo);
  });

  it('should set product attribute by ID (happy path)', async () => {
    const result = await useCase.execute({
      productId: 'p1',
      attributeId: 'a1',
      value: 'Red',
    });

    expect(result.success).toBe(true);
    expect(result.data?.value).toBe('Red');
  });

  it('should set product attribute by code', async () => {
    const result = await useCase.execute({
      productId: 'p1',
      attributeCode: 'color',
      value: 'Blue',
    });

    expect(result.success).toBe(true);
  });

  it('should return error when attribute not found', async () => {
    mockRepo.findAttributeById.mockResolvedValueOnce(null);
    mockRepo.findAttributeByCode.mockResolvedValueOnce(null);

    const result = await useCase.execute({
      productId: 'p1',
      attributeId: 'nonexistent',
      value: 'Red',
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe('Attribute not found');
  });
});
