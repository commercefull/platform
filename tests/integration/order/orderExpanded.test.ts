/**
 * Order Expanded Tests
 * Tests: refunds, cancellations, returns, status transitions, order items
 */

import { AxiosInstance } from 'axios';
import { SEEDED_ORDER_ID, SEEDED_REFUND_ORDER_ID, SEEDED_DELIVERED_ORDER_ID, SEEDED_ORDER_PAYMENT_ID } from './testUtils';
import { expectStatus, createTestClient, loginTestAdmin, loginTestUser } from '../testUtils';

describe('Order Expanded Tests', () => {
  let client: AxiosInstance;
  let adminToken: string;
  let customerToken: string;

  beforeAll(async () => {
    jest.setTimeout(30000);
    client = createTestClient();
    adminToken = await loginTestAdmin(client);
    customerToken = await loginTestUser(client, 'customer@example.com', 'password123');
  });

  const authHeaders = () => ({ Authorization: `Bearer ${adminToken}` });
  const customerAuthHeaders = () => ({ Authorization: `Bearer ${customerToken}` });

  // ============================================================================
  // Order Status Transition Tests
  // ============================================================================

  describe('Status Transitions', () => {
    it('should list all orders with status filter', async () => {
      const resp = await client.get('/business/orders', {
        params: { status: 'pending' },
        headers: authHeaders(),
      });

      expect(resp.status).toBe(200);
      expect(resp.data.success).toBe(true);
    });

    it('should get order status history', async () => {
      const historyResp = await client.get(`/business/orders/${SEEDED_ORDER_ID}/status-history`, {
        headers: authHeaders(),
      });

      expectStatus(historyResp, 200);
      expect(historyResp.data.success).toBe(true);
    });

    it('should update order status', async () => {
      const updateResp = await client.put(
        `/business/orders/${SEEDED_ORDER_ID}/status`,
        { status: 'processing' },
        { headers: authHeaders() },
      );

      expectStatus(updateResp, 200);
    });
  });

  // ============================================================================
  // Order Cancellation Tests
  // ============================================================================

  describe('Cancellations', () => {
    it('should cancel an order', async () => {
      const cancelResp = await client.post(
        `/business/orders/${SEEDED_ORDER_ID}/cancel`,
        { reason: 'Customer requested cancellation' },
        { headers: authHeaders() },
      );

      expectStatus(cancelResp, 200);
    });

    it('should reject cancellation of already delivered order', async () => {
      const cancelResp = await client.post(
        `/business/orders/${SEEDED_DELIVERED_ORDER_ID}/cancel`,
        { reason: 'Test cancellation' },
        { headers: authHeaders() },
      );

      expectStatus(cancelResp, 400);
    });
  });

  // ============================================================================
  // Order Refund Tests
  // ============================================================================

  describe('Refunds', () => {
    it('should list refunds for an order', async () => {
      const refundResp = await client.get(`/business/orders/${SEEDED_REFUND_ORDER_ID}/refunds`, {
        headers: authHeaders(),
      });

      expectStatus(refundResp, 200);
    });

    it('should create a partial refund', async () => {
      const refundResp = await client.post(
        `/business/orders/${SEEDED_REFUND_ORDER_ID}/refunds`,
        { orderPaymentId: SEEDED_ORDER_PAYMENT_ID, amount: '10.00', reason: 'Partial refund for damaged item' },
        { headers: authHeaders() },
      );

      expectStatus(refundResp, 201);
    });
  });

  // ============================================================================
  // Order Returns Tests
  // ============================================================================

  describe('Returns', () => {
    it('should list returns', async () => {
      const returnsResp = await client.get('/business/returns', {
        headers: authHeaders(),
      });

      expectStatus(returnsResp, 200);
    });

    it('should create a return request', async () => {
      const returnResp = await client.post(
        '/business/returns',
        {
          orderId: SEEDED_DELIVERED_ORDER_ID,
          items: [{ productId: '00000000-0000-0000-0000-000000000002', quantity: 1, reason: 'Item not as described' }],
          reason: 'Item not as described',
        },
        { headers: authHeaders() },
      );

      expectStatus(returnResp, 201);
    });
  });

  // ============================================================================
  // Customer Order Views
  // ============================================================================

  describe('Customer Order Views', () => {
    it('should list customer orders', async () => {
      if (!customerToken) return;

      const resp = await client.get('/customer/order', {
        headers: customerAuthHeaders(),
      });

      expect(resp.status).toBe(200);
      expect(resp.data.success).toBe(true);
    });

    it('should get order details as customer', async () => {
      if (!customerToken) return;

      const resp = await client.get(`/customer/order/${SEEDED_REFUND_ORDER_ID}`, {
        headers: customerAuthHeaders(),
      });

      expect(resp.status).toBe(200);
      expect(resp.data.success).toBe(true);
    });
  });

  // ============================================================================
  // Order Search & Filtering
  // ============================================================================

  describe('Search & Filtering', () => {
    it('should search orders by order number', async () => {
      const resp = await client.get('/business/orders', {
        params: { search: 'TEST' },
        headers: authHeaders(),
      });

      expect(resp.status).toBe(200);
      expect(resp.data.success).toBe(true);
    });

    it('should filter orders by payment status', async () => {
      const resp = await client.get('/business/orders', {
        params: { paymentStatus: 'paid' },
        headers: authHeaders(),
      });

      expect(resp.status).toBe(200);
      expect(resp.data.success).toBe(true);
    });

    it('should filter orders by date range', async () => {
      const resp = await client.get('/business/orders', {
        params: {
          startDate: '2020-01-01',
          endDate: '2030-12-31',
        },
        headers: authHeaders(),
      });

      expect(resp.status).toBe(200);
      expect(resp.data.success).toBe(true);
    });
  });
});
