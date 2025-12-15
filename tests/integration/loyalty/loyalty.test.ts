/**
 * Loyalty Integration Tests
 * 
 * Tests for loyalty management endpoints.
 */

import axios, { AxiosInstance } from 'axios';

// ============================================================================
// Test Configuration
// ============================================================================

const API_URL = process.env.API_URL || 'http://localhost:3000';

const TEST_MERCHANT = {
  email: 'merchant@example.com',
  password: 'password123'
};

const TEST_CUSTOMER = {
  email: 'customer@example.com',
  password: 'password123'
};

let client: AxiosInstance;
let merchantToken: string;
let customerToken: string;
let customerId: string;

// ============================================================================
// Setup
// ============================================================================

beforeAll(async () => {
  client = axios.create({
    baseURL: API_URL,
    validateStatus: () => true,
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    }
  });

  // Login as merchant
  const merchantLogin = await client.post('/business/auth/login', TEST_MERCHANT, { headers: { 'X-Test-Request': 'true' } });
  merchantToken = merchantLogin.data.accessToken;

  // Login as customer
  const customerLogin = await client.post('/customer/identity/login', TEST_CUSTOMER);
  customerToken = customerLogin.data.accessToken;
  customerId = customerLogin.data.customer?.customerId || customerLogin.data.customerId;
});

// ============================================================================
// Tests
// ============================================================================

