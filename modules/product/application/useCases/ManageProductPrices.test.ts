jest.mock('../../infrastructure/repositories/productPriceRepo', () => ({
  __esModule: true,
  default: {
    findByProduct: jest.fn().mockResolvedValue([{ priceId: 'pr1', amount: 100 }]),
    create: jest.fn().mockResolvedValue({ priceId: 'pr2', amount: 200 }),
    update: jest.fn().mockResolvedValue({ priceId: 'pr1', amount: 150 }),
  },
}));

import { ManageProductPricesUseCase } from './ManageProductPrices';
import productPriceRepo from '../../infrastructure/repositories/productPriceRepo';

const _mockRepo = productPriceRepo as unknown as Record<string, jest.Mock>;

describe('ManageProductPricesUseCase', () => {
  let useCase: ManageProductPricesUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new ManageProductPricesUseCase();
  });

  it('should find by product', async () => {
    const result = await useCase.findByProduct('p1');
    expect(result).toHaveLength(1);
  });

  it('should create price', async () => {
    const result = await useCase.create({ productId: 'p1', amount: 200, currency: 'USD' } as never);
    expect(result).toEqual({ priceId: 'pr2', amount: 200 });
  });

  it('should update price', async () => {
    const result = await useCase.update('pr1', { amount: 150 } as never);
    expect(result).toEqual({ priceId: 'pr1', amount: 150 });
  });
});
