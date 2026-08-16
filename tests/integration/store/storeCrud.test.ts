/**
 * Store CRUD Integration Tests
 *
 * Tests for store create, get by ID, get by slug, update, delete,
 * configure pickup, and set local delivery zone.
 */

import axios, { AxiosInstance } from 'axios';
import { randomUUID } from 'node:crypto';
import { expectStatus } from '../testUtils';

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

describe('Store CRUD Tests', () => {
  let createdStoreId: string | undefined;

  // ==========================================================================
  // POST /business/stores
  // ==========================================================================

  describe('POST /business/stores', () => {
    it('should reject store creation with missing name', async () => {
      const response = await client.post(
        '/business/stores',
        { slug: `test-${Date.now()}` },
        { headers: authHeaders() },
      );

      expectStatus(response, 404);
      expect(response.data.success).toBe(false);
    });

    it('should reject store creation with missing slug', async () => {
      const response = await client.post(
        '/business/stores',
        { name: 'Test Store' },
        { headers: authHeaders() },
      );

      expectStatus(response, 404);
      expect(response.data.success).toBe(false);
    });

    it('should create a store with valid data', async () => {
      const response = await client.post(
        '/business/stores',
        {
          name: `Integration Test Store ${randomUUID().substring(0, 8)}`,
          slug: `int-test-${Date.now()}`,
          storeType: 'merchant_store',
          merchantId: '01a004e6-11d9-7923-b6bd-139f2ba3cd46',
          description: 'Store created by integration test',
          isActive: true,
        },
        { headers: authHeaders() },
      );

      expectStatus(response, 201);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toBeDefined();
      expect(response.data.data).toHaveProperty('storeId');
      createdStoreId = response.data.data.storeId;
    });
  });

  // ==========================================================================
  // GET /business/stores/:storeId
  // ==========================================================================

  describe('GET /business/stores/:storeId', () => {
    it('should return 404 for non-existent store', async () => {
      const response = await client.get(`/business/stores/${randomUUID()}`, {
        headers: authHeaders(),
      });

      expectStatus(response, 404);
      expect(response.data.success).toBe(false);
    });

    it('should get an existing store by ID', async () => {
      const response = await client.get(`/business/stores/${TEST_STORE_IDS.ACTIVE}`, {
        headers: authHeaders(),
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toBeDefined();
      expect(response.data.data.storeId).toBe(TEST_STORE_IDS.ACTIVE);
    });

    it('should get a created store by ID', async () => {
      if (!createdStoreId) return;

      const response = await client.get(`/business/stores/${createdStoreId}`, {
        headers: authHeaders(),
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data.storeId).toBe(createdStoreId);
    });
  });

  // ==========================================================================
  // GET /business/stores/business/:businessId
  // ==========================================================================

  describe('GET /business/stores/business/:businessId', () => {
    it('should return stores for a business', async () => {
      const response = await client.get('/business/stores/business/00000000-0000-0000-0000-000000000001', {
        headers: authHeaders(),
      });

      expectStatus(response, 200);
      expect(response.data.success).toBe(true);
    });
  });

  // ==========================================================================
  // GET /business/stores/slug/:slug
  // ==========================================================================

  describe('GET /business/stores/slug/:slug', () => {
    it('should return 404 for non-existent slug', async () => {
      const response = await client.get(`/business/stores/slug/non-existent-slug-${Date.now()}`, {
        headers: authHeaders(),
      });

      expectStatus(response, 404);
    });

    it('should get a store by slug', async () => {
      const response = await client.get('/business/stores/slug/active-test-store', {
        headers: authHeaders(),
      });

      expectStatus(response, 200);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toBeDefined();
      expect(response.data.data.slug).toBe('active-test-store');
    });
  });

  // ==========================================================================
  // GET /business/stores/active
  // ==========================================================================

  describe('GET /business/stores/active', () => {
    it('should return active stores', async () => {
      const response = await client.get('/business/stores/active', {
        headers: authHeaders(),
      });

      expectStatus(response, 200);
      expect(response.data.success).toBe(true);
    });
  });

  // ==========================================================================
  // PUT /business/stores/:storeId
  // ==========================================================================

  describe('PUT /business/stores/:storeId', () => {
    it('should update a store', async () => {
      if (!createdStoreId) return;

      const response = await client.put(
        `/business/stores/${createdStoreId}`,
        {
          description: 'Updated by integration test',
          isActive: true,
        },
        { headers: authHeaders() },
      );

      expectStatus(response, 200);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toBeDefined();
    });

    it('should return error for non-existent store update', async () => {
      const response = await client.put(
        `/business/stores/${randomUUID()}`,
        { description: 'No such store' },
        { headers: authHeaders() },
      );

      expectStatus(response, 404);
    });
  });

  // ==========================================================================
  // PUT /business/stores/:storeId/pickup
  // ==========================================================================

  describe('PUT /business/stores/:storeId/pickup', () => {
    it('should configure store pickup settings', async () => {
      if (!createdStoreId) return;

      const response = await client.put(
        `/business/stores/${createdStoreId}/pickup`,
        {
          enabled: true,
          settings: {
            prepareTimeMinutes: 30,
            instructions: 'Pickup at front desk',
          },
        },
        { headers: authHeaders() },
      );

      expectStatus(response, 200);
      expect(response.data.success).toBe(true);
    });

    it('should return error for pickup config on non-existent store', async () => {
      const response = await client.put(
        `/business/stores/${randomUUID()}/pickup`,
        { enabled: true },
        { headers: authHeaders() },
      );

      expectStatus(response, 404);
    });
  });

  // ==========================================================================
  // PUT /business/stores/:storeId/local-delivery
  // ==========================================================================

  describe('PUT /business/stores/:storeId/local-delivery', () => {
    it('should set local delivery zone', async () => {
      if (!createdStoreId) return;

      const response = await client.put(
        `/business/stores/${createdStoreId}/local-delivery`,
        {
          enabled: true,
          radiusKm: 15,
          minimumOrderValue: 25.0,
          deliveryFee: 5.0,
          estimatedDeliveryTime: '2-3 hours',
        },
        { headers: authHeaders() },
      );

      expectStatus(response, 200);
      expect(response.data.success).toBe(true);
    });

    it('should return error for local delivery on non-existent store', async () => {
      const response = await client.put(
        `/business/stores/${randomUUID()}/local-delivery`,
        { enabled: true, radiusKm: 10 },
        { headers: authHeaders() },
      );

      expectStatus(response, 404);
    });
  });

  // ==========================================================================
  // DELETE /business/stores/:storeId
  // ==========================================================================

  describe('DELETE /business/stores/:storeId', () => {
    it('should delete a created store', async () => {
      if (!createdStoreId) return;

      const response = await client.delete(`/business/stores/${createdStoreId}`, {
        headers: authHeaders(),
      });

      expectStatus(response, 200);
      expect(response.data.success).toBe(true);

      // Verify deletion
      const getResponse = await client.get(`/business/stores/${createdStoreId}`, {
        headers: authHeaders(),
      });
      expectStatus(getResponse, 404);
    });

    it('should return error or success for deleting non-existent store', async () => {
      const response = await client.delete(`/business/stores/${randomUUID()}`, {
        headers: authHeaders(),
      });

      // Controller returns 200 (idempotent delete) or 400/404
      expect([200, 400, 404].includes(response.status)).toBe(true);
    });
  });
});
