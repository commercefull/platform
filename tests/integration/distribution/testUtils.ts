import axios, { AxiosInstance } from 'axios';

// Test data
export const testDistributionCenter = {
  name: 'Test Distribution Center',
  code: `DC-TEST-${Math.floor(Math.random() * 10000)}`,
  address: '123 Test Street',
  city: 'Test City',
  state: 'Test State',
  postalCode: '12345',
  country: 'US',
  contactPhone: '555-123-4567',
  contactEmail: 'test@example.com',
  isActive: true,
  capacity: 1000
};

export const testShippingZone = {
  name: 'Test Shipping Zone',
  countries: ['US', 'CA'],
  regions: ['NY', 'CA', 'ON'],
  postalCodes: ['10001', '90210'],
  isActive: true
};

export const testShippingMethod = {
  name: 'Test Shipping Method',
  code: `SM-TEST-${Math.floor(Math.random() * 10000)}`,
  carrier: 'Test Carrier',
  estimatedDeliveryDays: 3,
  isActive: true,
  basePrice: 9.99
};

export const testFulfillmentPartner = {
  name: 'Test Fulfillment Partner',
  code: `FP-TEST-${Math.floor(Math.random() * 10000)}`,
  apiKey: 'test-api-key',
  apiEndpoint: 'https://api.testpartner.com',
  isActive: true,
  contactName: 'Test Contact',
  contactEmail: 'partner@example.com',
  contactPhone: '555-987-6543'
};

export const testDistributionRule = {
  name: 'Test Distribution Rule',
  priority: 10,
  isDefault: false,
  isActive: true
};

// Test credentials
const adminCredentials = {
  email: 'admin@example.com', // Replace with valid admin credentials
  password: 'password123'     // Replace with valid admin password
};

/**
 * Setup function for distribution integration tests
 */
export async function setupDistributionTests() {
  // Create client
  const client = axios.create({
    baseURL: process.env.API_URL || 'http://localhost:3000',
    validateStatus: () => true // Don't throw HTTP errors
  });

  // Get admin token
  const loginResponse = await client.post('/api/auth/login', adminCredentials);
  const adminToken = loginResponse.data.token;

  if (!adminToken) {
    throw new Error('Failed to get admin token');
  }

  // Create test data
  // 1. Create Distribution Center
  const centerResponse = await client.post('/api/admin/distribution/centers', testDistributionCenter, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  
  if (!centerResponse.data.success) {
    throw new Error('Failed to create test distribution center');
  }
  
  const testDistributionCenterId = centerResponse.data.data.id;

  // 2. Create Shipping Zone
  const zoneResponse = await client.post('/api/admin/distribution/shipping-zones', testShippingZone, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  
  if (!zoneResponse.data.success) {
    throw new Error('Failed to create test shipping zone');
  }
  
  const testShippingZoneId = zoneResponse.data.data.id;

  // 3. Create Shipping Method
  const methodResponse = await client.post('/api/admin/distribution/shipping-methods', testShippingMethod, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  
  if (!methodResponse.data.success) {
    throw new Error('Failed to create test shipping method');
  }
  
  const testShippingMethodId = methodResponse.data.data.id;

  // 4. Create Fulfillment Partner
  const partnerResponse = await client.post('/api/admin/distribution/fulfillment-partners', testFulfillmentPartner, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  
  if (!partnerResponse.data.success) {
    throw new Error('Failed to create test fulfillment partner');
  }
  
  const testFulfillmentPartnerId = partnerResponse.data.data.id;

  // 5. Create Distribution Rule with dependencies
  const distributionRule = {
    ...testDistributionRule,
    distributionCenterId: testDistributionCenterId,
    shippingZoneId: testShippingZoneId,
    shippingMethodId: testShippingMethodId,
    fulfillmentPartnerId: testFulfillmentPartnerId
  };
  
  const ruleResponse = await client.post('/api/admin/distribution/rules', distributionRule, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  
  if (!ruleResponse.data.success) {
    throw new Error('Failed to create test distribution rule');
  }
  
  const testRuleId = ruleResponse.data.data.id;

  // Return all test data and helper objects
  return {
    client,
    adminToken,
    testDistributionCenterId,
    testShippingZoneId,
    testShippingMethodId,
    testFulfillmentPartnerId,
    testRuleId
  };
}

/**
 * Cleanup function for distribution integration tests
 */
export async function cleanupDistributionTests(
  client: AxiosInstance, 
  adminToken: string, 
  { 
    testRuleId,
    testFulfillmentPartnerId,
    testShippingMethodId,
    testShippingZoneId,
    testDistributionCenterId
  }: {
    testRuleId: string,
    testFulfillmentPartnerId: string,
    testShippingMethodId: string,
    testShippingZoneId: string,
    testDistributionCenterId: string
  }
) {
  // Delete in reverse order of dependencies
  // 1. Delete Rule
  if (testRuleId) {
    await client.delete(`/api/admin/distribution/rules/${testRuleId}`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
  }

  // 2. Delete Fulfillment Partner
  if (testFulfillmentPartnerId) {
    await client.delete(`/api/admin/distribution/fulfillment-partners/${testFulfillmentPartnerId}`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
  }

  // 3. Delete Shipping Method
  if (testShippingMethodId) {
    await client.delete(`/api/admin/distribution/shipping-methods/${testShippingMethodId}`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
  }

  // 4. Delete Shipping Zone
  if (testShippingZoneId) {
    await client.delete(`/api/admin/distribution/shipping-zones/${testShippingZoneId}`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
  }

  // 5. Delete Distribution Center
  if (testDistributionCenterId) {
    await client.delete(`/api/admin/distribution/centers/${testDistributionCenterId}`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
  }
}
