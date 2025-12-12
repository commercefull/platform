import { AxiosInstance } from 'axios';
import {
  setupLoyaltyTests,
  cleanupLoyaltyTests,
  testTier,
  testReward,
  redeemTestReward,
  addCustomerPoints
} from './testUtils';

describe('Loyalty Tests', () => {
  let client: AxiosInstance;
  let adminToken: string;
  let customerToken: string;
  let customerId: string;
  let testTierId: string;
  let testRewardId: string;
  let redemptionCode: string;

  beforeAll(async () => {
    const setup = await setupLoyaltyTests();
    client = setup.client;
    adminToken = setup.adminToken;
    customerToken = setup.customerToken;
    customerId = setup.customerId;
    testTierId = setup.testTierId;
    testRewardId = setup.testRewardId;
  });

  afterAll(async () => {
    await cleanupLoyaltyTests(client, adminToken, testTierId, testRewardId);
  });

  describe('Tier Management', () => {
    it('should get all loyalty tiers', async () => {
      const response = await client.get('/business/loyalty/tiers', {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(Array.isArray(response.data.data)).toBe(true);
      
      if (response.data.data.length > 0) {
        // Verify that fields use camelCase in the API responses (TypeScript interface)
        const tier = response.data.data.find((t: any) => t.id === testTierId);
        expect(tier).toBeDefined();
        expect(tier).toHaveProperty('pointsThreshold');
        expect(tier).toHaveProperty('isActive');
        expect(tier).not.toHaveProperty('points_threshold');
        expect(tier).not.toHaveProperty('is_active');
      }
    });

    it('should get a tier by ID', async () => {
      const response = await client.get(`/business/loyalty/tiers/${testTierId}`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('id', testTierId);
      expect(response.data.data).toHaveProperty('name', testTier.name);
      expect(response.data.data).toHaveProperty('pointsThreshold', testTier.pointsThreshold);
      expect(response.data.data).toHaveProperty('multiplier', testTier.multiplier);
    });

    it('should update a tier', async () => {
      const updateData = {
        name: 'Updated Test Tier',
        description: 'Updated description for testing',
        multiplier: 1.5
      };
      
      const response = await client.put(`/business/loyalty/tiers/${testTierId}`, updateData, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('name', updateData.name);
      expect(response.data.data).toHaveProperty('description', updateData.description);
      expect(response.data.data).toHaveProperty('multiplier', updateData.multiplier);
    });
  });

  describe('Reward Management', () => {
    it('should get all loyalty rewards', async () => {
      const response = await client.get('/business/loyalty/rewards', {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(Array.isArray(response.data.data)).toBe(true);
      
      if (response.data.data.length > 0) {
        // Verify that fields use camelCase in the API responses (TypeScript interface)
        const reward = response.data.data.find((r: any) => r.id === testRewardId);
        expect(reward).toBeDefined();
        expect(reward).toHaveProperty('pointsCost');
        expect(reward).toHaveProperty('freeShipping');
        expect(reward).not.toHaveProperty('points_cost');
        expect(reward).not.toHaveProperty('free_shipping');
      }
    });

    it('should get a reward by ID', async () => {
      const response = await client.get(`/business/loyalty/rewards/${testRewardId}`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('id', testRewardId);
      expect(response.data.data).toHaveProperty('name', testReward.name);
      expect(response.data.data).toHaveProperty('pointsCost', testReward.pointsCost);
    });

    it('should update a reward', async () => {
      const updateData = {
        name: 'Updated Test Reward',
        description: 'Updated description for testing',
        pointsCost: 600
      };
      
      const response = await client.put(`/business/loyalty/rewards/${testRewardId}`, updateData, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('name', updateData.name);
      expect(response.data.data).toHaveProperty('description', updateData.description);
      expect(response.data.data).toHaveProperty('pointsCost', updateData.pointsCost);
    });
  });

  describe('Customer Points Management', () => {
    it('should get customer points', async () => {
      const response = await client.get(`/business/loyalty/customers/${customerId}/points`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('customerId', customerId);
      expect(response.data.data).toHaveProperty('currentPoints');
      expect(response.data.data).toHaveProperty('lifetimePoints');
      
      // Should include the tier information
      expect(response.data.data).toHaveProperty('tier');
      expect(response.data.data.tier).toHaveProperty('id', testTierId);
    });

    it('should adjust customer points', async () => {
      const pointsToAdd = 250;
      const response = await client.post(`/business/loyalty/customers/${customerId}/points/adjust`, {
        points: pointsToAdd,
        reason: 'Test adjustment'
      }, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      
      // Get the updated points to verify
      const verifyResponse = await client.get(`/business/loyalty/customers/${customerId}/points`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      const previousPoints = 1000; // From the setup
      expect(verifyResponse.data.data.currentPoints).toBe(previousPoints + pointsToAdd);
    });

    it('should get customer transactions', async () => {
      const response = await client.get(`/business/loyalty/customers/${customerId}/transactions`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(Array.isArray(response.data.data)).toBe(true);
      
      // Should have at least one transaction from our test setup
      expect(response.data.data.length).toBeGreaterThan(0);
      
      // Verify transaction fields use camelCase
      if (response.data.data.length > 0) {
        const transaction = response.data.data[0];
        expect(transaction).toHaveProperty('customerId');
        expect(transaction).toHaveProperty('action');
        expect(transaction).toHaveProperty('createdAt');
      }
    });
  });

  describe('Redemption Process', () => {
    it('should redeem points for a reward', async () => {
      redemptionCode = await redeemTestReward(client, customerToken, testRewardId);
      expect(redemptionCode).toBeDefined();
      
      // Get the customer's redemptions to verify
      const response = await client.get('/api/loyalty/my-redemptions', {
        headers: { Authorization: `Bearer ${customerToken}` }
      });
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(Array.isArray(response.data.data)).toBe(true);
      
      // Find the redemption we just created
      const redemption = response.data.data.find((r: any) => r.redemptionCode === redemptionCode);
      expect(redemption).toBeDefined();
      expect(redemption).toHaveProperty('status', 'pending');
    });

    it('should update redemption status', async () => {
      // We need the redemption ID, which we'd typically get from the database
      // Since we don't have direct DB access in tests, we'd need to get it from a list endpoint
      const response = await client.get(`/business/loyalty/customers/${customerId}/redemptions`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      
      // Find the redemption with our redemption code
      const redemption = response.data.data.find((r: any) => r.redemptionCode === redemptionCode);
      expect(redemption).toBeDefined();
      
      // Update the status
      const updateResponse = await client.put(`/business/loyalty/redemptions/${redemption.id}/status`, {
        status: 'used'
      }, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      expect(updateResponse.status).toBe(200);
      expect(updateResponse.data.success).toBe(true);
      expect(updateResponse.data.data).toHaveProperty('status', 'used');
      expect(updateResponse.data.data).toHaveProperty('usedAt');
    });
  });

  describe('Public API Tests', () => {
    it('should get public loyalty tiers', async () => {
      const response = await client.get('/api/loyalty/tiers');
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(Array.isArray(response.data.data)).toBe(true);
      
      // Public API should return limited tier information
      if (response.data.data.length > 0) {
        const tier = response.data.data[0];
        expect(tier).toHaveProperty('name');
        expect(tier).toHaveProperty('pointsThreshold');
        expect(tier).not.toHaveProperty('multiplier'); // Limited info
        expect(tier).not.toHaveProperty('createdAt'); // Limited info
      }
    });

    it('should get public loyalty rewards', async () => {
      const response = await client.get('/api/loyalty/rewards');
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(Array.isArray(response.data.data)).toBe(true);
      
      // Public API should return limited reward information
      if (response.data.data.length > 0) {
        const reward = response.data.data[0];
        expect(reward).toHaveProperty('name');
        expect(reward).toHaveProperty('pointsCost');
        expect(reward).not.toHaveProperty('discountCode'); // Limited info
        expect(reward).not.toHaveProperty('createdAt'); // Limited info
      }
    });

    it('should get my loyalty status when authenticated', async () => {
      const response = await client.get('/api/loyalty/my-status', {
        headers: { Authorization: `Bearer ${customerToken}` }
      });
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('currentPoints');
      expect(response.data.data).toHaveProperty('lifetimePoints');
      expect(response.data.data).toHaveProperty('tier');
      expect(response.data.data.tier).toHaveProperty('name');
    });

    it('should get my transactions when authenticated', async () => {
      const response = await client.get('/api/loyalty/my-transactions', {
        headers: { Authorization: `Bearer ${customerToken}` }
      });
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(Array.isArray(response.data.data)).toBe(true);
      
      // Transaction fields should be in customer-friendly format
      if (response.data.data.length > 0) {
        const transaction = response.data.data[0];
        expect(transaction).toHaveProperty('points');
        expect(transaction).toHaveProperty('action');
        expect(transaction).toHaveProperty('date');
        expect(transaction).not.toHaveProperty('customerId'); // Unnecessary in customer view
      }
    });

    it('should require authentication for loyalty status', async () => {
      const response = await client.get('/api/loyalty/my-status');
      expect([401, 403]).toContain(response.status);
      expect(response.data.success).toBe(false);
    });

    it('should prevent redeeming a reward without enough points', async () => {
      // Set customer points to just below the required amount
      const requiredPoints = 600; // The updated pointsCost from our earlier test
      await addCustomerPoints(
        client, 
        adminToken, 
        customerId,
        -(1250 + 250), // Reset to 0 (removing what was added in setup and previous test)
        'Reset for testing'
      );
      
      await addCustomerPoints(
        client, 
        adminToken, 
        customerId,
        requiredPoints - 1, // 1 point short
        'Set up for insufficient points test'
      );
      
      // Try to redeem
      const response = await client.post('/api/loyalty/redeem', {
        rewardId: testRewardId
      }, {
        headers: { Authorization: `Bearer ${customerToken}` }
      });
      
      expect(response.status).toBe(400);
      expect(response.data.success).toBe(false);
      expect(response.data.message).toContain('Insufficient points');
    });
  });
});
