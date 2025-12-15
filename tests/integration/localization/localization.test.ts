/**
 * Localization Integration Tests
 * 
 * Tests for locale and country management endpoints.
 */

import axios, { AxiosInstance } from 'axios';

// ============================================================================
// Test Configuration
// ============================================================================

const API_URL = process.env.API_URL || 'http://localhost:3000';

const TEST_MERCHANT = {
  email: 'merchant@example.com',
  password: 'password123'
};

let client: AxiosInstance;
let merchantToken: string;

// ============================================================================
// Setup
// ============================================================================

beforeAll(async () => {
  client = axios.create({
    baseURL: API_URL,
    validateStatus: () => true,
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    }
  });

  // Login as merchant
  const loginResponse = await client.post('/business/auth/login', TEST_MERCHANT, { headers: { 'X-Test-Request': 'true' } });
  merchantToken = loginResponse.data.accessToken;
});

// ============================================================================
// Tests
// ============================================================================

describe('Localization Feature Tests', () => {
  // ==========================================================================
  // Locale Management (Business Routes)
  // ==========================================================================

  describe('Locale Management (Business)', () => {
    let testLocaleId: string;

    describe('GET /business/locales', () => {
      it('should list all locales', async () => {
        const response = await client.get('/business/locales', {
          headers: { Authorization: `Bearer ${merchantToken}` }
        });

        expect(response.status).toBe(200);
        expect(response.data.success).toBe(true);
        expect(Array.isArray(response.data.data)).toBe(true);
      });

      it('should filter active locales only', async () => {
        const response = await client.get('/business/locales', {
          headers: { Authorization: `Bearer ${merchantToken}` },
          params: { activeOnly: 'true' }
        });

        expect(response.status).toBe(200);
        expect(response.data.success).toBe(true);
        expect(Array.isArray(response.data.data)).toBe(true);
      });

      it('should require authentication', async () => {
        const response = await client.get('/business/locales');
        expect(response.status).toBe(401);
      });
    });

    describe('GET /business/locales/default', () => {
      it('should get default locale', async () => {
        const response = await client.get('/business/locales/default', {
          headers: { Authorization: `Bearer ${merchantToken}` }
        });

        expect(response.status).toBe(200);
        expect(response.data.success).toBe(true);
        expect(response.data.data).toHaveProperty('isDefault', true);
      });
    });

    describe('GET /business/locales/statistics', () => {
      it('should get locale statistics', async () => {
        const response = await client.get('/business/locales/statistics', {
          headers: { Authorization: `Bearer ${merchantToken}` }
        });

        expect(response.status).toBe(200);
        expect(response.data.success).toBe(true);
        expect(response.data.data).toHaveProperty('total');
        expect(response.data.data).toHaveProperty('active');
      });
    });

    describe('GET /business/locales/language/:language', () => {
      it('should get locales by language', async () => {
        const response = await client.get('/business/locales/language/en', {
          headers: { Authorization: `Bearer ${merchantToken}` }
        });

        expect(response.status).toBe(200);
        expect(response.data.success).toBe(true);
        expect(Array.isArray(response.data.data)).toBe(true);
      });
    });

    describe('GET /business/locales/country/:countryCode', () => {
      it('should get locales by country code', async () => {
        const response = await client.get('/business/locales/country/US', {
          headers: { Authorization: `Bearer ${merchantToken}` }
        });

        expect(response.status).toBe(200);
        expect(response.data.success).toBe(true);
        expect(Array.isArray(response.data.data)).toBe(true);
      });
    });

    describe('POST /business/locales', () => {
      it('should create a new locale', async () => {
        const localeData = {
          code: `test-${Date.now()}`,
          name: 'Test Locale',
          language: 'en',
          countryCode: 'XX',
          isActive: true,
          textDirection: 'ltr',
          dateFormat: 'yyyy-MM-dd',
          timeFormat: 'HH:mm:ss',
          timeZone: 'UTC'
        };

        const response = await client.post('/business/locales', localeData, {
          headers: { Authorization: `Bearer ${merchantToken}` }
        });

        expect(response.status).toBe(201);
        expect(response.data.success).toBe(true);
        expect(response.data.data).toHaveProperty('localeId');
        testLocaleId = response.data.data.localeId;
      });
    });

    describe('GET /business/locales/:id', () => {
      it('should get locale by ID', async () => {
        // First get a locale
        const listResponse = await client.get('/business/locales', {
          headers: { Authorization: `Bearer ${merchantToken}` }
        });

        if (listResponse.data.data && listResponse.data.data.length > 0) {
          const localeId = listResponse.data.data[0].localeId;
          const response = await client.get(`/business/locales/${localeId}`, {
            headers: { Authorization: `Bearer ${merchantToken}` }
          });

          expect(response.status).toBe(200);
          expect(response.data.success).toBe(true);
          expect(response.data.data).toHaveProperty('localeId', localeId);
        }
      });

      it('should return 404 for non-existent locale', async () => {
        const response = await client.get('/business/locales/00000000-0000-0000-0000-000000000000', {
          headers: { Authorization: `Bearer ${merchantToken}` }
        });

        expect(response.status).toBe(404);
      });
    });

    describe('GET /business/locales/code/:code', () => {
      it('should get locale by code', async () => {
        const response = await client.get('/business/locales/code/en-US', {
          headers: { Authorization: `Bearer ${merchantToken}` }
        });

        expect(response.status).toBe(200);
        expect(response.data.success).toBe(true);
        expect(response.data.data).toHaveProperty('code', 'en-US');
      });
    });

    describe('PUT /business/locales/:id', () => {
      it('should update a locale', async () => {
        // Get a locale first
        const listResponse = await client.get('/business/locales', {
          headers: { Authorization: `Bearer ${merchantToken}` }
        });

        if (listResponse.data.data && listResponse.data.data.length > 0) {
          const localeId = listResponse.data.data[0].localeId;
          const response = await client.put(
            `/business/locales/${localeId}`,
            { dateFormat: 'dd/MM/yyyy' },
            { headers: { Authorization: `Bearer ${merchantToken}` } }
          );

          expect(response.status).toBe(200);
          expect(response.data.success).toBe(true);
        }
      });
    });
  });

  // ==========================================================================
  // Country Management (Business Routes)
  // ==========================================================================

  describe('Country Management (Business)', () => {
    describe('GET /business/countries', () => {
      it('should list all countries', async () => {
        const response = await client.get('/business/countries', {
          headers: { Authorization: `Bearer ${merchantToken}` }
        });

        expect(response.status).toBe(200);
        expect(response.data.success).toBe(true);
        expect(Array.isArray(response.data.data)).toBe(true);
      });
    });
  });

  // ==========================================================================
  // Public Localization Routes
  // ==========================================================================

  describe('Public Localization', () => {
    describe('GET /localization/locales', () => {
      it('should get active locales (public)', async () => {
        const response = await client.get('/customer/localization/locales');

        expect(response.status).toBe(200);
        expect(response.data.success).toBe(true);
        expect(Array.isArray(response.data.data)).toBe(true);
      });
    });

    describe('GET /localization/locales/:code', () => {
      it('should get locale by code (public)', async () => {
        const response = await client.get('/customer/localization/locales/en-US');

        expect(response.status).toBe(200);
        expect(response.data.success).toBe(true);
      });
    });

    describe('GET /localization/countries', () => {
      it('should get active countries (public)', async () => {
        const response = await client.get('/customer/localization/countries');

        expect(response.status).toBe(200);
        expect(response.data.success).toBe(true);
      });
    });

    describe('GET /localization/detect', () => {
      it('should detect locale from request', async () => {
        const response = await client.get('/customer/localization/detect');

        expect(response.status).toBe(200);
        expect(response.data.success).toBe(true);
      });
    });
  });

  // ==========================================================================
  // Authorization
  // ==========================================================================

  describe('Authorization', () => {
    it('should require auth for business locale management', async () => {
      const response = await client.post('/business/locales', {});
      expect(response.status).toBe(401);
    });

    it('should allow public access to localization endpoints', async () => {
      const response = await client.get('/customer/localization/locales');
      expect(response.status).toBe(200);
    });
  });
});
