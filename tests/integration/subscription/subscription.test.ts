import { AxiosInstance } from 'axios';
import { setupSubscriptionTests, cleanupSubscriptionTests, createTestSubscriptionProduct, createTestSubscriptionPlan } from './testUtils';

describe('Subscription Feature Tests', () => {
  let client: AxiosInstance;
  let adminToken: string;
  let customerToken: string;
  const createdResources = {
    productIds: [] as string[],
    planIds: [] as string[],
    subscriptionIds: [] as string[]
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

  // ============================================================================
  // Subscription Products Tests (UC-SUB-001 to UC-SUB-005)
  // ============================================================================

  describe('Subscription Products (Business)', () => {
    let testProductId: string;

    it('UC-SUB-003: should create a subscription product', async () => {
      const productData = createTestSubscriptionProduct();

      const response = await client.post('/business/subscriptions/products', productData, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });

      expect(response.status).toBe(201);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('id');

      testProductId = response.data.data.id;
      createdResources.productIds.push(testProductId);
    });

    it('UC-SUB-001: should list subscription products', async () => {
      const response = await client.get('/business/subscriptions/products', {
        headers: { Authorization: `Bearer ${adminToken}` }
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(Array.isArray(response.data.data)).toBe(true);
    });

    it('UC-SUB-002: should get a specific subscription product', async () => {
      const response = await client.get(`/business/subscriptions/products/${testProductId}`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('id', testProductId);
    });

    it('UC-SUB-004: should update a subscription product', async () => {
      const updateData = { description: 'Updated description' };

      const response = await client.put(`/business/subscriptions/products/${testProductId}`, updateData, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
    });
  });

  // ============================================================================
  // Subscription Plans Tests (UC-SUB-006 to UC-SUB-009)
  // ============================================================================

  describe('Subscription Plans (Business)', () => {
    let testProductId: string;
    let testPlanId: string;

    beforeAll(async () => {
      const productData = createTestSubscriptionProduct();
      const response = await client.post('/business/subscriptions/products', productData, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      testProductId = response.data.data.id;
      createdResources.productIds.push(testProductId);
    });

    it('UC-SUB-007: should create a subscription plan', async () => {
      const planData = createTestSubscriptionPlan();

      const response = await client.post(`/business/subscriptions/products/${testProductId}/plans`, planData, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });

      expect(response.status).toBe(201);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('id');

      testPlanId = response.data.data.id;
      createdResources.planIds.push(testPlanId);
    });

    it('UC-SUB-006: should list subscription plans', async () => {
      const response = await client.get(`/business/subscriptions/products/${testProductId}/plans`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(Array.isArray(response.data.data)).toBe(true);
    });

    it('should get a specific plan', async () => {
      const response = await client.get(`/business/subscriptions/products/${testProductId}/plans/${testPlanId}`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
    });

    it('UC-SUB-008: should update a subscription plan', async () => {
      const updateData = { price: 39.99 };

      const response = await client.put(`/business/subscriptions/products/${testProductId}/plans/${testPlanId}`, updateData, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
    });
  });

  // ============================================================================
  // Customer Subscription Management (Business) (UC-SUB-010 to UC-SUB-015)
  // ============================================================================

  describe('Customer Subscription Management (Business)', () => {
    it('UC-SUB-010: should list customer subscriptions', async () => {
      const response = await client.get('/business/subscriptions/subscriptions', {
        headers: { Authorization: `Bearer ${adminToken}` }
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(Array.isArray(response.data.data)).toBe(true);
    });

    it('should filter subscriptions by status', async () => {
      const response = await client.get('/business/subscriptions/subscriptions', {
        headers: { Authorization: `Bearer ${adminToken}` },
        params: { status: 'active' }
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
    });
  });

  // ============================================================================
  // Billing Operations (Business) (UC-SUB-019 to UC-SUB-022)
  // ============================================================================

  describe('Billing Operations (Business)', () => {
    it('UC-SUB-019: should get dunning attempts', async () => {
      const response = await client.get('/business/subscriptions/dunning/pending', {
        headers: { Authorization: `Bearer ${adminToken}` }
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
    });

    it('UC-SUB-021: should get subscriptions due for billing', async () => {
      const response = await client.get('/business/subscriptions/billing/due', {
        headers: { Authorization: `Bearer ${adminToken}` }
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
    });
  });

  // ============================================================================
  // Customer-Facing Tests (UC-SUB-023 to UC-SUB-035)
  // ============================================================================

  describe('Customer-Facing Subscriptions', () => {
    it('UC-SUB-023: should browse subscription products (public)', async () => {
      const response = await client.get('/api/subscriptions/products');

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
    });

    it('UC-SUB-026: should get my subscriptions (customer)', async () => {
      const response = await client.get('/api/subscriptions/mine', {
        headers: { Authorization: `Bearer ${customerToken}` }
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(Array.isArray(response.data.data)).toBe(true);
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

    it('should require auth for customer subscriptions', async () => {
      const response = await client.get('/api/subscriptions/mine');
      expect(response.status).toBe(401);
    });

    it('should reject invalid tokens', async () => {
      const response = await client.get('/business/subscriptions/products', {
        headers: { Authorization: 'Bearer invalid-token' }
      });
      expect(response.status).toBe(401);
    });
  });
});
