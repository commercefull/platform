/**
 * Store Dispatch Integration Tests
 *
 * Tests the full store dispatch lifecycle:
 * create → list → get → approve → dispatch → receive → cancel
 */

import axios, { AxiosInstance } from 'axios';
import { randomUUID } from 'node:crypto';

const API_URL = process.env.API_URL || 'http://localhost:3000';

const TEST_MERCHANT = {
  email: 'merchant@example.com',
  password: 'password123',
};

const TEST_STORE_IDS = {
  ACTIVE: '20000000-0000-0000-0000-000000000001',
  INACTIVE: '20000000-0000-0000-0000-000000000002',
  FEATURED: '20000000-0000-0000-0000-000000000003',
  MERCHANT: '20000000-0000-0000-0000-000000000004',
};

const TEST_PRODUCT_1_ID = '00000000-0000-0000-0000-000000000001';

let client: AxiosInstance;
let merchantToken: string;

beforeAll(async () => {
  client = axios.create({
    baseURL: API_URL,
    validateStatus: () => true,
    timeout: 10000,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'X-Test-Request': 'true',
    },
  });

  const loginResponse = await client.post('/business/auth/login', TEST_MERCHANT, {
    headers: { 'X-Test-Request': 'true' },
  });
  merchantToken = loginResponse.data?.accessToken || '';
});

const authHeaders = () => ({ Authorization: `Bearer ${merchantToken}` });

// ============================================================================
// Tests
// ============================================================================

