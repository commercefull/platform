import type { CustomerProfile } from '../../domain/entities/CustomerProfile';
import type {
  CustomerProfileRepository,
  SegmentRepository,
  SegmentMembershipRepository,
} from '../../domain/repositories/SegmentRepository';

export class GetSegmentMembersUseCase {
  constructor(
    private segmentRepo: SegmentRepository,
    private profileRepo: CustomerProfileRepository,
    private membershipRepo: SegmentMembershipRepository,
  ) {}

  async execute(segmentId: string, _limit?: number): Promise<CustomerProfile[]> {
    return this.profileRepo.findBySegment(segmentId);
  }
}

