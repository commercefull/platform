/**
 * Fulfillment Operations Integration Tests
 *
 * Covers endpoints not exercised by fulfillmentLifecycle.test.ts / fulfillmentLocation.test.ts:
 * - POST   /business/fulfillments/:fulfillmentId/assign
 * - DELETE /business/fulfillment/locations/:locationId
 * - PUT    /business/fulfillment/partners/:partnerId
 * - DELETE /business/fulfillment/partners/:partnerId
 */

import axios, { AxiosInstance } from 'axios';
import { randomUUID } from 'node:crypto';
import { expectStatus } from '../testUtils';

const API_URL = process.env.API_URL || 'http://localhost:3000';

const TEST_MERCHANT = {
  email: 'merchant@example.com',
  password: 'password123',
};

// Seeded in seeds/20240805002208_seedFulfillmentOpsData.js
const SEEDED = {
  FULFILLMENT_ID: '01944000-0000-7000-8000-000000000001',
  LOCATION_ID: '01944001-0000-7000-8000-000000000001',
  PARTNER_UPDATE_ID: '01944002-0000-7000-8000-000000000001',
  PARTNER_DELETE_ID: '01944002-0000-7000-8000-000000000002',
};

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

describe('Fulfillment Operations Tests', () => {
  describe('POST /business/fulfillments/:fulfillmentId/assign', () => {
    it('should reject assign without sourceType/sourceId', async () => {
      const response = await client.post(`/business/fulfillments/${SEEDED.FULFILLMENT_ID}/assign`, {}, { headers: authHeaders() });
      expectStatus(response, 400);
    });

    it('should assign the seeded fulfillment to a warehouse source', async () => {
      const response = await client.post(
        `/business/fulfillments/${SEEDED.FULFILLMENT_ID}/assign`,
        { sourceType: 'warehouse', sourceId: '0193b000-0000-7000-8000-000000000001' },
        { headers: authHeaders() },
      );
      expectStatus(response, 200);
      expect(response.data.success).toBe(true);
    });

    it('should return 404 for a non-existent fulfillment', async () => {
      const response = await client.post(
        `/business/fulfillments/${randomUUID()}/assign`,
        { sourceType: 'warehouse', sourceId: randomUUID() },
        { headers: authHeaders() },
      );
      expectStatus(response, 404);
    });
  });

  describe('DELETE /business/fulfillment/locations/:locationId', () => {
    it('should delete the seeded location', async () => {
      const response = await client.delete(`/business/fulfillment/locations/${SEEDED.LOCATION_ID}`, { headers: authHeaders() });
      expectStatus(response, 200);
      expect(response.data.success).toBe(true);
    });

    it('should return 404 when getting the deleted location', async () => {
      const response = await client.get(`/business/fulfillment/locations/${SEEDED.LOCATION_ID}`, { headers: authHeaders() });
      expectStatus(response, 404);
    });
  });

  describe('PUT /business/fulfillment/partners/:partnerId', () => {
    it('should update the seeded partner', async () => {
      const response = await client.put(
        `/business/fulfillment/partners/${SEEDED.PARTNER_UPDATE_ID}`,
        { contactEmail: 'updated-partner@test.com', contactPhone: '+1-555-9999' },
        { headers: authHeaders() },
      );
      expectStatus(response, 200);
      expect(response.data.success).toBe(true);
    });

    it('should return 404 for a non-existent partner', async () => {
      const response = await client.put(
        `/business/fulfillment/partners/${randomUUID()}`,
        { contactEmail: 'nobody@test.com' },
        { headers: authHeaders() },
      );
      expectStatus(response, 404);
    });
  });

  describe('DELETE /business/fulfillment/partners/:partnerId', () => {
    it('should delete the seeded partner', async () => {
      const response = await client.delete(`/business/fulfillment/partners/${SEEDED.PARTNER_DELETE_ID}`, { headers: authHeaders() });
      expectStatus(response, 200);
      expect(response.data.success).toBe(true);
    });
  });
});
