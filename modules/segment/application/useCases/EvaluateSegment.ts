import type {
  CustomerProfileRepository,
  SegmentRepository,
  SegmentMembershipRepository,
} from '../../domain/repositories/SegmentRepository';
import { evaluateConditions } from '../../domain/services/ConditionEvaluator';
import { SegmentNotFoundError } from '../../domain/errors/SegmentErrors';

export class EvaluateSegmentUseCase {
  constructor(
    private segmentRepo: SegmentRepository,
    private profileRepo: CustomerProfileRepository,
    private membershipRepo: SegmentMembershipRepository,
  ) {}

  async execute(segmentId: string): Promise<{ matched: number; total: number }> {
    const segment = await this.segmentRepo.findById(segmentId);
    if (!segment) throw new SegmentNotFoundError(segmentId);

    // Clear old memberships
    await this.membershipRepo.removeAllForSegment(segmentId);

    // Get all profiles
    const profiles = await this.profileRepo.findAll(10000, 0);
    let matched = 0;

    for (const profile of profiles) {
      const isMatch = evaluateConditions(segment.conditions, segment.matchMode, profile);
      if (isMatch) {
        await this.membershipRepo.upsert(segmentId, profile.customerId);
        matched++;
      }
    }

    // Update segment member count
    segment.setMemberCount(matched);
    await this.segmentRepo.update(segment);

    return { matched, total: profiles.length };
  }
}

