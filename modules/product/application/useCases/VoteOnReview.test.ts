
import { VoteOnReviewUseCase, VoteOnReviewCommand } from './VoteOnReview';
import { ProductValidationError } from '../../domain/errors/ProductErrors';
import { createReviewVote, lazyMock } from '../../tests/testUtils';

;

describe('VoteOnReviewUseCase', () => {
  let useCase: VoteOnReviewUseCase;
  let mockRepo: jest.Mocked<ConstructorParameters<typeof VoteOnReviewUseCase>[0]>;

  beforeEach(() => {
    jest.clearAllMocks();
        mockRepo = lazyMock<ConstructorParameters<typeof VoteOnReviewUseCase>[0]>();
    mockRepo.create.mockResolvedValue(createReviewVote());
    mockRepo.countByReview.mockResolvedValue({ helpful: 5, unhelpful: 2 });
    useCase = new VoteOnReviewUseCase(mockRepo);
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
