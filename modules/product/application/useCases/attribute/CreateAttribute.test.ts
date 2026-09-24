
import { CreateAttributeUseCase } from './CreateAttribute';
import type { DynamicAttributePort } from '../../../domain/repositories/ProductCatalogPorts';
import { createAttribute, createAttributeData, lazyMock } from '../../../tests/testUtils';

describe('CreateAttributeUseCase', () => {
  let useCase: CreateAttributeUseCase;
  let mockRepo: jest.Mocked<DynamicAttributePort>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockRepo = lazyMock<DynamicAttributePort>();
    mockRepo.findAttributeByCode.mockResolvedValue(null);
    mockRepo.findAttributeById.mockResolvedValue(null);
    mockRepo.createAttribute.mockResolvedValue(createAttribute({ productAttributeId: 'a1' }));
    mockRepo.updateAttribute.mockResolvedValue(createAttribute({ name: 'Color Updated' }));
    mockRepo.findAttributeValues.mockResolvedValue([]);
    mockRepo.setProductAttribute.mockResolvedValue(createAttributeData({ productId: 'p1', attributeId: 'a1', value: 'Red' }));
    useCase = new CreateAttributeUseCase(mockRepo);
  });

  it('should create attribute (happy path)', async () => {
    const result = await useCase.execute({ name: 'Color', code: 'color', type: 'select' });

    expect(result.success).toBe(true);
    expect(result.data?.productAttributeId).toBe('a1');
  });

  it('should return error when name is missing', async () => {
    const result = await useCase.execute({ name: '', code: 'color' });

    expect(result.success).toBe(false);
    expect(result.error).toBe('Name and code are required');
  });

  it('should return error when code is missing', async () => {
    const result = await useCase.execute({ name: 'Color', code: '' });

    expect(result.success).toBe(false);
    expect(result.error).toBe('Name and code are required');
  });

  it('should return error when code already exists', async () => {
    mockRepo.findAttributeByCode.mockResolvedValueOnce(createAttribute({ productAttributeId: 'existing' }));

    const result = await useCase.execute({ name: 'Color', code: 'color' });

    expect(result.success).toBe(false);
    expect(result.error).toContain('already exists');
  });

  it('should create predefined options when options are provided', async () => {
    const result = await useCase.execute({
      name: 'Color',
      code: 'color',
      type: 'select',
      options: [
        { value: 'red', displayValue: 'Red', position: 0, isDefault: true },
        { value: 'blue', displayValue: 'Blue' },
      ],
    });

    expect(result.success).toBe(true);
    expect(mockRepo.createAttributeValue).toHaveBeenCalledTimes(2);
    expect(mockRepo.createAttributeValue).toHaveBeenNthCalledWith(1, {
      attributeId: 'a1',
      value: 'red',
      displayValue: 'Red',
      position: 0,
      isDefault: true,
    });
    expect(mockRepo.createAttributeValue).toHaveBeenNthCalledWith(2, {
      attributeId: 'a1',
      value: 'blue',
      displayValue: 'Blue',
      position: undefined,
      isDefault: undefined,
    });
  });

  it('should default type and inputType to text when not provided', async () => {
    await useCase.execute({ name: 'SKU Note', code: 'sku_note' });

    expect(mockRepo.createAttribute).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'text', inputType: 'text' }),
    );
  });

  it('should default inputType to the attribute type when inputType is not provided', async () => {
    await useCase.execute({ name: 'Size', code: 'size', type: 'select' });

    expect(mockRepo.createAttribute).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'select', inputType: 'select' }),
    );
  });

  it('should return failure when the repository throws', async () => {
    mockRepo.createAttribute.mockRejectedValueOnce(new Error('db down'));

    const result = await useCase.execute({ name: 'Color', code: 'color' });

    expect(result.success).toBe(false);
    expect(result.error).toContain('Failed to create attribute');
    expect(result.error).toContain('db down');
  });
});
