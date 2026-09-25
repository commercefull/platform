/**
 * Customer Profile & Address Operations Integration Tests
 *
 * Covers endpoints not exercised by other customer suites:
 * - PUT    /customer/me
 * - GET    /customer/me/addresses
 * - POST   /customer/me/addresses
 * - DELETE /customer/me/addresses/:addressId
 */

import { AxiosInstance } from 'axios';
import { createTestClient, loginTestUser, expectStatus } from '../testUtils';

describe('Customer Profile Operations Tests', () => {
  let client: AxiosInstance;
  let customerToken: string;

  // Seeded in seeds/20240805002001_seedIntegrationTestData.js for testcustomer@example.com
  const seededAddressId = '00000000-0000-0000-0000-000000006001';
  const headers = () => ({ Authorization: `Bearer ${customerToken}` });

  beforeAll(async () => {
    client = createTestClient();
    customerToken = await loginTestUser(client);
    if (!customerToken) throw new Error('Failed to get customer token for profile tests');
  });

  it('PUT /customer/me updates the profile', async () => {
    const resp = await client.put(
      '/customer/me',
      { firstName: 'Test', lastName: 'Customer', phone: '+1-555-0100' },
      { headers: headers() },
    );
    expectStatus(resp, 200);
    expect(resp.data.success).toBe(true);
  });

  it('PUT /customer/me rejects unauthenticated requests', async () => {
    const resp = await client.put('/customer/me', { firstName: 'X' });
    expectStatus(resp, 401);
  });

  it('GET /customer/me/addresses lists the seeded address', async () => {
    const resp = await client.get('/customer/me/addresses', { headers: headers() });
    expectStatus(resp, 200);
    expect(resp.data.success).toBe(true);

    const addresses = resp.data.data.addresses;
    expect(Array.isArray(addresses)).toBe(true);
    const seeded = addresses.find((a: { addressId: string }) => a.addressId === seededAddressId);
    expect(seeded).toBeDefined();
    expect(seeded.city).toBe('Test City');
  });

  it('POST /customer/me/addresses creates an address', async () => {
    const resp = await client.post(
      '/customer/me/addresses',
      {
        addressLine1: '99 New Lane',
        city: 'Portland',
        state: 'OR',
        postalCode: '97035',
        country: 'US',
        addressType: 'billing',
        firstName: 'Test',
        lastName: 'Customer',
      },
      { headers: headers() },
    );
    expectStatus(resp, 201);
    expect(resp.data.success).toBe(true);
    expect(resp.data.data.addressId).toBeDefined();
    expect(resp.data.data.city).toBe('Portland');
  });

  it('POST /customer/me/addresses rejects unauthenticated requests', async () => {
    const resp = await client.post('/customer/me/addresses', { addressLine1: 'X', city: 'Y', state: 'Z', postalCode: '1', country: 'US', addressType: 'shipping' });
    expectStatus(resp, 401);
  });

  it('DELETE /customer/me/addresses/:addressId removes an address', async () => {
    // Create then delete so the seeded default address is untouched
    const created = await client.post(
      '/customer/me/addresses',
      {
        addressLine1: '1 Disposable Rd',
        city: 'Nowhere',
        state: 'NW',
        postalCode: '00000',
        country: 'US',
        addressType: 'shipping',
      },
      { headers: headers() },
    );
    expectStatus(created, 201);
    const addressId = created.data.data.addressId;

    const resp = await client.delete(`/customer/me/addresses/${addressId}`, { headers: headers() });
    expectStatus(resp, 200);
    expect(resp.data.data.deleted).toBe(true);
  });

  it('DELETE /customer/me/addresses/:addressId returns 404 for unknown address', async () => {
    const resp = await client.delete('/customer/me/addresses/00000000-0000-0000-0000-00000000dead', {
      headers: headers(),
    });
    expectStatus(resp, 404);
  });

  it('cannot touch another customer\'s address (IDOR guard)', async () => {
    // Register a second customer and try to delete/update the seeded address
    const reg = await client.post('/customer/identity/register', {
      email: `idor-${Date.now()}@example.com`,
      password: 'password123',
      firstName: 'Other',
      lastName: 'Person',
    });
    expectStatus(reg, 201);
    const otherToken = reg.data.accessToken;
    const otherHeaders = { Authorization: `Bearer ${otherToken}` };

    const del = await client.delete(`/customer/me/addresses/${seededAddressId}`, { headers: otherHeaders });
    expectStatus(del, 404);

    const upd = await client.put(`/customer/me/addresses/${seededAddressId}`, { city: 'Hacked' }, { headers: otherHeaders });
    expectStatus(upd, 404);
  });
});
