
import { AddAttributeValueUseCase } from './AddAttributeValue';
import type { DynamicAttributePort } from '../../../domain/repositories/ProductCatalogPorts';
import { createAttribute, createAttributeValue, lazyMock } from '../../../tests/testUtils';

describe('AddAttributeValueUseCase', () => {
  let useCase: AddAttributeValueUseCase;
  let mockRepo: jest.Mocked<DynamicAttributePort>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockRepo = lazyMock<DynamicAttributePort>();
    mockRepo.findAttributeById.mockResolvedValue(createAttribute());
    mockRepo.findAttributeValues.mockResolvedValue([]);
    mockRepo.createAttributeValue.mockResolvedValue(createAttributeValue({ productAttributeValueId: 'v1', displayValue: 'Red' }));
    mockRepo.deleteAttributeValue.mockResolvedValue(true);
    useCase = new AddAttributeValueUseCase(mockRepo);
  });

  it('should add attribute value (happy path)', async () => {
    const result = await useCase.execute({
      attributeId: 'a1',
      value: 'Red',
      displayValue: 'Red',
    });

    expect(result.success).toBe(true);
    expect(result.data?.productAttributeValueId).toBe('v1');
  });

  it('should return error when attribute not found', async () => {
    mockRepo.findAttributeById.mockResolvedValueOnce(null);

    const result = await useCase.execute({ attributeId: 'nonexistent', value: 'Red' });

    expect(result.success).toBe(false);
    expect(result.error).toBe('Attribute not found');
  });

  it('should return error when attribute type does not support values', async () => {
    mockRepo.findAttributeById.mockResolvedValueOnce(createAttribute({ name: 'Width', code: 'width', type: 'text' }));

    const result = await useCase.execute({ attributeId: 'a1', value: '10px' });

    expect(result.success).toBe(false);
    expect(result.error).toContain('does not support predefined values');
  });

  it('should return error when value already exists', async () => {
    mockRepo.findAttributeValues.mockResolvedValueOnce([createAttributeValue()]);

    const result = await useCase.execute({ attributeId: 'a1', value: 'Red' });

    expect(result.success).toBe(false);
    expect(result.error).toContain('already exists');
  });

  it('should default the position to the existing value count when not provided', async () => {
    mockRepo.findAttributeValues.mockResolvedValueOnce([
      createAttributeValue({ productAttributeValueId: 'v1', value: 'Red' }),
      createAttributeValue({ productAttributeValueId: 'v2', value: 'Blue' }),
    ]);

    const result = await useCase.execute({ attributeId: 'a1', value: 'Green' });

    expect(result.success).toBe(true);
    expect(mockRepo.createAttributeValue).toHaveBeenCalledWith(
      expect.objectContaining({ attributeId: 'a1', value: 'Green', position: 2 }),
    );
  });

  it('should return failure when the repository throws', async () => {
    mockRepo.createAttributeValue.mockRejectedValueOnce(new Error('unique violation'));

    const result = await useCase.execute({ attributeId: 'a1', value: 'Green' });

    expect(result.success).toBe(false);
    expect(result.error).toContain('unique violation');
  });
});
