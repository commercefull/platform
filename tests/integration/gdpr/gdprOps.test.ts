/**
 * GDPR Operations Integration Tests
 *
 * Covers the endpoint not exercised by gdpr.test.ts:
 * - POST /business/gdpr/requests/:gdprDataRequestId/delete
 */

import { AxiosInstance } from 'axios';
import { randomUUID } from 'node:crypto';
import { expectStatus, createTestClient, loginTestAdmin } from '../testUtils';

describe('GDPR Operations Tests', () => {
  let client: AxiosInstance;
  let adminToken: string;

  // Seeded in seeds/20240805001303_seedGdprData.js (unverified deletion request)
  const requestId = '01939000-0000-7000-8000-000000000001';

  const adminHeaders = () => ({ Authorization: `Bearer ${adminToken}` });

  beforeAll(async () => {
    client = createTestClient();
    adminToken = await loginTestAdmin(client);
  });

  it('rejects processing before identity verification', async () => {
    const resp = await client.post(`/business/gdpr/requests/${requestId}/delete`, {}, { headers: adminHeaders() });
    // GdprValidationError: 'Customer identity must be verified before processing'
    expectStatus(resp, 400);
  });

  it('verifies the customer identity', async () => {
    const resp = await client.post(`/business/gdpr/requests/${requestId}/verify`, {}, { headers: adminHeaders() });
    expectStatus(resp, 200);
  });

  it('POST /business/gdpr/requests/:gdprDataRequestId/delete processes the deletion', async () => {
    const resp = await client.post(
      `/business/gdpr/requests/${requestId}/delete`,
      { notes: 'Processed by integration test' },
      { headers: adminHeaders() },
    );
    expectStatus(resp, 200);
    expect(resp.data.success).toBe(true);
  });

  it('returns 404 for an unknown request', async () => {
    const resp = await client.post(`/business/gdpr/requests/${randomUUID()}/delete`, {}, { headers: adminHeaders() });
    expectStatus(resp, 404);
  });
});
