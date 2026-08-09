/**
 * Fulfillment Location & Partner Integration Tests
 *
 * Tests for fulfillment location CRUD, activation/deactivation,
 * nearest location lookup, and partner management endpoints.
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

// ============================================================================
// Tests
// ============================================================================

describe('Fulfillment Location & Partner Tests', () => {
  // ==========================================================================
  // Fulfillment Locations
  // ==========================================================================

  describe('Fulfillment Locations', () => {
    let createdLocationId: string | undefined;

    describe('POST /business/locations', () => {
      it('should create a fulfillment location', async () => {
        const locationData = {
          organizationId: 'test-org-1',
          type: 'warehouse',
          name: `Test Fulfillment Location ${randomUUID().substring(0, 8)}`,
          code: `LOC-${Date.now()}`,
          capabilities: { canShip: true, canPickup: false, canLocalDeliver: false },
        };

        const response = await client.post('/business/locations', locationData, {
          headers: authHeaders(),
        });

        expect([201, 200]).toContain(response.status);
        if (response.status === 201 || response.status === 200) {
          expect(response.data.success).toBe(true);
          expect(response.data.data).toBeDefined();
          createdLocationId =
            response.data.data?.fulfillmentLocationId || response.data.data?.id;
        }
      });

      it('should reject creation with missing name', async () => {
        const response = await client.post(
          '/business/locations',
          { organizationId: 'test-org-1', type: 'warehouse' },
          { headers: authHeaders() },
        );

        expect([400, 500]).toContain(response.status);
        expect(response.data.success).toBe(false);
      });
    });

    describe('GET /business/locations', () => {
      it('should list fulfillment locations', async () => {
        const response = await client.get('/business/locations', {
          headers: authHeaders(),
          params: { organizationId: 'test-org-1' },
        });

        expect(response.status).toBe(200);
        expect(response.data.success).toBe(true);
        expect(Array.isArray(response.data.data)).toBe(true);
      });

      it('should filter by active status', async () => {
        const response = await client.get('/business/locations', {
          headers: authHeaders(),
          params: { organizationId: 'test-org-1', isActive: 'true' },
        });

        expect(response.status).toBe(200);
        expect(response.data.success).toBe(true);
      });
    });

    describe('GET /business/locations/:locationId', () => {
      it('should return 404 for non-existent location', async () => {
        const response = await client.get(`/business/locations/${randomUUID()}`, {
          headers: authHeaders(),
        });

        expect([404, 500]).toContain(response.status);
        expect(response.data.success).toBe(false);
      });

      it('should get a location by ID if created', async () => {
        if (!createdLocationId) return;

        const response = await client.get(`/business/locations/${createdLocationId}`, {
          headers: authHeaders(),
        });

        expect(response.status).toBe(200);
        expect(response.data.success).toBe(true);
        expect(response.data.data).toBeDefined();
      });
    });

    describe('PUT /business/locations/:locationId', () => {
      it('should update a location', async () => {
        if (!createdLocationId) return;

        const response = await client.put(
          `/business/locations/${createdLocationId}`,
          { name: `Updated Location ${Date.now()}` },
          { headers: authHeaders() },
        );

        expect([200, 404]).toContain(response.status);
        if (response.status === 200) {
          expect(response.data.success).toBe(true);
        }
      });
    });

    describe('POST /business/locations/:locationId/activate', () => {
      it('should activate a location', async () => {
        if (!createdLocationId) return;

        const response = await client.post(
          `/business/locations/${createdLocationId}/activate`,
          {},
          { headers: authHeaders() },
        );

        expect([200, 404]).toContain(response.status);
        if (response.status === 200) {
          expect(response.data.success).toBe(true);
        }
      });
    });

    describe('POST /business/locations/:locationId/deactivate', () => {
      it('should deactivate a location', async () => {
        if (!createdLocationId) return;

        const response = await client.post(
          `/business/locations/${createdLocationId}/deactivate`,
          {},
          { headers: authHeaders() },
        );

        expect([200, 404]).toContain(response.status);
        if (response.status === 200) {
          expect(response.data.success).toBe(true);
        }
      });
    });

    describe('GET /business/locations/nearest', () => {
      it('should find nearest locations by coordinates', async () => {
        const response = await client.get('/business/locations/nearest', {
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

    describe('GET /business/partners', () => {
      it('should list fulfillment partners', async () => {
        const response = await client.get('/business/partners', {
          headers: authHeaders(),
        });

        expect(response.status).toBe(200);
        expect(response.data.success).toBe(true);
        expect(Array.isArray(response.data.data)).toBe(true);
      });
    });

    describe('POST /business/partners', () => {
      it('should create a fulfillment partner', async () => {
        const partnerData = {
          name: `Test Partner ${randomUUID().substring(0, 8)}`,
          code: `PARTNER-${Date.now()}`,
          type: '3pl',
          contactEmail: 'partner@test.com',
          contactPhone: '+1-555-0100',
          isActive: true,
        };

        const response = await client.post('/business/partners', partnerData, {
          headers: authHeaders(),
        });

        expect([201, 200]).toContain(response.status);
        if (response.status === 201 || response.status === 200) {
          expect(response.data.success).toBe(true);
          expect(response.data.data).toBeDefined();
          createdPartnerId =
            response.data.data?.fulfillmentPartnerId || response.data.data?.id;
        }
      });

      it('should reject partner creation with missing name', async () => {
        const response = await client.post(
          '/business/partners',
          { code: 'MISSING-NAME' },
          { headers: authHeaders() },
        );

        expect([400, 500]).toContain(response.status);
        expect(response.data.success).toBe(false);
      });
    });

    describe('GET /business/partners/:partnerId', () => {
      it('should return 404 for non-existent partner', async () => {
        const response = await client.get(`/business/partners/${randomUUID()}`, {
          headers: authHeaders(),
        });

        expect(response.status).toBe(404);
        expect(response.data.success).toBe(false);
      });

      it('should get a partner by ID if created', async () => {
        if (!createdPartnerId) return;

        const response = await client.get(`/business/partners/${createdPartnerId}`, {
          headers: authHeaders(),
        });

        expect(response.status).toBe(200);
        expect(response.data.success).toBe(true);
        expect(response.data.data).toBeDefined();
      });
    });
  });
});
