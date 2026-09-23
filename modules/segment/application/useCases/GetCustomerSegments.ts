import type { SegmentMembershipRepository } from '../../domain/repositories/SegmentRepository';

export class GetCustomerSegmentsUseCase {
  constructor(private membershipRepo: SegmentMembershipRepository) {}

  async execute(customerId: string): Promise<{ segmentId: string; matchScore: number | null }[]> {
    return this.membershipRepo.findByCustomer(customerId);
  }
}
