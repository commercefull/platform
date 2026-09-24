/**
 * Marketplace Operations Integration Tests
 *
 * Covers endpoints not exercised by marketplace.test.ts:
 * - POST /business/vendors/:vendorId/terminate        — terminate vendor
 * - POST /business/payouts/:payoutId/line-items       — add payout line item
 * - POST /business/payouts/:payoutId/complete         — complete payout
 * - POST /business/payouts/:payoutId/fail             — fail payout
 * - POST /business/payouts/:payoutId/retry            — retry failed payout
 */

import { AxiosInstance } from 'axios';
import { createTestClient, loginTestAdmin, expectStatus } from '../testUtils';

// Seeded in seeds/20240805002207_seedMarketplaceOpsData.js
const SEEDED = {
  VENDOR_TERMINATE: '01943000-0000-7000-8000-000000000001',
  PAYOUT_LINE_ITEMS: '01943001-0000-7000-8000-000000000001',
  PAYOUT_COMPLETE: '01943001-0000-7000-8000-000000000002',
  PAYOUT_FAIL_RETRY: '01943001-0000-7000-8000-000000000003',
};

describe('Marketplace Operations Tests', () => {
  let client: AxiosInstance;
  let adminToken: string;

  const headers = () => ({ Authorization: `Bearer ${adminToken}` });

  beforeAll(async () => {
    jest.setTimeout(30000);
    client = createTestClient();
    adminToken = await loginTestAdmin(client);
    if (!adminToken) throw new Error('Failed to get admin token for Marketplace tests');
  });

  // ============================================================================
  // Vendor Termination
  // ============================================================================

  describe('Vendor Termination', () => {
    it('should terminate the seeded vendor', async () => {
      const response = await client.post(`/business/vendors/${SEEDED.VENDOR_TERMINATE}/terminate`, {}, { headers: headers() });
      expectStatus(response, 200);
      expect(response.data.success).toBe(true);
    });
  });

  // ============================================================================
  // Payout Lifecycle
  // ============================================================================

  describe('Payout Lifecycle', () => {
    it('should add a line item to a pending payout', async () => {
      const response = await client.post(
        `/business/payouts/${SEEDED.PAYOUT_LINE_ITEMS}/line-items`,
        {
          lineItemId: 'li-extra-001',
          orderId: null,
          orderNumber: 'ORD-OPS-001',
          grossRevenueCents: 5000,
          commissionAmountCents: 500,
          netAmountCents: 4500,
          currency: 'USD',
        },
        { headers: headers() },
      );
      expectStatus(response, 200);
      expect(response.data.success).toBe(true);
    });

    it('should process then complete a payout', async () => {
      const processResponse = await client.post(`/business/payouts/${SEEDED.PAYOUT_COMPLETE}/process`, {}, { headers: headers() });
      expectStatus(processResponse, 200);

      const completeResponse = await client.post(
        `/business/payouts/${SEEDED.PAYOUT_COMPLETE}/complete`,
        { transactionRef: 'txn-ops-001' },
        { headers: headers() },
      );
      expectStatus(completeResponse, 200);
      expect(completeResponse.data.data?.status).toBe('completed');
    });

    it('should fail a payout and retry it', async () => {
      const failResponse = await client.post(
        `/business/payouts/${SEEDED.PAYOUT_FAIL_RETRY}/fail`,
        { reason: 'Bank rejected transfer' },
        { headers: headers() },
      );
      expectStatus(failResponse, 200);
      expect(failResponse.data.data?.status).toBe('failed');

      const retryResponse = await client.post(`/business/payouts/${SEEDED.PAYOUT_FAIL_RETRY}/retry`, {}, { headers: headers() });
      expectStatus(retryResponse, 200);
      expect(retryResponse.data.data?.status).toBe('pending');
    });
  });
});
