import { MembershipTier, LegacyMembershipBenefit as MembershipBenefit } from '../../../modules/membership/infrastructure';

// Common test data for membership tier
export const testTier: Partial<MembershipTier> = {
  name: 'Test Tier',
  description: 'Test tier for integration tests',
  monthlyPriceCents: 1999,
  annualPriceCents: 19999,
  level: 2,
  isActive: true,
};

// Common test data for membership benefit
export const testBenefit: Partial<MembershipBenefit> = {
  name: 'Test Benefit',
  description: 'Test benefit for integration tests',
  tierIds: [], // Will be populated with the created tier ID
  benefitType: 'discount',
  discountPercentage: 10,
  isActive: true,
};





// Seeded membership fixtures (seeds/20240805002205_seedMembershipOpsData.js)
export const SEEDED_TIER_ID = '0193f002-0000-7000-8000-000000000001';
export const SEEDED_BENEFIT_ID = '0193f003-0000-7000-8000-000000000001';
export const SEEDED_USER_MEMBERSHIP_ID = '0193f005-0000-7000-8000-000000000001';
