import { AxiosInstance } from 'axios';
import { MembershipTier, LegacyMembershipBenefit as MembershipBenefit, UserMembership } from '../../../modules/membership/infrastructure';

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

// Common test data for user membership
export const testUserMembership: Partial<UserMembership> = {
  startDate: new Date().toISOString(),
  endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year from now
  isActive: true,
  autoRenew: true,
  membershipType: 'annual',
};

// Helper function to create a test membership tier
export const createTestTier = async (client: AxiosInstance, adminToken: string): Promise<string> => {
  const response = await client.post('/business/membership/tiers', testTier, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });

  expect(response.status).toBe(201);
  expect(response.data.success).toBe(true);

  return response.data.data.id;
};

// Helper function to create a test membership benefit
export const createTestBenefit = async (client: AxiosInstance, adminToken: string, tierId: string): Promise<string> => {
  const benefitData = {
    ...testBenefit,
    tierIds: [tierId],
  };

  const response = await client.post('/business/membership/benefits', benefitData, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });

  expect(response.status).toBe(201);
  expect(response.data.success).toBe(true);

  return response.data.data.id;
};

// Helper function to create a test user membership
export const createTestUserMembership = async (
  client: AxiosInstance,
  adminToken: string,
  userId: string,
  tierId: string,
): Promise<string> => {
  const membershipData = {
    ...testUserMembership,
    userId,
    tierId,
  };

  const response = await client.post('/business/membership/user-memberships', membershipData, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });

  expect(response.status).toBe(201);
  expect(response.data.success).toBe(true);

  return response.data.data.id;
};

// Seeded membership fixtures (seeds/20240805002205_seedMembershipOpsData.js)
export const SEEDED_TIER_ID = '0193f002-0000-7000-8000-000000000001';
export const SEEDED_BENEFIT_ID = '0193f003-0000-7000-8000-000000000001';
export const SEEDED_USER_MEMBERSHIP_ID = '0193f005-0000-7000-8000-000000000001';
