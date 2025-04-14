import { AxiosInstance } from 'axios';
import { createTestClient, loginTestUser } from '../testUtils';
import { 
  LoyaltyTier, 
  LoyaltyReward, 
  LoyaltyTierType 
} from '../../../features/loyalty/repos/loyaltyRepo';

// Common test data for loyalty tier
export const testTier: Partial<LoyaltyTier> = {
  name: 'Test Tier',
  description: 'Test tier for integration tests',
  type: LoyaltyTierType.BRONZE,
  pointsThreshold: 100,
  multiplier: 1.2,
  benefits: ['Free shipping', '10% discount on accessories'],
  isActive: true
};

// Common test data for loyalty reward
export const testReward: Partial<LoyaltyReward> = {
  name: 'Test Reward',
  description: 'Test reward for integration tests',
  pointsCost: 500,
  discountAmount: 10.00,
  discountPercent: undefined,
  discountCode: 'TEST10',
  freeShipping: true,
  isActive: true
};

// Helper function to create a test loyalty tier
export const createTestTier = async (
  client: AxiosInstance, 
  adminToken: string
): Promise<string> => {
  const response = await client.post('/api/admin/loyalty/tiers', testTier, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  
  expect(response.status).toBe(201);
  expect(response.data.success).toBe(true);
  
  return response.data.data.id;
};

// Helper function to create a test loyalty reward
export const createTestReward = async (
  client: AxiosInstance, 
  adminToken: string
): Promise<string> => {
  const response = await client.post('/api/admin/loyalty/rewards', testReward, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  
  expect(response.status).toBe(201);
  expect(response.data.success).toBe(true);
  
  return response.data.data.id;
};

// Helper function to initialize loyalty points for a customer
export const initializeCustomerPoints = async (
  client: AxiosInstance,
  adminToken: string,
  customerId: string,
  tierId: string
): Promise<void> => {
  // Initialize customer with the specified tier
  const response = await client.post(`/api/admin/loyalty/customers/${customerId}/points/adjust`, {
    points: 0,
    reason: 'Initialize customer for testing',
    tierId
  }, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  
  expect(response.status).toBe(200);
  expect(response.data.success).toBe(true);
};

// Helper function to add points to a customer
export const addCustomerPoints = async (
  client: AxiosInstance,
  adminToken: string,
  customerId: string,
  points: number,
  reason: string = 'Test points adjustment'
): Promise<void> => {
  const response = await client.post(`/api/admin/loyalty/customers/${customerId}/points/adjust`, {
    points,
    reason
  }, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  
  expect(response.status).toBe(200);
  expect(response.data.success).toBe(true);
};

// Helper function to create test order points
export const createTestOrderPoints = async (
  client: AxiosInstance,
  adminToken: string,
  customerId: string,
  orderId: string = `order-${Math.floor(Math.random() * 10000)}`,
  orderAmount: number = 100
): Promise<string> => {
  const response = await client.post(`/api/admin/loyalty/orders/${orderId}/points`, {
    customerId,
    orderAmount
  }, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  
  expect(response.status).toBe(200);
  expect(response.data.success).toBe(true);
  
  return orderId;
};

// Helper function to redeem points for a reward
export const redeemTestReward = async (
  client: AxiosInstance,
  customerToken: string,
  rewardId: string
): Promise<string> => {
  const response = await client.post('/api/loyalty/redeem', {
    rewardId
  }, {
    headers: { Authorization: `Bearer ${customerToken}` }
  });
  
  expect(response.status).toBe(200);
  expect(response.data.success).toBe(true);
  
  return response.data.data.redemptionCode;
};

// Setup function to initialize client and test data for loyalty tests
export const setupLoyaltyTests = async () => {
  // Create test client
  const client = createTestClient();
  
  // Login as admin and customer
  const adminToken = await loginTestUser(client, 'admin');
  const customerToken = await loginTestUser(client, 'customer');
  const customerId = 'test-customer-id'; // Assuming this is available - in real tests, would fetch from DB
  
  // Create test tier
  const testTierId = await createTestTier(client, adminToken);
  
  // Create test reward
  const testRewardId = await createTestReward(client, adminToken);
  
  // Initialize customer points
  await initializeCustomerPoints(client, adminToken, customerId, testTierId);
  
  // Add some points to the customer
  await addCustomerPoints(client, adminToken, customerId, 1000);
  
  return {
    client,
    adminToken,
    customerToken,
    customerId,
    testTierId,
    testRewardId
  };
};

// Cleanup function to remove test resources
export const cleanupLoyaltyTests = async (
  client: AxiosInstance,
  adminToken: string,
  testTierId: string,
  testRewardId: string
) => {
  try {
    // There's no explicit delete endpoint in our API, but if needed we could add:
    // await client.delete(`/api/admin/loyalty/tiers/${testTierId}`, {
    //   headers: { Authorization: `Bearer ${adminToken}` }
    // });
    
    // await client.delete(`/api/admin/loyalty/rewards/${testRewardId}`, {
    //   headers: { Authorization: `Bearer ${adminToken}` }
    // });
    
    // For now, we can deactivate them instead
    await client.put(`/api/admin/loyalty/tiers/${testTierId}`, {
      isActive: false
    }, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    await client.put(`/api/admin/loyalty/rewards/${testRewardId}`, {
      isActive: false
    }, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
  } catch (error) {
    console.error('Error during loyalty test cleanup:', error);
  }
};
