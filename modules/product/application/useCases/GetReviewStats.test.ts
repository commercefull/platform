jest.mock('../../infrastructure/repositories/productReviewRepo', () => ({
  __esModule: true,
  default: {
    getProductStatistics: jest.fn().mockResolvedValue({ totalReviews: 10, averageRating: 4.5 }),
  },
}));

import { GetReviewStatsUseCase } from './GetReviewStats';
import productReviewRepo from '../../infrastructure/repositories/productReviewRepo';

const mockRepo = productReviewRepo as unknown as Record<string, jest.Mock>;

describe('GetReviewStatsUseCase', () => {
  let useCase: GetReviewStatsUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new GetReviewStatsUseCase();
  });

  it('should get review stats (happy path)', async () => {
    const result = await useCase.execute('p1') as unknown as Record<string, unknown>;

    expect(result.totalReviews).toBe(10);
    expect(mockRepo.getProductStatistics).toHaveBeenCalledWith('p1');
  });
});
