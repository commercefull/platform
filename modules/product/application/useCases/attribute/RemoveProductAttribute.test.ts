import { RemoveProductAttributeUseCase } from './RemoveProductAttribute';
import type { DynamicAttributePort } from '../../../domain/repositories/ProductCatalogPorts';
import { createAttribute, lazyMock } from '../../../tests/testUtils';

describe('RemoveProductAttributeUseCase', () => {
  let useCase: RemoveProductAttributeUseCase;
  let mockRepo: jest.Mocked<DynamicAttributePort>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockRepo = lazyMock<DynamicAttributePort>();
    useCase = new RemoveProductAttributeUseCase(mockRepo);
  });

  it('should remove the attribute when given an attributeId', async () => {
    const result = await useCase.execute({ productId: 'p1', attributeId: 'a1' });

    expect(result.success).toBe(true);
    expect(mockRepo.removeProductAttribute).toHaveBeenCalledWith('p1', 'a1');
    expect(mockRepo.findAttributeByCode).not.toHaveBeenCalled();
  });

  it('should resolve the attribute by code before removing', async () => {
    mockRepo.findAttributeByCode.mockResolvedValue(createAttribute({ productAttributeId: 'a1', code: 'color' }));

    const result = await useCase.execute({ productId: 'p1', attributeCode: 'color' });

    expect(result.success).toBe(true);
    expect(mockRepo.findAttributeByCode).toHaveBeenCalledWith('color');
    expect(mockRepo.removeProductAttribute).toHaveBeenCalledWith('p1', 'a1');
  });

  it('should fail when the attribute code does not resolve', async () => {
    mockRepo.findAttributeByCode.mockResolvedValue(null);

    const result = await useCase.execute({ productId: 'p1', attributeCode: 'unknown' });

    expect(result.success).toBe(false);
    expect(result.error).toBe('Attribute not found');
    expect(mockRepo.removeProductAttribute).not.toHaveBeenCalled();
  });

  it('should fail when neither attributeId nor attributeCode is provided', async () => {
    const result = await useCase.execute({ productId: 'p1' });

    expect(result.success).toBe(false);
    expect(result.error).toBe('Attribute ID or code is required');
  });

  it('should return failure when the repository throws', async () => {
    mockRepo.removeProductAttribute.mockRejectedValue(new Error('delete failed'));

    const result = await useCase.execute({ productId: 'p1', attributeId: 'a1' });

    expect(result.success).toBe(false);
    expect(result.error).toContain('delete failed');
  });
});
