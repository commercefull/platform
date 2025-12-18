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
  rateType: 'flat',
  isActive: true
};

export function createTestShippingRate(zoneId: string, methodId: string) {
  return {
    distributionShippingZoneId: zoneId,
    distributionShippingMethodId: methodId,
    baseRate: '9.99',
    perItemRate: '1.50',
    freeThreshold: '100',
    rateType: 'flat',
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

export function createTestOrderFulfillment(warehouseId?: string, shippingMethodId?: string) {
  return {
    orderId: "12345678-1234-1234-1234-123456789012",
    orderNumber: `ORD-${Date.now()}`,
    distributionWarehouseId: warehouseId,
    distributionShippingMethodId: shippingMethodId,
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
      'Content-Type': 'application/json',
      'X-Test-Request': 'true'
    } // Don't throw HTTP errors
  });

  // Get admin token
  let adminToken = '';
  try {
    const loginResponse = await client.post('/business/auth/login', adminCredentials, { headers: { 'X-Test-Request': 'true' } });
    adminToken = loginResponse.data?.accessToken || '';
  } catch (error: any) {
    console.log('Warning: Login request failed:', error.message);
  }

  if (!adminToken) {
    console.log('Warning: Failed to get admin token for distribution tests');
    return {
      client,
      adminToken: '',
      testDistributionCenterId: '',
      testShippingZoneId: '',
      testShippingMethodId: '',
      testFulfillmentPartnerId: '',
      testRuleId: ''
    };
  }

  let testDistributionCenterId = '';
  let testShippingZoneId = '';
  let testShippingMethodId = '';
  let testFulfillmentPartnerId = '';
  let testRuleId = '';

  try {
    // Create test data
    // 1. Create Distribution Center
    const centerResponse = await client.post('/business/distribution/centers', testDistributionCenter, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    // DB returns distributionWarehouseId, not id
    if (centerResponse.data?.success && centerResponse.data?.data) {
      testDistributionCenterId = centerResponse.data.data.distributionWarehouseId || centerResponse.data.data.id;
    } else {
      console.log('Warning: Failed to create test distribution center:', centerResponse.data);
    }

    // 2. Create Shipping Zone
    const zoneResponse = await client.post('/business/distribution/shipping-zones', testShippingZone, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    // DB returns distributionShippingZoneId, not id
    if (zoneResponse.data?.success && zoneResponse.data?.data) {
      testShippingZoneId = zoneResponse.data.data.distributionShippingZoneId || zoneResponse.data.data.id;
    } else {
      console.log('Warning: Failed to create test shipping zone:', zoneResponse.data);
    }

    // 3. Create Shipping Method
    const methodResponse = await client.post('/business/distribution/shipping-methods', testShippingMethod, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    // DB returns distributionShippingMethodId, not id
    if (methodResponse.data?.success && methodResponse.data?.data) {
      testShippingMethodId = methodResponse.data.data.distributionShippingMethodId || methodResponse.data.data.id;
    } else {
      console.log('Warning: Failed to create test shipping method:', methodResponse.data);
    }

    // 4. Create Fulfillment Partner
    const partnerResponse = await client.post('/business/distribution/fulfillment-partners', testFulfillmentPartner, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    // DB returns distributionFulfillmentPartnerId, not id
    if (partnerResponse.data?.success && partnerResponse.data?.data) {
      testFulfillmentPartnerId = partnerResponse.data.data.distributionFulfillmentPartnerId || partnerResponse.data.data.id;
    } else {
      console.log('Warning: Failed to create test fulfillment partner:', partnerResponse.data);
    }

    // 5. Create Distribution Rule with dependencies (only if all dependencies exist)
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
      
      // DB returns distributionRuleId, not id
      if (ruleResponse.data?.success && ruleResponse.data?.data) {
        testRuleId = ruleResponse.data.data.distributionRuleId || ruleResponse.data.data.id;
      } else {
        console.log('Warning: Failed to create test distribution rule:', ruleResponse.data);
      }
    }
  } catch (error) {
    console.log('Warning: Distribution test setup error:', error);
  }

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
