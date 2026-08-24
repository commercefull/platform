jest.mock('../../../../libs/uuid', () => ({
  __esModule: true,
  generateUUID: jest.fn().mockReturnValue('variant-uuid'),
}));

jest.mock('../../infrastructure/repositories/ProductVariantRepository', () => ({
  __esModule: true,
  default: {
    save: jest.fn().mockImplementation(async (variant: unknown) => variant),
  },
}));

import { CreateProductVariantUseCase, CreateProductVariantCommand } from './CreateProductVariant';
import ProductVariantRepository from '../../infrastructure/repositories/ProductVariantRepository';

const mockRepo = ProductVariantRepository as unknown as Record<string, jest.Mock>;

describe('CreateProductVariantUseCase', () => {
  let useCase: CreateProductVariantUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new CreateProductVariantUseCase(mockRepo as never);
  });

  it('should create product variant (happy path)', async () => {
    const result = await useCase.execute(new CreateProductVariantCommand(
      'p1', 'SKU-1',
      [{ attributeId: 'a1', attributeName: 'Color', value: 'Red' }],
      100, 80, 'USD', true, 50, false, 5, true, 0,
    ));

    expect(result.variantId).toBe('variant-uuid');
    expect(result.productId).toBe('p1');
    expect(mockRepo.save).toHaveBeenCalled();
  });
});
