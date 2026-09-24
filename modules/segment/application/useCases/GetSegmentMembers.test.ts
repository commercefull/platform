import { GetSegmentMembersUseCase } from './GetSegmentMembers';
import type {
  SegmentRepository,
  CustomerProfileRepository,
  SegmentMembershipRepository,
} from '../../domain/repositories/SegmentRepository';
import { createCustomerProfile, lazyMock } from '../../tests/testUtils';

describe('GetSegmentMembersUseCase', () => {
  it('should return profiles assigned to the segment', async () => {
    const segmentRepo = lazyMock<SegmentRepository>();
    const profileRepo = lazyMock<CustomerProfileRepository>();
    const membershipRepo = lazyMock<SegmentMembershipRepository>();
    profileRepo.findBySegment.mockResolvedValue([createCustomerProfile()]);

    const result = await new GetSegmentMembersUseCase(segmentRepo, profileRepo, membershipRepo).execute('seg-1');

    expect(result).toHaveLength(1);
    expect(profileRepo.findBySegment).toHaveBeenCalledWith('seg-1');
  });
});

