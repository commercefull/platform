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
    const resp = await client.post(`/customer/me/addresses/${addressId}/default`, { addressType: 'shipping' }, { headers: headers() });
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

  it('creates and updates international addresses — GB no-state, AE no-postal, JP prefecture, US state+ZIP', async () => {
    const cases = [
      // GB: no administrative area — a postcode is enough
      { label: 'GB', body: { addressLine1: '10 Downing St', city: 'London', postalCode: 'SW1A 2AA', country: 'GB', addressType: 'shipping' } },
      // AE: no postal code system — emirate carried in `state`
      { label: 'AE', body: { addressLine1: 'Sheikh Zayed Road 1', city: 'Dubai', state: 'Dubai', country: 'AE', addressType: 'shipping' } },
      // JP: prefecture + postal code
      { label: 'JP', body: { addressLine1: '1-1 Chiyoda', city: 'Tokyo', state: 'Tokyo', postalCode: '100-0001', country: 'JP', addressType: 'billing' } },
      // US: state + 5-digit ZIP
      { label: 'US', body: { addressLine1: '1600 Amphitheatre Pkwy', city: 'Mountain View', state: 'CA', postalCode: '94043', country: 'US', addressType: 'shipping' } },
    ];

    for (const { label, body } of cases) {
      const created = await client.post('/customer/me/addresses', body, { headers: headers() });
      expectStatus(created, 201);
      const id = created.data.data.addressId;
      expect(created.data.data.country).toBe(label);

      const updated = await client.put(`/customer/me/addresses/${id}`, { city: body.city }, { headers: headers() });
      expectStatus(updated, 200);
    }
  });
});
