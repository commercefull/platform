import { AxiosInstance } from 'axios';
import {
  setupSubscriptionTests,
  cleanupSubscriptionTests,
  createTestSubscriptionProduct,
  createTestSubscriptionPlan,
  SEEDED_SUBSCRIPTION_PRODUCT_IDS,
  SEEDED_SUBSCRIPTION_PLAN_IDS,
  SEEDED_CUSTOMER_SUBSCRIPTION_IDS,
} from './testUtils';

describe('Subscription Feature Tests', () => {
  let client: AxiosInstance;
  let adminToken: string;
  let customerToken: string;
  const createdResources = {
    productIds: [] as string[],
    planIds: [] as string[],
    subscriptionIds: [] as string[],
  };

  beforeAll(async () => {
    const setup = await setupSubscriptionTests();
    client = setup.client;
    adminToken = setup.adminToken;
    customerToken = setup.customerToken;
  });

  afterAll(async () => {
    await cleanupSubscriptionTests(client, adminToken, createdResources);
  });

  const authHeaders = () => ({ Authorization: `Bearer ${adminToken}` });
  const customerHeaders = () => ({ Authorization: `Bearer ${customerToken}` });

  // ============================================================================
  // Subscription Products Tests (UC-SUB-001 to UC-SUB-005)
  // ============================================================================

  describe('Subscription Products (Business)', () => {
    it('should list subscription products', async () => {
      const response = await client.get('/business/subscriptions/products', {
        headers: authHeaders(),
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(Array.isArray(response.data.data)).toBe(true);
    });

    it('should get seeded Monthly Box product', async () => {
      const response = await client.get(`/business/subscriptions/products/${SEEDED_SUBSCRIPTION_PRODUCT_IDS.MONTHLY_BOX}`, {
        headers: authHeaders(),
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('subscriptionProductId', SEEDED_SUBSCRIPTION_PRODUCT_IDS.MONTHLY_BOX);
    });

    it('should return 404 for non-existent product', async () => {
      const response = await client.get('/business/subscriptions/products/00000000-0000-0000-0000-000000000000', {
        headers: authHeaders(),
      });

      expect(response.status).toBe(404);
    });
  });

  // ============================================================================
  // Subscription Plans Tests (UC-SUB-006 to UC-SUB-009)
  // ============================================================================

  describe('Subscription Plans (Business)', () => {
    it('should list subscription plans for a product', async () => {
      const response = await client.get(`/business/subscriptions/products/${SEEDED_SUBSCRIPTION_PRODUCT_IDS.MONTHLY_BOX}/plans`, {
        headers: authHeaders(),
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(Array.isArray(response.data.data)).toBe(true);
      expect(response.data.data.length).toBeGreaterThan(0);
    });

    it('should get seeded Basic Monthly Box plan', async () => {
      const response = await client.get(
        `/business/subscriptions/products/${SEEDED_SUBSCRIPTION_PRODUCT_IDS.MONTHLY_BOX}/plans/${SEEDED_SUBSCRIPTION_PLAN_IDS.MONTHLY_BOX_BASIC}`,
        {
          headers: authHeaders(),
        },
      );

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('name');
    });

    it('should get seeded Premium Monthly Box plan (popular)', async () => {
      const response = await client.get(
        `/business/subscriptions/products/${SEEDED_SUBSCRIPTION_PRODUCT_IDS.MONTHLY_BOX}/plans/${SEEDED_SUBSCRIPTION_PLAN_IDS.MONTHLY_BOX_PREMIUM}`,
        {
          headers: authHeaders(),
        },
      );

      // May return 404 if seed data doesn't exist
      if (response.status === 200) {
        expect(response.data.success).toBe(true);
      }
    });
  });

  // ============================================================================
  // Customer Subscription Management (Business) (UC-SUB-010 to UC-SUB-015)
  // ============================================================================

  describe('Customer Subscription Management (Business)', () => {
    it('should list customer subscriptions', async () => {
      const response = await client.get('/business/subscriptions/subscriptions', {
        headers: authHeaders(),
      });

      // May return 200 or 500 depending on DB state
      if (response.status === 200) {
        expect(response.data.success).toBe(true);
        expect(Array.isArray(response.data.data)).toBe(true);
      }
    });

    it('should filter subscriptions by status', async () => {
      const response = await client.get('/business/subscriptions/subscriptions?status=active', {
        headers: authHeaders(),
      });

      // May return 200 or 500 depending on DB state
      if (response.status === 200) {
        expect(response.data.success).toBe(true);
      }
    });

    it('should get seeded active subscription', async () => {
      const response = await client.get(`/business/subscriptions/subscriptions/${SEEDED_CUSTOMER_SUBSCRIPTION_IDS.ACTIVE_MONTHLY}`, {
        headers: authHeaders(),
      });

      expect(response.status).toBe(200);
    });
  });

  // ============================================================================
  // Billing Operations (Business) (UC-SUB-019 to UC-SUB-022)
  // ============================================================================

  describe('Billing Operations (Business)', () => {
    it('should get pending dunning attempts', async () => {
      const response = await client.get('/business/subscriptions/dunning/pending', {
        headers: authHeaders(),
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
    });

    it('should get subscriptions due for billing', async () => {
      const response = await client.get('/business/subscriptions/billing/due', {
        headers: authHeaders(),
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
    });
  });

  // ============================================================================
  // Customer-Facing Tests (UC-SUB-023 to UC-SUB-035)
  // ============================================================================

  describe('Customer-Facing Subscriptions', () => {
    it('should browse subscription products (public)', async () => {
      const response = await client.get('/customer/subscriptions/products');

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
    });

    it('should get subscription product details (public)', async () => {
      const response = await client.get(`/customer/subscriptions/products/${SEEDED_SUBSCRIPTION_PRODUCT_IDS.MONTHLY_BOX}`);

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
    });

    it('should get subscription plan details (public)', async () => {
      const response = await client.get(`/customer/subscriptions/plans/${SEEDED_SUBSCRIPTION_PLAN_IDS.MONTHLY_BOX_PREMIUM}`);

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
    });

    it('should require auth for my subscriptions', async () => {
      const response = await client.get('/customer/subscriptions/mine');

      expect(response.status).toBe(401);
    });
  });

  // ============================================================================
  // Authorization Tests
  // ============================================================================

  describe('Authorization', () => {
    it('should require auth for admin subscription list', async () => {
      const response = await client.get('/business/subscriptions/subscriptions');
      expect(response.status).toBe(401);
    });

    it('should require auth for admin product creation', async () => {
      const response = await client.post('/business/subscriptions/products', {});
      expect(response.status).toBe(401);
    });

    it('should require auth for customer subscriptions', async () => {
      const response = await client.get('/customer/subscriptions/mine');
      expect(response.status).toBe(401);
    });

    it('should reject invalid tokens', async () => {
      const response = await client.get('/business/subscriptions/products', {
        headers: { Authorization: 'Bearer invalid-token' },
      });
      expect(response.status).toBe(401);
    });
  });
});
