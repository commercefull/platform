/**
 * Store Hierarchy & List Stores Integration Tests
 *
 * Tests for store hierarchy creation and store listing with
 * filtering and pagination.
 */

import axios, { AxiosInstance } from 'axios';
import { expectStatus } from '../testUtils';

const API_URL = process.env.API_URL || 'http://localhost:3000';

const TEST_MERCHANT = {
  email: 'merchant@example.com',
  password: 'password123',
};

// Seeded test data from seeds/20241220000022_seedStoreTestData.js
const SEEDED_ORG_ID = '01911000-0000-7000-8000-000000000001';
const SEEDED_STORE_ACTIVE_ID = '20000000-0000-0000-0000-000000000001';
const _SEEDED_STORE_INACTIVE_ID = '20000000-0000-0000-0000-000000000002';
const SEEDED_STORE_FEATURED_ID = '20000000-0000-0000-0000-000000000003';

let client: AxiosInstance;
let organizationToken: string;

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
  organizationToken = loginResponse.data?.accessToken || '';
});

const authHeaders = () => ({ Authorization: `Bearer ${organizationToken}` });

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
        params: { storeType: 'organization_store' },
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(Array.isArray(response.data.data)).toBe(true);

      // All returned stores should have the correct type
      response.data.data.forEach((store: Record<string, unknown>) => {
        if (store.storeType) {
          expect(store.storeType).toBe('organization_store');
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
    it('should create a store hierarchy', async () => {
      const hierarchyData = {
        organizationId: SEEDED_ORG_ID,
        name: `Test Hierarchy ${Date.now()}`,
        defaultStoreId: SEEDED_STORE_ACTIVE_ID,
        storeIds: [SEEDED_STORE_ACTIVE_ID, SEEDED_STORE_FEATURED_ID],
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
        expect(response.data.data).toHaveProperty('organizationId', SEEDED_ORG_ID);
        expect(response.data.data).toHaveProperty('defaultStoreId', SEEDED_STORE_ACTIVE_ID);
        expect(response.data.data).toHaveProperty('storeCount', 2);
      }
    });

    it('should reject hierarchy creation with missing organizationId', async () => {
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
      const response = await client.post(
        '/business/stores/hierarchy',
        {
          organizationId: SEEDED_ORG_ID,
          name: 'Invalid Default Hierarchy',
          defaultStoreId: 'nonexistent-store-id',
          storeIds: [SEEDED_STORE_ACTIVE_ID, SEEDED_STORE_FEATURED_ID],
        },
        { headers: authHeaders() },
      );

      expectStatus(response, 400);
      expect(response.data.success).toBe(false);
    });
  });
});
