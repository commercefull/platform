
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
});
