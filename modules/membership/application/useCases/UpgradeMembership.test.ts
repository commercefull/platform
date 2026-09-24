import '../../tests/testUtils';
import { UpgradeMembershipUseCase } from './UpgradeMembership';
import {
  MembershipNotFoundError,
  MembershipPlanNotFoundError,
  MembershipValidationError,
} from '../../domain/errors/MembershipErrors';
import { createUpgradeMembershipRepository, emitMock } from '../../tests/testUtils';

describe('UpgradeMembershipUseCase', () => {
  const membershipRepository = createUpgradeMembershipRepository();
  const useCase = new UpgradeMembershipUseCase(membershipRepository);

  beforeEach(() => {
    jest.clearAllMocks();
    membershipRepository.getMembershipById.mockResolvedValue({
      status: 'active',
      customerId: 'c1',
      tierId: 't1',
      currentPeriodEnd: new Date(Date.now() + 15 * 86400000).toISOString(),
      billingPeriod: 'monthly',
    });
    membershipRepository.getTierById.mockImplementation(async (id: string) => {
      if (id === 't1') return { name: 'Silver', priceCents: 25, isActive: true };
      if (id === 't2') return { name: 'Gold', priceCents: 50, isActive: true };
      return null;
    });
    membershipRepository.updateMembership.mockResolvedValue({
      currentPeriodEnd: new Date(Date.now() + 30 * 86400000),
    });
    membershipRepository.createStatusLog.mockResolvedValue(undefined);
  });

  it('should upgrade to a pricier tier and emit membership.upgraded', async () => {
    const result = await useCase.execute({ membershipId: 'm1', newTierId: 't2' });

    expect(result.membershipId).toBe('m1');
    expect(result.newTierName).toBe('Gold');
    expect(result.newBillingAmountCents).toBe(50);
    expect(emitMock).toHaveBeenCalledWith(
      'membership.upgraded',
      expect.objectContaining({ membershipId: 'm1' }),
    );
  });

  it('should throw MembershipNotFoundError when the membership does not exist', async () => {
    membershipRepository.getMembershipById.mockResolvedValue(null);

    await expect(useCase.execute({ membershipId: 'missing', newTierId: 't2' })).rejects.toThrow(MembershipNotFoundError);
    expect(emitMock).not.toHaveBeenCalled();
  });

  it('should throw MembershipValidationError when the membership is not active', async () => {
    membershipRepository.getMembershipById.mockResolvedValue({ status: 'cancelled', customerId: 'c1', tierId: 't1' });

    await expect(useCase.execute({ membershipId: 'm1', newTierId: 't2' })).rejects.toThrow(MembershipValidationError);
  });

  it('should throw MembershipPlanNotFoundError when the new tier does not exist', async () => {
    await expect(useCase.execute({ membershipId: 'm1', newTierId: 'missing' })).rejects.toThrow(
      MembershipPlanNotFoundError,
    );
  });

  it('should throw MembershipValidationError when the new tier is cheaper', async () => {
    membershipRepository.getTierById.mockImplementation(async (id: string) => {
      if (id === 't1') return { name: 'Gold', priceCents: 50, isActive: true };
      if (id === 't2') return { name: 'Silver', priceCents: 25, isActive: true };
      return null;
    });

    await expect(useCase.execute({ membershipId: 'm1', newTierId: 't2' })).rejects.toThrow(MembershipValidationError);
    expect(emitMock).not.toHaveBeenCalled();
  });
});
