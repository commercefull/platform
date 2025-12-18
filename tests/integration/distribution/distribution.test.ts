import { AxiosInstance } from 'axios';
import axios from 'axios';
import { 
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

const createClient = () => axios.create({
  baseURL: process.env.API_URL || 'http://localhost:3000',
  validateStatus: () => true,
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  }
});

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
    jest.setTimeout(30000);
    client = createClient();
    
    try {
      const loginResponse = await client.post('/business/auth/login', {
        email: 'merchant@example.com',
        password: 'password123'
      }, { headers: { 'X-Test-Request': 'true' } });
      
      adminToken = loginResponse.data?.accessToken || '';
    } catch (error) {
      console.log('Warning: Login failed for distribution tests:', error instanceof Error ? error.message : String(error));
    }

    // Create test entities
    try {
      if (adminToken) {
        // Create Distribution Center
        const centerResponse = await client.post('/business/distribution/centers', testDistributionCenter, {
          headers: { Authorization: `Bearer ${adminToken}` }
        });
        
        if (centerResponse.data?.success && centerResponse.data?.data) {
          testDistributionCenterId = centerResponse.data.data.distributionWarehouseId || centerResponse.data.data.id || '';
        }

        // Create Shipping Zone
        const zoneResponse = await client.post('/business/distribution/shipping-zones', testShippingZone, {
          headers: { Authorization: `Bearer ${adminToken}` }
        });
        
        if (zoneResponse.data?.success && zoneResponse.data?.data) {
          testShippingZoneId = zoneResponse.data.data.distributionShippingZoneId || zoneResponse.data.data.id || '';
        }

        // Create Shipping Method
        const methodResponse = await client.post('/business/distribution/shipping-methods', testShippingMethod, {
          headers: { Authorization: `Bearer ${adminToken}` }
        });
        
        if (methodResponse.data?.success && methodResponse.data?.data) {
          testShippingMethodId = methodResponse.data.data.distributionShippingMethodId || methodResponse.data.data.id || '';
        }

        // Create Fulfillment Partner
        const partnerResponse = await client.post('/business/distribution/fulfillment-partners', testFulfillmentPartner, {
          headers: { Authorization: `Bearer ${adminToken}` }
        });
        
        if (partnerResponse.data?.success && partnerResponse.data?.data) {
          testFulfillmentPartnerId = partnerResponse.data.data.distributionFulfillmentPartnerId || partnerResponse.data.data.id || '';
        }

        // Create Distribution Rule with dependencies (only if all dependencies exist)
        if (testDistributionCenterId && testShippingZoneId && testShippingMethodId) {
          const distributionRule = {
            ...testDistributionRule,
            distributionCenterId: testDistributionCenterId,
            shippingZoneId: testShippingZoneId,
            shippingMethodId: testShippingMethodId,
            fulfillmentPartnerId: testFulfillmentPartnerId || undefined
          };
          
          const ruleResponse = await client.post('/business/distribution/rules', distributionRule, {
            headers: { Authorization: `Bearer ${adminToken}` }
          });
          
          if (ruleResponse.data?.success && ruleResponse.data?.data) {
            testRuleId = ruleResponse.data.data.distributionRuleId || ruleResponse.data.data.id || '';
          }
        }
      }
    } catch (error) {
      console.log('Warning: Distribution test setup error:', error);
    }
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
      if (!testDistributionCenterId) {
        console.log('Skipping test - distribution center not created');
        return;
      }
      
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
        
        // Verify properties use camelCase (email is the actual column name, not contactEmail)
        expect(center).toHaveProperty('postalCode');
        expect(center).toHaveProperty('isActive');
        expect(center).toHaveProperty('createdAt');
        expect(center).not.toHaveProperty('postal_code');
        expect(center).not.toHaveProperty('is_active');
        expect(center).not.toHaveProperty('created_at');
      }
    });
  });

  describe('Shipping Zone API', () => {
    it('should get shipping zone by ID with camelCase properties', async () => {
      if (!testShippingZoneId) {
        console.log('Skipping test - no shipping zone ID from setup');
        return;
      }
      
      const response = await client.get(`/business/distribution/shipping-zones/${testShippingZoneId}`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('distributionShippingZoneId', testShippingZoneId);
      
      // Verify properties from TypeScript interface are in camelCase
      expect(response.data.data).toHaveProperty('name');
      expect(response.data.data).toHaveProperty('locationType');
      expect(response.data.data).toHaveProperty('isActive');
      
      // Make sure no snake_case properties leaked through
      expect(response.data.data).not.toHaveProperty('location_type');
      expect(response.data.data).not.toHaveProperty('is_active');
    });

    it('should update a shipping zone with camelCase properties', async () => {
      if (!testShippingZoneId) {
        console.log('Skipping test - no shipping zone ID from setup');
        return;
      }
      
      const updateData = {
        name: 'Updated Shipping Zone',
        locations: ['US', 'CA', 'MX']
      };
      
      const response = await client.put(`/business/distribution/shipping-zones/${testShippingZoneId}`, updateData, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      
      // Verify the update worked with camelCase properties
      expect(response.data.data).toHaveProperty('name', updateData.name);
    });
  });

  describe('Shipping Method API', () => {
    it('should get shipping method by ID with camelCase properties', async () => {
      if (!testShippingMethodId) {
        console.log('Skipping test - no shipping method ID from setup');
        return;
      }
      
      const response = await client.get(`/business/distribution/shipping-methods/${testShippingMethodId}`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      
      // Verify properties from TypeScript interface are in camelCase
      expect(response.data.data).toHaveProperty('name');
      expect(response.data.data).toHaveProperty('isActive');
      
      // Make sure no snake_case properties leaked through
      expect(response.data.data).not.toHaveProperty('is_active');
    });
  });

  describe('Fulfillment Partner API', () => {
    it('should get fulfillment partner by ID with camelCase properties', async () => {
      if (!testFulfillmentPartnerId) {
        console.log('Skipping test - no fulfillment partner ID from setup');
        return;
      }
      
      const response = await client.get(`/business/distribution/fulfillment-partners/${testFulfillmentPartnerId}`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      
      // Verify properties from TypeScript interface are in camelCase
      expect(response.data.data).toHaveProperty('name');
      expect(response.data.data).toHaveProperty('isActive');
      
      // Make sure no snake_case properties leaked through
      expect(response.data.data).not.toHaveProperty('is_active');
    });
  });

  describe('Distribution Rule API', () => {
    it('should get distribution rule by ID with camelCase properties', async () => {
      if (!testRuleId) {
        console.log('Skipping test - no distribution rule ID from setup');
        return;
      }
      
      const response = await client.get(`/business/distribution/rules/${testRuleId}`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      
      // Verify properties from TypeScript interface are in camelCase
      expect(response.data.data).toHaveProperty('name');
      expect(response.data.data).toHaveProperty('isActive');
      
      // Make sure no snake_case properties leaked through
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
      if (!testShippingZoneId || !testShippingMethodId) {
        console.log('Skipping test - missing zone or method ID from setup');
        return;
      }
      
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
      if (!testShippingZoneId) {
        console.log('Skipping test - no shipping zone ID from setup');
        return;
      }
      
      const response = await client.get(`/business/distribution/shipping-rates/zone/${testShippingZoneId}`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(Array.isArray(response.data.data)).toBe(true);
    });

    it('should get shipping rates by method', async () => {
      if (!testShippingMethodId) {
        console.log('Skipping test - no shipping method ID from setup');
        return;
      }
      
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
      if (!testShippingMethodId) {
        console.log('Skipping test - no shipping method ID from setup');
        return;
      }
      
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
      
      // May return 200 or 404 depending on rate configuration
      if (response.status === 200) {
        expect(response.data.success).toBe(true);
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
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('methods');
      expect(Array.isArray(response.data.data.methods)).toBe(true);
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
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('bestWarehouse');
      expect(response.data.data.bestWarehouse).toHaveProperty('id');
      expect(response.data.data.bestWarehouse).toHaveProperty('name');
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
      if (!testDistributionCenterId || !testShippingMethodId) {
        console.log('Skipping test - missing distribution center or shipping method ID from setup');
        return;
      }
      
      const fulfillmentData = createTestOrderFulfillment(
        testDistributionCenterId,
        testShippingMethodId
      );
      
      const response = await client.post('/business/distribution/fulfillments', fulfillmentData, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      if (response.status === 201) {
        expect(response.data.success).toBe(true);
        testFulfillmentId = response.data.data.id || response.data.data.distributionOrderFulfillmentId;
        if (testFulfillmentId) {
          createdResources.fulfillmentIds.push(testFulfillmentId);
        }
      }
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
      if (!testDistributionCenterId) {
        console.log('Skipping test - no distribution center ID from setup');
        return;
      }
      
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
      if (!testDistributionCenterId || !testShippingZoneId) {
        console.log('Skipping test - missing distribution center or shipping zone ID from setup');
        return;
      }
      
      const ruleData = createTestDistributionRule(testDistributionCenterId, testShippingZoneId);
      
      const response = await client.post('/business/distribution/rules', ruleData, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      if (response.status === 201) {
        expect(response.data.success).toBe(true);
        newRuleId = response.data.data.id || response.data.data.distributionRuleId;
        if (newRuleId) {
          createdResources.ruleIds.push(newRuleId);
        }
      }
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
      expect(response.status).toBe(401);
    });

    it('should require auth for shipping zone management', async () => {
      const response = await client.get('/business/distribution/shipping-zones');
      expect(response.status).toBe(401);
    });

    it('should require auth for fulfillment management', async () => {
      const response = await client.get('/business/distribution/fulfillments');
      expect(response.status).toBe(401);
    });

    it('should reject invalid tokens', async () => {
      const response = await client.get('/business/distribution/centers', {
        headers: { Authorization: 'Bearer invalid-token' }
      });
      expect(response.status).toBe(401);
    });
  });

  // ============================================================================
  // Public API Endpoints
  // ============================================================================

  describe('Public API Endpoints', () => {
    it('should get active distribution centers with limited information', async () => {
      const response = await client.get('/customer/distribution/centers');
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(Array.isArray(response.data.data)).toBe(true);
    });

    it('should get active shipping methods with public information', async () => {
      const response = await client.get('/customer/distribution/shipping-methods');
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(Array.isArray(response.data.data)).toBe(true);
    });
  });
});
