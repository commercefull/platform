import { AxiosInstance } from 'axios';
import { createTestClient, loginTestUser } from '../testUtils';
import { 
  MembershipTier, 
  MembershipBenefit, 
  UserMembership 
} from '../../../features/membership/repos/membershipRepo';

// Common test data for membership tier
export const testTier: Partial<MembershipTier> = {
  name: 'Test Tier',
  description: 'Test tier for integration tests',
  monthlyPrice: 19.99,
  annualPrice: 199.99,
  level: 2,
  isActive: true
};

// Common test data for membership benefit
export const testBenefit: Partial<MembershipBenefit> = {
  name: 'Test Benefit',
  description: 'Test benefit for integration tests',
  tierIds: [], // Will be populated with the created tier ID
  benefitType: 'discount',
  discountPercentage: 10,
  isActive: true
};

// Common test data for user membership
export const testUserMembership: Partial<UserMembership> = {
  startDate: new Date().toISOString(),
  endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year from now
  isActive: true,
  autoRenew: true,
  membershipType: 'annual'
};

// Helper function to create a test membership tier
export const createTestTier = async (
  client: AxiosInstance, 
  adminToken: string
): Promise<string> => {
  const response = await client.post('/api/admin/membership/tiers', testTier, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  
  expect(response.status).toBe(201);
  expect(response.data.success).toBe(true);
  
  return response.data.data.id;
};

// Helper function to create a test membership benefit
export const createTestBenefit = async (
  client: AxiosInstance, 
  adminToken: string,
  tierId: string
): Promise<string> => {
  const benefitData = {
    ...testBenefit,
    tierIds: [tierId]
  };
  
  const response = await client.post('/api/admin/membership/benefits', benefitData, {
    headers: { Authorization: `Bearer ${adminToken}` }
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
  tierId: string
): Promise<string> => {
  const membershipData = {
    ...testUserMembership,
    userId,
    tierId
  };
  
  const response = await client.post('/api/admin/membership/user-memberships', membershipData, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  
  expect(response.status).toBe(201);
  expect(response.data.success).toBe(true);
  
  return response.data.data.id;
};

// Setup function to initialize client and test data for membership tests
export const setupMembershipTests = async () => {
  // Create test client
  const client = createTestClient();
  
  // Login as admin and regular user
  const adminToken = await loginTestUser(client, 'admin');
  const userToken = await loginTestUser(client, 'customer');
  const userId = 'test-user-id'; // In a real scenario, you would get this from the user profile
  
  // Create test tier
  const testTierId = await createTestTier(client, adminToken);
  
  // Create test benefit
  const testBenefitId = await createTestBenefit(client, adminToken, testTierId);
  
  // Create test user membership
  const testUserMembershipId = await createTestUserMembership(client, adminToken, userId, testTierId);
  
  return {
    client,
    adminToken,
    userToken,
    userId,
    testTierId,
    testBenefitId,
    testUserMembershipId
  };
};

// Cleanup function to remove test resources
export const cleanupMembershipTests = async (
  client: AxiosInstance,
  adminToken: string,
  testTierId: string,
  testBenefitId: string,
  testUserMembershipId: string
) => {
  try {
    // Cancel test user membership
    await client.put(`/api/admin/membership/user-memberships/${testUserMembershipId}/cancel`, {}, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    // Delete test benefit
    await client.delete(`/api/admin/membership/benefits/${testBenefitId}`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    // Delete test tier
    await client.delete(`/api/admin/membership/tiers/${testTierId}`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
  } catch (error) {
    console.error('Error during membership test cleanup:', error);
  }
};
