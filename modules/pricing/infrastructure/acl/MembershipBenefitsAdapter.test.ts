import { MembershipBenefitsAdapter } from './MembershipBenefitsAdapter';
import type { MembershipRepo, LegacyMembershipBenefit } from '../../../membership/infrastructure/repositories/membershipRepo';

const benefit = (overrides: Partial<LegacyMembershipBenefit> = {}): LegacyMembershipBenefit => ({
  id: 'b1',
  tierIds: [],
  name: 'Benefit',
  description: '',
  benefitType: 'discount',
  isActive: true,
  createdAt: '2024-01-01',
  updatedAt: '2024-01-01',
  ...overrides,
});

const mockMembershipRepoInstance: jest.Mocked<Pick<MembershipRepo, 'getUserMembershipBenefits'>> = {
  getUserMembershipBenefits: jest.fn(),
};

describe('MembershipBenefitsAdapter', () => {
  let adapter: MembershipBenefitsAdapter;
  let mockMembershipRepo: jest.Mocked<Pick<MembershipRepo, 'getUserMembershipBenefits'>>;

  beforeEach(() => {
    mockMembershipRepo = mockMembershipRepoInstance;
    mockMembershipRepo.getUserMembershipBenefits.mockClear();
    adapter = new MembershipBenefitsAdapter(mockMembershipRepo);
  });

  it('implements MembershipBenefitsPort', () => {
    expect(typeof adapter.getDiscountBenefits).toBe('function');
  });

  it('should map membership benefits to MembershipDiscountBenefit', async () => {
    mockMembershipRepo.getUserMembershipBenefits.mockResolvedValue([
      benefit({ id: 'b1', name: 'Gold 10% off', discountPercentage: 10 }),
      benefit({ id: 'b2', name: 'Silver 5% off', discountPercentage: 5 }),
    ]);

    const result = await adapter.getDiscountBenefits('cust-1');

    expect(result).toHaveLength(2);
    expect(result[0].id).toBe('b1');
    expect(result[0].name).toBe('Gold 10% off');
    expect(result[0].discountPercentage).toBe(10);
  });

  it('should filter out non-discount benefits', async () => {
    mockMembershipRepo.getUserMembershipBenefits.mockResolvedValue([
      benefit({ id: 'b1', name: 'Free shipping', benefitType: 'shipping' }),
      benefit({ id: 'b2', name: '10% off', discountPercentage: 10 }),
    ]);

    const result = await adapter.getDiscountBenefits('cust-1');

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('b2');
  });

  it('should return empty array when no benefits found', async () => {
    mockMembershipRepo.getUserMembershipBenefits.mockResolvedValue([]);

    const result = await adapter.getDiscountBenefits('cust-1');

    expect(result).toEqual([]);
  });

  it('should return empty array when null returned', async () => {
    mockMembershipRepo.getUserMembershipBenefits.mockResolvedValue(null as unknown as LegacyMembershipBenefit[]);

    const result = await adapter.getDiscountBenefits('cust-1');

    expect(result).toEqual([]);
  });

  it('should filter out benefits with undefined discountPercentage', async () => {
    mockMembershipRepo.getUserMembershipBenefits.mockResolvedValue([
      benefit({ id: 'b1', name: 'Mystery discount' }),
    ]);

    const result = await adapter.getDiscountBenefits('cust-1');

    expect(result).toHaveLength(0);
  });
});
