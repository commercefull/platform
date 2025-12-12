import axios, { AxiosInstance } from 'axios';

// Test data generators
export function createTestDistributionCenter() {
  return {
    name: `Test Distribution Center ${Date.now()}`,
    code: `DC-TEST-${Math.floor(Math.random() * 100000)}`,
    addressLine1: '123 Test Street',
    city: 'Test City',
    state: 'CA',
    postalCode: '90210',
    country: 'US',
    phone: '555-123-4567',
    email: 'test@example.com',
    timezone: 'America/Los_Angeles',
    cutoffTime: '14:00',
    processingTime: 24,
    isActive: true,
    isDefault: false,
    isFulfillmentCenter: true,
    latitude: 34.0522,
    longitude: -118.2437
  };
}

// Legacy test data for backward compatibility
export const testDistributionCenter = {
  name: 'Test Distribution Center',
  code: `DC-TEST-${Math.floor(Math.random() * 10000)}`,
  addressLine1: '123 Test Street',
  city: 'Test City',
  state: 'Test State',
  postalCode: '12345',
  country: 'US',
  phone: '555-123-4567',
  email: 'test@example.com',
  isActive: true,
  isFulfillmentCenter: true
};

export const testShippingZone = {
  name: 'Test Shipping Zone',
  locationType: 'country',
  locations: ['US', 'CA'],
  excludedLocations: [],
  isActive: true,
  priority: 1
};

export function createTestShippingZone() {
  return {
    name: `Test Shipping Zone ${Date.now()}`,
    locationType: 'country',
    locations: ['US', 'CA'],
    excludedLocations: [],
    isActive: true,
    priority: Math.floor(Math.random() * 100)
  };
}

export const testShippingMethod = {
  name: 'Test Shipping Method',
  code: `SM-TEST-${Math.floor(Math.random() * 10000)}`,
  description: 'Test shipping method for integration tests',
  isActive: true,
  isDefault: false
};

export function createTestShippingMethod() {
  return {
    name: `Test Shipping Method ${Date.now()}`,
    code: `SM-TEST-${Math.floor(Math.random() * 100000)}`,
    description: 'Test shipping method for integration tests',
    isActive: true,
    isDefault: false
  };
}

export const testShippingCarrier = {
  name: 'Test Carrier',
  code: `TC-TEST-${Math.floor(Math.random() * 10000)}`,
  trackingUrlTemplate: 'https://track.example.com/{trackingNumber}',
  isActive: true
};

export function createTestShippingCarrier() {
  return {
    name: `Test Carrier ${Date.now()}`,
    code: `TC-TEST-${Math.floor(Math.random() * 100000)}`,
    trackingUrlTemplate: 'https://track.example.com/{trackingNumber}',
    isActive: true
  };
}

export const testShippingRate = {
  baseRate: 9.99,
  perItemRate: 1.50,
  freeShippingThreshold: 100,
  isActive: true
};

export function createTestShippingRate(zoneId: string, methodId: string) {
  return {
    distributionShippingZoneId: zoneId,
    distributionShippingMethodId: methodId,
    baseRate: 9.99,
    perItemRate: 1.50,
    freeShippingThreshold: 100,
    isActive: true
  };
}

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

export function createTestFulfillmentPartner() {
  return {
    name: `Test Fulfillment Partner ${Date.now()}`,
    code: `FP-TEST-${Math.floor(Math.random() * 100000)}`,
    apiKey: 'test-api-key',
    apiEndpoint: 'https://api.testpartner.com',
    isActive: true,
    contactName: 'Test Contact',
    contactEmail: 'partner@example.com',
    contactPhone: '555-987-6543'
  };
}

export const testDistributionRule = {
  name: 'Test Distribution Rule',
  priority: 10,
  isDefault: false,
  isActive: true
};

export function createTestDistributionRule(warehouseId?: string, zoneId?: string) {
  return {
    name: `Test Distribution Rule ${Date.now()}`,
    description: 'Test rule for integration tests',
    distributionWarehouseId: warehouseId || null,
    distributionShippingZoneId: zoneId || null,
    applicableCountries: ['US', 'CA'],
    applicableRegions: [],
    applicablePostalCodes: [],
    priority: Math.floor(Math.random() * 100),
    isDefault: false,
    isActive: true
  };
}

export function createTestOrderFulfillment(orderId: string, warehouseId?: string, shippingMethodId?: string) {
  return {
    orderId,
    orderNumber: `ORD-${Date.now()}`,
    warehouseId,
    shippingMethodId,
    shipToAddress: {
      line1: '456 Customer Street',
      line2: 'Apt 101',
      city: 'Los Angeles',
      state: 'CA',
      postalCode: '90001',
      country: 'US'
    },
    customerNotes: 'Please leave at door'
  };
}

// Test credentials
const adminCredentials = {
  email: 'merchant@example.com', // Replace with valid admin credentials
  password: 'password123'     // Replace with valid admin password
};

/**
 * Setup function for distribution integration tests
 */
export async function setupDistributionTests() {
  // Create client
  const client = axios.create({
    baseURL: process.env.API_URL || 'http://localhost:3000',
    validateStatus: () => true,
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    } // Don't throw HTTP errors
  });

  // Get admin token
  const loginResponse = await client.post('/business/auth/login', adminCredentials);
  const adminToken = loginResponse.data.accessToken;

  if (!adminToken) {
    throw new Error('Failed to get admin token');
  }

  // Create test data
  // 1. Create Distribution Center
  const centerResponse = await client.post('/business/distribution/centers', testDistributionCenter, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  
  if (!centerResponse.data.success) {
    throw new Error('Failed to create test distribution center');
  }
  
  const testDistributionCenterId = centerResponse.data.data.id;

  // 2. Create Shipping Zone
  const zoneResponse = await client.post('/business/distribution/shipping-zones', testShippingZone, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  
  if (!zoneResponse.data.success) {
    throw new Error('Failed to create test shipping zone');
  }
  
  const testShippingZoneId = zoneResponse.data.data.id;

  // 3. Create Shipping Method
  const methodResponse = await client.post('/business/distribution/shipping-methods', testShippingMethod, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  
  if (!methodResponse.data.success) {
    throw new Error('Failed to create test shipping method');
  }
  
  const testShippingMethodId = methodResponse.data.data.id;

  // 4. Create Fulfillment Partner
  const partnerResponse = await client.post('/business/distribution/fulfillment-partners', testFulfillmentPartner, {
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
  
  const ruleResponse = await client.post('/business/distribution/rules', distributionRule, {
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
    await client.delete(`/business/distribution/rules/${testRuleId}`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
  }

  // 2. Delete Fulfillment Partner
  if (testFulfillmentPartnerId) {
    await client.delete(`/business/distribution/fulfillment-partners/${testFulfillmentPartnerId}`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
  }

  // 3. Delete Shipping Method
  if (testShippingMethodId) {
    await client.delete(`/business/distribution/shipping-methods/${testShippingMethodId}`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
  }

  // 4. Delete Shipping Zone
  if (testShippingZoneId) {
    await client.delete(`/business/distribution/shipping-zones/${testShippingZoneId}`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
  }

  // 5. Delete Distribution Center
  if (testDistributionCenterId) {
    await client.delete(`/business/distribution/centers/${testDistributionCenterId}`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
  }
}
