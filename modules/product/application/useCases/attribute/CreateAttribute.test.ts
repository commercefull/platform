jest.mock('../../../infrastructure/repositories/DynamicAttributeRepository', () => ({
  __esModule: true,
  default: {
    findAttributeByCode: jest.fn().mockResolvedValue(null),
    findAttributeById: jest.fn().mockResolvedValue(null),
    createAttribute: jest.fn().mockResolvedValue({
      productAttributeId: 'a1', name: 'Color', code: 'color', type: 'select', isSystem: false,
    }),
    updateAttribute: jest.fn().mockResolvedValue({
      productAttributeId: 'a1', name: 'Color Updated', code: 'color', type: 'select', isSystem: false,
    }),
    findAttributeValues: jest.fn().mockResolvedValue([]),
    setProductAttribute: jest.fn().mockResolvedValue({ productId: 'p1', attributeId: 'a1', value: 'Red' }),
  },
}));

import { CreateAttributeUseCase} from './CreateAttribute';
import dynamicAttributeRepository from '../../../infrastructure/repositories/DynamicAttributeRepository';

const mockRepo = dynamicAttributeRepository as unknown as Record<string, jest.Mock>;

describe('CreateAttributeUseCase', () => {
  let useCase: CreateAttributeUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new CreateAttributeUseCase();
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
    mockRepo.findAttributeByCode.mockResolvedValueOnce({ productAttributeId: 'existing' });

    const result = await useCase.execute({ name: 'Color', code: 'color' });

    expect(result.success).toBe(false);
    expect(result.error).toContain('already exists');
  });
});
