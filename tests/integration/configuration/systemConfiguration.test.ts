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
        configId: 'test-config-001',
        platformName: 'Test Platform',
        platformDomain: 'test.com',
        supportEmail: 'support@test.com',
        defaultCurrency: 'USD',
        defaultLanguage: 'en',
      };

      const response = await client.post('/business/configuration', configData, {
        headers: authHeaders(),
      });

      expect(response.status).toBe(201);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toBeDefined();
      expect(response.data.data.configId).toBe('test-config-001');
      expect(response.data.data.platformSettings.platformName).toBe('Test Platform');
      expect(response.data.data.systemMode).toBe('single_store');
      expect(response.data.data.isActive).toBe(true);
    });

    it('should create configuration with custom settings', async () => {
      const configData = {
        configId: 'test-config-custom',
        platformName: 'Custom Platform',
        platformDomain: 'custom.com',
        supportEmail: 'support@custom.com',
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
    let testConfigId: string;

    beforeAll(async () => {
      // Create a test configuration
      const configData = {
        configId: 'test-config-update',
        platformName: 'Update Test Platform',
        platformDomain: 'updatetest.com',
        supportEmail: 'support@updatetest.com',
      };

      const response = await client.post('/business/configuration', configData, {
        headers: authHeaders(),
      });

      testConfigId = response.data.data.configId;
    });

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

      const response = await client.put('/business/configuration/non-existent-id', updateData, {
        headers: authHeaders(),
      });

      expect([400, 404].includes(response.status)).toBe(true);
      expect(response.data.success).toBe(false);
    });
  });

  describe('GET /business/configuration/:configId', () => {
    let testConfigId: string;

    beforeAll(async () => {
      // Create a test configuration
      const configData = {
        configId: 'test-config-get',
        platformName: 'Get Test Platform',
        platformDomain: 'gettest.com',
        supportEmail: 'support@gettest.com',
        systemMode: 'marketplace',
      };

      const response = await client.post('/business/configuration', configData, {
        headers: authHeaders(),
      });

      testConfigId = response.data.data.configId;
    });

    it('should retrieve configuration by ID', async () => {
      const response = await client.get(`/business/configuration/${testConfigId}`, {
        headers: authHeaders(),
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data.configId).toBe(testConfigId);
      expect(response.data.data.platformSettings.platformName).toBe('Get Test Platform');
      expect(response.data.data.systemMode).toBe('marketplace');
      expect(response.data.data.features.enableMarketplace).toBe(true);
    });

    it('should return 404 for non-existent configuration', async () => {
      const response = await client.get('/business/configuration/non-existent-id', {
        headers: authHeaders(),
      });

      expect(response.status).toBe(404);
      expect(response.data.success).toBe(false);
    });
  });

  describe('GET /business/configuration/active', () => {
    beforeAll(async () => {
      // Create a configuration that will be active (default isActive: true)
      const configData = {
        configId: 'test-active-config',
        platformName: 'Active Config Platform',
        platformDomain: 'activeconfig.com',
        supportEmail: 'support@activeconfig.com',
        systemMode: 'multi_store',
      };

      await client.post('/business/configuration', configData, {
        headers: authHeaders(),
      });
    });

    it('should retrieve active configuration', async () => {
      const response = await client.get('/business/configuration/active', {
        headers: authHeaders(),
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toBeDefined();
      expect(response.data.data.isActive).toBe(true);
      expect(response.data.data.systemMode).toBe('multi_store');
    });
  });

  describe('GET /business/configuration', () => {
    beforeAll(async () => {
      // Create multiple test configurations
      const configs = [
        {
          configId: 'test-list-1',
          platformName: 'List Config 1',
          platformDomain: 'list1.com',
          supportEmail: 'support@list1.com',
        },
        {
          configId: 'test-list-2',
          platformName: 'List Config 2',
          platformDomain: 'list2.com',
          supportEmail: 'support@list2.com',
          systemMode: 'marketplace',
        },
      ];

      for (const config of configs) {
        await client.post('/business/configuration', config, {
          headers: authHeaders(),
        });
      }
    });

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
    let testConfigId: string;

    beforeAll(async () => {
      // Create a test configuration
      const configData = {
        configId: 'test-complex-config',
        platformName: 'Complex Config Platform',
        platformDomain: 'complexconfig.com',
        supportEmail: 'support@complexconfig.com',
      };

      const response = await client.post('/business/configuration', configData, {
        headers: authHeaders(),
      });

      testConfigId = response.data.data.configId;
    });

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
        configId: 'test-invalid',
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
        configId: 'test-concurrent-config',
        platformName: 'Concurrent Config Platform',
        platformDomain: 'concurrentconfig.com',
        supportEmail: 'support@concurrentconfig.com',
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
        client.put('/business/configuration/test-concurrent-config', update, {
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