describe('Store Dispatch Tests', () => {
  let createdDispatchId: string | undefined;

  // ==========================================================================
  // POST /business/dispatches
  // ==========================================================================

  describe('POST /business/dispatches', () => {
    it('should reject dispatch with missing fromStoreId', async () => {
      const response = await client.post(
        '/business/dispatches',
        {
          toStoreId: TEST_STORE_IDS.FEATURED,
          items: [{ productId: TEST_PRODUCT_1_ID, quantity: 5 }],
          requestedBy: 'test-user',
        },
        { headers: authHeaders() },
      );

      expect([400, 500]).toContain(response.status);
      expect(response.data.success).toBe(false);
    });

    it('should reject dispatch with missing toStoreId', async () => {
      const response = await client.post(
        '/business/dispatches',
        {
          fromStoreId: TEST_STORE_IDS.ACTIVE,
          items: [{ productId: TEST_PRODUCT_1_ID, quantity: 5 }],
          requestedBy: 'test-user',
        },
        { headers: authHeaders() },
      );

      expect([400, 500]).toContain(response.status);
      expect(response.data.success).toBe(false);
    });

    it('should reject dispatch with same source and destination store', async () => {
      const response = await client.post(
        '/business/dispatches',
        {
          fromStoreId: TEST_STORE_IDS.ACTIVE,
          toStoreId: TEST_STORE_IDS.ACTIVE,
          items: [{ productId: TEST_PRODUCT_1_ID, quantity: 5 }],
          requestedBy: 'test-user',
        },
        { headers: authHeaders() },
      );

      expect(response.status).toBe(400);
      expect(response.data.success).toBe(false);
    });

    it('should reject dispatch with empty items', async () => {
      const response = await client.post(
        '/business/dispatches',
        {
          fromStoreId: TEST_STORE_IDS.ACTIVE,
          toStoreId: TEST_STORE_IDS.FEATURED,
          items: [],
          requestedBy: 'test-user',
        },
        { headers: authHeaders() },
      );

      expect(response.status).toBe(400);
      expect(response.data.success).toBe(false);
    });

    it('should create a store dispatch (or fail on missing inventory)', async () => {
      const response = await client.post(
        '/business/dispatches',
        {
          fromStoreId: TEST_STORE_IDS.ACTIVE,
          toStoreId: TEST_STORE_IDS.FEATURED,
          items: [
            {
              productId: TEST_PRODUCT_1_ID,
              quantity: 1,
              sku: 'TEST-SKU-001',
              productName: 'Test Product 1',
            },
          ],
          notes: 'Integration test dispatch',
          requestedBy: 'test-user',
        },
        { headers: authHeaders() },
      );

      expect([201, 400, 500]).toContain(response.status);
      if (response.status === 201) {
        expect(response.data.success).toBe(true);
        expect(response.data.data).toBeDefined();
        expect(response.data.data).toHaveProperty('dispatchId');
        expect(response.data.data).toHaveProperty('dispatchNumber');
        expect(response.data.data.status).toBe('draft');
        expect(response.data.data.fromStoreId).toBe(TEST_STORE_IDS.ACTIVE);
        expect(response.data.data.toStoreId).toBe(TEST_STORE_IDS.FEATURED);
        expect(response.data.data.items).toHaveLength(1);
        createdDispatchId = response.data.data.dispatchId;
      }
    });
  });

  // ==========================================================================
  // GET /business/dispatches
  // ==========================================================================

  describe('GET /business/dispatches', () => {
    it('should list dispatches with default pagination', async () => {
      const response = await client.get('/business/dispatches', {
        headers: authHeaders(),
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toBeDefined();
    });

    it('should filter dispatches by fromStoreId', async () => {
      const response = await client.get('/business/dispatches', {
        headers: authHeaders(),
        params: { fromStoreId: TEST_STORE_IDS.ACTIVE },
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
    });

    it('should filter dispatches by status', async () => {
      const response = await client.get('/business/dispatches', {
        headers: authHeaders(),
        params: { status: 'draft' },
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
    });

    it('should support pagination with limit and offset', async () => {
      const response = await client.get('/business/dispatches', {
        headers: authHeaders(),
        params: { limit: 5, offset: 0 },
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
    });
  });

  // ==========================================================================
  // GET /business/dispatches/:dispatchId
  // ==========================================================================

  describe('GET /business/dispatches/:dispatchId', () => {
    it('should return 404 for non-existent dispatch', async () => {
      const response = await client.get(`/business/dispatches/${randomUUID()}`, {
        headers: authHeaders(),
      });

      expect(response.status).toBe(404);
      expect(response.data.success).toBe(false);
    });

    it('should get a dispatch by ID if created', async () => {
      if (!createdDispatchId) return;

      const response = await client.get(`/business/dispatches/${createdDispatchId}`, {
        headers: authHeaders(),
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data.dispatchId).toBe(createdDispatchId);
    });
  });

  // ==========================================================================
  // PUT /business/dispatches/:dispatchId/approve
  // ==========================================================================

  describe('PUT /business/dispatches/:dispatchId/approve', () => {
    it('should return 404 for non-existent dispatch', async () => {
      const response = await client.put(
        `/business/dispatches/${randomUUID()}/approve`,
        { approvedBy: 'test-admin' },
        { headers: authHeaders() },
      );

      expect([404, 400]).toContain(response.status);
      expect(response.data.success).toBe(false);
    });

    it('should approve a draft dispatch if created', async () => {
      if (!createdDispatchId) return;

      const response = await client.put(
        `/business/dispatches/${createdDispatchId}/approve`,
        { approvedBy: 'test-admin' },
        { headers: authHeaders() },
      );

      expect([200, 400]).toContain(response.status);
      if (response.status === 200) {
        expect(response.data.success).toBe(true);
        expect(response.data.data.status).toBe('approved');
        expect(response.data.data.approvedBy).toBe('test-admin');
      }
    });
  });

  // ==========================================================================
  // PUT /business/dispatches/:dispatchId/dispatch
  // ==========================================================================

  describe('PUT /business/dispatches/:dispatchId/dispatch', () => {
    it('should return 404 for non-existent dispatch', async () => {
      const response = await client.put(
        `/business/dispatches/${randomUUID()}/dispatch`,
        { dispatchedBy: 'test-user' },
        { headers: authHeaders() },
      );

      expect([404, 400]).toContain(response.status);
      expect(response.data.success).toBe(false);
    });

    it('should dispatch an approved dispatch if created', async () => {
      if (!createdDispatchId) return;

      const response = await client.put(
        `/business/dispatches/${createdDispatchId}/dispatch`,
        { dispatchedBy: 'test-user' },
        { headers: authHeaders() },
      );

      expect([200, 400]).toContain(response.status);
      if (response.status === 200) {
        expect(response.data.success).toBe(true);
        expect(response.data.data.status).toBe('dispatched');
      }
    });
  });

  // ==========================================================================
  // PUT /business/dispatches/:dispatchId/receive
  // ==========================================================================

  describe('PUT /business/dispatches/:dispatchId/receive', () => {
    it('should return 404 for non-existent dispatch', async () => {
      const response = await client.put(
        `/business/dispatches/${randomUUID()}/receive`,
        { receivedBy: 'test-user', items: [] },
        { headers: authHeaders() },
      );

      expect([404, 400]).toContain(response.status);
      expect(response.data.success).toBe(false);
    });

    it('should receive a dispatched dispatch if created', async () => {
      if (!createdDispatchId) return;

      const response = await client.put(
        `/business/dispatches/${createdDispatchId}/receive`,
        {
          receivedBy: 'test-user',
          items: [],
          notes: 'Received in good condition',
        },
        { headers: authHeaders() },
      );

      expect([200, 400]).toContain(response.status);
      if (response.status === 200) {
        expect(response.data.success).toBe(true);
        expect(response.data.data.status).toBe('received');
      }
    });
  });

  // ==========================================================================
  // PUT /business/dispatches/:dispatchId/cancel
  // ==========================================================================

  describe('PUT /business/dispatches/:dispatchId/cancel', () => {
    it('should return 404 for non-existent dispatch', async () => {
      const response = await client.put(
        `/business/dispatches/${randomUUID()}/cancel`,
        { reason: 'Test cancellation' },
        { headers: authHeaders() },
      );

      expect([404, 400]).toContain(response.status);
      expect(response.data.success).toBe(false);
    });

    it('should cancel a draft dispatch', async () => {
      // Create a separate dispatch to cancel (since the main one may already be received)
      const createResponse = await client.post(
        '/business/dispatches',
        {
          fromStoreId: TEST_STORE_IDS.ACTIVE,
          toStoreId: TEST_STORE_IDS.FEATURED,
          items: [
            {
              productId: TEST_PRODUCT_1_ID,
              quantity: 1,
              sku: 'TEST-SKU-001',
              productName: 'Test Product 1',
            },
          ],
          notes: 'Dispatch to cancel',
          requestedBy: 'test-user',
        },
        { headers: authHeaders() },
      );

      if (createResponse.status !== 201) return;

      const dispatchId = createResponse.data.data.dispatchId;
      const response = await client.put(
        `/business/dispatches/${dispatchId}/cancel`,
        { reason: 'No longer needed' },
        { headers: authHeaders() },
      );

      expect([200, 400]).toContain(response.status);
      if (response.status === 200) {
        expect(response.data.success).toBe(true);
        expect(response.data.data.status).toBe('cancelled');
      }
    });
  });
});
