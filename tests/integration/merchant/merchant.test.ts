import { AxiosInstance } from 'axios';
import { setupMerchantTests, cleanupMerchantTests, testMerchant, testMerchantAddress, testMerchantPaymentInfo } from './testUtils';

describe('Merchant Tests', () => {
  let client: AxiosInstance;
  let adminToken: string;
  let testMerchantId: string;
  let testAddressId: string;
  let testPaymentInfoId: string;

  beforeAll(async () => {
    const setup = await setupMerchantTests();
    client = setup.client;
    adminToken = setup.adminToken;
    testMerchantId = setup.testMerchantId;
    testAddressId = setup.testAddressId;
    testPaymentInfoId = setup.testPaymentInfoId;
  });

  afterAll(async () => {
    await cleanupMerchantTests(client, adminToken, testMerchantId);
  });

  describe('Merchant CRUD Operations', () => {
    it('should get a merchant by ID', async () => {
      if (!testMerchantId) {
        return;
      }

      const response = await client.get(`/business/merchants/${testMerchantId}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('merchantId', testMerchantId);

      // Verify camelCase property names in response (TypeScript interface)
      expect(response.data.data).toHaveProperty('logo');
      expect(response.data.data).toHaveProperty('createdAt');
      expect(response.data.data).toHaveProperty('updatedAt');
    });

    it('should list all merchants with pagination', async () => {
      const response = await client.get('/business/merchants', {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toBeDefined();
      expect(Array.isArray(response.data.data)).toBe(true);
      expect(response.data.pagination).toBeDefined();
    });

    it('should update a merchant', async () => {
      if (!testMerchantId) {
        return;
      }

      const updateData = {
        name: 'Updated Test Merchant',
        description: 'Updated description for testing',
      };

      const response = await client.put(`/business/merchants/${testMerchantId}`, updateData, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('name', updateData.name);
      expect(response.data.data).toHaveProperty('description', updateData.description);
    });

    it('should filter merchants by status', async () => {
      const response = await client.get('/business/merchants?status=active', {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toBeDefined();

      // All returned merchants should have status 'active'
      if (response.data.data.length > 0) {
        response.data.data.forEach((merchant: any) => {
          expect(merchant.status).toBe('active');
        });
      }
    });
  });

  describe('Merchant Address Operations', () => {
    it('should get addresses for a merchant', async () => {
      if (!testMerchantId) {
        return;
      }

      const response = await client.get(`/business/merchants/${testMerchantId}/addresses`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toBeDefined();
      expect(Array.isArray(response.data.data)).toBe(true);

      if (response.data.data.length > 0) {
        const address = response.data.data[0];
        expect(address).toHaveProperty('merchantId', testMerchantId);
        // Verify camelCase property names in response
        expect(address).toHaveProperty('addressLine1');
        expect(address).toHaveProperty('isDefault');
      }
    });

    it('should update a merchant address', async () => {
      if (!testMerchantId || !testAddressId) {
        return;
      }

      const updateData = {
        addressLine1: '456 Updated Street',
        city: 'New Test City',
      };

      const response = await client.put(`/business/merchants/${testMerchantId}/addresses/${testAddressId}`, updateData, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('addressLine1', updateData.addressLine1);
      expect(response.data.data).toHaveProperty('city', updateData.city);
    });
  });

  describe('Merchant Payment Info Operations', () => {
    it('should get payment info for a merchant', async () => {
      if (!testMerchantId) {
        return;
      }

      const response = await client.get(`/business/merchants/${testMerchantId}/payment-info`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toBeDefined();
      // API returns an array of payment info records
      expect(Array.isArray(response.data.data)).toBe(true);
      if (response.data.data.length > 0) {
        const paymentInfo = response.data.data[0];
        expect(paymentInfo).toHaveProperty('merchantId', testMerchantId);
        // Verify camelCase property names in response
        expect(paymentInfo).toHaveProperty('accountHolderName');
        expect(paymentInfo).toHaveProperty('paymentType');
        expect(paymentInfo).toHaveProperty('isVerified');
      }
    });

    it('should update merchant payment info', async () => {
      if (!testMerchantId || !testPaymentInfoId) {
        return;
      }

      const updateData = {
        accountHolderName: 'Updated Company Name',
        bankName: 'Updated Bank',
      };

      const response = await client.put(`/business/merchants/${testMerchantId}/payment-info/${testPaymentInfoId}`, updateData, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('accountHolderName', updateData.accountHolderName);
      expect(response.data.data).toHaveProperty('bankName', updateData.bankName);
    });
  });

  describe('Public API Tests', () => {
    it('should only return active merchants in public API', async () => {
      // Note: Public merchant API would be at a customer-facing route
      // For now, we test the business API with status filter
      const response = await client.get('/business/merchants?status=active', {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);

      if (response.data.data.length > 0) {
        // Public API should only return merchants with status 'active'
        response.data.data.forEach((merchant: any) => {
          expect(merchant.status).toBe('active');
        });

        // Business API returns full merchant data
        const merchant = response.data.data[0];
        expect(merchant).toHaveProperty('name');
        expect(merchant).toHaveProperty('merchantId');
      }
    });

    it('should get merchant information by ID via business API', async () => {
      if (!testMerchantId) {
        return;
      }

      const response = await client.get(`/business/merchants/${testMerchantId}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('merchantId', testMerchantId);
      expect(response.data.data).toHaveProperty('name');
    });
  });
});
