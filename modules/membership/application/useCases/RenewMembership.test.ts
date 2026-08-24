jest.mock('../../../../libs/events/eventBus', () => ({
  __esModule: true,
  eventBus: { emit: jest.fn() },
}));

import { RenewMembershipUseCase} from './RenewMembership';
import { MembershipNotFoundError, MembershipPlanNotFoundError, MembershipValidationError } from '../../domain/errors/MembershipErrors';

describe('RenewMembershipUseCase', () => {
  let useCase: RenewMembershipUseCase;
  let mockRepo: Record<string, jest.Mock>;

  beforeEach(() => {
    mockRepo = {
      getMembershipById: jest.fn().mockResolvedValue({ membershipId: 'm1', status: 'active', customerId: 'c1', tierId: 't1', billingPeriod: 'monthly', currentPeriodEnd: new Date().toISOString() }),
      getTierById: jest.fn().mockResolvedValue({ price: 50, billingPeriod: 'monthly' }),
      updateMembership: jest.fn().mockResolvedValue(undefined),
      createStatusLog: jest.fn().mockResolvedValue(undefined),
    };
    useCase = new RenewMembershipUseCase(mockRepo as never);
  });

  it('should renew membership (happy path)', async () => {
    const result = await useCase.execute({ membershipId: 'm1' });

    expect(result.membershipId).toBe('m1');
    expect(result.status).toBe('active');
    expect(result.amount).toBe(50);
  });

  it('should reactivate pending_cancellation membership', async () => {
    mockRepo.getMembershipById.mockResolvedValue({ membershipId: 'm1', status: 'pending_cancellation', customerId: 'c1', tierId: 't1', billingPeriod: 'monthly' });

    const result = await useCase.execute({ membershipId: 'm1' });

    expect(result.status).toBe('pending_cancellation');
  });

  it('should throw MembershipNotFoundError when membership not found', async () => {
    mockRepo.getMembershipById.mockResolvedValue(null);

    await expect(useCase.execute({ membershipId: 'missing' })).rejects.toThrow(MembershipNotFoundError);
  });

  it('should throw MembershipValidationError when status is cancelled', async () => {
    mockRepo.getMembershipById.mockResolvedValue({ membershipId: 'm1', status: 'cancelled', customerId: 'c1', tierId: 't1' });

    await expect(useCase.execute({ membershipId: 'm1' })).rejects.toThrow(MembershipValidationError);
  });

  it('should throw MembershipPlanNotFoundError when tier not found', async () => {
    mockRepo.getTierById.mockResolvedValue(null);

    await expect(useCase.execute({ membershipId: 'm1' })).rejects.toThrow(MembershipPlanNotFoundError);
  });
});
