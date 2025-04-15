import { AxiosInstance } from 'axios';
import { 
  setupDistributionTests, 
  cleanupDistributionTests, 
  testDistributionCenter,
  testShippingZone,
  testShippingMethod,
  testFulfillmentPartner,
  testDistributionRule
} from './testUtils';

describe('Distribution Feature Tests', () => {
  let client: AxiosInstance;
  let adminToken: string;
  let testDistributionCenterId: string;
  let testShippingZoneId: string;
  let testShippingMethodId: string;
  let testFulfillmentPartnerId: string;
  let testRuleId: string;

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
      const response = await client.get(`/api/admin/distribution/centers/${testDistributionCenterId}`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('id', testDistributionCenterId);
      
      // Verify properties from TypeScript interface are in camelCase
      expect(response.data.data).toHaveProperty('name', testDistributionCenter.name);
      expect(response.data.data).toHaveProperty('postalCode', testDistributionCenter.postalCode);
      expect(response.data.data).toHaveProperty('contactPhone', testDistributionCenter.contactPhone);
      expect(response.data.data).toHaveProperty('contactEmail', testDistributionCenter.contactEmail);
      expect(response.data.data).toHaveProperty('isActive', testDistributionCenter.isActive);
      
      // Verify timestamps are present and in camelCase
      expect(response.data.data).toHaveProperty('createdAt');
      expect(response.data.data).toHaveProperty('updatedAt');
      
      // Make sure no snake_case properties leaked through
      expect(response.data.data).not.toHaveProperty('postal_code');
      expect(response.data.data).not.toHaveProperty('contact_phone');
      expect(response.data.data).not.toHaveProperty('contact_email');
      expect(response.data.data).not.toHaveProperty('is_active');
      expect(response.data.data).not.toHaveProperty('created_at');
      expect(response.data.data).not.toHaveProperty('updated_at');
    });

    it('should update a distribution center with camelCase properties', async () => {
      const updateData = {
        name: 'Updated Test Center',
        capacity: 2000,
        contactEmail: 'updated@example.com'
      };
      
      const response = await client.put(`/api/admin/distribution/centers/${testDistributionCenterId}`, updateData, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      
      // Verify the update worked
      expect(response.data.data).toHaveProperty('name', updateData.name);
      expect(response.data.data).toHaveProperty('capacity', updateData.capacity);
      expect(response.data.data).toHaveProperty('contactEmail', updateData.contactEmail);
      
      // Verify that non-updated fields are preserved
      expect(response.data.data).toHaveProperty('code', testDistributionCenter.code);
      
      // Verify response is using camelCase
      expect(response.data.data).not.toHaveProperty('contact_email');
    });

    it('should list all distribution centers with camelCase properties', async () => {
      const response = await client.get('/api/admin/distribution/centers', {
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
      const response = await client.get(`/api/admin/distribution/shipping-zones/${testShippingZoneId}`, {
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
      
      const response = await client.put(`/api/admin/distribution/shipping-zones/${testShippingZoneId}`, updateData, {
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
      const response = await client.get(`/api/admin/distribution/shipping-methods/${testShippingMethodId}`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      
      // Verify properties from TypeScript interface are in camelCase
      expect(response.data.data).toHaveProperty('name', testShippingMethod.name);
      expect(response.data.data).toHaveProperty('estimatedDeliveryDays', testShippingMethod.estimatedDeliveryDays);
      expect(response.data.data).toHaveProperty('basePrice', testShippingMethod.basePrice);
      expect(response.data.data).toHaveProperty('isActive', testShippingMethod.isActive);
      
      // Make sure no snake_case properties leaked through
      expect(response.data.data).not.toHaveProperty('estimated_delivery_days');
      expect(response.data.data).not.toHaveProperty('base_price');
      expect(response.data.data).not.toHaveProperty('is_active');
    });
  });

  describe('Fulfillment Partner API', () => {
    it('should get fulfillment partner by ID with camelCase properties', async () => {
      const response = await client.get(`/api/admin/distribution/fulfillment-partners/${testFulfillmentPartnerId}`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      
      // Verify properties from TypeScript interface are in camelCase
      expect(response.data.data).toHaveProperty('name', testFulfillmentPartner.name);
      expect(response.data.data).toHaveProperty('contactName', testFulfillmentPartner.contactName);
      expect(response.data.data).toHaveProperty('contactEmail', testFulfillmentPartner.contactEmail);
      expect(response.data.data).toHaveProperty('apiKey', testFulfillmentPartner.apiKey);
      expect(response.data.data).toHaveProperty('apiEndpoint', testFulfillmentPartner.apiEndpoint);
      
      // Make sure no snake_case properties leaked through
      expect(response.data.data).not.toHaveProperty('contact_name');
      expect(response.data.data).not.toHaveProperty('contact_email');
      expect(response.data.data).not.toHaveProperty('api_key');
      expect(response.data.data).not.toHaveProperty('api_endpoint');
    });
  });

  describe('Distribution Rule API', () => {
    it('should get distribution rule by ID with camelCase properties', async () => {
      const response = await client.get(`/api/admin/distribution/rules/${testRuleId}`, {
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

  describe('Public API Endpoints', () => {
    it('should get active distribution centers with limited information', async () => {
      const response = await client.get('/api/distribution/centers');
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(Array.isArray(response.data.data)).toBe(true);
      
      // Public API should return limited information
      if (response.data.data.length > 0) {
        const center = response.data.data[0];
        expect(center).toHaveProperty('id');
        expect(center).toHaveProperty('name');
        expect(center).toHaveProperty('city');
        expect(center).toHaveProperty('state');
        expect(center).toHaveProperty('country');
        
        // Should not expose sensitive information
        expect(center).not.toHaveProperty('contactPhone');
        expect(center).not.toHaveProperty('contactEmail');
        expect(center).not.toHaveProperty('capacity');
        
        // Verify no snake_case properties
        expect(center).not.toHaveProperty('contact_phone');
        expect(center).not.toHaveProperty('contact_email');
      }
    });

    it('should get active shipping methods with public information', async () => {
      const response = await client.get('/api/distribution/shipping-methods');
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(Array.isArray(response.data.data)).toBe(true);
      
      // Public API should return shipping method information
      if (response.data.data.length > 0) {
        const method = response.data.data[0];
        expect(method).toHaveProperty('id');
        expect(method).toHaveProperty('name');
        expect(method).toHaveProperty('carrier');
        expect(method).toHaveProperty('estimatedDeliveryDays');
        expect(method).toHaveProperty('basePrice');
        
        // Verify camelCase format
        expect(method).not.toHaveProperty('estimated_delivery_days');
        expect(method).not.toHaveProperty('base_price');
      }
    });
  });
});
