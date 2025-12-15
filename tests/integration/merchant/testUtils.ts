import { AxiosInstance } from 'axios';
import { createTestClient, loginTestAdmin } from '../testUtils';
import { Merchant, MerchantAddress, MerchantPaymentInfo } from '../../../features/merchant/repos/merchantRepo';

// Common test data for merchant
export const testMerchant: Partial<Merchant> & { password?: string } = {
  name: 'Test Merchant',
  email: `test-merchant-${Math.floor(Math.random() * 10000)}@example.com`,
  phone: '123-456-7890',
  website: 'https://testmerchant.com',
  logo: 'https://example.com/logo.png',
  description: 'Test merchant for integration tests',
  status: 'active',
  password: 'password123'
};

// Common test data for merchant address
export const testMerchantAddress: Partial<MerchantAddress> = {
  addressLine1: '123 Test Street',
  addressLine2: 'Suite 101',
  city: 'Test City',
  state: 'TS',
  postalCode: '12345',
  country: 'US',
  isDefault: true
};

// Common test data for merchant payment info
export const testMerchantPaymentInfo: Partial<MerchantPaymentInfo> = {
  accountHolderName: 'Test Merchant Inc',
  bankName: 'Test Bank',
  accountNumber: '123456789',
  routingNumber: '987654321',
  paymentType: 'bank',
  currency: 'USD',
  isVerified: true
};

// Helper function to create a test merchant
export const createTestMerchant = async (
  client: AxiosInstance, 
  adminToken: string
): Promise<string> => {
  const response = await client.post('/business/merchants', testMerchant, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  
  expect(response.status).toBe(201);
  expect(response.data.success).toBe(true);
  
  return response.data.data.merchantId;
};

// Helper function to create a test merchant address
export const createTestMerchantAddress = async (
  client: AxiosInstance, 
  adminToken: string, 
  merchantId: string
): Promise<string> => {
  const addressData = {
    ...testMerchantAddress,
    merchantId
  };
  
  const response = await client.post(`/business/merchants/${merchantId}/addresses`, addressData, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  
  expect(response.status).toBe(201);
  expect(response.data.success).toBe(true);
  
  return response.data.data.merchantAddressId;
};

// Helper function to create test merchant payment info
export const createTestMerchantPaymentInfo = async (
  client: AxiosInstance, 
  adminToken: string, 
  merchantId: string
): Promise<string> => {
  const paymentInfoData = {
    ...testMerchantPaymentInfo,
    merchantId
  };
  
  const response = await client.post(`/business/merchants/${merchantId}/payment-info`, paymentInfoData, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  
  expect(response.status).toBe(201);
  expect(response.data.success).toBe(true);
  
  return response.data.data.merchantPaymentInfoId;
};

// Setup function to initialize client and test data for merchant tests
export const setupMerchantTests = async () => {
  // Create test client
  const client = createTestClient();
  
  // Login as admin/merchant
  const adminToken = await loginTestAdmin(client);
  
  // Create test merchant
  const testMerchantId = await createTestMerchant(client, adminToken);
  
  // Create test merchant address
  const testAddressId = await createTestMerchantAddress(client, adminToken, testMerchantId);
  
  // Create test merchant payment info
  const testPaymentInfoId = await createTestMerchantPaymentInfo(client, adminToken, testMerchantId);
  
  return {
    client,
    adminToken,
    testMerchantId,
    testAddressId,
    testPaymentInfoId
  };
};

// Cleanup function to remove test resources
export const cleanupMerchantTests = async (
  client: AxiosInstance,
  adminToken: string,
  testMerchantId: string
) => {
  try {
    // Delete test merchant (cascades to addresses and payment info)
    await client.delete(`/business/merchants/${testMerchantId}`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
  } catch (error) {
    console.error('Error during merchant test cleanup:', error);
  }
};
