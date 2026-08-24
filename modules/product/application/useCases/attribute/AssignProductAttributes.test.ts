jest.mock('../../../infrastructure/repositories/DynamicAttributeRepository', () => ({
  __esModule: true,
  default: {
    findAttributeById: jest.fn().mockResolvedValue({
      productAttributeId: 'a1', name: 'Color', code: 'color', type: 'text', isSystem: false,
    }),
    findAttributeByCode: jest.fn().mockResolvedValue({
      productAttributeId: 'a1', name: 'Color', code: 'color', type: 'text', isSystem: false,
    }),
    findAttributeValues: jest.fn().mockResolvedValue([]),
    setProductAttribute: jest.fn().mockResolvedValue({ productId: 'p1', attributeId: 'a1', value: 'Red' }),
  },
}));

import { SetProductAttributeUseCase} from './AssignProductAttributes';
import dynamicAttributeRepository from '../../../infrastructure/repositories/DynamicAttributeRepository';

const mockRepo = dynamicAttributeRepository as unknown as Record<string, jest.Mock>;

describe('SetProductAttributeUseCase', () => {
  let useCase: SetProductAttributeUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new SetProductAttributeUseCase();
  });

  it('should set product attribute by ID (happy path)', async () => {
    const result = await useCase.execute({
      productId: 'p1', attributeId: 'a1', value: 'Red',
    });

    expect(result.success).toBe(true);
    expect(result.data?.value).toBe('Red');
  });

  it('should set product attribute by code', async () => {
    const result = await useCase.execute({
      productId: 'p1', attributeCode: 'color', value: 'Blue',
    });

    expect(result.success).toBe(true);
  });

  it('should return error when attribute not found', async () => {
    mockRepo.findAttributeById.mockResolvedValueOnce(null);
    mockRepo.findAttributeByCode.mockResolvedValueOnce(null);

    const result = await useCase.execute({
      productId: 'p1', attributeId: 'nonexistent', value: 'Red',
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe('Attribute not found');
  });
});
