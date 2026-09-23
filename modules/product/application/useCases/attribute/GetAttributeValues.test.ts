import { GetAttributeValuesUseCase } from './GetAttributeValues';
import type { DynamicAttributePort } from '../../../domain/repositories/ProductCatalogPorts';
import { lazyMock } from '../../../tests/testUtils';

describe('GetAttributeValuesUseCase', () => {
  let useCase: GetAttributeValuesUseCase;
  let mockRepo: jest.Mocked<DynamicAttributePort>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockRepo = lazyMock<DynamicAttributePort>();
    useCase = new GetAttributeValuesUseCase(mockRepo);
  });

  it('should return values for the attribute', async () => {
    mockRepo.findAttributeValues.mockResolvedValue([
      { productAttributeValueId: 'v1', attributeId: 'a1', value: 'Red', label: 'Red' },
    ] as unknown as Awaited<ReturnType<DynamicAttributePort['findAttributeValues']>>);

    const result = await useCase.execute({ attributeId: 'a1' });

    expect(result.success).toBe(true);
    expect(result.data).toHaveLength(1);
    expect(mockRepo.findAttributeValues).toHaveBeenCalledWith('a1');
  });

  it('should return failure when the repository throws', async () => {
    mockRepo.findAttributeValues.mockRejectedValue(new Error('db down'));

    const result = await useCase.execute({ attributeId: 'a1' });

    expect(result.success).toBe(false);
    expect(result.error).toContain('db down');
  });
});
