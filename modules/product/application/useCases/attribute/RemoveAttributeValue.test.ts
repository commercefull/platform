import { RemoveAttributeValueUseCase } from './RemoveAttributeValue';
import type { DynamicAttributePort } from '../../../domain/repositories/ProductCatalogPorts';
import { lazyMock } from '../../../tests/testUtils';

describe('RemoveAttributeValueUseCase', () => {
  let useCase: RemoveAttributeValueUseCase;
  let mockRepo: jest.Mocked<DynamicAttributePort>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockRepo = lazyMock<DynamicAttributePort>();
    useCase = new RemoveAttributeValueUseCase(mockRepo);
  });

  it('should remove the attribute value', async () => {
    mockRepo.deleteAttributeValue.mockResolvedValue(true);

    const result = await useCase.execute({ attributeValueId: 'v1' });

    expect(result.success).toBe(true);
    expect(mockRepo.deleteAttributeValue).toHaveBeenCalledWith('v1');
  });

  it('should return failure when the value cannot be deleted', async () => {
    mockRepo.deleteAttributeValue.mockResolvedValue(false);

    const result = await useCase.execute({ attributeValueId: 'v1' });

    expect(result.success).toBe(false);
    expect(result.error).toBe('Failed to delete attribute value');
  });

  it('should return failure when the repository throws', async () => {
    mockRepo.deleteAttributeValue.mockRejectedValue(new Error('constraint violation'));

    const result = await useCase.execute({ attributeValueId: 'v1' });

    expect(result.success).toBe(false);
    expect(result.error).toContain('constraint violation');
  });
});
