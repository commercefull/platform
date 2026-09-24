import '../../tests/testUtils';
import { DowngradeMembershipUseCase } from './DowngradeMembership';
import {
  MembershipNotFoundError,
  MembershipPlanNotFoundError,
  MembershipValidationError,
} from '../../domain/errors/MembershipErrors';
import { createDowngradeMembershipRepository, emitMock } from '../../tests/testUtils';

describe('DowngradeMembershipUseCase', () => {
  const membershipRepository = createDowngradeMembershipRepository();
  const useCase = new DowngradeMembershipUseCase(membershipRepository);

  beforeEach(() => {
    jest.clearAllMocks();
    membershipRepository.getMembershipById.mockResolvedValue({
      status: 'active',
      customerId: 'c1',
      tierId: 't1',
      currentPeriodEnd: new Date(Date.now() + 15 * 86400000).toISOString(),
    });
    membershipRepository.getTierById.mockImplementation(async (id: string) => {
      if (id === 't1') return { name: 'Gold', priceCents: 50, isActive: true };
      if (id === 't2') return { name: 'Silver', priceCents: 25, isActive: true };
      return null;
    });
    membershipRepository.updateMembership.mockResolvedValue(undefined);
    membershipRepository.createStatusLog.mockResolvedValue(undefined);
  });

  it('should downgrade to a cheaper tier and emit membership.downgraded', async () => {
    const result = await useCase.execute({ membershipId: 'm1', newTierId: 't2' });

    expect(result.membershipId).toBe('m1');
    expect(emitMock).toHaveBeenCalledWith(
      'membership.downgraded',
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

  it('should throw MembershipValidationError when the new tier is more expensive', async () => {
    membershipRepository.getTierById.mockImplementation(async (id: string) => {
      if (id === 't1') return { name: 'Silver', priceCents: 25, isActive: true };
      if (id === 't2') return { name: 'Gold', priceCents: 50, isActive: true };
      return null;
    });

    await expect(useCase.execute({ membershipId: 'm1', newTierId: 't2' })).rejects.toThrow(MembershipValidationError);
    expect(emitMock).not.toHaveBeenCalled();
  });
});
