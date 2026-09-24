import '../../tests/testUtils';
import { UpdateMembershipTierUseCase } from './UpdateMembershipTier';
import { MembershipPlanNotFoundError } from '../../domain/errors/MembershipErrors';
import { createUpdateTierRepository } from '../../tests/testUtils';

describe('UpdateMembershipTierUseCase', () => {
  const membershipRepository = createUpdateTierRepository();
  const useCase = new UpdateMembershipTierUseCase(membershipRepository);

  beforeEach(() => {
    jest.clearAllMocks();
    membershipRepository.getTierById.mockResolvedValue({
      tierId: 't1',
      name: 'Gold',
      priceCents: 50,
      billingPeriod: 'monthly',
      isActive: true,
      updatedAt: new Date(),
    });
    membershipRepository.updateTier.mockResolvedValue({
      tierId: 't1',
      name: 'Gold Pro',
      priceCents: 60,
      billingPeriod: 'monthly',
      isActive: true,
      updatedAt: new Date(),
    });
  });

  it('should update the tier and return the new values', async () => {
    const result = await useCase.execute({ tierId: 't1', name: 'Gold Pro', priceCents: 60 });

    expect(result.tierId).toBe('t1');
    expect(result.name).toBe('Gold Pro');
    expect(result.priceCents).toBe(60);
    expect(membershipRepository.updateTier).toHaveBeenCalledWith(
      't1',
      expect.objectContaining({ name: 'Gold Pro', priceCents: 60 }),
    );
  });

  it('should throw MembershipPlanNotFoundError when the tier does not exist', async () => {
    membershipRepository.getTierById.mockResolvedValue(null);

    await expect(useCase.execute({ tierId: 'missing' })).rejects.toThrow(MembershipPlanNotFoundError);
    expect(membershipRepository.updateTier).not.toHaveBeenCalled();
  });
});
