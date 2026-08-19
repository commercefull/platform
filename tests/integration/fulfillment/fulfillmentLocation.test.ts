/**
 * Fulfillment Location & Partner Integration Tests
 *
 * Tests for fulfillment location CRUD, activation/deactivation,
 * nearest location lookup, and partner management endpoints.
 */

import axios, { AxiosInstance } from 'axios';
import { randomUUID } from 'node:crypto';
import { expectStatus } from '../testUtils';

const API_URL = process.env.API_URL || 'http://localhost:3000';

const TEST_MERCHANT = {
  email: 'merchant@example.com',
  password: 'password123',
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

// ============================================================================
// Tests
// ============================================================================

describe('Fulfillment Location & Partner Tests', () => {
  // ==========================================================================
  // Fulfillment Locations
  // ==========================================================================

  describe('Fulfillment Locations', () => {
    let createdLocationId: string | undefined;

    describe('POST /business/fulfillment/locations', () => {
      it('should create a fulfillment location', async () => {
        const locationData = {
          organizationId: 'test-org-1',
          type: 'warehouse',
          name: `Test Fulfillment Location ${randomUUID().substring(0, 8)}`,
          code: `LOC-${Date.now()}`,
          capabilities: { canShip: true, canPickup: false, canLocalDeliver: false },
        };

        const response = await client.post('/business/fulfillment/locations', locationData, {
          headers: authHeaders(),
        });

        expectStatus(response, 201);
        expect(response.data.success).toBe(true);
        expect(response.data.data).toBeDefined();
        createdLocationId =
          response.data.data?.fulfillmentLocationId || response.data.data?.id;
      });

      it('should reject creation with missing name', async () => {
        const response = await client.post(
          '/business/fulfillment/locations',
          { organizationId: 'test-org-1', type: 'warehouse' },
          { headers: authHeaders() },
        );

        expectStatus(response, 400);
        expect(response.data.success).toBe(false);
      });
    });

    describe('GET /business/fulfillment/locations', () => {
      it('should list fulfillment locations', async () => {
        const response = await client.get('/business/fulfillment/locations', {
          headers: authHeaders(),
          params: { organizationId: 'test-org-1' },
        });

        expect(response.status).toBe(200);
        expect(response.data.success).toBe(true);
        expect(Array.isArray(response.data.data)).toBe(true);
      });

      it('should filter by active status', async () => {
        const response = await client.get('/business/fulfillment/locations', {
          headers: authHeaders(),
          params: { organizationId: 'test-org-1', isActive: 'true' },
        });

        expect(response.status).toBe(200);
        expect(response.data.success).toBe(true);
      });
    });

    describe('GET /business/fulfillment/locations/:locationId', () => {
      it('should return 404 for non-existent location', async () => {
        const response = await client.get(`/business/fulfillment/locations/${randomUUID()}`, {
          headers: authHeaders(),
        });

        expectStatus(response, 404);
        expect(response.data.success).toBe(false);
      });

      it('should get a location by ID if created', async () => {
        if (!createdLocationId) return;

        const response = await client.get(`/business/fulfillment/locations/${createdLocationId}`, {
          headers: authHeaders(),
        });

        expect(response.status).toBe(200);
        expect(response.data.success).toBe(true);
        expect(response.data.data).toBeDefined();
      });
    });

    describe('PUT /business/fulfillment/locations/:locationId', () => {
      it('should update a location', async () => {
        if (!createdLocationId) return;

        const response = await client.put(
          `/business/fulfillment/locations/${createdLocationId}`,
          { name: `Updated Location ${Date.now()}` },
          { headers: authHeaders() },
        );

        expectStatus(response, 200);
        expect(response.data.success).toBe(true);
      });
    });

    describe('POST /business/fulfillment/locations/:locationId/activate', () => {
      it('should activate a location', async () => {
        if (!createdLocationId) return;

        const response = await client.post(
          `/business/fulfillment/locations/${createdLocationId}/activate`,
          {},
          { headers: authHeaders() },
        );

        expectStatus(response, 200);
        expect(response.data.success).toBe(true);
      });
    });

    describe('POST /business/fulfillment/locations/:locationId/deactivate', () => {
      it('should deactivate a location', async () => {
        if (!createdLocationId) return;

        const response = await client.post(
          `/business/fulfillment/locations/${createdLocationId}/deactivate`,
          {},
          { headers: authHeaders() },
        );

        expectStatus(response, 200);
        expect(response.data.success).toBe(true);
      });
    });

    describe('GET /business/fulfillment/locations/nearest', () => {
      it('should find nearest locations by coordinates', async () => {
        const response = await client.get('/business/fulfillment/locations/nearest', {
          headers: authHeaders(),
          params: {
            latitude: 45.5152,
            longitude: -122.6784,
            limit: 10,
          },
        });

        expect(response.status).toBe(200);
        expect(response.data.success).toBe(true);
        expect(Array.isArray(response.data.data)).toBe(true);
      });
    });
  });

  // ==========================================================================
  // Fulfillment Partners
  // ==========================================================================

  describe('Fulfillment Partners', () => {
    let createdPartnerId: string | undefined;

    describe('GET /business/fulfillment/partners', () => {
      it('should list fulfillment partners', async () => {
        const response = await client.get('/business/fulfillment/partners', {
          headers: authHeaders(),
        });

        expect(response.status).toBe(200);
        expect(response.data.success).toBe(true);
        expect(Array.isArray(response.data.data)).toBe(true);
      });
    });

    describe('POST /business/fulfillment/partners', () => {
      it('should create a fulfillment partner', async () => {
        const partnerData = {
          name: `Test Partner ${randomUUID().substring(0, 8)}`,
          code: `PARTNER-${Date.now()}`,
          type: '3pl',
          contactEmail: 'partner@test.com',
          contactPhone: '+1-555-0100',
          isActive: true,
        };

        const response = await client.post('/business/fulfillment/partners', partnerData, {
          headers: authHeaders(),
        });

        expectStatus(response, 201);
        expect(response.data.success).toBe(true);
        expect(response.data.data).toBeDefined();
        createdPartnerId =
          response.data.data?.fulfillmentPartnerId || response.data.data?.id;
      });

      it('should reject partner creation with missing name', async () => {
        const response = await client.post(
          '/business/fulfillment/partners',
          { code: 'MISSING-NAME' },
          { headers: authHeaders() },
        );

        expectStatus(response, 400);
        expect(response.data.success).toBe(false);
      });
    });

    describe('GET /business/fulfillment/partners/:partnerId', () => {
      it('should return 404 for non-existent partner', async () => {
        const response = await client.get(`/business/fulfillment/partners/${randomUUID()}`, {
          headers: authHeaders(),
        });

        expect(response.status).toBe(404);
        expect(response.data.success).toBe(false);
      });

      it('should get a partner by ID if created', async () => {
        if (!createdPartnerId) return;

        const response = await client.get(`/business/fulfillment/partners/${createdPartnerId}`, {
          headers: authHeaders(),
        });

        expect(response.status).toBe(200);
        expect(response.data.success).toBe(true);
        expect(response.data.data).toBeDefined();
      });
    });
  });
});
