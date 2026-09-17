/**
 * Theme Operations Integration Tests
 *
 * Covers endpoints not exercised by theme.test.ts:
 * - GET  /business/theme/overrides/organization/:organizationId
 * - PUT  /business/theme/overrides/:overrideId
 * - POST /business/theme/seed/built-in
 */

import { AxiosInstance } from 'axios';
import { createTestClient, loginTestAdmin, expectStatus } from '../testUtils';

describe('Theme Operations Tests', () => {
  let client: AxiosInstance;
  let orgToken: string;
  let organizationId = '';

  // Seeded in seeds/20241220000025_seedThemeTestData.js
  const overrideId = '0193e001-0000-7000-8000-000000000001';

  const headers = () => ({ Authorization: `Bearer ${orgToken}` });

  beforeAll(async () => {
    client = createTestClient();
    orgToken = await loginTestAdmin(client);
    if (!orgToken) throw new Error('Failed to get org token for Theme tests');

    const payload = JSON.parse(Buffer.from(orgToken.split('.')[1], 'base64url').toString()) as { id?: string };
    organizationId = payload.id || '';
  });

  it('GET /business/theme/overrides/organization/:organizationId lists overrides', async () => {
    const resp = await client.get(`/business/theme/overrides/organization/${organizationId}`, { headers: headers() });
    expectStatus(resp, 200);
    expect(resp.data.success).toBe(true);
    expect(Array.isArray(resp.data.data)).toBe(true);
  });

  it('PUT /business/theme/overrides/:overrideId updates the override', async () => {
    const resp = await client.put(
      `/business/theme/overrides/${overrideId}`,
      { settings: { primaryColor: '#00FF00' }, customCss: '.banner { color: green; }' },
      { headers: headers() },
    );
    expectStatus(resp, 200);
    expect(resp.data.success).toBe(true);
  });

  it('POST /business/theme/seed/built-in seeds built-in themes', async () => {
    const resp = await client.post('/business/theme/seed/built-in', {}, { headers: headers() });
    expectStatus(resp, 200);
    expect(resp.data.success).toBe(true);
  });
});
