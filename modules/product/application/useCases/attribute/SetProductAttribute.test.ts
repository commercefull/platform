
import { SetProductAttributeUseCase } from './SetProductAttribute';
import type { DynamicAttributePort } from '../../../domain/repositories/ProductCatalogPorts';
import { createAttribute, createAttributeData, createAttributeValue, lazyMock } from '../../../tests/testUtils';

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

  it('should accept a value that exists in the option list for select attributes', async () => {
    mockRepo.findAttributeById.mockResolvedValueOnce(createAttribute({ type: 'select', name: 'Color' }));
    mockRepo.findAttributeValues.mockResolvedValueOnce([createAttributeValue({ value: 'Red' })]);

    const result = await useCase.execute({ productId: 'p1', attributeId: 'a1', value: 'Red' });

    expect(result.success).toBe(true);
    expect(mockRepo.setProductAttribute).toHaveBeenCalled();
  });

  it('should reject a value not in the option list for select attributes', async () => {
    mockRepo.findAttributeById.mockResolvedValueOnce(createAttribute({ type: 'select', name: 'Color' }));
    mockRepo.findAttributeValues.mockResolvedValueOnce([createAttributeValue({ value: 'Red' })]);

    const result = await useCase.execute({ productId: 'p1', attributeId: 'a1', value: 'Green' });

    expect(result.success).toBe(false);
    expect(result.error).toBe('Invalid value "Green" for attribute "Color"');
    expect(mockRepo.setProductAttribute).not.toHaveBeenCalled();
  });

  it('should allow any value for a select attribute that has no options defined', async () => {
    mockRepo.findAttributeById.mockResolvedValueOnce(createAttribute({ type: 'select', name: 'Color' }));
    mockRepo.findAttributeValues.mockResolvedValueOnce([]);

    const result = await useCase.execute({ productId: 'p1', attributeId: 'a1', value: 'AnyValue' });

    expect(result.success).toBe(true);
  });

  it('should skip option validation for non-option attribute types', async () => {
    mockRepo.findAttributeById.mockResolvedValueOnce(createAttribute({ type: 'number' }));

    const result = await useCase.execute({ productId: 'p1', attributeId: 'a1', value: '42' });

    expect(result.success).toBe(true);
    expect(mockRepo.findAttributeValues).not.toHaveBeenCalled();
  });

  it('should return failure when the repository throws', async () => {
    mockRepo.setProductAttribute.mockRejectedValueOnce(new Error('write conflict'));

    const result = await useCase.execute({ productId: 'p1', attributeId: 'a1', value: 'Red' });

    expect(result.success).toBe(false);
    expect(result.error).toContain('write conflict');
  });
});
