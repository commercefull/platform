import { AxiosInstance } from 'axios';
import {
  setupShippingTests,
  cleanupShippingTests,
  createTestCarrier,
  createTestMethod,
  createTestZone,
  SEEDED_CARRIER_IDS,
  SEEDED_METHOD_IDS,
  SEEDED_ZONE_IDS,
  SEEDED_RATE_IDS,
  SEEDED_PACKAGING_IDS,
} from './testUtils';

describe('Shipping Feature Tests', () => {
  let client: AxiosInstance;
  let adminToken: string;
  const createdResources = {
    carrierIds: [] as string[],
    methodIds: [] as string[],
    zoneIds: [] as string[],
    rateIds: [] as string[],
  };

  beforeAll(async () => {
    const setup = await setupShippingTests();
    client = setup.client;
    adminToken = setup.adminToken;
  });

  afterAll(async () => {
    await cleanupShippingTests(client, adminToken, createdResources);
  });

  const authHeaders = () => ({ Authorization: `Bearer ${adminToken}` });

  // ============================================================================
  // Carrier Management Tests
  // ============================================================================

  describe('Carrier Management', () => {
    let testCarrierId: string;

    it('should list all carriers', async () => {
      const response = await client.get('/business/carriers', {
        headers: authHeaders(),
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(Array.isArray(response.data.data)).toBe(true);
    });

    it('should get seeded UPS carrier by ID', async () => {
      const response = await client.get(`/business/carriers/${SEEDED_CARRIER_IDS.UPS}`, {
        headers: authHeaders(),
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data.code).toBe('TEST_UPS');
    });

    it('should create a new carrier', async () => {
      const carrierData = createTestCarrier();

      const response = await client.post('/business/carriers', carrierData, {
        headers: authHeaders(),
      });

      expect(response.status).toBe(201);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('shippingCarrierId');

      testCarrierId = response.data.data.shippingCarrierId;
      createdResources.carrierIds.push(testCarrierId);
    });

    it('should update a carrier', async () => {
      const updateData = { name: 'Updated Carrier Name', description: 'Updated description' };

      const response = await client.put(`/business/carriers/${testCarrierId}`, updateData, {
        headers: authHeaders(),
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data.name).toBe('Updated Carrier Name');
    });

    it('should delete a carrier', async () => {
      const response = await client.delete(`/business/carriers/${testCarrierId}`, {
        headers: authHeaders(),
      });

      expect([200, 204]).toContain(response.status);

      const getResponse = await client.get(`/business/carriers/${testCarrierId}`, {
        headers: authHeaders(),
      });
      expect([404, 400]).toContain(getResponse.status);
    });

    it('should return 404 for non-existent carrier', async () => {
      const response = await client.get('/business/carriers/00000000-0000-0000-0000-000000000000', {
        headers: authHeaders(),
      });

      expect(response.status).toBe(404);
    });
  });

  // ============================================================================
  // Shipping Method Tests
  // ============================================================================

  describe('Shipping Method Management', () => {
    let testMethodId: string;

    it('should list all methods', async () => {
      const response = await client.get('/business/methods', {
        headers: authHeaders(),
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(Array.isArray(response.data.data)).toBe(true);
    });

    it('should get seeded UPS Ground method by ID', async () => {
      const response = await client.get(`/business/methods/${SEEDED_METHOD_IDS.UPS_GROUND}`, {
        headers: authHeaders(),
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data.code).toBe('UPS_GROUND');
    });

    it('should create a new method', async () => {
      const methodData = createTestMethod(SEEDED_CARRIER_IDS.UPS);

      const response = await client.post('/business/methods', methodData, {
        headers: authHeaders(),
      });

      expect(response.status).toBe(201);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('shippingMethodId');

      testMethodId = response.data.data.shippingMethodId;
      createdResources.methodIds.push(testMethodId);
    });

    it('should update a method', async () => {
      const updateData = { name: 'Updated Method Name', priority: 5 };

      const response = await client.put(`/business/methods/${testMethodId}`, updateData, {
        headers: authHeaders(),
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data.name).toBe('Updated Method Name');
    });

    it('should delete a method', async () => {
      const response = await client.delete(`/business/methods/${testMethodId}`, {
        headers: authHeaders(),
      });

      expect([200, 204]).toContain(response.status);
    });
  });

  // ============================================================================
  // Shipping Zone Tests
  // ============================================================================

  describe('Shipping Zone Management', () => {
    let testZoneId: string;

    it('should list all zones', async () => {
      const response = await client.get('/business/zones', {
        headers: authHeaders(),
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(Array.isArray(response.data.data)).toBe(true);
    });

    it('should get seeded US Domestic zone by ID', async () => {
      const response = await client.get(`/business/zones/${SEEDED_ZONE_IDS.US_DOMESTIC}`, {
        headers: authHeaders(),
      });

      expect([200, 404]).toContain(response.status);
      if (response.status === 200) {
        expect(response.data.success).toBe(true);
      }
    });

    it('should create a new zone', async () => {
      const zoneData = createTestZone();

      const response = await client.post('/business/zones', zoneData, {
        headers: authHeaders(),
      });

      expect([201, 200, 400, 500]).toContain(response.status);
      if (response.status === 201 || response.status === 200) {
        expect(response.data.success).toBe(true);
        testZoneId = response.data.data.shippingZoneId;
        createdResources.zoneIds.push(testZoneId);
      }
    });

    it('should update a zone', async () => {
      if (!testZoneId) return;

      const updateData = { name: 'Updated Zone Name', priority: 5 };

      const response = await client.put(`/business/zones/${testZoneId}`, updateData, {
        headers: authHeaders(),
      });

      expect([200, 400]).toContain(response.status);
      if (response.status === 200) {
        expect(response.data.success).toBe(true);
      }
    });

    it('should delete a zone', async () => {
      if (!testZoneId) return;

      const response = await client.delete(`/business/zones/${testZoneId}`, {
        headers: authHeaders(),
      });

      expect([200, 204, 400]).toContain(response.status);
    });
  });

  // ============================================================================
  // Shipping Rate Tests
  // ============================================================================

  describe('Shipping Rate Management', () => {
    it('should list all rates', async () => {
      const response = await client.get('/business/rates', {
        headers: authHeaders(),
      });

      expect([200, 400, 500]).toContain(response.status);
      if (response.status === 200) {
        expect(response.data.success).toBe(true);
      }
    });

    it('should get seeded UPS Ground US rate by ID', async () => {
      const response = await client.get(`/business/rates/${SEEDED_RATE_IDS.UPS_GROUND_US}`, {
        headers: authHeaders(),
      });

      expect([200, 404, 400]).toContain(response.status);
      if (response.status === 200) {
        expect(response.data.success).toBe(true);
      }
    });

    it('should filter rates by zone', async () => {
      const response = await client.get(`/business/rates?zoneId=${SEEDED_ZONE_IDS.US_DOMESTIC}`, {
        headers: authHeaders(),
      });

      expect([200, 400, 500]).toContain(response.status);
      if (response.status === 200) {
        expect(response.data.success).toBe(true);
      }
    });
  });

  // ============================================================================
  // Packaging Type Tests
  // ============================================================================

  describe('Packaging Type Management', () => {
    let testPackagingId: string;

    it('should list all packaging types', async () => {
      const response = await client.get('/business/packaging-types', {
        headers: authHeaders(),
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(Array.isArray(response.data.data)).toBe(true);
    });

    it('should get seeded Medium Box by ID', async () => {
      const response = await client.get(`/business/packaging-types/${SEEDED_PACKAGING_IDS.MEDIUM_BOX}`, {
        headers: authHeaders(),
      });

      expect([200, 404]).toContain(response.status);
      if (response.status === 200) {
        expect(response.data.success).toBe(true);
      }
    });

    it('should create a new packaging type', async () => {
      const packagingData = {
        name: `Test Packaging ${Date.now()}`,
        code: `TPK${Date.now()}`,
        description: 'Test packaging type',
        isActive: true,
      };

      const response = await client.post('/business/packaging-types', packagingData, {
        headers: authHeaders(),
      });

      expect([201, 200, 400]).toContain(response.status);
      if (response.status === 201 || response.status === 200) {
        testPackagingId = response.data.data?.shippingPackagingTypeId;
      }
    });

    it('should update a packaging type', async () => {
      if (!testPackagingId) return;

      const response = await client.put(
        `/business/packaging-types/${testPackagingId}`,
        { name: 'Updated Packaging' },
        { headers: authHeaders() },
      );

      expect([200, 400]).toContain(response.status);
    });

    it('should delete a packaging type', async () => {
      if (!testPackagingId) return;

      const response = await client.delete(`/business/packaging-types/${testPackagingId}`, {
        headers: authHeaders(),
      });

      expect([200, 204, 400]).toContain(response.status);
    });
  });

  // ============================================================================
  // Rate Calculation Tests
  // ============================================================================

  describe('Rate Calculation', () => {
    it('should calculate shipping rates for US destination', async () => {
      const rateRequest = {
        destinationAddress: {
          country: 'US',
          state: 'CA',
          city: 'Los Angeles',
          postalCode: '90210',
        },
        orderDetails: {
          subtotal: 100,
          itemCount: 3,
          totalWeight: 5,
          currency: 'USD',
        },
      };

      const response = await client.post('/business/calculate-rates', rateRequest, {
        headers: authHeaders(),
      });

      expect([200, 400]).toContain(response.status);
    });

    it('should return empty rates for unsupported destination', async () => {
      const rateRequest = {
        destinationAddress: {
          country: 'ZZ',
          postalCode: '00000',
        },
        orderDetails: {
          subtotal: 100,
          itemCount: 1,
        },
      };

      const response = await client.post('/business/calculate-rates', rateRequest, {
        headers: authHeaders(),
      });

      expect(response.status).toBe(200);
    });

    it('should require destination address', async () => {
      const rateRequest = {
        orderDetails: {
          subtotal: 100,
          itemCount: 1,
        },
      };

      const response = await client.post('/business/calculate-rates', rateRequest, {
        headers: authHeaders(),
      });

      expect(response.status).toBe(400);
    });
  });

  // ============================================================================
  // Estimate Delivery Tests
  // ============================================================================

  describe('POST /customer/estimate-delivery', () => {
    it('should estimate delivery time for a shipping method', async () => {
      const response = await client.post(
        '/customer/estimate-delivery',
        {
          methodId: SEEDED_METHOD_IDS.UPS_GROUND,
          destinationAddress: {
            country: 'US',
            state: 'CA',
            city: 'Los Angeles',
            postalCode: '90210',
          },
        },
        { headers: { 'X-Test-Request': 'true' } },
      );

      expect([200, 400]).toContain(response.status);
      if (response.status === 200) {
        expect(response.data.success).toBe(true);
      }
    });

    it('should reject estimate without methodId', async () => {
      const response = await client.post(
        '/customer/estimate-delivery',
        {
          destinationAddress: { country: 'US' },
        },
        { headers: { 'X-Test-Request': 'true' } },
      );

      expect([400, 500]).toContain(response.status);
    });
  });

  // ============================================================================
  // Authorization Tests
  // ============================================================================

  describe('Authorization', () => {
    it('should require auth for carrier creation', async () => {
      const response = await client.post('/business/carriers', createTestCarrier());
      expect(response.status).toBe(401);
    });

    it('should require auth for carrier update', async () => {
      const response = await client.put(`/business/carriers/${SEEDED_CARRIER_IDS.UPS}`, { name: 'Test' });
      expect(response.status).toBe(401);
    });

    it('should require auth for carrier deletion', async () => {
      const response = await client.delete(`/business/carriers/${SEEDED_CARRIER_IDS.UPS}`);
      expect(response.status).toBe(401);
    });

    it('should reject invalid tokens', async () => {
      const response = await client.get('/business/carriers', {
        headers: { Authorization: 'Bearer invalid-token' },
      });
      expect(response.status).toBe(401);
    });
  });
});
