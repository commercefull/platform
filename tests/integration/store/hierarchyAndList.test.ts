/**
 * Store Hierarchy & List Stores Integration Tests
 *
 * Tests for store hierarchy creation and store listing with
 * filtering and pagination.
 */

import axios, { AxiosInstance } from 'axios';
import { expectStatus } from '../testUtils';
import { randomUUID } from 'node:crypto';

const API_URL = process.env.API_URL || 'http://localhost:3000';

const TEST_MERCHANT = {
  email: 'merchant@example.com',
  password: 'password123',
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

describe('Store Hierarchy & List Stores Tests', () => {
  // ==========================================================================
  // List Stores
  // ==========================================================================

  describe('GET /business/stores', () => {
    it('should list stores with default pagination', async () => {
      const response = await client.get('/business/stores', {
        headers: authHeaders(),
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(Array.isArray(response.data.data)).toBe(true);

      if (response.data.pagination) {
        expect(response.data.pagination).toHaveProperty('total');
        expect(response.data.pagination).toHaveProperty('page');
        expect(response.data.pagination).toHaveProperty('limit');
        expect(response.data.pagination).toHaveProperty('totalPages');
      }
    });

    it('should list stores with custom pagination', async () => {
      const response = await client.get('/business/stores', {
        headers: authHeaders(),
        params: { page: 1, limit: 5 },
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(Array.isArray(response.data.data)).toBe(true);
    });

    it('should filter stores by storeType', async () => {
      const response = await client.get('/business/stores', {
        headers: authHeaders(),
        params: { storeType: 'business_store' },
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(Array.isArray(response.data.data)).toBe(true);

      // All returned stores should have the correct type
      response.data.data.forEach((store: Record<string, unknown>) => {
        if (store.storeType) {
          expect(store.storeType).toBe('business_store');
        }
      });
    });

    it('should filter stores by isActive', async () => {
      const response = await client.get('/business/stores', {
        headers: authHeaders(),
        params: { isActive: 'true' },
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);

      // All returned stores should be active
      response.data.data.forEach((store: Record<string, unknown>) => {
        if (store.isActive !== undefined) {
          expect(store.isActive).toBe(true);
        }
      });
    });

    it('should filter stores by isFeatured', async () => {
      const response = await client.get('/business/stores', {
        headers: authHeaders(),
        params: { isFeatured: 'true' },
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);

      response.data.data.forEach((store: Record<string, unknown>) => {
        if (store.isFeatured !== undefined) {
          expect(store.isFeatured).toBe(true);
        }
      });
    });
  });

  // ==========================================================================
  // Store Hierarchy
  // ==========================================================================

  describe('POST /business/stores/hierarchy', () => {
    let testBusinessId: string;
    let testStoreIds: string[] = [];

    beforeAll(async () => {
      // Create a test business
      const businessResponse = await client.post(
        '/business/businesses',
        {
          name: `Hierarchy Test Business ${randomUUID().substring(0, 8)}`,
          slug: `hierarchy-test-${Date.now()}`,
          domain: `hierarchytest${Date.now()}.com`,
          businessType: 'multi_store',
          allowMultipleStores: true,
        },
        { headers: authHeaders() },
      );

      if (businessResponse.data?.data?.businessId) {
        testBusinessId = businessResponse.data.data.businessId;

        // Create two test stores under this business
        for (let i = 0; i < 2; i++) {
          const storeResponse = await client.post(
            '/business/stores',
            {
              name: `Hierarchy Store ${i + 1}`,
              slug: `hierarchy-store-${i}-${Date.now()}`,
              businessId: testBusinessId,
              storeType: 'business_store',
              defaultCurrency: 'USD',
              storeEmail: `hierarchy${i}@test.com`,
              address: {
                street1: `${i + 1} Test St`,
                city: 'Test City',
                state: 'TS',
                postalCode: '12345',
                country: 'US',
              },
            },
            { headers: authHeaders() },
          );

          if (storeResponse.data?.data?.storeId) {
            testStoreIds.push(storeResponse.data.data.storeId);
          }
        }
      }
    });

    it('should create a store hierarchy', async () => {
      if (!testBusinessId || testStoreIds.length < 2) return;

      const hierarchyData = {
        businessId: testBusinessId,
        name: `Test Hierarchy ${randomUUID().substring(0, 8)}`,
        defaultStoreId: testStoreIds[0],
        storeIds: testStoreIds,
        settings: {
          allowCrossStoreTransfers: true,
          allowCrossStoreFulfillment: true,
          centralizedPricing: false,
        },
      };

      const response = await client.post('/business/stores/hierarchy', hierarchyData, {
        headers: authHeaders(),
      });

      expect(response.status).toBe(201);
      if (response.status === 201) {
        expect(response.data.success).toBe(true);
        expect(response.data.data).toBeDefined();
        expect(response.data.data).toHaveProperty('hierarchyId');
        expect(response.data.data).toHaveProperty('businessId', testBusinessId);
        expect(response.data.data).toHaveProperty('defaultStoreId', testStoreIds[0]);
        expect(response.data.data).toHaveProperty('storeCount', 2);
      }
    });

    it('should reject hierarchy creation with missing businessId', async () => {
      const response = await client.post(
        '/business/stores/hierarchy',
        {
          name: 'Missing Business Hierarchy',
          defaultStoreId: 'some-store-id',
          storeIds: ['some-store-id'],
        },
        { headers: authHeaders() },
      );

      expectStatus(response, 400);
    });

    it('should reject hierarchy creation when default store not in storeIds', async () => {
      if (!testBusinessId) return;

      const response = await client.post(
        '/business/stores/hierarchy',
        {
          businessId: testBusinessId,
          name: 'Invalid Default Hierarchy',
          defaultStoreId: 'nonexistent-store-id',
          storeIds: testStoreIds,
        },
        { headers: authHeaders() },
      );

      expectStatus(response, 400);
      expect(response.data.success).toBe(false);
    });
  });
});
