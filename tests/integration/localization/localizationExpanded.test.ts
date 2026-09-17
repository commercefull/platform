/**
 * Localization Expanded Integration Tests
 *
 * Covers endpoints not exercised by localization.test.ts:
 * - POST /business/locales/:id/default              — set default locale
 * - POST /business/locales/:id/activate             — activate locale
 * - POST /business/locales/:id/deactivate           — deactivate locale
 * - GET  /business/countries/region/:region         — countries by region
 * - GET  /business/countries/code/:code             — country by code
 * - POST /business/countries/:id/activate           — activate country
 * - POST /business/countries/:id/deactivate         — deactivate country
 * - GET  /customer/localization/countries/:code     — public country lookup
 */

import { AxiosInstance } from 'axios';
import { createTestClient, loginTestAdmin, expectStatus } from '../testUtils';

describe('Localization Expanded Tests', () => {
  let client: AxiosInstance;
  let adminToken: string;

  const headers = () => ({ Authorization: `Bearer ${adminToken}` });

  beforeAll(async () => {
    jest.setTimeout(30000);
    client = createTestClient();
    adminToken = await loginTestAdmin(client);
    if (!adminToken) throw new Error('Failed to get admin token for Localization tests');
  });

  // ============================================================================
  // Locale lifecycle
  // ============================================================================

  describe('Locale Lifecycle', () => {
    // Seeded in seeds/20240805000204_seedLocale.js (non-default, active)
    const localeId = '01941000-0000-7000-8000-000000000001';

    it('should activate a locale', async () => {
      const response = await client.post(`/business/locales/${localeId}/activate`, {}, { headers: headers() });
      expectStatus(response, 200);
      expect(response.data.success).toBe(true);
    });

    it('should set a locale as default', async () => {
      const response = await client.post(`/business/locales/${localeId}/default`, {}, { headers: headers() });
      expectStatus(response, 200);
      expect(response.data.success).toBe(true);
    });

    it('should deactivate a locale', async () => {
      const response = await client.post(`/business/locales/${localeId}/deactivate`, {}, { headers: headers() });
      expectStatus(response, 200);
      expect(response.data.success).toBe(true);
    });

    it('should return 404 for lifecycle ops on a missing locale', async () => {
      const response = await client.post(`/business/locales/00000000-0000-0000-0000-000000000000/activate`, {}, { headers: headers() });
      expectStatus(response, 404);
    });
  });

  // ============================================================================
  // Country lookups & lifecycle
  // ============================================================================

  describe('Country Lookups & Lifecycle', () => {
    // Seeded in seeds/20240805000206_seedCountry.js
    const countryId = '01941100-0000-7000-8000-000000000001';

    it('should list countries by region', async () => {
      const response = await client.get('/business/countries/region/Europe', { headers: headers() });
      expectStatus(response, 200);
      expect(response.data.success).toBe(true);
      expect(Array.isArray(response.data.data)).toBe(true);
    });

    it('should get a country by code', async () => {
      const response = await client.get('/business/countries/code/US', { headers: headers() });
      expectStatus(response, 200);
      expect(response.data.success).toBe(true);
    });

    it('should deactivate and re-activate a seeded country', async () => {
      const deactivateResponse = await client.post(`/business/countries/${countryId}/deactivate`, {}, { headers: headers() });
      expectStatus(deactivateResponse, 200);

      const activateResponse = await client.post(`/business/countries/${countryId}/activate`, {}, { headers: headers() });
      expectStatus(activateResponse, 200);
    });

    it('should return 404 for lifecycle ops on a missing country', async () => {
      const response = await client.post(
        `/business/countries/00000000-0000-0000-0000-000000000000/deactivate`,
        {},
        { headers: headers() },
      );
      expectStatus(response, 404);
    });
  });

  // ============================================================================
  // Customer-facing lookup
  // ============================================================================

  describe('Customer Localization', () => {
    it('should get a country by code via the public API', async () => {
      const response = await client.get('/customer/localization/countries/US');
      expectStatus(response, 200);
      expect(response.data.success).toBe(true);
    });
  });
});
