/**
 * Payment Operations Integration Tests
 *
 * Covers endpoints not exercised by the other payment suites:
 * - GET   /business/payment/disputes                    — list disputes
 * - POST  /business/payment/disputes                    — list disputes (POST alias)
 * - GET   /business/payment/disputes/:disputeId         — get dispute
 * - PATCH /business/payment/disputes/:disputeId         — update dispute status
 * - GET   /business/payment/fees                        — list fees (requires transactionId)
 * - GET   /business/payment/settings                    — get merchant settings
 * - POST  /business/payment/settings                    — update merchant settings
 * - GET   /business/payment/balance                     — get merchant balance
 * - GET   /business/payment/reports                     — list merchant reports
 * - GET   /customer/payment/methods                     — available payment methods
 * - GET   /customer/payment/orders/:orderId             — transactions for order
 * - POST  /customer/payment-methods/:methodId/default   — set default stored method
 */

import { AxiosInstance } from 'axios';
import { createTestClient, loginTestAdmin, loginTestUser, expectStatus } from '../testUtils';

// Seeded fixtures
const SEEDED_ORDER_ID = '00000000-0000-0000-0000-000000000200';
const SEEDED_STORED_METHOD_ID = '00000000-0000-0000-0000-000000008001';

describe('Payment Operations Tests', () => {
  let client: AxiosInstance;
  let adminToken: string;
  let customerToken: string;

  const adminHeaders = () => ({ Authorization: `Bearer ${adminToken}` });
  const customerHeaders = () => ({ Authorization: `Bearer ${customerToken}` });

  beforeAll(async () => {
    jest.setTimeout(30000);
    client = createTestClient();
    adminToken = await loginTestAdmin(client);
    customerToken = await loginTestUser(client);
    if (!adminToken) throw new Error('Failed to get admin token for Payment tests');
  });

  // ============================================================================
  // Disputes (business)
  // ============================================================================

  describe('Disputes', () => {
    it('should list disputes', async () => {
      const response = await client.get('/business/payment/disputes', { headers: adminHeaders() });
      expectStatus(response, 200);
      expect(response.data.success).toBe(true);
    });

    it('should list disputes via POST alias', async () => {
      const response = await client.post('/business/payment/disputes', {}, { headers: adminHeaders() });
      expectStatus(response, 200);
    });

    it('should return 404 for a non-existent dispute', async () => {
      const response = await client.get('/business/payment/disputes/00000000-0000-0000-0000-000000000000', {
        headers: adminHeaders(),
      });
      expectStatus(response, 404);
    });

    it('should reject dispute status update without status', async () => {
      const response = await client.patch(
        '/business/payment/disputes/00000000-0000-0000-0000-000000000000',
        {},
        { headers: adminHeaders() },
      );
      expectStatus(response, 400);
    });

    it('should return 404 when updating a non-existent dispute', async () => {
      const response = await client.patch(
        '/business/payment/disputes/00000000-0000-0000-0000-000000000000',
        { status: 'won', resolvedAt: new Date().toISOString() },
        { headers: adminHeaders() },
      );
      expectStatus(response, 404);
    });
  });

  // ============================================================================
  // Fees (business)
  // ============================================================================

  describe('Fees', () => {
    it('should require transactionId query parameter', async () => {
      const response = await client.get('/business/payment/fees', { headers: adminHeaders() });
      expectStatus(response, 400);
    });

    it('should list fees for a transaction', async () => {
      const response = await client.get('/business/payment/fees?transactionId=00000000-0000-0000-0000-000000000000', {
        headers: adminHeaders(),
      });
      expectStatus(response, 200);
      expect(response.data.success).toBe(true);
    });
  });

  // ============================================================================
  // Settings (business)
  // ============================================================================

  describe('Settings', () => {
    it('should get payment settings', async () => {
      const response = await client.get('/business/payment/settings', { headers: adminHeaders() });
      expectStatus(response, 200);
      expect(response.data.success).toBe(true);
    });

    it('should reject an empty settings update', async () => {
      const response = await client.post('/business/payment/settings', {}, { headers: adminHeaders() });
      expectStatus(response, 400);
    });

    it('should update payment settings', async () => {
      const response = await client.post(
        '/business/payment/settings',
        { capturePaymentsAutomatically: true, allowGuestCheckout: true, paymentAttemptLimit: 3 },
        { headers: adminHeaders() },
      );
      expectStatus(response, 200);
      expect(response.data.success).toBe(true);
    });
  });

  // ============================================================================
  // Balance & Reports (business)
  // ============================================================================

  describe('Balance & Reports', () => {
    it('should get payment balance', async () => {
      const response = await client.get('/business/payment/balance?currency=USD', { headers: adminHeaders() });
      expectStatus(response, 200);
      expect(response.data.success).toBe(true);
    });

    it('should list payment reports', async () => {
      const response = await client.get('/business/payment/reports', { headers: adminHeaders() });
      expectStatus(response, 200);
      expect(response.data.success).toBe(true);
    });
  });

  // ============================================================================
  // Customer payment endpoints
  // ============================================================================

  describe('Customer Payment Endpoints', () => {
    it('should list available payment methods', async () => {
      const response = await client.get('/customer/payment/methods?currency=USD', { headers: customerHeaders() });
      expectStatus(response, 200);
      expect(response.data.success).toBe(true);
    });

    it('should get transactions for the seeded order', async () => {
      const response = await client.get(`/customer/payment/orders/${SEEDED_ORDER_ID}`, { headers: customerHeaders() });
      expectStatus(response, 200);
      expect(response.data.success).toBe(true);
    });

    it('should set the seeded stored method as default', async () => {
      const defaultResponse = await client.post(
        `/customer/payment-methods/${SEEDED_STORED_METHOD_ID}/default`,
        {},
        { headers: customerHeaders() },
      );
      expectStatus(defaultResponse, 200);
      expect(defaultResponse.data.success).toBe(true);
    });
  });
});
