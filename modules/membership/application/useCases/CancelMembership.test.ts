jest.mock('../../../../libs/events/eventBus', () => ({
  __esModule: true,
  eventBus: { emit: jest.fn() },
}));

import { CancelMembershipUseCase} from './CancelMembership';
import { MembershipNotFoundError, MembershipValidationError } from '../../domain/errors/MembershipErrors';

describe('CancelMembershipUseCase', () => {
  let useCase: CancelMembershipUseCase;
  let mockRepo: Record<string, jest.Mock>;

  beforeEach(() => {
    mockRepo = {
      getMembershipById: jest.fn().mockResolvedValue({ status: 'active', customerId: 'c1', tierId: 't1', billingPeriod: 'monthly', currentPeriodEnd: new Date(Date.now() + 15 * 86400000).toISOString(), createdAt: new Date() }),
      getTierById: jest.fn().mockResolvedValue({ price: 50 }),
      updateMembership: jest.fn().mockResolvedValue(undefined),
      createStatusLog: jest.fn().mockResolvedValue(undefined),
      recordCancellationFeedback: jest.fn().mockResolvedValue(undefined),
    };
    useCase = new CancelMembershipUseCase(mockRepo as never);
  });

  it('should cancel membership at period end (happy path)', async () => {
    const result = await useCase.execute({ membershipId: 'm1', reason: 'Too expensive' });

    expect(result.membershipId).toBe('m1');
    expect(result.status).toBe('pending_cancellation');
  });

  it('should cancel membership immediately with refund', async () => {
    const result = await useCase.execute({ membershipId: 'm1', immediate: true, cancelledBy: 'admin1' });

    expect(result.membershipId).toBe('m1');
    expect(result.refundEligible).toBe(true);
  });

  it('should throw MembershipNotFoundError when membership not found', async () => {
    mockRepo.getMembershipById.mockResolvedValue(null);

    await expect(useCase.execute({ membershipId: 'missing' })).rejects.toThrow(MembershipNotFoundError);
  });

  it('should throw MembershipValidationError when already cancelled', async () => {
    mockRepo.getMembershipById.mockResolvedValue({ status: 'cancelled', customerId: 'c1', tierId: 't1' });

    await expect(useCase.execute({ membershipId: 'm1' })).rejects.toThrow(MembershipValidationError);
  });
});
