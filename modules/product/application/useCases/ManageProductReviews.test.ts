jest.mock('../../infrastructure/repositories/productReviewRepo', () => ({
  __esModule: true,
  ProductReviewRepo: jest.fn().mockImplementation(() => ({
    findById: jest.fn().mockResolvedValue({ reviewId: 'r1' }),
    findByProductId: jest.fn().mockResolvedValue([{ reviewId: 'r1' }]),
    findByCustomerId: jest.fn().mockResolvedValue([{ reviewId: 'r1' }]),
    findWithFilters: jest.fn().mockResolvedValue([{ reviewId: 'r1' }]),
    findPending: jest.fn().mockResolvedValue([{ reviewId: 'r1', status: 'pending' }]),
    create: jest.fn().mockResolvedValue({ reviewId: 'r2' }),
    update: jest.fn().mockResolvedValue(undefined),
    updateStatus: jest.fn().mockResolvedValue(undefined),
    approve: jest.fn().mockResolvedValue(undefined),
    reject: jest.fn().mockResolvedValue(undefined),
    highlight: jest.fn().mockResolvedValue(undefined),
    addAdminResponse: jest.fn().mockResolvedValue(undefined),
    incrementHelpful: jest.fn().mockResolvedValue(undefined),
    getProductStatistics: jest.fn().mockResolvedValue({ totalReviews: 10 }),
    findByCustomerAndProduct: jest.fn().mockResolvedValue(null),
    checkCustomerPurchase: jest.fn().mockResolvedValue(true),
  })),
}));

import { ManageProductReviewsUseCase } from './ManageProductReviews';
import { ProductReviewRepo } from '../../infrastructure/repositories/productReviewRepo';

describe('ManageProductReviewsUseCase', () => {
  let useCase: ManageProductReviewsUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new ManageProductReviewsUseCase(new ProductReviewRepo() as never);
  });

  it('should find by ID', async () => {
    const result = await useCase.findById('r1');
    expect(result).toEqual({ reviewId: 'r1' });
  });

  it('should find by product ID', async () => {
    const result = await useCase.findByProductId('p1', undefined, 10, 0);
    expect(result).toHaveLength(1);
  });

  it('should find pending', async () => {
    const result = await useCase.findPending(10, 0);
    expect(result).toHaveLength(1);
  });

  it('should create review', async () => {
    const result = await useCase.create({ productId: 'p1', customerId: 'c1', rating: 5 } as never);
    expect(result).toEqual({ reviewId: 'r2' });
  });

  it('should approve review', async () => {
    await useCase.approve('r1');
  });

  it('should reject review', async () => {
    await useCase.reject('r1');
  });

  it('should check customer purchase', async () => {
    const result = await useCase.checkCustomerPurchase('c1', 'p1');
    expect(result).toBe(true);
  });
});
