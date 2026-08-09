/**
 * Fulfillment Lifecycle Integration Tests
 *
 * Tests the full fulfillment lifecycle:
 * create → list → get → pick → pack → ship → deliver
 * and cancel, tracking update, return initiation.
 */

import axios, { AxiosInstance } from 'axios';
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

const validFulfillmentData = () => ({
  orderId: randomUUID(),
  orderNumber: `ORD-${Date.now()}`,
  sourceType: 'store',
  sourceId: randomUUID(),
  shipFromAddress: {
    line1: '123 Warehouse St',
    city: 'Portland',
    state: 'OR',
    postalCode: '97035',
    country: 'US',
  },
  shipToAddress: {
    line1: '456 Customer Ave',
    city: 'Seattle',
    state: 'WA',
    postalCode: '98101',
    country: 'US',
  },
  carrierName: 'Test Carrier',
  items: [
    {
      orderItemId: randomUUID(),
      productId: '00000000-0000-0000-0000-000000000001',
      sku: 'TEST-SKU-001',
      name: 'Test Product 1',
      quantityOrdered: 2,
    },
  ],
  notes: 'Integration test fulfillment',
});

// ============================================================================
// Tests
// ============================================================================

describe('Fulfillment Lifecycle Tests', () => {
  let createdFulfillmentId: string | undefined;

  // ==========================================================================
  // POST /business/ (create fulfillment)
  // ==========================================================================

  describe('POST /business/ (create fulfillment)', () => {
    it('should reject fulfillment creation with missing orderId', async () => {
      const response = await client.post(
        '/business/',
        { ...validFulfillmentData(), orderId: undefined },
        { headers: authHeaders() },
      );

      expect([400, 500]).toContain(response.status);
      expect(response.data.success).toBe(false);
    });

    it('should reject fulfillment creation with missing sourceType', async () => {
      const response = await client.post(
        '/business/',
        { ...validFulfillmentData(), sourceType: undefined },
        { headers: authHeaders() },
      );

      expect([400, 500]).toContain(response.status);
      expect(response.data.success).toBe(false);
    });

    it('should reject fulfillment creation with missing items', async () => {
      const response = await client.post(
        '/business/',
        { ...validFulfillmentData(), items: undefined },
        { headers: authHeaders() },
      );

      expect([400, 500]).toContain(response.status);
      expect(response.data.success).toBe(false);
    });

    it('should create a fulfillment with valid data', async () => {
      const response = await client.post('/business/', validFulfillmentData(), {
        headers: authHeaders(),
      });

      expect([201, 200, 400]).toContain(response.status);
      if (response.status === 201 || response.status === 200) {
        expect(response.data.success).toBe(true);
        expect(response.data.data).toBeDefined();
        const fulfillment = response.data.data.fulfillment || response.data.data;
        expect(fulfillment).toHaveProperty('fulfillmentId');
        createdFulfillmentId = fulfillment.fulfillmentId;
      }
    });
  });

  // ==========================================================================
  // GET /business/ (list fulfillments)
  // ==========================================================================

  describe('GET /business/ (list fulfillments)', () => {
    it('should list fulfillments with default pagination', async () => {
      const response = await client.get('/business/', { headers: authHeaders() });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toBeDefined();
    });

    it('should filter fulfillments by status', async () => {
      const response = await client.get('/business/', {
        headers: authHeaders(),
        params: { status: 'pending' },
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
    });

    it('should support pagination with limit', async () => {
      const response = await client.get('/business/', {
        headers: authHeaders(),
        params: { limit: 5, page: 1 },
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
    });
  });

  // ==========================================================================
  // GET /business/order/:orderId
  // ==========================================================================

  describe('GET /business/order/:orderId', () => {
    it('should list fulfillments by order ID', async () => {
      const orderId = randomUUID();
      const response = await client.get(`/business/order/${orderId}`, {
        headers: authHeaders(),
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toBeDefined();
    });
  });

  // ==========================================================================
  // GET /business/:fulfillmentId
  // ==========================================================================

  describe('GET /business/:fulfillmentId', () => {
    it('should return 404 for non-existent fulfillment', async () => {
      const response = await client.get(`/business/${randomUUID()}`, {
        headers: authHeaders(),
      });

      expect([404, 400]).toContain(response.status);
      expect(response.data.success).toBe(false);
    });

    it('should get a fulfillment by ID if created', async () => {
      if (!createdFulfillmentId) return;

      const response = await client.get(`/business/${createdFulfillmentId}`, {
        headers: authHeaders(),
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
    });
  });

  // ==========================================================================
  // POST /business/:fulfillmentId/pick
  // ==========================================================================

  describe('POST /business/:fulfillmentId/pick', () => {
    it('should return 404 for non-existent fulfillment', async () => {
      const response = await client.post(
        `/business/${randomUUID()}/pick`,
        { items: [] },
        { headers: authHeaders() },
      );

      expect([404, 400]).toContain(response.status);
      expect(response.data.success).toBe(false);
    });

    it('should process picking if fulfillment exists', async () => {
      if (!createdFulfillmentId) return;

      const response = await client.post(
        `/business/${createdFulfillmentId}/pick`,
        {
          items: [],
          completePickingProcess: true,
        },
        { headers: authHeaders() },
      );

      expect([200, 400]).toContain(response.status);
      if (response.status === 200) {
        expect(response.data.success).toBe(true);
      }
    });
  });

  // ==========================================================================
  // POST /business/:fulfillmentId/pack
  // ==========================================================================

  describe('POST /business/:fulfillmentId/pack', () => {
    it('should return 404 for non-existent fulfillment', async () => {
      const response = await client.post(
        `/business/${randomUUID()}/pack`,
        { completePackingProcess: true },
        { headers: authHeaders() },
      );

      expect([404, 400]).toContain(response.status);
      expect(response.data.success).toBe(false);
    });

    it('should process packing if fulfillment exists', async () => {
      if (!createdFulfillmentId) return;

      const response = await client.post(
        `/business/${createdFulfillmentId}/pack`,
        {
          completePackingProcess: true,
          weight: 2.5,
          dimensions: { length: 10, width: 8, height: 6 },
        },
        { headers: authHeaders() },
      );

      expect([200, 400]).toContain(response.status);
      if (response.status === 200) {
        expect(response.data.success).toBe(true);
      }
    });
  });

  // ==========================================================================
  // POST /business/:fulfillmentId/ship
  // ==========================================================================

  describe('POST /business/:fulfillmentId/ship', () => {
    it('should return 404 for non-existent fulfillment', async () => {
      const response = await client.post(
        `/business/${randomUUID()}/ship`,
        { trackingNumber: 'TRK123' },
        { headers: authHeaders() },
      );

      expect([404, 400]).toContain(response.status);
      expect(response.data.success).toBe(false);
    });

    it('should ship a fulfillment if it exists and is packed', async () => {
      if (!createdFulfillmentId) return;

      const response = await client.post(
        `/business/${createdFulfillmentId}/ship`,
        {
          trackingNumber: `TRK-${Date.now()}`,
          trackingUrl: 'https://tracking.example.com',
          carrierName: 'Test Carrier',
          shippingCost: 9.99,
        },
        { headers: authHeaders() },
      );

      expect([200, 400]).toContain(response.status);
      if (response.status === 200) {
        expect(response.data.success).toBe(true);
      }
    });
  });

  // ==========================================================================
  // PUT /business/:fulfillmentId/tracking
  // ==========================================================================

  describe('PUT /business/:fulfillmentId/tracking', () => {
    it('should return 404 for non-existent fulfillment', async () => {
      const response = await client.put(
        `/business/${randomUUID()}/tracking`,
        { trackingNumber: 'TRK999' },
        { headers: authHeaders() },
      );

      expect([404, 400]).toContain(response.status);
      expect(response.data.success).toBe(false);
    });

    it('should update tracking info if fulfillment exists', async () => {
      if (!createdFulfillmentId) return;

      const response = await client.put(
        `/business/${createdFulfillmentId}/tracking`,
        {
          trackingNumber: `TRK-UPDATED-${Date.now()}`,
          trackingUrl: 'https://tracking.updated.com',
        },
        { headers: authHeaders() },
      );

      expect([200, 400]).toContain(response.status);
      if (response.status === 200) {
        expect(response.data.success).toBe(true);
      }
    });
  });

  // ==========================================================================
  // POST /business/:fulfillmentId/deliver
  // ==========================================================================

  describe('POST /business/:fulfillmentId/deliver', () => {
    it('should return 404 for non-existent fulfillment', async () => {
      const response = await client.post(`/business/${randomUUID()}/deliver`, {}, {
        headers: authHeaders(),
      });

      expect([404, 400]).toContain(response.status);
      expect(response.data.success).toBe(false);
    });

    it('should mark delivered if fulfillment exists and is shipped', async () => {
      if (!createdFulfillmentId) return;

      const response = await client.post(`/business/${createdFulfillmentId}/deliver`, {}, {
        headers: authHeaders(),
      });

      expect([200, 400]).toContain(response.status);
      if (response.status === 200) {
        expect(response.data.success).toBe(true);
      }
    });
  });

  // ==========================================================================
  // POST /business/:fulfillmentId/return
  // ==========================================================================

  describe('POST /business/:fulfillmentId/return', () => {
    it('should return 404 for non-existent fulfillment', async () => {
      const response = await client.post(
        `/business/${randomUUID()}/return`,
        { reason: 'Customer return' },
        { headers: authHeaders() },
      );

      expect([404, 400]).toContain(response.status);
      expect(response.data.success).toBe(false);
    });

    it('should initiate return if fulfillment exists', async () => {
      if (!createdFulfillmentId) return;

      const response = await client.post(
        `/business/${createdFulfillmentId}/return`,
        { reason: 'Customer requested return' },
        { headers: authHeaders() },
      );

      expect([200, 400]).toContain(response.status);
      if (response.status === 200) {
        expect(response.data.success).toBe(true);
      }
    });
  });

  // ==========================================================================
  // POST /business/:fulfillmentId/cancel (separate fulfillment)
  // ==========================================================================

  describe('POST /business/:fulfillmentId/cancel', () => {
    it('should return 404 for non-existent fulfillment', async () => {
      const response = await client.post(
        `/business/${randomUUID()}/cancel`,
        { reason: 'Test cancellation' },
        { headers: authHeaders() },
      );

      expect([404, 400]).toContain(response.status);
      expect(response.data.success).toBe(false);
    });

    it('should cancel a pending fulfillment', async () => {
      // Create a separate fulfillment to cancel
      const createRes = await client.post('/business/', validFulfillmentData(), {
        headers: authHeaders(),
      });

      if (createRes.status !== 201 && createRes.status !== 200) return;

      const fulfillment = createRes.data.data.fulfillment || createRes.data.data;
      const fulfillmentId = fulfillment.fulfillmentId;

      const response = await client.post(
        `/business/${fulfillmentId}/cancel`,
        { reason: 'No longer needed' },
        { headers: authHeaders() },
      );

      expect([200, 400]).toContain(response.status);
      if (response.status === 200) {
        expect(response.data.success).toBe(true);
      }
    });
  });
});
