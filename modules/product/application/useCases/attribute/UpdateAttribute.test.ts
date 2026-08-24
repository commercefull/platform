jest.mock('../../../infrastructure/repositories/DynamicAttributeRepository', () => ({
  __esModule: true,
  default: {
    findAttributeByCode: jest.fn().mockResolvedValue(null),
    findAttributeById: jest.fn().mockResolvedValue({
      productAttributeId: 'a1', name: 'Color', code: 'color', type: 'select', isSystem: false,
    }),
    updateAttribute: jest.fn().mockResolvedValue({
      productAttributeId: 'a1', name: 'Color Updated', code: 'color', type: 'select', isSystem: false,
    }),
  },
}));

import { UpdateAttributeUseCase} from './UpdateAttribute';
import dynamicAttributeRepository from '../../../infrastructure/repositories/DynamicAttributeRepository';

const mockRepo = dynamicAttributeRepository as unknown as Record<string, jest.Mock>;

describe('UpdateAttributeUseCase', () => {
  let useCase: UpdateAttributeUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new UpdateAttributeUseCase();
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
    mockRepo.findAttributeById.mockResolvedValueOnce({
      productAttributeId: 'a1', name: 'System', code: 'sys', type: 'text', isSystem: true,
    });

    const result = await useCase.execute({ attributeId: 'a1', name: 'Updated' });

    expect(result.success).toBe(false);
    expect(result.error).toBe('Cannot update system attributes');
  });

  it('should return error when new code already exists', async () => {
    mockRepo.findAttributeByCode.mockResolvedValueOnce({ productAttributeId: 'other' });

    const result = await useCase.execute({ attributeId: 'a1', code: 'new_code' });

    expect(result.success).toBe(false);
    expect(result.error).toContain('already exists');
  });
});
