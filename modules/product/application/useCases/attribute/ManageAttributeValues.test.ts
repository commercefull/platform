jest.mock('../../../infrastructure/repositories/DynamicAttributeRepository', () => ({
  __esModule: true,
  default: {
    findAttributeById: jest.fn().mockResolvedValue({
      productAttributeId: 'a1', name: 'Color', code: 'color', type: 'select', isSystem: false,
    }),
    findAttributeValues: jest.fn().mockResolvedValue([]),
    createAttributeValue: jest.fn().mockResolvedValue({
      productAttributeValueId: 'v1', attributeId: 'a1', value: 'Red', displayValue: 'Red', position: 0,
    }),
    deleteAttributeValue: jest.fn().mockResolvedValue(true),
  },
}));

import { AddAttributeValueUseCase} from './ManageAttributeValues';
import dynamicAttributeRepository from '../../../infrastructure/repositories/DynamicAttributeRepository';

const mockRepo = dynamicAttributeRepository as unknown as Record<string, jest.Mock>;

describe('AddAttributeValueUseCase', () => {
  let useCase: AddAttributeValueUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new AddAttributeValueUseCase();
  });

  it('should add attribute value (happy path)', async () => {
    const result = await useCase.execute({
      attributeId: 'a1', value: 'Red', displayValue: 'Red',
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
    mockRepo.findAttributeById.mockResolvedValueOnce({
      productAttributeId: 'a1', name: 'Width', code: 'width', type: 'text', isSystem: false,
    });

    const result = await useCase.execute({ attributeId: 'a1', value: '10px' });

    expect(result.success).toBe(false);
    expect(result.error).toContain('does not support predefined values');
  });

  it('should return error when value already exists', async () => {
    mockRepo.findAttributeValues.mockResolvedValueOnce([{ value: 'Red' }]);

    const result = await useCase.execute({ attributeId: 'a1', value: 'Red' });

    expect(result.success).toBe(false);
    expect(result.error).toContain('already exists');
  });
});
