
import { ManageProductReviewsUseCase } from './ManageProductReviews';
import { createProductReview, lazyMock } from '../../tests/testUtils';

describe('ManageProductReviewsUseCase', () => {
  let useCase: ManageProductReviewsUseCase;
  let mockRepo: jest.Mocked<ConstructorParameters<typeof ManageProductReviewsUseCase>[0]>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockRepo = lazyMock<ConstructorParameters<typeof ManageProductReviewsUseCase>[0]>();
    mockRepo.findById.mockResolvedValue(createProductReview());
    mockRepo.findByProductId.mockResolvedValue([createProductReview()]);
    mockRepo.findByCustomerId.mockResolvedValue([createProductReview()]);
    mockRepo.findWithFilters.mockResolvedValue([createProductReview()]);
    mockRepo.findPending.mockResolvedValue([createProductReview({ status: 'pending' })]);
    mockRepo.create.mockResolvedValue(createProductReview({ productReviewId: 'r2' }));
    mockRepo.update.mockResolvedValue(createProductReview());
    mockRepo.updateStatus.mockResolvedValue(createProductReview());
    mockRepo.approve.mockResolvedValue(createProductReview());
    mockRepo.reject.mockResolvedValue(createProductReview());
    mockRepo.highlight.mockResolvedValue(createProductReview());
    mockRepo.addAdminResponse.mockResolvedValue(createProductReview());
    mockRepo.incrementHelpful.mockResolvedValue(createProductReview());
    mockRepo.getProductStatistics.mockResolvedValue({
      totalReviews: 10,
      averageRating: 4.5,
      distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 10 },
      verifiedPurchaseCount: 0,
    });
    mockRepo.findByCustomerAndProduct.mockResolvedValue(null);
    mockRepo.checkCustomerPurchase.mockResolvedValue(true);
    useCase = new ManageProductReviewsUseCase(mockRepo);
  });

  it('should find by ID', async () => {
    const result = await useCase.findById('r1');
    expect(result).toEqual(createProductReview());
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
    const result = await useCase.create({ productId: 'p1', customerId: 'c1', rating: 5, status: 'pending', isVerifiedPurchase: false });
    expect(result).toEqual(createProductReview({ productReviewId: 'r2' }));
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
