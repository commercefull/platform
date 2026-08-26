jest.mock('../../infrastructure/repositories/productReviewVoteRepo', () => ({
  __esModule: true,
  default: {
    create: jest.fn().mockResolvedValue({ productReviewVoteId: 'v1', productReviewId: 'r1', customerId: 'c1', isHelpful: true }),
    countByReview: jest.fn().mockResolvedValue({ helpful: 5, unhelpful: 2 }),
  },
}));

import { VoteOnReviewUseCase, VoteOnReviewCommand } from './VoteOnReview';
import { ProductValidationError } from '../../domain/errors/ProductErrors';
import productReviewVoteRepo from '../../infrastructure/repositories/productReviewVoteRepo';

const mockRepo = productReviewVoteRepo as unknown as Record<string, jest.Mock>;

describe('VoteOnReviewUseCase', () => {
  let useCase: VoteOnReviewUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new VoteOnReviewUseCase(productReviewVoteRepo);
  });

  it('should vote on review (happy path)', async () => {
    const result = await useCase.execute(new VoteOnReviewCommand('r1', 'c1', true));

    expect(result.voted).toBe(true);
    expect(result.productReviewVoteId).toBe('v1');
    expect(result.counts.helpful).toBe(5);
  });

  it('should return voted=false when already voted', async () => {
    mockRepo.create.mockResolvedValueOnce(null);

    const result = await useCase.execute(new VoteOnReviewCommand('r1', 'c1', true));

    expect(result.voted).toBe(false);
    expect(result.productReviewVoteId).toBeUndefined();
  });

  it('should throw ProductValidationError when productReviewId is empty', async () => {
    await expect(useCase.execute(new VoteOnReviewCommand('', 'c1', true))).rejects.toThrow(ProductValidationError);
  });

  it('should throw ProductValidationError when customerId is empty', async () => {
    await expect(useCase.execute(new VoteOnReviewCommand('r1', '', true))).rejects.toThrow(ProductValidationError);
  });
});
