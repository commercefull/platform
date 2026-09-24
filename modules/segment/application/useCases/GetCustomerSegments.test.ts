import { GetCustomerSegmentsUseCase } from './GetCustomerSegments';
import type { SegmentMembershipRepository } from '../../domain/repositories/SegmentRepository';
import { lazyMock } from '../../tests/testUtils';

describe('GetCustomerSegmentsUseCase', () => {
  it('should return the segments the customer belongs to', async () => {
    const membershipRepo = lazyMock<SegmentMembershipRepository>();
    membershipRepo.findByCustomer.mockResolvedValue([{ segmentId: 'seg-1', matchScore: 0.9 }]);

    const result = await new GetCustomerSegmentsUseCase(membershipRepo).execute('cust-1');

    expect(result).toEqual([{ segmentId: 'seg-1', matchScore: 0.9 }]);
  });
});
