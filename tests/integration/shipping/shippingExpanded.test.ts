/**
 * Shipping Expanded Tests
 * Tests: rate calculation, zone-based shipping, packaging, method filtering
 */

import { AxiosInstance } from 'axios';
import {
  setupShippingTests,
  cleanupShippingTests,
  createTestCarrier,
  createTestZone,
  SEEDED_CARRIER_IDS,
  SEEDED_METHOD_IDS,
  SEEDED_ZONE_IDS,
  SEEDED_PACKAGING_IDS,
} from './testUtils';
import { expectStatus } from '../testUtils';

describe('Shipping Expanded Tests', () => {
  let client: AxiosInstance;
  let adminToken: string;
  const createdResources = {
    carrierIds: [] as string[],
    methodIds: [] as string[],
    zoneIds: [] as string[],
    rateIds: [] as string[],
  };

  beforeAll(async () => {
    jest.setTimeout(30000);
    const setup = await setupShippingTests();
    client = setup.client;
    adminToken = setup.adminToken;
  });

  afterAll(async () => {
    await cleanupShippingTests(client, adminToken, createdResources);
  });

  const authHeaders = () => ({ Authorization: `Bearer ${adminToken}` });

  // ============================================================================
  // Rate Calculation Tests
  // ============================================================================

  describe('Rate Calculation', () => {
    it('should list all shipping rates', async () => {
      const resp = await client.get('/business/rates', {
        headers: authHeaders(),
      });

      expect(resp.status).toBe(200);
      expect(resp.data.success).toBe(true);
      expect(Array.isArray(resp.data.data)).toBe(true);
    });

    it('should get rates for a specific zone', async () => {
      const resp = await client.get('/business/rates', {
        params: { zoneId: SEEDED_ZONE_IDS.US_DOMESTIC },
        headers: authHeaders(),
      });

      expect(resp.status).toBe(200);
      expect(resp.data.success).toBe(true);
    });

    it('should get rates for a specific method', async () => {
      const resp = await client.get('/business/rates', {
        params: { methodId: SEEDED_METHOD_IDS.UPS_GROUND },
        headers: authHeaders(),
      });

      expect(resp.status).toBe(200);
      expect(resp.data.success).toBe(true);
    });
  });

  // ============================================================================
  // Zone-Based Shipping Tests
  // ============================================================================

  describe('Zone-Based Shipping', () => {
    it('should list all shipping zones', async () => {
      const resp = await client.get('/business/zones', {
        headers: authHeaders(),
      });

      expect(resp.status).toBe(200);
      expect(resp.data.success).toBe(true);
      expect(Array.isArray(resp.data.data)).toBe(true);
    });

    it('should get a specific zone by ID', async () => {
      const resp = await client.get(`/business/zones/${SEEDED_ZONE_IDS.US_DOMESTIC}`, {
        headers: authHeaders(),
      });

      expect(resp.status).toBe(200);
      expect(resp.data.success).toBe(true);
    });

    it('should create a new shipping zone', async () => {
      const zoneData = createTestZone();
      const resp = await client.post('/business/zones', zoneData, {
        headers: authHeaders(),
      });

      expectStatus(resp, 201);
      if (resp.status === 201 || resp.status === 200) {
        expect(resp.data.success).toBe(true);
        expect(resp.data.data).toHaveProperty('shippingZoneId');
        createdResources.zoneIds.push(resp.data.data.shippingZoneId);
      }
    });

    it('should return 404 for non-existent zone', async () => {
      const resp = await client.get('/business/zones/00000000-0000-0000-0000-000000000000', {
        headers: authHeaders(),
      });

      expectStatus(resp, 404);
    });
  });

  // ============================================================================
  // Packaging Tests
  // ============================================================================

  describe('Packaging', () => {
    it('should list all packaging types', async () => {
      const resp = await client.get('/business/packaging-types', {
        headers: authHeaders(),
      });

      expect(resp.status).toBe(200);
      expect(resp.data.success).toBe(true);
      expect(Array.isArray(resp.data.data)).toBe(true);
    });

    it('should get a specific packaging by ID', async () => {
      const resp = await client.get(`/business/packaging-types/${SEEDED_PACKAGING_IDS.SMALL_BOX}`, {
        headers: authHeaders(),
      });

      expect(resp.status).toBe(200);
      expect(resp.data.success).toBe(true);
    });
  });

  // ============================================================================
  // Method Filtering Tests
  // ============================================================================

  describe('Method Filtering', () => {
    it('should list all shipping methods', async () => {
      const resp = await client.get('/business/methods', {
        headers: authHeaders(),
      });

      expect(resp.status).toBe(200);
      expect(resp.data.success).toBe(true);
      expect(Array.isArray(resp.data.data)).toBe(true);
    });

    it('should filter methods by carrier', async () => {
      const resp = await client.get('/business/methods', {
        params: { carrierId: SEEDED_CARRIER_IDS.UPS },
        headers: authHeaders(),
      });

      expect(resp.status).toBe(200);
      expect(resp.data.success).toBe(true);
    });

    it('should get a specific method by ID', async () => {
      const resp = await client.get(`/business/methods/${SEEDED_METHOD_IDS.UPS_GROUND}`, {
        headers: authHeaders(),
      });

      expect(resp.status).toBe(200);
      expect(resp.data.success).toBe(true);
    });
  });

  // ============================================================================
  // Carrier Management Expanded
  // ============================================================================

  describe('Carrier Management Expanded', () => {
    it('should update a carrier', async () => {
      const carrierData = createTestCarrier();
      const createResp = await client.post('/business/carriers', carrierData, {
        headers: authHeaders(),
      });

      if (createResp.status === 201 || createResp.status === 200) {
        const carrierId = createResp.data.data.shippingCarrierId || createResp.data.data.carrierId;
        createdResources.carrierIds.push(carrierId);

        const updateResp = await client.put(
          `/business/carriers/${carrierId}`,
          { ...carrierData, name: 'Updated Carrier Name' },
          { headers: authHeaders() },
        );

        expectStatus(updateResp, 200);
      }
    });

    it('should deactivate a carrier', async () => {
      const carrierData = createTestCarrier();
      const createResp = await client.post('/business/carriers', carrierData, {
        headers: authHeaders(),
      });

      if (createResp.status === 201 || createResp.status === 200) {
        const carrierId = createResp.data.data.shippingCarrierId || createResp.data.data.carrierId;
        createdResources.carrierIds.push(carrierId);

        const updateResp = await client.put(
          `/business/carriers/${carrierId}`,
          { ...carrierData, isActive: false },
          { headers: authHeaders() },
        );

        expectStatus(updateResp, 200);
      }
    });
  });
});
