import { GetMembershipBenefitsUseCase} from './GetMembershipBenefits';

describe('GetMembershipBenefitsUseCase', () => {
  let useCase: GetMembershipBenefitsUseCase;
  let mockRepo: Record<string, jest.Mock>;

  beforeEach(() => {
    mockRepo = {
      findActiveByCustomerId: jest.fn().mockResolvedValue({ tierId: 't1', endDate: new Date(Date.now() + 30 * 86400000) }),
      findTierById: jest.fn().mockResolvedValue({ name: 'Gold', level: 2, benefits: [{ type: 'discount', value: 10, description: '10% off' }] }),
    };
    useCase = new GetMembershipBenefitsUseCase(mockRepo as never);
  });

  it('should get membership benefits (happy path)', async () => {
    const result = await useCase.execute({ customerId: 'c1' });

    expect(result.hasMembership).toBe(true);
    expect(result.tierName).toBe('Gold');
    expect(result.benefits).toHaveLength(1);
    expect(result.daysRemaining).toBeGreaterThan(0);
  });

  it('should return no membership for non-members', async () => {
    mockRepo.findActiveByCustomerId.mockResolvedValue(null);

    const result = await useCase.execute({ customerId: 'non-member' });

    expect(result.hasMembership).toBe(false);
    expect(result.benefits).toHaveLength(0);
  });
});
