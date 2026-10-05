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
    mockMembershipRepo.getUserMembershipBenefits.mockResolvedValue([benefit({ id: 'b1', name: 'Mystery discount' })]);

    const result = await adapter.getDiscountBenefits('cust-1');

    expect(result).toHaveLength(0);
  });

  it('should include unscoped benefits regardless of context', async () => {
    mockMembershipRepo.getUserMembershipBenefits.mockResolvedValue([benefit({ id: 'b1', name: 'Gold 10% off', discountPercentage: 10 })]);

    const result = await adapter.getDiscountBenefits('cust-1', { storeId: 'store-1', channelId: 'ch-web' });

    expect(result).toHaveLength(1);
  });

  it('should include store-scoped benefits only when the store matches', async () => {
    mockMembershipRepo.getUserMembershipBenefits.mockResolvedValue([
      benefit({ id: 'b1', name: 'US member deal', discountPercentage: 15, storeIds: ['store-us'] }),
      benefit({ id: 'b2', name: 'Global deal', discountPercentage: 5 }),
    ]);

    const matching = await adapter.getDiscountBenefits('cust-1', { storeId: 'store-us' });
    const nonMatching = await adapter.getDiscountBenefits('cust-1', { storeId: 'store-uk' });
    const noStore = await adapter.getDiscountBenefits('cust-1', {});

    expect(matching.map(b => b.id)).toEqual(['b1', 'b2']);
    expect(nonMatching.map(b => b.id)).toEqual(['b2']);
    expect(noStore.map(b => b.id)).toEqual(['b2']);
  });

  it('should filter channel-scoped benefits by channel context', async () => {
    mockMembershipRepo.getUserMembershipBenefits.mockResolvedValue([
      benefit({ id: 'b1', name: 'Web exclusive', discountPercentage: 10, channelIds: ['ch-web'] }),
    ]);

    const matching = await adapter.getDiscountBenefits('cust-1', { channelId: 'ch-web' });
    const otherChannel = await adapter.getDiscountBenefits('cust-1', { channelId: 'ch-pos' });

    expect(matching).toHaveLength(1);
    expect(otherChannel).toHaveLength(0);
  });

  it('should match country and currency scopes case-insensitively', async () => {
    mockMembershipRepo.getUserMembershipBenefits.mockResolvedValue([
      benefit({ id: 'b1', name: 'UK deal', discountPercentage: 10, countryCodes: ['GB'], currencyCodes: ['GBP'] }),
    ]);

    const matching = await adapter.getDiscountBenefits('cust-1', { countryCode: 'gb', currencyCode: 'gbp' });
    const nonMatching = await adapter.getDiscountBenefits('cust-1', { countryCode: 'US', currencyCode: 'USD' });

    expect(matching).toHaveLength(1);
    expect(nonMatching).toHaveLength(0);
  });
});
