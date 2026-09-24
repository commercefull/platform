
import { GetReviewStatsUseCase } from './GetReviewStats';
import { lazyMock } from '../../tests/testUtils';

;

describe('GetReviewStatsUseCase', () => {
  let useCase: GetReviewStatsUseCase;
  let mockRepo: jest.Mocked<ConstructorParameters<typeof GetReviewStatsUseCase>[0]>;

  beforeEach(() => {
    jest.clearAllMocks();
        mockRepo = lazyMock<ConstructorParameters<typeof GetReviewStatsUseCase>[0]>();
    mockRepo.getProductStatistics.mockResolvedValue({ totalReviews: 10, averageRating: 4.5, distribution: { 1: 0, 2: 0, 3: 0, 4: 2, 5: 8 }, verifiedPurchaseCount: 3 });
    useCase = new GetReviewStatsUseCase(mockRepo);
  });

  it('should get review stats (happy path)', async () => {
    const result = (await useCase.execute('p1')) as unknown as Record<string, unknown>;

    expect(result.totalReviews).toBe(10);
    expect(mockRepo.getProductStatistics).toHaveBeenCalledWith('p1');
  });
});
