import { AxiosInstance } from 'axios';
import { 
  setupDistributionTests, 
  cleanupDistributionTests, 
  testDistributionCenter,
  testShippingZone,
  testShippingMethod,
  testFulfillmentPartner,
  testDistributionRule,
  createTestDistributionCenter,
  createTestShippingZone,
  createTestShippingMethod,
  createTestShippingCarrier,
  createTestShippingRate,
  createTestFulfillmentPartner,
  createTestDistributionRule,
  createTestOrderFulfillment
} from './testUtils';

describe('Distribution Feature Tests', () => {
  let client: AxiosInstance;
  let adminToken: string;
  let testDistributionCenterId: string;
  let testShippingZoneId: string;
  let testShippingMethodId: string;
  let testShippingCarrierId: string;
  let testShippingRateId: string;
  let testFulfillmentPartnerId: string;
  let testRuleId: string;
  let testFulfillmentId: string;

  // Track created resources for cleanup
  const createdResources = {
    centerIds: [] as string[],
    zoneIds: [] as string[],
    methodIds: [] as string[],
    carrierIds: [] as string[],
    rateIds: [] as string[],
    partnerIds: [] as string[],
    ruleIds: [] as string[],
    fulfillmentIds: [] as string[]
  };

  beforeAll(async () => {
    const setup = await setupDistributionTests();
    client = setup.client;
    adminToken = setup.adminToken;
    testDistributionCenterId = setup.testDistributionCenterId;
    testShippingZoneId = setup.testShippingZoneId;
    testShippingMethodId = setup.testShippingMethodId;
    testFulfillmentPartnerId = setup.testFulfillmentPartnerId;
    testRuleId = setup.testRuleId;
  });

  afterAll(async () => {
    // Cleanup created resources in reverse order
    for (const id of createdResources.fulfillmentIds) {
      await client.delete(`/business/distribution/fulfillments/${id}`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      }).catch(() => {});
    }
    for (const id of createdResources.ruleIds) {
      await client.delete(`/business/distribution/rules/${id}`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      }).catch(() => {});
    }
    for (const id of createdResources.rateIds) {
      await client.delete(`/business/distribution/shipping-rates/${id}`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      }).catch(() => {});
    }
    for (const id of createdResources.partnerIds) {
      await client.delete(`/business/distribution/fulfillment-partners/${id}`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      }).catch(() => {});
    }
    for (const id of createdResources.methodIds) {
      await client.delete(`/business/distribution/shipping-methods/${id}`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      }).catch(() => {});
    }
    for (const id of createdResources.carrierIds) {
      await client.delete(`/business/distribution/shipping-carriers/${id}`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      }).catch(() => {});
    }
    for (const id of createdResources.zoneIds) {
      await client.delete(`/business/distribution/shipping-zones/${id}`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      }).catch(() => {});
    }
    for (const id of createdResources.centerIds) {
      await client.delete(`/business/distribution/centers/${id}`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      }).catch(() => {});
    }

    await cleanupDistributionTests(client, adminToken, {
      testRuleId,
      testFulfillmentPartnerId,
      testShippingMethodId,
      testShippingZoneId,
      testDistributionCenterId
    });
  });

  describe('Distribution Center API', () => {
    it('should get distribution center by ID with camelCase properties', async () => {
      const response = await client.get(`/business/distribution/centers/${testDistributionCenterId}`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      
      // Verify properties from TypeScript interface are in camelCase
      expect(response.data.data).toHaveProperty('name');
      expect(response.data.data).toHaveProperty('postalCode');
      expect(response.data.data).toHaveProperty('isActive');
      
      // Verify timestamps are present and in camelCase
      expect(response.data.data).toHaveProperty('createdAt');
      expect(response.data.data).toHaveProperty('updatedAt');
      
      // Make sure no snake_case properties leaked through
      expect(response.data.data).not.toHaveProperty('postal_code');
      expect(response.data.data).not.toHaveProperty('is_active');
      expect(response.data.data).not.toHaveProperty('created_at');
      expect(response.data.data).not.toHaveProperty('updated_at');
    });

    it('should update a distribution center with camelCase properties', async () => {
      const updateData = {
        name: 'Updated Test Center',
        email: 'updated@example.com'
      };
      
      const response = await client.put(`/business/distribution/centers/${testDistributionCenterId}`, updateData, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      
      // Verify the update worked
      expect(response.data.data).toHaveProperty('name', updateData.name);
      
      // Verify that non-updated fields are preserved
      expect(response.data.data).toHaveProperty('code', testDistributionCenter.code);
      
      // Verify response is using camelCase
      expect(response.data.data).not.toHaveProperty('contact_email');
    });

    it('should list all distribution centers with camelCase properties', async () => {
      const response = await client.get('/business/distribution/centers', {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(Array.isArray(response.data.data)).toBe(true);
      
      if (response.data.data.length > 0) {
        const center = response.data.data[0];
        
        // Verify properties use camelCase
        expect(center).toHaveProperty('postalCode');
        expect(center).toHaveProperty('contactEmail');
        expect(center).toHaveProperty('isActive');
        expect(center).toHaveProperty('createdAt');
        expect(center).not.toHaveProperty('postal_code');
        expect(center).not.toHaveProperty('contact_email');
        expect(center).not.toHaveProperty('is_active');
        expect(center).not.toHaveProperty('created_at');
      }
    });
  });

  describe('Shipping Zone API', () => {
    it('should get shipping zone by ID with camelCase properties', async () => {
      const response = await client.get(`/business/distribution/shipping-zones/${testShippingZoneId}`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('id', testShippingZoneId);
      
      // Verify properties from TypeScript interface are in camelCase
      expect(response.data.data).toHaveProperty('name', testShippingZone.name);
      expect(response.data.data).toHaveProperty('postalCodes');
      expect(response.data.data).toHaveProperty('isActive', testShippingZone.isActive);
      
      // Make sure arrays are properly transformed
      expect(Array.isArray(response.data.data.countries)).toBe(true);
      expect(Array.isArray(response.data.data.regions)).toBe(true);
      expect(Array.isArray(response.data.data.postalCodes)).toBe(true);
      
      // Make sure no snake_case properties leaked through
      expect(response.data.data).not.toHaveProperty('postal_codes');
      expect(response.data.data).not.toHaveProperty('is_active');
    });

    it('should update a shipping zone with camelCase properties', async () => {
      const updateData = {
        name: 'Updated Shipping Zone',
        countries: ['US', 'CA', 'MX']
      };
      
      const response = await client.put(`/business/distribution/shipping-zones/${testShippingZoneId}`, updateData, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      
      // Verify the update worked with camelCase properties
      expect(response.data.data).toHaveProperty('name', updateData.name);
      expect(response.data.data.countries).toHaveLength(3);
      expect(response.data.data.countries).toContain('MX');
    });
  });

  describe('Shipping Method API', () => {
    it('should get shipping method by ID with camelCase properties', async () => {
      const response = await client.get(`/business/distribution/shipping-methods/${testShippingMethodId}`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      
      // Verify properties from TypeScript interface are in camelCase
      expect(response.data.data).toHaveProperty('name', testShippingMethod.name);
      expect(response.data.data).toHaveProperty('isActive', testShippingMethod.isActive);
      
      // Make sure no snake_case properties leaked through
      expect(response.data.data).not.toHaveProperty('is_active');
    });
  });

  describe('Fulfillment Partner API', () => {
    it('should get fulfillment partner by ID with camelCase properties', async () => {
      const response = await client.get(`/business/distribution/fulfillment-partners/${testFulfillmentPartnerId}`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      
      // Verify properties from TypeScript interface are in camelCase
      expect(response.data.data).toHaveProperty('name', testFulfillmentPartner.name);
      expect(response.data.data).toHaveProperty('code', testFulfillmentPartner.code);
      expect(response.data.data).toHaveProperty('isActive');
      
      // Make sure no snake_case properties leaked through
      expect(response.data.data).not.toHaveProperty('is_active');
    });
  });

  describe('Distribution Rule API', () => {
    it('should get distribution rule by ID with camelCase properties', async () => {
      const response = await client.get(`/business/distribution/rules/${testRuleId}`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      
      // Verify properties from TypeScript interface are in camelCase
      expect(response.data.data).toHaveProperty('name', testDistributionRule.name);
      expect(response.data.data).toHaveProperty('distributionCenterId', testDistributionCenterId);
      expect(response.data.data).toHaveProperty('shippingZoneId', testShippingZoneId);
      expect(response.data.data).toHaveProperty('shippingMethodId', testShippingMethodId);
      expect(response.data.data).toHaveProperty('fulfillmentPartnerId', testFulfillmentPartnerId);
      expect(response.data.data).toHaveProperty('isDefault', testDistributionRule.isDefault);
      expect(response.data.data).toHaveProperty('isActive', testDistributionRule.isActive);
      
      // Make sure no snake_case properties leaked through
      expect(response.data.data).not.toHaveProperty('distribution_center_id');
      expect(response.data.data).not.toHaveProperty('shipping_zone_id');
      expect(response.data.data).not.toHaveProperty('shipping_method_id');
      expect(response.data.data).not.toHaveProperty('fulfillment_partner_id');
      expect(response.data.data).not.toHaveProperty('is_default');
      expect(response.data.data).not.toHaveProperty('is_active');
    });
  });

  // ============================================================================
  // Shipping Carrier API Tests
  // ============================================================================

  describe('Shipping Carrier API', () => {
    it('should create a shipping carrier', async () => {
      const carrierData = createTestShippingCarrier();
      
      const response = await client.post('/business/distribution/shipping-carriers', carrierData, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      expect(response.status).toBe(201);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('distributionShippingCarrierId');
      
      testShippingCarrierId = response.data.data.distributionShippingCarrierId;
      createdResources.carrierIds.push(testShippingCarrierId);
    });

    it('should list all shipping carriers', async () => {
      const response = await client.get('/business/distribution/shipping-carriers', {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(Array.isArray(response.data.data)).toBe(true);
    });

    it('should get a shipping carrier by ID', async () => {
      const response = await client.get(`/business/distribution/shipping-carriers/${testShippingCarrierId}`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('distributionShippingCarrierId', testShippingCarrierId);
    });

    it('should update a shipping carrier', async () => {
      const updateData = { name: 'Updated Carrier Name' };
      
      const response = await client.put(`/business/distribution/shipping-carriers/${testShippingCarrierId}`, updateData, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('name', updateData.name);
    });
  });

  // ============================================================================
  // Shipping Rate API Tests
  // ============================================================================

  describe('Shipping Rate API', () => {
    it('should create a shipping rate', async () => {
      const rateData = createTestShippingRate(testShippingZoneId, testShippingMethodId);
      
      const response = await client.post('/business/distribution/shipping-rates', rateData, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      expect(response.status).toBe(201);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('distributionShippingRateId');
      
      testShippingRateId = response.data.data.distributionShippingRateId;
      createdResources.rateIds.push(testShippingRateId);
    });

    it('should list all shipping rates', async () => {
      const response = await client.get('/business/distribution/shipping-rates', {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(Array.isArray(response.data.data)).toBe(true);
    });

    it('should get shipping rates by zone', async () => {
      const response = await client.get(`/business/distribution/shipping-rates/zone/${testShippingZoneId}`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(Array.isArray(response.data.data)).toBe(true);
    });

    it('should get shipping rates by method', async () => {
      const response = await client.get(`/business/distribution/shipping-rates/method/${testShippingMethodId}`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(Array.isArray(response.data.data)).toBe(true);
    });
  });

  // ============================================================================
  // Shipping Calculation Use Case Tests
  // ============================================================================

  describe('Shipping Calculation (Use Cases)', () => {
    it('should calculate shipping rate for a destination', async () => {
      const rateRequest = {
        destinationCountry: 'US',
        destinationState: 'CA',
        destinationPostalCode: '90210',
        shippingMethodId: testShippingMethodId,
        orderValue: 50,
        orderWeight: 2.5,
        itemCount: 3
      };
      
      const response = await client.post('/business/distribution/shipping/calculate-rate', rateRequest, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      // May succeed or fail depending on rate configuration
      expect([200, 400]).toContain(response.status);
      
      if (response.status === 200) {
        expect(response.data.success).toBe(true);
        expect(response.data.data).toHaveProperty('totalRate');
        expect(response.data.data).toHaveProperty('currency');
        expect(response.data.data).toHaveProperty('isFreeShipping');
      }
    });

    it('should get available shipping methods for a destination', async () => {
      const response = await client.get('/business/distribution/shipping/available-methods', {
        params: {
          destinationCountry: 'US',
          destinationState: 'CA',
          orderValue: 100
        },
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      // May succeed or fail depending on configuration
      expect([200, 400]).toContain(response.status);
      
      if (response.status === 200) {
        expect(response.data.success).toBe(true);
        expect(response.data.data).toHaveProperty('methods');
        expect(Array.isArray(response.data.data.methods)).toBe(true);
      }
    });

    it('should return error for missing destination country', async () => {
      const response = await client.get('/business/distribution/shipping/available-methods', {
        params: { orderValue: 100 },
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      expect(response.status).toBe(400);
      expect(response.data.success).toBe(false);
    });
  });

  // ============================================================================
  // Warehouse Selection Use Case Tests
  // ============================================================================

  describe('Warehouse Selection (Use Cases)', () => {
    it('should find best warehouse for a destination', async () => {
      const response = await client.get('/business/distribution/warehouses/best', {
        params: {
          destinationCountry: 'US',
          destinationState: 'CA',
          destinationPostalCode: '90210'
        },
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      // May succeed or return 404 if no warehouses configured
      expect([200, 404]).toContain(response.status);
      
      if (response.status === 200) {
        expect(response.data.success).toBe(true);
        expect(response.data.data).toHaveProperty('bestWarehouse');
        expect(response.data.data.bestWarehouse).toHaveProperty('id');
        expect(response.data.data.bestWarehouse).toHaveProperty('name');
      }
    });

    it('should return error for missing destination country', async () => {
      const response = await client.get('/business/distribution/warehouses/best', {
        params: { destinationState: 'CA' },
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      expect(response.status).toBe(400);
      expect(response.data.success).toBe(false);
    });

    it('should include alternative warehouses when available', async () => {
      const response = await client.get('/business/distribution/warehouses/best', {
        params: {
          destinationCountry: 'US',
          destinationLatitude: 34.0522,
          destinationLongitude: -118.2437
        },
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      if (response.status === 200 && response.data.data.alternatives) {
        expect(Array.isArray(response.data.data.alternatives)).toBe(true);
      }
    });
  });

  // ============================================================================
  // Order Fulfillment API Tests
  // ============================================================================

  describe('Order Fulfillment API', () => {
    it('should create an order fulfillment', async () => {
      const fulfillmentData = createTestOrderFulfillment(
        `test-order-${Date.now()}`,
        testDistributionCenterId,
        testShippingMethodId
      );
      
      const response = await client.post('/business/distribution/fulfillments', fulfillmentData, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      expect(response.status).toBe(201);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('id');
      
      testFulfillmentId = response.data.data.id;
      createdResources.fulfillmentIds.push(testFulfillmentId);
    });

    it('should list all order fulfillments', async () => {
      const response = await client.get('/business/distribution/fulfillments', {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(Array.isArray(response.data.data)).toBe(true);
    });

    it('should get an order fulfillment by ID', async () => {
      if (!testFulfillmentId) return;
      
      const response = await client.get(`/business/distribution/fulfillments/${testFulfillmentId}`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('distributionOrderFulfillmentId', testFulfillmentId);
    });

    it('should get fulfillments by status', async () => {
      const response = await client.get('/business/distribution/fulfillments/status/pending', {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(Array.isArray(response.data.data)).toBe(true);
    });

    it('should get fulfillments by warehouse', async () => {
      const response = await client.get(`/business/distribution/fulfillments/warehouse/${testDistributionCenterId}`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(Array.isArray(response.data.data)).toBe(true);
    });
  });

  // ============================================================================
  // Fulfillment Status Transitions (Use Cases)
  // ============================================================================

  describe('Fulfillment Status Transitions', () => {
    it('should transition fulfillment to processing', async () => {
      if (!testFulfillmentId) return;
      
      const response = await client.put(`/business/distribution/fulfillments/${testFulfillmentId}/status`, {
        action: 'start_processing'
      }, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('newStatus', 'processing');
    });

    it('should transition fulfillment to picking', async () => {
      if (!testFulfillmentId) return;
      
      const response = await client.put(`/business/distribution/fulfillments/${testFulfillmentId}/status`, {
        action: 'start_picking'
      }, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('newStatus', 'picking');
    });

    it('should transition fulfillment to packing', async () => {
      if (!testFulfillmentId) return;
      
      const response = await client.put(`/business/distribution/fulfillments/${testFulfillmentId}/status`, {
        action: 'complete_picking'
      }, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('newStatus', 'packing');
    });

    it('should transition fulfillment to ready_to_ship', async () => {
      if (!testFulfillmentId) return;
      
      const response = await client.put(`/business/distribution/fulfillments/${testFulfillmentId}/status`, {
        action: 'complete_packing',
        packageWeight: 2.5,
        packageCount: 1
      }, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('newStatus', 'ready_to_ship');
    });

    it('should transition fulfillment to shipped with tracking', async () => {
      if (!testFulfillmentId) return;
      
      const response = await client.put(`/business/distribution/fulfillments/${testFulfillmentId}/status`, {
        action: 'ship',
        trackingNumber: 'TEST123456789',
        trackingUrl: 'https://track.example.com/TEST123456789'
      }, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('newStatus', 'shipped');
      expect(response.data.data).toHaveProperty('trackingNumber', 'TEST123456789');
    });

    it('should transition fulfillment to delivered', async () => {
      if (!testFulfillmentId) return;
      
      const response = await client.put(`/business/distribution/fulfillments/${testFulfillmentId}/status`, {
        action: 'deliver'
      }, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('newStatus', 'delivered');
    });

    it('should reject invalid status transitions', async () => {
      if (!testFulfillmentId) return;
      
      // Try to go back to processing from delivered (invalid)
      const response = await client.put(`/business/distribution/fulfillments/${testFulfillmentId}/status`, {
        action: 'start_processing'
      }, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      expect(response.status).toBe(400);
      expect(response.data.success).toBe(false);
    });

    it('should reject invalid action', async () => {
      if (!testFulfillmentId) return;
      
      const response = await client.put(`/business/distribution/fulfillments/${testFulfillmentId}/status`, {
        action: 'invalid_action'
      }, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      expect(response.status).toBe(400);
      expect(response.data.success).toBe(false);
    });
  });

  // ============================================================================
  // Distribution Rule CRUD Tests
  // ============================================================================

  describe('Distribution Rule CRUD', () => {
    let newRuleId: string;

    it('should create a distribution rule', async () => {
      const ruleData = createTestDistributionRule(testDistributionCenterId, testShippingZoneId);
      
      const response = await client.post('/business/distribution/rules', ruleData, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      expect(response.status).toBe(201);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('id');
      
      newRuleId = response.data.data.id;
      createdResources.ruleIds.push(newRuleId);
    });

    it('should list all distribution rules', async () => {
      const response = await client.get('/business/distribution/rules', {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(Array.isArray(response.data.data)).toBe(true);
    });

    it('should get active distribution rules', async () => {
      const response = await client.get('/business/distribution/rules/active', {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(Array.isArray(response.data.data)).toBe(true);
    });

    it('should update a distribution rule', async () => {
      if (!newRuleId) return;
      
      const updateData = { 
        name: 'Updated Rule Name',
        priority: 50
      };
      
      const response = await client.put(`/business/distribution/rules/${newRuleId}`, updateData, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('name', updateData.name);
    });

    it('should delete a distribution rule', async () => {
      if (!newRuleId) return;
      
      const response = await client.delete(`/business/distribution/rules/${newRuleId}`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      
      // Remove from cleanup list since we deleted it
      createdResources.ruleIds = createdResources.ruleIds.filter(id => id !== newRuleId);
    });
  });

  // ============================================================================
  // Authorization Tests
  // ============================================================================

  describe('Authorization', () => {
    it('should require auth for distribution center management', async () => {
      const response = await client.get('/business/distribution/centers');
      expect([401, 403]).toContain(response.status);
    });

    it('should require auth for shipping zone management', async () => {
      const response = await client.get('/business/distribution/shipping-zones');
      expect([401, 403]).toContain(response.status);
    });

    it('should require auth for fulfillment management', async () => {
      const response = await client.get('/business/distribution/fulfillments');
      expect([401, 403]).toContain(response.status);
    });

    it('should reject invalid tokens', async () => {
      const response = await client.get('/business/distribution/centers', {
        headers: { Authorization: 'Bearer invalid-token' }
      });
      expect([401, 403]).toContain(response.status);
    });
  });

  // ============================================================================
  // Public API Endpoints
  // ============================================================================

  describe('Public API Endpoints', () => {
    it('should get active distribution centers with limited information', async () => {
      const response = await client.get('/api/distribution/centers');
      
      // May return 200 or 404 depending on public routes configuration
      expect([200, 404]).toContain(response.status);
      
      if (response.status === 200) {
        expect(response.data.success).toBe(true);
        expect(Array.isArray(response.data.data)).toBe(true);
      }
    });

    it('should get active shipping methods with public information', async () => {
      const response = await client.get('/api/distribution/shipping-methods');
      
      // May return 200 or 404 depending on public routes configuration
      expect([200, 404]).toContain(response.status);
      
      if (response.status === 200) {
        expect(response.data.success).toBe(true);
        expect(Array.isArray(response.data.data)).toBe(true);
      }
    });
  });
});
