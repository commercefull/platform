/**
 * Returns Operations Integration Tests
 *
 * Covers endpoints not exercised by returns.test.ts:
 * - POST /business/returns/:returnId/in-transit
 * - POST /business/returns/:returnId/received
 * - POST /business/returns/:returnId/inspect
 * - POST /business/returns/:returnId/complete
 * - POST /business/store-credit/debit
 */

import { AxiosInstance } from 'axios';
import { createTestClient, loginTestAdmin, loginTestUser, expectStatus } from '../testUtils';

describe('Returns Operations Tests', () => {
  let client: AxiosInstance;
  let orgToken: string;
  let customerId = '';

  // Seeded in seeds/20240805002204_seedReturnsTestData.js
  const returnId = '0193c000-0000-7000-8000-000000000001';
  const requestedReturnId = '0193c000-0000-7000-8000-000000000002';

  const headers = () => ({ Authorization: `Bearer ${orgToken}` });

  beforeAll(async () => {
    client = createTestClient();
    orgToken = await loginTestAdmin(client);
    if (!orgToken) throw new Error('Failed to get org token for Returns tests');

    const customerToken = await loginTestUser(client, 'customer@example.com', 'password123');
    if (customerToken) {
      const payload = JSON.parse(Buffer.from(customerToken.split('.')[1], 'base64url').toString()) as { id?: string };
      customerId = payload.id || '';
    }
  });

  describe('Return workflow transitions', () => {
    it('POST /business/returns/:returnId/approve moves to approved', async () => {
      const resp = await client.post(`/business/returns/${returnId}/approve`, {}, { headers: headers() });
      expectStatus(resp, 200);
    });

    it('POST /business/returns/:returnId/in-transit rejects invalid transition', async () => {
      // Second seeded return is still in "requested" status
      const resp = await client.post(`/business/returns/${requestedReturnId}/in-transit`, {}, { headers: headers() });
      expectStatus(resp, 409);
    });

    it('POST /business/returns/:returnId/in-transit marks return in transit', async () => {
      const resp = await client.post(
        `/business/returns/${returnId}/in-transit`,
        { trackingNumber: 'TRACK-123' },
        { headers: headers() },
      );
      expectStatus(resp, 200);
      expect(resp.data.data?.status).toBe('inTransit');
    });

    it('POST /business/returns/:returnId/received marks return received', async () => {
      const resp = await client.post(`/business/returns/${returnId}/received`, {}, { headers: headers() });
      expectStatus(resp, 200);
      expect(resp.data.data?.status).toBe('received');
    });

    it('POST /business/returns/:returnId/inspect completes inspection', async () => {
      const resp = await client.post(
        `/business/returns/${returnId}/inspect`,
        { passedItems: { '00000000-0000-0000-0000-000000000010': true } },
        { headers: headers() },
      );
      expectStatus(resp, 200);
      expect(resp.data.data?.status).toBe('inspected');
    });

    it('POST /business/returns/:returnId/complete completes the return', async () => {
      const resp = await client.post(`/business/returns/${returnId}/complete`, {}, { headers: headers() });
      expectStatus(resp, 200);
      expect(resp.data.data?.status).toBe('completed');
    });
  });

  describe('Store credit debit', () => {
    it('POST /business/store-credit/debit debits the credited balance', async () => {
      if (!customerId) return;
      const resp = await client.post(
        '/business/store-credit/debit',
        { customerId, amount: 5, referenceType: 'order', reason: 'Partial purchase' },
        { headers: headers() },
      );
      expectStatus(resp, 200);
    });

    it('POST /business/store-credit/debit rejects overdraft', async () => {
      if (!customerId) return;
      const resp = await client.post(
        '/business/store-credit/debit',
        { customerId, amount: 999999 },
        { headers: headers() },
      );
      expectStatus(resp, 400);
    });
  });
});
