/* eslint-disable @typescript-eslint/no-explicit-any */

const mockMembershipRepoInstance = {
  getUserMembershipBenefits: jest.fn(),
};

jest.mock('../../../membership/infrastructure/repositories/membershipRepo', () => ({
  __esModule: true,
  MembershipRepo: jest.fn(() => mockMembershipRepoInstance),
}));

import { MembershipBenefitsAdapter } from './MembershipBenefitsAdapter';

describe('MembershipBenefitsAdapter', () => {
  let adapter: MembershipBenefitsAdapter;
  let mockMembershipRepo: any;

  beforeEach(() => {
    mockMembershipRepo = mockMembershipRepoInstance;
    mockMembershipRepo.getUserMembershipBenefits.mockClear();
    adapter = new MembershipBenefitsAdapter();
  });

  it('implements MembershipBenefitsPort', () => {
    expect(typeof adapter.getDiscountBenefits).toBe('function');
  });

  it('should map membership benefits to MembershipDiscountBenefit', async () => {
    mockMembershipRepo.getUserMembershipBenefits.mockResolvedValue([
      { id: 'b1', name: 'Gold 10% off', benefitType: 'discount', discountPercentage: 10 },
      { id: 'b2', name: 'Silver 5% off', benefitType: 'discount', discountPercentage: 5 },
    ]);

    const result = await adapter.getDiscountBenefits('cust-1');

    expect(result).toHaveLength(2);
    expect(result[0].id).toBe('b1');
    expect(result[0].name).toBe('Gold 10% off');
    expect(result[0].discountPercentage).toBe(10);
  });

  it('should filter out non-discount benefits', async () => {
    mockMembershipRepo.getUserMembershipBenefits.mockResolvedValue([
      { id: 'b1', name: 'Free shipping', benefitType: 'shipping', discountPercentage: undefined },
      { id: 'b2', name: '10% off', benefitType: 'discount', discountPercentage: 10 },
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
    mockMembershipRepo.getUserMembershipBenefits.mockResolvedValue(null);

    const result = await adapter.getDiscountBenefits('cust-1');

    expect(result).toEqual([]);
  });

  it('should filter out benefits with undefined discountPercentage', async () => {
    mockMembershipRepo.getUserMembershipBenefits.mockResolvedValue([
      { id: 'b1', name: 'Mystery discount', benefitType: 'discount', discountPercentage: undefined },
    ]);

    const result = await adapter.getDiscountBenefits('cust-1');

    expect(result).toHaveLength(0);
  });
});
