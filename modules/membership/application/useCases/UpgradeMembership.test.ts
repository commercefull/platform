jest.mock('../../../../libs/events/eventBus', () => ({
  __esModule: true,
  eventBus: { emit: jest.fn() },
}));

import { UpgradeMembershipUseCase} from './UpgradeMembership';
import { MembershipNotFoundError, MembershipPlanNotFoundError, MembershipValidationError } from '../../domain/errors/MembershipErrors';

describe('UpgradeMembershipUseCase', () => {
  let useCase: UpgradeMembershipUseCase;
  let mockRepo: Record<string, jest.Mock>;

  beforeEach(() => {
    mockRepo = {
      getMembershipById: jest.fn().mockResolvedValue({ status: 'active', customerId: 'c1', tierId: 't1', currentPeriodEnd: new Date(Date.now() + 15 * 86400000).toISOString(), billingPeriod: 'monthly' }),
      getTierById: jest.fn().mockImplementation(async (id: string) => {
        if (id === 't1') return { name: 'Silver', price: 25, isActive: true };
        if (id === 't2') return { name: 'Gold', price: 50, isActive: true };
        return null;
      }),
      updateMembership: jest.fn().mockResolvedValue({ currentPeriodEnd: new Date(Date.now() + 30 * 86400000) }),
      createStatusLog: jest.fn().mockResolvedValue(undefined),
    };
    useCase = new UpgradeMembershipUseCase(mockRepo as never);
  });

  it('should upgrade membership (happy path)', async () => {
    const result = await useCase.execute({ membershipId: 'm1', newTierId: 't2' });

    expect(result.membershipId).toBe('m1');
    expect(result.newTierName).toBe('Gold');
    expect(result.newBillingAmount).toBe(50);
  });

  it('should throw MembershipNotFoundError when membership not found', async () => {
    mockRepo.getMembershipById.mockResolvedValue(null);

    await expect(useCase.execute({ membershipId: 'missing', newTierId: 't2' })).rejects.toThrow(MembershipNotFoundError);
  });

  it('should throw MembershipValidationError when membership is not active', async () => {
    mockRepo.getMembershipById.mockResolvedValue({ status: 'cancelled', customerId: 'c1', tierId: 't1' });

    await expect(useCase.execute({ membershipId: 'm1', newTierId: 't2' })).rejects.toThrow(MembershipValidationError);
  });

  it('should throw MembershipPlanNotFoundError when new tier not found', async () => {
    await expect(useCase.execute({ membershipId: 'm1', newTierId: 'missing' })).rejects.toThrow(MembershipPlanNotFoundError);
  });

  it('should throw MembershipValidationError when new tier price is lower', async () => {
    mockRepo.getTierById.mockImplementation(async (id: string) => {
      if (id === 't1') return { name: 'Gold', price: 50, isActive: true };
      if (id === 't2') return { name: 'Silver', price: 25, isActive: true };
      return null;
    });

    await expect(useCase.execute({ membershipId: 'm1', newTierId: 't2' })).rejects.toThrow(MembershipValidationError);
  });
});
