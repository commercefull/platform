/**
 * Vote On Review Use Case
 * Creates a review vote, enforces one-vote-per-customer invariant
 * Uses ON CONFLICT DO NOTHING, then checks if record was created
 */

import productReviewVoteRepo from '../../infrastructure/repositories/productReviewVoteRepo';

// ============================================================================
// Command
// ============================================================================

export class VoteOnReviewCommand {
  constructor(
    public readonly productReviewId: string,
    public readonly customerId: string,
    public readonly isHelpful: boolean,
  ) {}
}

// ============================================================================
// Response
// ============================================================================

export interface VoteOnReviewResponse {
  voted: boolean;
  productReviewVoteId?: string;
  productReviewId: string;
  customerId: string;
  isHelpful: boolean;
  counts: {
    helpful: number;
    unhelpful: number;
  };
}

// ============================================================================
// Use Case
// ============================================================================

export class VoteOnReviewUseCase {
  async execute(command: VoteOnReviewCommand): Promise<VoteOnReviewResponse> {
    if (!command.productReviewId) {
      throw new Error('productReviewId is required');
    }
    if (!command.customerId) {
      throw new Error('customerId is required');
    }

    // Attempt insert — ON CONFLICT DO NOTHING enforces one-vote-per-customer
    const vote = await productReviewVoteRepo.create({
      productReviewId: command.productReviewId,
      customerId: command.customerId,
      isHelpful: command.isHelpful,
    });

    // If vote is null, the customer already voted (conflict was silenced)
    const voted = vote !== null;

    const counts = await productReviewVoteRepo.countByReview(command.productReviewId);

    return {
      voted,
      productReviewVoteId: vote?.productReviewVoteId,
      productReviewId: command.productReviewId,
      customerId: command.customerId,
      isHelpful: command.isHelpful,
      counts,
    };
  }
}
