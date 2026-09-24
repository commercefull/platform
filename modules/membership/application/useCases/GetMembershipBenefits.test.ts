import '../../tests/testUtils';
import { GetMembershipBenefitsUseCase } from './GetMembershipBenefits';
import { createBenefitsRepository } from '../../tests/testUtils';

describe('GetMembershipBenefitsUseCase', () => {
  const membershipRepository = createBenefitsRepository();
  const useCase = new GetMembershipBenefitsUseCase(membershipRepository);

  beforeEach(() => {
    jest.clearAllMocks();
    membershipRepository.findActiveByCustomerId.mockResolvedValue({
      tierId: 't1',
      endDate: new Date(Date.now() + 30 * 86400000),
    });
    membershipRepository.findTierById.mockResolvedValue({
      name: 'Gold',
      level: 2,
      benefits: [{ type: 'discount', value: 10, description: '10% off' }],
    });
  });

  it('should return the tier benefits and days remaining for a member', async () => {
    const result = await useCase.execute({ customerId: 'c1' });

    expect(result.hasMembership).toBe(true);
    expect(result.tierName).toBe('Gold');
    expect(result.benefits).toHaveLength(1);
    expect(result.daysRemaining).toBeGreaterThan(0);
  });

  it('should return no membership when the customer is not a member', async () => {
    membershipRepository.findActiveByCustomerId.mockResolvedValue(null);

    const result = await useCase.execute({ customerId: 'non-member' });

    expect(result.hasMembership).toBe(false);
    expect(result.benefits).toHaveLength(0);
    expect(membershipRepository.findTierById).not.toHaveBeenCalled();
  });
});