describe('Loyalty Feature Tests', () => {
  // ==========================================================================
  // Tier Management (Business)
  // ==========================================================================

  describe('Tier Management (Business)', () => {
    let testTierId: string;

    describe('GET /business/loyalty/tiers', () => {
      it('should list all loyalty tiers', async () => {
        const response = await client.get('/business/loyalty/tiers', {
          headers: { Authorization: `Bearer ${merchantToken}` }
        });

        expect(response.status).toBe(200);
        expect(response.data.success).toBe(true);
        expect(Array.isArray(response.data.data)).toBe(true);
      });

      it('should require authentication', async () => {
        const response = await client.get('/business/loyalty/tiers');
        expect(response.status).toBe(401);
      });
    });

    describe('POST /business/loyalty/tiers', () => {
      it('should create a new tier', async () => {
        const tierData = {
          name: `Test Tier ${Date.now()}`,
          description: 'Test tier for integration tests',
          type: 'points',
          pointsThreshold: 100,
          multiplier: 1.2,
          benefits: ['Free shipping', '10% discount'],
          isActive: true
        };

        const response = await client.post('/business/loyalty/tiers', tierData, {
          headers: { Authorization: `Bearer ${merchantToken}` }
        });

        expect(response.status).toBe(201);
        expect(response.data.success).toBe(true);
        expect(response.data.data).toHaveProperty('loyaltyTierId');
        testTierId = response.data.data.loyaltyTierId;
      });

      it('should require name and pointsThreshold', async () => {
        const response = await client.post('/business/loyalty/tiers', {
          multiplier: 1.0
        }, {
          headers: { Authorization: `Bearer ${merchantToken}` }
        });

        expect(response.status).toBe(400);
        expect(response.data.success).toBe(false);
      });
    });

    describe('GET /business/loyalty/tiers/:id', () => {
      it('should get tier by ID', async () => {
        if (!testTierId) return;

        const response = await client.get(`/business/loyalty/tiers/${testTierId}`, {
          headers: { Authorization: `Bearer ${merchantToken}` }
        });

        expect(response.status).toBe(200);
        expect(response.data.success).toBe(true);
        expect(response.data.data).toHaveProperty('loyaltyTierId', testTierId);
      });

      it('should return 404 for non-existent tier', async () => {
        const response = await client.get('/business/loyalty/tiers/00000000-0000-0000-0000-000000000000', {
          headers: { Authorization: `Bearer ${merchantToken}` }
        });

        expect(response.status).toBe(404);
      });
    });

    describe('PUT /business/loyalty/tiers/:id', () => {
      it('should update a tier', async () => {
        if (!testTierId) return;

        const response = await client.put(`/business/loyalty/tiers/${testTierId}`, {
          name: 'Updated Test Tier',
          multiplier: 1.5
        }, {
          headers: { Authorization: `Bearer ${merchantToken}` }
        });

        expect(response.status).toBe(200);
        expect(response.data.success).toBe(true);
        expect(response.data.data.name).toBe('Updated Test Tier');
      });
    });
  });

  // ==========================================================================
  // Reward Management (Business)
  // ==========================================================================

  describe('Reward Management (Business)', () => {
    let testRewardId: string;

    describe('GET /business/loyalty/rewards', () => {
      it('should list all loyalty rewards', async () => {
        const response = await client.get('/business/loyalty/rewards', {
          headers: { Authorization: `Bearer ${merchantToken}` }
        });

        expect(response.status).toBe(200);
        expect(response.data.success).toBe(true);
        expect(Array.isArray(response.data.data)).toBe(true);
      });
    });

    describe('POST /business/loyalty/rewards', () => {
      it('should create a new reward', async () => {
        const rewardData = {
          name: `Test Reward ${Date.now()}`,
          description: 'Test reward for integration tests',
          pointsCost: 500,
          discountAmount: 10.00,
          freeShipping: true,
          isActive: true
        };

        const response = await client.post('/business/loyalty/rewards', rewardData, {
          headers: { Authorization: `Bearer ${merchantToken}` }
        });

        expect(response.status).toBe(201);
        expect(response.data.success).toBe(true);
        expect(response.data.data).toHaveProperty('loyaltyRewardId');
        testRewardId = response.data.data.loyaltyRewardId;
      });

      it('should require name and pointsCost', async () => {
        const response = await client.post('/business/loyalty/rewards', {
          description: 'Missing required fields'
        }, {
          headers: { Authorization: `Bearer ${merchantToken}` }
        });

        expect(response.status).toBe(400);
        expect(response.data.success).toBe(false);
      });
    });

    describe('GET /business/loyalty/rewards/:id', () => {
      it('should get reward by ID', async () => {
        if (!testRewardId) return;

        const response = await client.get(`/business/loyalty/rewards/${testRewardId}`, {
          headers: { Authorization: `Bearer ${merchantToken}` }
        });

        expect(response.status).toBe(200);
        expect(response.data.success).toBe(true);
        expect(response.data.data).toHaveProperty('loyaltyRewardId', testRewardId);
      });
    });

    describe('PUT /business/loyalty/rewards/:id', () => {
      it('should update a reward', async () => {
        if (!testRewardId) return;

        const response = await client.put(`/business/loyalty/rewards/${testRewardId}`, {
          name: 'Updated Test Reward',
          pointsCost: 600
        }, {
          headers: { Authorization: `Bearer ${merchantToken}` }
        });

        expect(response.status).toBe(200);
        expect(response.data.success).toBe(true);
        expect(response.data.data.name).toBe('Updated Test Reward');
      });
    });
  });

  // ==========================================================================
  // Public Loyalty Endpoints
  // ==========================================================================

  describe('Public Loyalty Endpoints', () => {
    describe('GET /loyalty/tiers', () => {
      it('should get public tiers without auth', async () => {
        const response = await client.get('/customer/loyalty/tiers');

        expect(response.status).toBe(200);
        expect(response.data.success).toBe(true);
        expect(Array.isArray(response.data.data)).toBe(true);

        // Public tiers should have limited fields
        if (response.data.data.length > 0) {
          const tier = response.data.data[0];
          expect(tier).toHaveProperty('name');
          expect(tier).toHaveProperty('pointsThreshold');
        }
      });
    });

    describe('GET /loyalty/rewards', () => {
      it('should get public rewards without auth', async () => {
        const response = await client.get('/customer/loyalty/rewards');

        expect(response.status).toBe(200);
        expect(response.data.success).toBe(true);
        expect(Array.isArray(response.data.data)).toBe(true);

        // Public rewards should have limited fields
        if (response.data.data.length > 0) {
          const reward = response.data.data[0];
          expect(reward).toHaveProperty('name');
          expect(reward).toHaveProperty('pointsCost');
        }
      });
    });
  });

  // ==========================================================================
  // Customer Loyalty Endpoints
  // ==========================================================================

  describe('Customer Loyalty Endpoints', () => {
    describe('GET /loyalty/my-status', () => {
      it('should get customer loyalty status when authenticated', async () => {
        const response = await client.get('/customer/loyalty/my-status', {
          headers: { Authorization: `Bearer ${customerToken}` }
        });

        expect(response.status).toBe(200);
        expect(response.data.success).toBe(true);
        expect(response.data.data).toHaveProperty('currentPoints');
        expect(response.data.data).toHaveProperty('tier');
      });

      it('should require authentication', async () => {
        const response = await client.get('/customer/loyalty/my-status');
        expect(response.status).toBe(401);
      });
    });

    describe('GET /loyalty/my-transactions', () => {
      it('should get customer transactions when authenticated', async () => {
        const response = await client.get('/customer/loyalty/my-transactions', {
          headers: { Authorization: `Bearer ${customerToken}` }
        });

        expect(response.status).toBe(200);
        expect(response.data.success).toBe(true);
        expect(Array.isArray(response.data.data)).toBe(true);
      });
    });

    describe('GET /loyalty/my-redemptions', () => {
      it('should get customer redemptions when authenticated', async () => {
        const response = await client.get('/customer/loyalty/my-redemptions', {
          headers: { Authorization: `Bearer ${customerToken}` }
        });

        expect(response.status).toBe(200);
        expect(response.data.success).toBe(true);
        expect(Array.isArray(response.data.data)).toBe(true);
      });
    });

    describe('POST /loyalty/redeem', () => {
      it('should require authentication', async () => {
        const response = await client.post('/customer/loyalty/redeem', {
          rewardId: '00000000-0000-0000-0000-000000000000'
        });

        expect(response.status).toBe(401);
      });

      it('should require rewardId', async () => {
        const response = await client.post('/customer/loyalty/redeem', {}, {
          headers: { Authorization: `Bearer ${customerToken}` }
        });

        expect(response.status).toBe(400);
      });
    });
  });

  // ==========================================================================
  // Customer Points Management (Business)
  // ==========================================================================

  describe('Customer Points Management (Business)', () => {
    describe('GET /business/loyalty/customers/:customerId/points', () => {
      it('should get customer points', async () => {
        if (!customerId) return;

        const response = await client.get(`/business/loyalty/customers/${customerId}/points`, {
          headers: { Authorization: `Bearer ${merchantToken}` }
        });

        expect(response.status).toBe(200);
        expect(response.data.success).toBe(true);
        expect(response.data.data).toHaveProperty('currentPoints');
      });
    });

    describe('POST /business/loyalty/customers/:customerId/points/adjust', () => {
      it('should adjust customer points', async () => {
        if (!customerId) return;

        const response = await client.post(
          `/business/loyalty/customers/${customerId}/points/adjust`,
          { points: 100, reason: 'Test adjustment' },
          { headers: { Authorization: `Bearer ${merchantToken}` } }
        );

        expect(response.status).toBe(200);
        expect(response.data.success).toBe(true);
      });

      it('should require points amount', async () => {
        if (!customerId) return;

        const response = await client.post(
          `/business/loyalty/customers/${customerId}/points/adjust`,
          { reason: 'Missing points' },
          { headers: { Authorization: `Bearer ${merchantToken}` } }
        );

        expect(response.status).toBe(400);
      });
    });

    describe('GET /business/loyalty/customers/:customerId/transactions', () => {
      it('should get customer transactions', async () => {
        if (!customerId) return;

        const response = await client.get(
          `/business/loyalty/customers/${customerId}/transactions`,
          { headers: { Authorization: `Bearer ${merchantToken}` } }
        );

        expect(response.status).toBe(200);
        expect(response.data.success).toBe(true);
        expect(Array.isArray(response.data.data)).toBe(true);
      });
    });

    describe('GET /business/loyalty/customers/:customerId/redemptions', () => {
      it('should get customer redemptions', async () => {
        if (!customerId) return;

        const response = await client.get(
          `/business/loyalty/customers/${customerId}/redemptions`,
          { headers: { Authorization: `Bearer ${merchantToken}` } }
        );

        expect(response.status).toBe(200);
        expect(response.data.success).toBe(true);
        expect(Array.isArray(response.data.data)).toBe(true);
      });
    });
  });

  // ==========================================================================
  // Authorization
  // ==========================================================================

  describe('Authorization', () => {
    it('should require auth for business tier management', async () => {
      const response = await client.post('/business/loyalty/tiers', {});
      expect(response.status).toBe(401);
    });

    it('should require auth for business reward management', async () => {
      const response = await client.post('/business/loyalty/rewards', {});
      expect(response.status).toBe(401);
    });

    it('should allow public access to tiers', async () => {
      const response = await client.get('/customer/loyalty/tiers');
      expect(response.status).toBe(200);
    });

    it('should allow public access to rewards', async () => {
      const response = await client.get('/customer/loyalty/rewards');
      expect(response.status).toBe(200);
    });
  });
});
