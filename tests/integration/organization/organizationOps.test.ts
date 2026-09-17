/**
 * Organization Operations Integration Tests
 *
 * Covers endpoints not exercised by organization.test.ts:
 * - POST /business/organizations/:organizationId/addresses
 * - PUT  /business/organizations/:organizationId/addresses/:addressId
 * - POST /business/organizations/:organizationId/payment-info
 * - PUT  /business/organizations/:organizationId/payment-info/:paymentInfoId
 */

import axios, { AxiosInstance } from 'axios';
import { randomUUID } from 'node:crypto';
import { expectStatus } from '../testUtils';

const API_URL = process.env.API_URL || 'http://localhost:3000';

const TEST_MERCHANT = {
  email: 'merchant@example.com',
  password: 'password123',
};

let client: AxiosInstance;
let organizationToken: string;
let organizationId: string;

beforeAll(async () => {
  client = axios.create({
    baseURL: API_URL,
    validateStatus: () => true,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'X-Test-Request': 'true',
    },
  });

  const loginResponse = await client.post('/business/auth/login', TEST_MERCHANT, { headers: { 'X-Test-Request': 'true' } });
  organizationToken = loginResponse.data?.accessToken || '';
  organizationId = loginResponse.data?.organization?.id || '';
  if (!organizationToken || !organizationId) throw new Error('Failed to get organization token/id');
});

const authHeaders = () => ({ Authorization: `Bearer ${organizationToken}` });

describe('Organization Addresses', () => {
  let addressId: string;

  it('POST /business/organizations/:organizationId/addresses adds an address', async () => {
    const resp = await client.post(
      `/business/organizations/${organizationId}/addresses`,
      {
        addressLine1: '100 Org Plaza',
        city: 'Portland',
        state: 'OR',
        postalCode: '97201',
        country: 'US',
        isPrimary: false,
      },
      { headers: authHeaders() },
    );
    expectStatus(resp, 201);
    addressId = resp.data.data?.organizationAddressId || resp.data.data?.id || '';
    expect(addressId).toBeTruthy();
  });

  it('PUT /business/organizations/:organizationId/addresses/:addressId updates the address', async () => {
    if (!addressId) return;
    const resp = await client.put(
      `/business/organizations/${organizationId}/addresses/${addressId}`,
      { addressLine1: '200 Updated Plaza', city: 'Salem' },
      { headers: authHeaders() },
    );
    expectStatus(resp, 200);
    expect(resp.data.success).toBe(true);
  });

  it('PUT /business/organizations/:organizationId/addresses/:addressId returns 404 for unknown address', async () => {
    const resp = await client.put(
      `/business/organizations/${organizationId}/addresses/${randomUUID()}`,
      { city: 'Nowhere' },
      { headers: authHeaders() },
    );
    expectStatus(resp, 404);
  });
});

describe('Organization Payment Info', () => {
  // Seeded org with no payment info (20241223100002_seedDefaultOrganization.js),
  // so POST is deterministic: 201 then 409 on duplicate.
  const freshOrgId = '0191d000-0000-7000-8000-000000000001';
  let paymentInfoId = '';

  it('POST /business/organizations/:organizationId/payment-info adds payment info', async () => {
    const resp = await client.post(
      `/business/organizations/${freshOrgId}/payment-info`,
      {
        accountHolderName: 'Payment Org LLC',
        bankName: 'Test Bank',
        accountNumber: '000123456789',
        routingNumber: '021000021',
        paymentProcessor: 'stripe',
      },
      { headers: authHeaders() },
    );
    expectStatus(resp, 201);
    paymentInfoId = resp.data.data?.organizationPaymentInfoId || resp.data.data?.id || '';
    expect(paymentInfoId).toBeTruthy();
  });

  it('POST /business/organizations/:organizationId/payment-info returns 409 for duplicate', async () => {
    const resp = await client.post(
      `/business/organizations/${freshOrgId}/payment-info`,
      { accountHolderName: 'Duplicate', bankName: 'Test Bank' },
      { headers: authHeaders() },
    );
    expectStatus(resp, 409);
  });

  it('PUT /business/organizations/:organizationId/payment-info/:paymentInfoId updates payment info', async () => {
    const resp = await client.put(
      `/business/organizations/${freshOrgId}/payment-info/${paymentInfoId}`,
      { accountHolderName: 'Payment Org LLC Updated', bankName: 'Updated Bank' },
      { headers: authHeaders() },
    );
    expectStatus(resp, 200);
    expect(resp.data.success).toBe(true);
  });

  it('PUT /business/organizations/:organizationId/payment-info/:paymentInfoId returns 404 for unknown payment info', async () => {
    const resp = await client.put(
      `/business/organizations/${freshOrgId}/payment-info/${randomUUID()}`,
      { bankName: 'No Bank' },
      { headers: authHeaders() },
    );
    expectStatus(resp, 404);
  });
});
