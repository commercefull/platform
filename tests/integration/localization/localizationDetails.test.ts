/**
 * Localization Detail Endpoints Integration Tests
 *
 * Covers endpoints missed by localization.test.ts / localizationExpanded.test.ts:
 * - POST/PUT/GET/DELETE /business/countries/:id
 * - PUT/DELETE /business/locales/:id
 */

import { AxiosInstance } from 'axios';
import { expectStatus, createTestClient, loginTestAdmin } from '../testUtils';

describe('Localization Detail Endpoints', () => {
  let client: AxiosInstance;
  let adminToken: string;

  const auth = () => ({ headers: { Authorization: `Bearer ${adminToken}` } });

  beforeAll(async () => {
    client = createTestClient();
    adminToken = await loginTestAdmin(client);
  });

  describe('Countries', () => {
    let countryId: string;

    it('POST /business/countries creates a country', async () => {
      const resp = await client.post(
        '/business/countries',
        { code: 'XX', name: 'Coverage Country', alpha3Code: 'XXC', region: 'Testland' },
        auth(),
      );
      expectStatus(resp, 201);
      countryId = resp.data.data.countryId || resp.data.data.id;
      expect(countryId).toBeTruthy();
    });

    it('GET /business/countries/:id returns the country', async () => {
      const resp = await client.get(`/business/countries/${countryId}`, auth());
      expectStatus(resp, 200);
      expect(resp.data.data.code).toBe('XX');
    });

    it('PUT /business/countries/:id updates the country', async () => {
      const resp = await client.put(`/business/countries/${countryId}`, { name: 'Coverage Country Updated' }, auth());
      expectStatus(resp, 200);
    });

    it('DELETE /business/countries/:id removes the country', async () => {
      const resp = await client.delete(`/business/countries/${countryId}`, auth());
      expectStatus(resp, 200);

      const get = await client.get(`/business/countries/${countryId}`, auth());
      expectStatus(get, 404);
    });
  });

  describe('Locales', () => {
    let localeId: string;

    it('POST /business/locales creates a locale', async () => {
      const resp = await client.post(
        '/business/locales',
        { code: 'xx-XX', name: 'Coverage Locale', language: 'xx', countryCode: 'XX' },
        auth(),
      );
      expectStatus(resp, 201);
      localeId = resp.data.data.localeId || resp.data.data.id;
    });

    it('PUT /business/locales/:id updates the locale', async () => {
      const resp = await client.put(`/business/locales/${localeId}`, { name: 'Coverage Locale Updated' }, auth());
      expectStatus(resp, 200);
    });

    it('DELETE /business/locales/:id removes the locale', async () => {
      const resp = await client.delete(`/business/locales/${localeId}`, auth());
      expectStatus(resp, 200);
    });
  });
});
