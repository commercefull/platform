/**
 * Organization Detail Endpoints Integration Tests
 *
 * Covers endpoints missed by organization.test.ts / organizationOps.test.ts:
 * - PUT/DELETE /business/organizations/:id
 * - GET /business/organizations/:id/stores
 * - GET/POST/PUT /business/organizations/:organizationId/addresses
 * - GET/POST/PUT /business/organizations/:organizationId/payment-info
 *
 * Note: the real routes are plural /organizations — earlier tests calling
 * singular /organization/... hit 404s.
 */

import { AxiosInstance } from 'axios';
import { expectStatus, createTestClient, loginTestAdmin } from '../testUtils';

const SEEDED_ORG_ID = '01911000-0000-7000-8000-000000000001'; // merchant@example.com
const UNKNOWN_ID = '00000000-0000-0000-0000-000000099999';

describe('Organization Detail Endpoints', () => {
  let client: AxiosInstance;
  let adminToken: string;

  const auth = () => ({ headers: { Authorization: `Bearer ${adminToken}` } });

  beforeAll(async () => {
    client = createTestClient();
    adminToken = await loginTestAdmin(client);
  });

  describe('Organization update/delete', () => {
    it('PUT /business/organizations/:id updates the organization', async () => {
      const resp = await client.put(
        `/business/organizations/${SEEDED_ORG_ID}`,
        { name: 'Coverage Merchant', phone: '+1-555-0100' },
        auth(),
      );
      expectStatus(resp, 200);
      expect(resp.data.data.name).toBe('Coverage Merchant');
    });

    it('PUT /business/organizations/:id rejects an email used by another org', async () => {
      const holderEmail = `holder-${Date.now()}@example.com`;
      const other = await client.post(
        '/business/organizations',
        { name: 'Email Holder Org', email: holderEmail, password: 'password123' },
        auth(),
      );
      expectStatus(other, 201);

      const resp = await client.put(`/business/organizations/${SEEDED_ORG_ID}`, { email: holderEmail }, auth());
      expectStatus(resp, 409);
    });

    it('PUT /business/organizations/:id returns 404 for unknown org', async () => {
      const resp = await client.put(`/business/organizations/${UNKNOWN_ID}`, { name: 'Nope' }, auth());
      expectStatus(resp, 404);
    });

    it('POST + DELETE /business/organizations removes a created org', async () => {
      const create = await client.post(
        '/business/organizations',
        { name: 'Disposable Org', email: 'disposable-coverage@example.com', password: 'password123' },
        auth(),
      );
      expectStatus(create, 201);
      const orgId = create.data.data.organizationId;

      const del = await client.delete(`/business/organizations/${orgId}`, auth());
      expectStatus(del, 200);

      const get = await client.get(`/business/organizations/${orgId}`, auth());
      expectStatus(get, 404);
    });

    it('DELETE /business/organizations/:id returns 404 for unknown org', async () => {
      const resp = await client.delete(`/business/organizations/${UNKNOWN_ID}`, auth());
      expectStatus(resp, 404);
    });
  });

  describe('Organization stores', () => {
    it('GET /business/organizations/:id/stores lists org stores', async () => {
      const resp = await client.get(`/business/organizations/${SEEDED_ORG_ID}/stores`, auth());
      expectStatus(resp, 200);
      expect(Array.isArray(resp.data.data)).toBe(true);
    });

    it('GET /business/organizations/:id/stores returns 404 for unknown org', async () => {
      const resp = await client.get(`/business/organizations/${UNKNOWN_ID}/stores`, auth());
      expectStatus(resp, 404);
    });
  });

  describe('Organization addresses', () => {
    let addressId: string;

    it('POST /business/organizations/:id/addresses adds an address', async () => {
      const resp = await client.post(
        `/business/organizations/${SEEDED_ORG_ID}/addresses`,
        { addressLine1: '100 Coverage Way', city: 'Austin', state: 'TX', postalCode: '73301', country: 'US' },
        auth(),
      );
      expectStatus(resp, 201);
      addressId = resp.data.data.organizationAddressId || resp.data.data.addressId;
      expect(addressId).toBeTruthy();
    });

    it('GET /business/organizations/:id/addresses lists addresses', async () => {
      const resp = await client.get(`/business/organizations/${SEEDED_ORG_ID}/addresses`, auth());
      expectStatus(resp, 200);
      const ids = resp.data.data.map((a: Record<string, string>) => a.organizationAddressId || a.addressId);
      expect(ids).toContain(addressId);
    });

    it('PUT /business/organizations/:id/addresses/:addressId updates it', async () => {
      const resp = await client.put(
        `/business/organizations/${SEEDED_ORG_ID}/addresses/${addressId}`,
        { city: 'Dallas' },
        auth(),
      );
      expectStatus(resp, 200);
    });
  });

  describe('Organization payment info', () => {
    let paymentInfoId: string;

    it('POST /business/organizations/:id/payment-info adds payment info', async () => {
      const resp = await client.post(
        `/business/organizations/${SEEDED_ORG_ID}/payment-info`,
        {
          accountHolderName: 'Coverage Merchant',
          bankName: 'Test Bank',
          accountNumber: '000123456789',
          routingNumber: '110000000',
          paymentType: 'bankAccount',
        },
        auth(),
      );
      expectStatus(resp, 201);
      paymentInfoId = resp.data.data.organizationPaymentInfoId || resp.data.data.paymentInfoId;
      expect(paymentInfoId).toBeTruthy();
    });

    it('GET /business/organizations/:id/payment-info lists payment info', async () => {
      const resp = await client.get(`/business/organizations/${SEEDED_ORG_ID}/payment-info`, auth());
      expectStatus(resp, 200);
      expect(resp.data.data.length).toBeGreaterThanOrEqual(1);
    });

    it('PUT /business/organizations/:id/payment-info/:paymentInfoId updates it', async () => {
      const resp = await client.put(
        `/business/organizations/${SEEDED_ORG_ID}/payment-info/${paymentInfoId}`,
        { bankName: 'Updated Bank' },
        auth(),
      );
      expectStatus(resp, 200);
    });
  });
});
