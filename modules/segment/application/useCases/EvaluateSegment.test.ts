import { EvaluateSegmentUseCase } from './EvaluateSegment';
import { SegmentNotFoundError } from '../../domain/errors/SegmentErrors';
import type {
  SegmentRepository,
  CustomerProfileRepository,
  SegmentMembershipRepository,
} from '../../domain/repositories/SegmentRepository';
import { createCustomerProfile, createSegment, lazyMock } from '../../tests/testUtils';

describe('EvaluateSegmentUseCase', () => {
  let segmentRepo: jest.Mocked<SegmentRepository>;
  let profileRepo: jest.Mocked<CustomerProfileRepository>;
  let membershipRepo: jest.Mocked<SegmentMembershipRepository>;
  let useCase: EvaluateSegmentUseCase;

  beforeEach(() => {
    segmentRepo = lazyMock<SegmentRepository>();
    segmentRepo.findById.mockResolvedValue(createSegment({ conditions: [{ field: 'lifetimeValueCents', operator: 'gte', value: 0 }] }));
    segmentRepo.update.mockImplementation(async s => s);
    profileRepo = lazyMock<CustomerProfileRepository>();
    profileRepo.findAll.mockResolvedValue([createCustomerProfile(), createCustomerProfile({ customerId: 'cust-2' })]);
    membershipRepo = lazyMock<SegmentMembershipRepository>();
    useCase = new EvaluateSegmentUseCase(segmentRepo, profileRepo, membershipRepo);
  });

  it('should match all profiles when every profile satisfies the conditions', async () => {
    const result = await useCase.execute('seg-1');

    expect(result).toEqual({ matched: 2, total: 2 });
    expect(membershipRepo.removeAllForSegment).toHaveBeenCalledWith('seg-1');
    expect(membershipRepo.upsert).toHaveBeenCalledTimes(2);
    expect(segmentRepo.update).toHaveBeenCalled();
  });

  it('should match only profiles that satisfy the conditions', async () => {
    segmentRepo.findById.mockResolvedValue(
      createSegment({ conditions: [{ field: 'lifetimeValueCents', operator: 'gte', value: 500 }] }),
    );

    const result = await useCase.execute('seg-1');

    expect(result).toEqual({ matched: 0, total: 2 });
    expect(membershipRepo.upsert).not.toHaveBeenCalled();
  });

  it('should throw SegmentNotFoundError when the segment does not exist', async () => {
    segmentRepo.findById.mockResolvedValue(null);

    await expect(useCase.execute('missing')).rejects.toThrow(SegmentNotFoundError);
  });
});

