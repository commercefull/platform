
import { UpdateAttributeUseCase } from './UpdateAttribute';
import type { DynamicAttributePort } from '../../../domain/repositories/ProductCatalogPorts';
import { createAttribute, lazyMock } from '../../../tests/testUtils';

describe('UpdateAttributeUseCase', () => {
  let useCase: UpdateAttributeUseCase;
  let mockRepo: jest.Mocked<DynamicAttributePort>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockRepo = lazyMock<DynamicAttributePort>();
    mockRepo.findAttributeByCode.mockResolvedValue(null);
    mockRepo.findAttributeById.mockResolvedValue(createAttribute());
    mockRepo.updateAttribute.mockResolvedValue(createAttribute({ name: 'Color Updated' }));
    useCase = new UpdateAttributeUseCase(mockRepo);
  });

  it('should update attribute (happy path)', async () => {
    const result = await useCase.execute({ attributeId: 'a1', name: 'Color Updated' });

    expect(result.success).toBe(true);
    expect(result.data?.name).toBe('Color Updated');
  });

  it('should return error when attribute not found', async () => {
    mockRepo.findAttributeById.mockResolvedValueOnce(null);

    const result = await useCase.execute({ attributeId: 'nonexistent', name: 'Test' });

    expect(result.success).toBe(false);
    expect(result.error).toBe('Attribute not found');
  });

  it('should return error when updating system attribute', async () => {
    mockRepo.findAttributeById.mockResolvedValueOnce(createAttribute({ name: 'System', isSystem: true }));

    const result = await useCase.execute({ attributeId: 'a1', name: 'Updated' });

    expect(result.success).toBe(false);
    expect(result.error).toBe('Cannot update system attributes');
  });

  it('should return error when new code already exists', async () => {
    mockRepo.findAttributeByCode.mockResolvedValueOnce(createAttribute({ productAttributeId: 'other' }));

    const result = await useCase.execute({ attributeId: 'a1', code: 'new_code' });

    expect(result.success).toBe(false);
    expect(result.error).toContain('already exists');
  });
});
