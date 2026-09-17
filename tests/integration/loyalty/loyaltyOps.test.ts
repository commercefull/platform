/**
 * Loyalty Operations Integration Tests
 *
 * Covers endpoints not exercised by loyalty.test.ts:
 * - PUT  /business/loyalty/redemptions/:id/status
 * - POST /business/loyalty/orders/:orderId/points
 *
 * Fixtures come from 20240805000531_seedLoyaltyTestData.js.
 */

import { AxiosInstance } from 'axios';
import { randomUUID } from 'node:crypto';
import { createTestClient, loginTestAdmin, loginTestUser, expectStatus } from '../testUtils';

// Seeded fixture IDs (see seeds/20240805000531_seedLoyaltyTestData.js)
const SEEDED_REDEMPTION_ID = '0193c011-0000-7000-8000-000000000001';

describe('Loyalty Operations Tests', () => {
  let client: AxiosInstance;
  let orgToken: string;
  let customerId = '';

  const orgHeaders = () => ({ Authorization: `Bearer ${orgToken}` });

  beforeAll(async () => {
    client = createTestClient();
    orgToken = await loginTestAdmin(client);
    if (!orgToken) throw new Error('Failed to get org token for Loyalty tests');

    const customerToken = await loginTestUser(client, 'customer@example.com', 'password123');
    if (customerToken) {
      const payload = JSON.parse(Buffer.from(customerToken.split('.')[1], 'base64url').toString()) as { id?: string };
      customerId = payload.id || '';
    }
  });

  describe('Redemption status', () => {
    it('PUT /business/loyalty/redemptions/:id/status updates status', async () => {
      const resp = await client.put(
        `/business/loyalty/redemptions/${SEEDED_REDEMPTION_ID}/status`,
        { status: 'used' },
        { headers: orgHeaders() },
      );
      expectStatus(resp, 200);
      expect(resp.data.success).toBe(true);
    });

    it('PUT /business/loyalty/redemptions/:id/status validates status value', async () => {
      const resp = await client.put(`/business/loyalty/redemptions/${randomUUID()}/status`, { status: 'bogus' }, { headers: orgHeaders() });
      expectStatus(resp, 400);
    });
  });

  describe('Order points', () => {
    it('POST /business/loyalty/orders/:orderId/points processes order points', async () => {
      if (!customerId) return;
      const resp = await client.post(
        '/business/loyalty/orders/00000000-0000-0000-0000-000000000200/points',
        { orderAmount: 120, customerId },
        { headers: orgHeaders() },
      );
      expectStatus(resp, 200);
      expect(resp.data.success).toBe(true);
    });

    it('POST /business/loyalty/orders/:orderId/points requires orderAmount and customerId', async () => {
      const resp = await client.post(`/business/loyalty/orders/${randomUUID()}/points`, {}, { headers: orgHeaders() });
      expectStatus(resp, 400);
    });
  });
});
