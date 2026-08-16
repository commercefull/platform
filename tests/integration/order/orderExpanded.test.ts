/**
 * Order Expanded Tests
 * Tests: refunds, cancellations, returns, status transitions, order items
 */

import { AxiosInstance } from 'axios';
import { setupOrderTests } from './testUtils';
import { expectStatus } from '../testUtils';

describe('Order Expanded Tests', () => {
  let client: AxiosInstance;
  let adminToken: string;
  let customerToken: string;

  beforeAll(async () => {
    jest.setTimeout(30000);
    const setup = await setupOrderTests();
    client = setup.client;
    adminToken = setup.adminToken;
    customerToken = setup.customerToken;
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
      const resp = await client.get('/business/orders', {
        params: { status: 'pending' },
        headers: authHeaders(),
      });

      if (resp.data.data?.length > 0) {
        const orderId = resp.data.data[0].orderId;
        const historyResp = await client.get(`/business/orders/${orderId}/status-history`, {
          headers: authHeaders(),
        });

        expectStatus(historyResp, 200);
        expect(historyResp.data.success).toBe(true);
      }
    });

    it('should update order status', async () => {
      const resp = await client.get('/business/orders', {
        params: { status: 'pending' },
        headers: authHeaders(),
      });

      if (resp.data.data?.length > 0) {
        const orderId = resp.data.data[0].orderId;
        const updateResp = await client.patch(
          `/business/orders/${orderId}/status`,
          { status: 'processing' },
          { headers: authHeaders() },
        );

        expectStatus(updateResp, 200);
      }
    });
  });

  // ============================================================================
  // Order Cancellation Tests
  // ============================================================================

  describe('Cancellations', () => {
    it('should cancel an order', async () => {
      const resp = await client.get('/business/orders', {
        params: { status: 'pending' },
        headers: authHeaders(),
      });

      if (resp.data.data?.length > 0) {
        const orderId = resp.data.data[0].orderId;
        const cancelResp = await client.post(
          `/business/orders/${orderId}/cancel`,
          { reason: 'Customer requested cancellation' },
          { headers: authHeaders() },
        );

        expectStatus(cancelResp, 200);
      }
    });

    it('should reject cancellation of already delivered order', async () => {
      const resp = await client.get('/business/orders', {
        params: { status: 'delivered' },
        headers: authHeaders(),
      });

      if (resp.data.data?.length > 0) {
        const orderId = resp.data.data[0].orderId;
        const cancelResp = await client.post(
          `/business/orders/${orderId}/cancel`,
          { reason: 'Test cancellation' },
          { headers: authHeaders() },
        );

        expectStatus(cancelResp, 400);
      }
    });
  });

  // ============================================================================
  // Order Refund Tests
  // ============================================================================

  describe('Refunds', () => {
    it('should list refunds for an order', async () => {
      const resp = await client.get('/business/orders', {
        headers: authHeaders(),
      });

      if (resp.data.data?.length > 0) {
        const orderId = resp.data.data[0].orderId;
        const refundResp = await client.get(`/business/orders/${orderId}/refunds`, {
          headers: authHeaders(),
        });

        expectStatus(refundResp, 200);
      }
    });

    it('should create a partial refund', async () => {
      const resp = await client.get('/business/orders', {
        params: { paymentStatus: 'paid' },
        headers: authHeaders(),
      });

      if (resp.data.data?.length > 0) {
        const orderId = resp.data.data[0].orderId;
        const refundResp = await client.post(
          `/business/orders/${orderId}/refunds`,
          { amount: 10.0, reason: 'Partial refund for damaged item' },
          { headers: authHeaders() },
        );

        expectStatus(refundResp, 201);
      }
    });
  });

  // ============================================================================
  // Order Returns Tests
  // ============================================================================

  describe('Returns', () => {
    it('should list returns for an order', async () => {
      const resp = await client.get('/business/orders', {
        headers: authHeaders(),
      });

      if (resp.data.data?.length > 0) {
        const orderId = resp.data.data[0].orderId;
        const returnsResp = await client.get(`/business/orders/${orderId}/returns`, {
          headers: authHeaders(),
        });

        expectStatus(returnsResp, 200);
      }
    });

    it('should create a return request', async () => {
      const resp = await client.get('/business/orders', {
        params: { status: 'delivered' },
        headers: authHeaders(),
      });

      if (resp.data.data?.length > 0) {
        const orderId = resp.data.data[0].orderId;
        const returnResp = await client.post(
          `/business/orders/${orderId}/returns`,
          { reason: 'Item not as described', items: [] },
          { headers: authHeaders() },
        );

        expectStatus(returnResp, 201);
      }
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

      const listResp = await client.get('/customer/order', {
        headers: customerAuthHeaders(),
      });

      if (listResp.data.data?.length > 0) {
        const orderId = listResp.data.data[0].orderId;
        const resp = await client.get(`/customer/orders/${orderId}`, {
          headers: customerAuthHeaders(),
        });

        expect(resp.status).toBe(200);
        expect(resp.data.success).toBe(true);
      }
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
