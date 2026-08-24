/**
 * SystemConfiguration API Integration Tests
 * Tests system configuration operations through HTTP API endpoints
 */

import axios, { AxiosInstance } from 'axios';
import { loginTestAdmin } from '../testUtils';

const createClient = (): AxiosInstance =>
  axios.create({
    baseURL: process.env.API_URL || 'http://localhost:3000',
    validateStatus: () => true,
    timeout: 10000,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'X-Test-Request': 'true',
    },
  });

describe('SystemConfiguration API Integration', () => {
  let client: AxiosInstance;
  let adminToken: string;

  beforeAll(async () => {
    jest.setTimeout(30000);
    client = createClient();
    adminToken = await loginTestAdmin(client);
  });

  const authHeaders = () => ({ Authorization: `Bearer ${adminToken}` });

  describe('POST /business/configuration', () => {
    it('should create system configuration successfully', async () => {
      const configData = {
        configId: '00000000-0000-0000-0000-000000000010',
        platformName: 'Test Platform',
        platformDomain: 'test-create-001.com',
        supportEmail: 'support@test-create-001.com',
        defaultCurrency: 'USD',
        defaultLanguage: 'en',
      };

      const response = await client.post('/business/configuration', configData, {
        headers: authHeaders(),
      });

      expect(response.status).toBe(201);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toBeDefined();
      expect(response.data.data.configId).toBe('00000000-0000-0000-0000-000000000010');
      expect(response.data.data.platformSettings.platformName).toBe('Test Platform');
      expect(response.data.data.systemMode).toBe('single_store');
      expect(response.data.data.isActive).toBe(true);
    });

    it('should create configuration with custom settings', async () => {
      const configData = {
        configId: '00000000-0000-0000-0000-000000000011',
        platformName: 'Custom Platform',
        platformDomain: 'custom-create.com',
        supportEmail: 'support@custom-create.com',
        defaultCurrency: 'EUR',
        defaultLanguage: 'de',
        timezone: 'Europe/Berlin',
        systemMode: 'marketplace',
      };

      const response = await client.post('/business/configuration', configData, {
        headers: authHeaders(),
      });

      expect(response.status).toBe(201);
      expect(response.data.success).toBe(true);
      expect(response.data.data.systemMode).toBe('marketplace');
      expect(response.data.data.platformSettings.defaultCurrency).toBe('EUR');
      expect(response.data.data.platformSettings.timezone).toBe('Europe/Berlin');
      expect(response.data.data.features.enableMarketplace).toBe(true);
    });
  });

  describe('PUT /business/configuration/:configId', () => {
    const testConfigId = '00000000-0000-0000-0000-000000000001'; // Seeded SINGLE_STORE config

    it('should update platform settings', async () => {
      const updateData = {
        platformName: 'Updated Platform Name',
        platformDomain: 'updateddomain.com',
        defaultCurrency: 'GBP',
        defaultLanguage: 'en',
      };

      const response = await client.put(`/business/configuration/${testConfigId}`, updateData, {
        headers: authHeaders(),
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data.platformName).toBe('Updated Platform Name');
      expect(response.data.data.platformSettings.defaultCurrency).toBe('GBP');
    });

    it('should change system mode', async () => {
      const updateData = {
        systemMode: 'multi_store',
      };

      const response = await client.put(`/business/configuration/${testConfigId}`, updateData, {
        headers: authHeaders(),
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data.systemMode).toBe('multi_store');
      expect(response.data.data.features.enableMultiStore).toBe(true);
    });

    it('should update feature toggles', async () => {
      const updateData = {
        features: {
          enableWishlist: false,
          enableProductReviews: false,
          enableCoupons: true,
          enableSubscriptions: true,
        },
      };

      const response = await client.put(`/business/configuration/${testConfigId}`, updateData, {
        headers: authHeaders(),
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data.features.enableWishlist).toBe(false);
      expect(response.data.data.features.enableProductReviews).toBe(false);
      expect(response.data.data.features.enableCoupons).toBe(true);
      expect(response.data.data.features.enableSubscriptions).toBe(true);
    });

    it('should update business settings', async () => {
      const updateData = {
        organizationSettings: {
          maxStoresPerOrganization: 25,
          maxWarehousesPerOrganization: 10,
          allowOrganizationTypeChanges: true,
        },
      };

      const response = await client.put(`/business/configuration/${testConfigId}`, updateData, {
        headers: authHeaders(),
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data.organizationSettings.maxStoresPerOrganization).toBe(25);
      expect(response.data.data.organizationSettings.maxWarehousesPerOrganization).toBe(10);
      expect(response.data.data.organizationSettings.allowOrganizationTypeChanges).toBe(true);
    });

    it('should return 400 for non-existent configuration', async () => {
      const updateData = {
        platformName: 'Non-existent Update',
      };

      const response = await client.put('/business/configuration/00000000-0000-0000-0000-000000000099', updateData, {
        headers: authHeaders(),
      });

      expect([400, 404].includes(response.status)).toBe(true);
      expect(response.data.success).toBe(false);
    });
  });

  describe('GET /business/configuration/:configId', () => {
    const testConfigId = '00000000-0000-0000-0000-000000000002'; // Seeded MARKETPLACE config

    it('should retrieve configuration by ID', async () => {
      const response = await client.get(`/business/configuration/${testConfigId}`, {
        headers: authHeaders(),
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data.configId).toBe(testConfigId);
      expect(response.data.data.platformSettings.platformName).toBe('Marketplace Platform');
      expect(response.data.data.systemMode).toBe('marketplace');
      expect(response.data.data.features.enableMarketplace).toBe(true);
    });

    it('should return 404 for non-existent configuration', async () => {
      const response = await client.get('/business/configuration/00000000-0000-0000-0000-000000000099', {
        headers: authHeaders(),
      });

      expect(response.status).toBe(404);
      expect(response.data.success).toBe(false);
    });
  });

  describe('GET /business/configuration/active', () => {
    // Seeded configs are already active

    it('should retrieve active configuration', async () => {
      const response = await client.get('/business/configuration/active', {
        headers: authHeaders(),
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toBeDefined();
      expect(response.data.data.isActive).toBe(true);
      expect(response.data.data.systemMode).toBeDefined();
    });
  });

  describe('GET /business/configuration', () => {
    // Seeded configs already exist for listing

    it('should list all configurations', async () => {
      const response = await client.get('/business/configuration', {
        headers: authHeaders(),
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(Array.isArray(response.data.data)).toBe(true);
      expect(response.data.count).toBeGreaterThanOrEqual(2);

      // Verify structure
      response.data.data.forEach((config: Record<string, unknown>) => {
        expect(config.configId).toBeDefined();
        expect(config.platformSettings).toBeDefined();
        expect(config.systemMode).toBeDefined();
        expect(config.features).toBeDefined();
      });
    });
  });

  describe('Complex Configuration Updates', () => {
    const testConfigId = '00000000-0000-0000-0000-000000000001'; // Seeded SINGLE_STORE config

    it('should update notification settings', async () => {
      const updateData = {
        notificationSettings: {
          emailEnabled: true,
          smsEnabled: true,
          pushEnabled: false,
          defaultTemplates: {
            orderConfirmation: true,
            shippingUpdate: true,
            passwordReset: false,
            accountVerification: true,
          },
        },
      };

      const response = await client.put(`/business/configuration/${testConfigId}`, updateData, {
        headers: authHeaders(),
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data.notificationSettings.emailEnabled).toBe(true);
      expect(response.data.data.notificationSettings.smsEnabled).toBe(true);
      expect(response.data.data.notificationSettings.defaultTemplates.orderConfirmation).toBe(true);
      expect(response.data.data.notificationSettings.defaultTemplates.passwordReset).toBe(false);
    });

    it('should update integration settings', async () => {
      const updateData = {
        integrationSettings: {
          paymentGateways: ['stripe', 'paypal', 'square'],
          shippingProviders: ['fedex', 'ups', 'usps', 'dhl'],
          analyticsProviders: ['google_analytics', 'segment', 'mixpanel'],
          emailProviders: ['sendgrid', 'mailgun', 'postmark'],
        },
      };

      const response = await client.put(`/business/configuration/${testConfigId}`, updateData, {
        headers: authHeaders(),
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data.integrationSettings.paymentGateways).toEqual(['stripe', 'paypal', 'square']);
      expect(response.data.data.integrationSettings.shippingProviders).toEqual(['fedex', 'ups', 'usps', 'dhl']);
      expect(response.data.data.integrationSettings.analyticsProviders).toEqual(['google_analytics', 'segment', 'mixpanel']);
    });

    it('should update security settings', async () => {
      const updateData = {
        securitySettings: {
          enableTwoFactorAuth: true,
          passwordPolicy: {
            minLength: 12,
            requireUppercase: true,
            requireLowercase: true,
            requireNumbers: true,
            requireSpecialChars: true,
          },
          sessionTimeout: 180,
          maxLoginAttempts: 3,
        },
      };

      const response = await client.put(`/business/configuration/${testConfigId}`, updateData, {
        headers: authHeaders(),
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data.securitySettings.enableTwoFactorAuth).toBe(true);
      expect(response.data.data.securitySettings.passwordPolicy.minLength).toBe(12);
      expect(response.data.data.securitySettings.sessionTimeout).toBe(180);
      expect(response.data.data.securitySettings.maxLoginAttempts).toBe(3);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid configuration data', async () => {
      const invalidData = {
        configId: '00000000-0000-0000-0000-000000000012',
        platformName: '', // Invalid empty name
        platformDomain: 'invalid.com',
        // Missing required supportEmail
      };

      const response = await client.post('/business/configuration', invalidData, {
        headers: authHeaders(),
      });

      expect([400, 500].includes(response.status)).toBe(true);
      expect(response.data.success).toBe(false);
    });

    it('should handle concurrent configuration updates', async () => {
      const configData = {
        configId: '00000000-0000-0000-0000-000000000013',
        platformName: 'Concurrent Config Platform',
        platformDomain: 'concurrent-config-test.com',
        supportEmail: 'support@concurrent-config-test.com',
      };

      // Create config first
      await client.post('/business/configuration', configData, {
        headers: authHeaders(),
      });

      // Make concurrent updates
      const updates = [
        { platformName: 'Updated by Request 1' },
        { platformName: 'Updated by Request 2' },
        { platformName: 'Updated by Request 3' },
      ];

      const promises = updates.map(update =>
        client.put('/business/configuration/00000000-0000-0000-0000-000000000013', update, {
          headers: authHeaders(),
        }),
      );

      const responses = await Promise.all(promises);

      // At least one should succeed (depending on timing)
      const successCount = responses.filter(r => r.status === 200).length;
      expect(successCount).toBeGreaterThan(0);
    });
  });
});
