/**
 * Customer Address Operations Integration Tests
 *
 * Covers endpoints not exercised by other customer suites:
 * - PUT  /customer/me/addresses/:addressId
 * - POST /customer/me/addresses/:addressId/default
 */

import { AxiosInstance } from 'axios';
import { createTestClient, loginTestUser, expectStatus } from '../testUtils';

describe('Customer Address Operations Tests', () => {
  let client: AxiosInstance;
  let customerToken: string;

  // Seeded in seeds/20240805002001_seedIntegrationTestData.js for testcustomer@example.com
  const addressId = '00000000-0000-0000-0000-000000006001';

  const headers = () => ({ Authorization: `Bearer ${customerToken}` });

  beforeAll(async () => {
    client = createTestClient();
    customerToken = await loginTestUser(client);
    if (!customerToken) throw new Error('Failed to get customer token for address tests');
  });

  it('PUT /customer/me/addresses/:addressId updates the address', async () => {
    const resp = await client.put(
      `/customer/me/addresses/${addressId}`,
      { addressLine1: '20 Updated Ave', city: 'Salem' },
      { headers: headers() },
    );
    expectStatus(resp, 200);
  });

  it('POST /customer/me/addresses/:addressId/default sets the default address', async () => {
    const resp = await client.post(
      `/customer/me/addresses/${addressId}/default`,
      { addressType: 'shipping' },
      { headers: headers() },
    );
    expectStatus(resp, 200);
  });

  it('POST /customer/me/addresses/:addressId/default validates addressType', async () => {
    const resp = await client.post(`/customer/me/addresses/${addressId}/default`, { addressType: 'invalid' }, { headers: headers() });
    expectStatus(resp, 400);
  });

  it('rejects address updates without authentication', async () => {
    const resp = await client.put(`/customer/me/addresses/${addressId}`, { city: 'X' });
    expectStatus(resp, 401);
  });
});
