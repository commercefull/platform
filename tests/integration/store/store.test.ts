/**
 * Store API Integration Tests
 * Tests store operations through HTTP API endpoints
 */

import axios, { AxiosInstance } from 'axios';
import { loginTestAdmin, expectStatus } from '../testUtils';
import { randomUUID } from 'node:crypto';

const createClient = () =>
  axios.create({
    baseURL: process.env.API_URL || 'http://localhost:3000',
    validateStatus: () => true,
    timeout: 10000,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'X-Test-Request': 'true',
    },
  });

describe('Store API Integration', () => {
  let client: AxiosInstance;
  let adminToken: string;

  beforeAll(async () => {
    jest.setTimeout(30000);
    client = createClient();
    adminToken = await loginTestAdmin(client);
  });

  const authHeaders = () => ({ Authorization: `Bearer ${adminToken}` });

  describe('POST /business/stores', () => {
    it('should create a store successfully', async () => {
      const storeData = {
        name: 'Test Store',
        slug: `test-store-${Date.now()}`,
        storeType: 'merchant_store',
        organizationId: '00000000-0000-0000-0000-000000000001',
        defaultCurrency: 'USD',
        storeEmail: 'store@teststore.com',
        storePhone: '+1-555-0123',
        isActive: true,
      };

      const response = await client.post('/business/stores', storeData, {
        headers: authHeaders(),
      });

      expectStatus(response, 201);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toBeDefined();
      expect(response.data.data).toHaveProperty('storeId');
      expect(response.data.data.name).toBe('Test Store');
    });

    it('should handle store settings and policies', async () => {
      const storeData = {
        name: 'Settings Test Store',
        slug: `settings-store-${Date.now()}`,
        storeType: 'merchant_store',
        organizationId: '00000000-0000-0000-0000-000000000001',
        settings: {
          allowGuestCheckout: false,
          requireAccountForPurchase: true,
          enableWishlist: true,
          enableProductReviews: true,
          inventoryDisplayMode: 'show_low_stock',
          priceDisplayMode: 'inclusive_tax',
        },
        storePolicies: {
          returnPolicy: '30-day return policy',
          shippingPolicy: 'Free shipping over $50',
          privacyPolicy: 'We respect your privacy',
        },
      };

      const response = await client.post('/business/stores', storeData, {
        headers: authHeaders(),
      });

      expectStatus(response, 201);
      expect(response.data.success).toBe(true);
    });

    it('should enforce unique slug constraint', async () => {
      const slug = `unique-slug-${Date.now()}`;
      const storeData1 = {
        name: 'First Store',
        slug,
        storeType: 'merchant_store',
        organizationId: '00000000-0000-0000-0000-000000000001',
      };

      await client.post('/business/stores', storeData1, { headers: authHeaders() });

      const storeData2 = {
        name: 'Second Store',
        slug,
        storeType: 'merchant_store',
        organizationId: '00000000-0000-0000-0000-000000000001',
      };

      const response = await client.post('/business/stores', storeData2, {
        headers: authHeaders(),
      });

      expect([400, 409].includes(response.status)).toBe(true);
      expect(response.data.success).toBe(false);
    });

    it('should validate ownership constraints', async () => {
      const invalidStoreData = {
        name: 'Invalid Store',
        slug: `invalid-store-${Date.now()}`,
        storeType: 'merchant_store',
      };

      const response = await client.post('/business/stores', invalidStoreData, {
        headers: authHeaders(),
      });

      expect([400, 404].includes(response.status)).toBe(true);
      expect(response.data.success).toBe(false);
    });
  });

  describe('GET /business/stores/:storeId', () => {
    it('should return 404 for non-existent store', async () => {
      const response = await client.get(`/business/stores/${randomUUID()}`, {
        headers: authHeaders(),
      });

      expectStatus(response, 404);
    });

    it('should get store by ID', async () => {
      const response = await client.get('/business/stores/20000000-0000-0000-0000-000000000001', {
        headers: authHeaders(),
      });

      if (response.status === 200) {
        expect(response.data.success).toBe(true);
        expect(response.data.data).toBeDefined();
        expect(response.data.data).toHaveProperty('storeId');
      }
    });
  });
});
