import { AxiosInstance } from 'axios';
import { setupShippingTests, cleanupShippingTests, createTestCarrier } from './testUtils';

describe('Shipping Feature Tests', () => {
  let client: AxiosInstance;
  let adminToken: string;
  const createdResources = {
    carrierIds: [] as string[],
    labelIds: [] as string[]
  };

  beforeAll(async () => {
    const setup = await setupShippingTests();
    client = setup.client;
    adminToken = setup.adminToken;
  });

  afterAll(async () => {
    await cleanupShippingTests(client, adminToken, createdResources);
  });

  // ============================================================================
  // Carrier Management Tests (UC-SHP-001 to UC-SHP-005)
  // ============================================================================

  describe('Carrier Management', () => {
    let testCarrierId: string;

    it('UC-SHP-003: should create a carrier', async () => {
      const carrierData = createTestCarrier();

      const response = await client.post('/business/shipping/carriers', carrierData, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });

      expect(response.status).toBe(201);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('id');

      testCarrierId = response.data.data.id;
      createdResources.carrierIds.push(testCarrierId);
    });

    it('UC-SHP-001: should list carriers', async () => {
      const response = await client.get('/business/shipping/carriers', {
        headers: { Authorization: `Bearer ${adminToken}` }
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(Array.isArray(response.data.data)).toBe(true);
    });

    it('UC-SHP-002: should get a specific carrier', async () => {
      const response = await client.get(`/business/shipping/carriers/${testCarrierId}`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
    });

    it('UC-SHP-004: should update a carrier', async () => {
      const updateData = { name: 'Updated Carrier Name' };

      const response = await client.put(`/business/shipping/carriers/${testCarrierId}`, updateData, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
    });
  });

  // ============================================================================
  // Rate Calculation Tests (UC-SHP-006)
  // ============================================================================

  describe('Rate Calculation', () => {
    it('UC-SHP-006: should get shipping rates', async () => {
      const rateRequest = {
        items: [{ productId: 'prod-001', quantity: 1, weight: 1.5 }],
        origin: { postalCode: '10001', country: 'US' },
        destination: { postalCode: '90210', country: 'US', state: 'CA' }
      };

      const response = await client.post('/api/shipping/rates', rateRequest);

      expect(response.status).toBe(200);
    });
  });

  // ============================================================================
  // Label Generation Tests (UC-SHP-007 to UC-SHP-009)
  // ============================================================================

  describe('Label Generation', () => {
    it('UC-SHP-007: should create a shipping label', async () => {
      const labelData = {
        orderId: 'order-001',
        carrierId: 'carrier-001',
        serviceCode: 'ground',
        packageWeight: 2.5,
        packageDimensions: { length: 10, width: 8, height: 6 }
      };

      const response = await client.post('/business/shipping/labels', labelData, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });

      expect(response.status).toBe(201);
    });
  });

  // ============================================================================
  // Tracking Tests (UC-SHP-010)
  // ============================================================================

  describe('Tracking', () => {
    it('UC-SHP-010: should get tracking info', async () => {
      const response = await client.get('/api/shipping/tracking/TEST123456');

      expect(response.status).toBe(200);
    });
  });

  // ============================================================================
  // Authorization Tests
  // ============================================================================

  describe('Authorization', () => {
    it('should require auth for carrier management', async () => {
      const response = await client.get('/business/shipping/carriers');
      expect(response.status).toBe(401);
    });

    it('should reject invalid tokens', async () => {
      const response = await client.get('/business/shipping/carriers', {
        headers: { Authorization: 'Bearer invalid-token' }
      });
      expect(response.status).toBe(401);
    });
  });
});
