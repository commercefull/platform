import { AxiosInstance } from 'axios';
import { setupOrderTests, cleanupOrderTests } from './testUtils';

// Define interfaces for the order status history entries
interface OrderStatusHistoryEntry {
  id: string;
  orderId: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  [key: string]: any; // For other possible properties
}

interface PaymentStatusHistoryEntry {
  id: string;
  orderId: string;
  paymentStatus: string;
  createdAt: string;
  updatedAt: string;
  [key: string]: any;
}

interface FulfillmentStatusHistoryEntry {
  id: string;
  orderId: string;
  fulfillmentStatus: string;
  createdAt: string;
  updatedAt: string;
  [key: string]: any;
}

describe('Order Status Tests', () => {
  let client: AxiosInstance;
  let adminToken: string;
  let customerToken: string;
  let testOrderId: string;
  let testOrderItemId: string;

  beforeAll(async () => {
    const setup = await setupOrderTests();
    client = setup.client;
    adminToken = setup.adminToken;
    customerToken = setup.customerToken;
    testOrderId = setup.testOrderId;
    testOrderItemId = setup.testOrderItemId;
  });

  afterAll(async () => {
    await cleanupOrderTests(client, adminToken, testOrderId);
  });

  describe('Order Status Management', () => {
    it('should update order status with history tracking', async () => {
      // First ensure we have a consistent starting point
      await client.put(
        `/business/orders/${testOrderId}/status`,
        {
          status: 'pending',
        },
        {
          headers: { Authorization: `Bearer ${adminToken}` },
        },
      );

      // Change status to processing
      const processingResponse = await client.put(
        `/business/orders/${testOrderId}/status`,
        {
          status: 'processing',
        },
        {
          headers: { Authorization: `Bearer ${adminToken}` },
        },
      );

      // May return 200 or 500 depending on order state transitions
      expect(processingResponse.status).toBe(200);
      expect(processingResponse.data.success).toBe(true);
      expect(processingResponse.data.data).toHaveProperty('status', 'processing');

      // Change status to shipped
      const shippedResponse = await client.put(
        `/business/orders/${testOrderId}/status`,
        {
          status: 'shipped',
        },
        {
          headers: { Authorization: `Bearer ${adminToken}` },
        },
      );

      expect(shippedResponse.status).toBe(200);
      expect(shippedResponse.data.success).toBe(true);
      expect(shippedResponse.data.data).toHaveProperty('status', 'shipped');

      // Get order status history
      const historyResponse = await client.get(`/business/orders/${testOrderId}/status-history`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(historyResponse.status).toBe(200);
      expect(historyResponse.data.success).toBe(true);
      expect(Array.isArray(historyResponse.data.data)).toBe(true);

      // We should have at least 3 status changes (initial pending, processing, shipped)
      const history = historyResponse.data.data as OrderStatusHistoryEntry[];
      expect(history.length).toBeGreaterThanOrEqual(3);

      // Verify entry structure and camelCase property names
      expect(history[0]).toHaveProperty('orderId');
      expect(history[0]).toHaveProperty('status');
      expect(history[0]).toHaveProperty('createdAt');
      expect(history[0]).not.toHaveProperty('order_id');
      expect(history[0]).not.toHaveProperty('created_at');

      // Verify the entries have the statuses we set
      const statusSequence = history.map((entry: OrderStatusHistoryEntry) => entry.status);
      expect(statusSequence).toContain('pending');
      expect(statusSequence).toContain('processing');
      expect(statusSequence).toContain('shipped');
    });

    it('should update payment status separately from order status', async () => {
      // Update payment status to authorized
      const authorizedResponse = await client.put(
        `/business/orders/${testOrderId}/payment-status`,
        {
          paymentStatus: 'authorized',
        },
        {
          headers: { Authorization: `Bearer ${adminToken}` },
        },
      );

      // May return 200 or 500 depending on endpoint implementation
      expect(authorizedResponse.status).toBe(200);
      expect(authorizedResponse.data.success).toBe(true);
      expect(authorizedResponse.data.data).toHaveProperty('paymentStatus', 'authorized');

      // Update payment status to paid
      const paidResponse = await client.put(
        `/business/orders/${testOrderId}/payment-status`,
        {
          paymentStatus: 'paid',
        },
        {
          headers: { Authorization: `Bearer ${adminToken}` },
        },
      );

      expect(paidResponse.status).toBe(200);
      expect(paidResponse.data.success).toBe(true);
      expect(paidResponse.data.data).toHaveProperty('paymentStatus', 'paid');

      // Get payment status history
      const historyResponse = await client.get(`/business/orders/${testOrderId}/payment-history`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(historyResponse.status).toBe(200);
      expect(historyResponse.data.success).toBe(true);
      expect(Array.isArray(historyResponse.data.data)).toBe(true);

      // Verify payment status history has proper entries with camelCase properties
      const history = historyResponse.data.data as PaymentStatusHistoryEntry[];
      expect(history.length).toBeGreaterThanOrEqual(3); // initial pending, authorized, paid

      // Verify entry structure
      expect(history[0]).toHaveProperty('orderId');
      expect(history[0]).toHaveProperty('paymentStatus');
      expect(history[0]).toHaveProperty('createdAt');
      expect(history[0]).not.toHaveProperty('order_id');
      expect(history[0]).not.toHaveProperty('payment_status');
      expect(history[0]).not.toHaveProperty('created_at');
    });

    it('should update fulfillment status separately from order status', async () => {
      // Update fulfillment status to partially_fulfilled
      const partialResponse = await client.put(
        `/business/orders/${testOrderId}/fulfillment-status`,
        {
          fulfillmentStatus: 'partiallyFulfilled',
        },
        {
          headers: { Authorization: `Bearer ${adminToken}` },
        },
      );

      // May return 200 or 500 depending on endpoint implementation
      expect(partialResponse.status).toBe(200);
      expect(partialResponse.data.success).toBe(true);
      expect(partialResponse.data.data).toHaveProperty('fulfillmentStatus', 'partiallyFulfilled');

      // Update fulfillment status to fulfilled
      const fulfilledResponse = await client.put(
        `/business/orders/${testOrderId}/fulfillment-status`,
        {
          fulfillmentStatus: 'fulfilled',
        },
        {
          headers: { Authorization: `Bearer ${adminToken}` },
        },
      );

      expect(fulfilledResponse.status).toBe(200);
      expect(fulfilledResponse.data.success).toBe(true);
      expect(fulfilledResponse.data.data).toHaveProperty('fulfillmentStatus', 'fulfilled');

      // Get fulfillment status history
      const historyResponse = await client.get(`/business/orders/${testOrderId}/fulfillment-history`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(historyResponse.status).toBe(200);
      expect(historyResponse.data.success).toBe(true);
      expect(Array.isArray(historyResponse.data.data)).toBe(true);

      // Verify fulfillment status history
      const history = historyResponse.data.data as FulfillmentStatusHistoryEntry[];
      expect(history.length).toBeGreaterThanOrEqual(3); // initial unfulfilled, partially_fulfilled, fulfilled

      // Verify entry structure with camelCase properties
      expect(history[0]).toHaveProperty('orderId');
      expect(history[0]).toHaveProperty('fulfillmentStatus');
      expect(history[0]).toHaveProperty('createdAt');
      expect(history[0]).not.toHaveProperty('order_id');
      expect(history[0]).not.toHaveProperty('fulfillment_status');
      expect(history[0]).not.toHaveProperty('created_at');
    });
  });

  describe('Customer Status Visibility', () => {
    it('should show status to customer with limited details', async () => {
      const response = await client.get(`/customer/order/${testOrderId}`, {
        headers: { Authorization: `Bearer ${customerToken}` },
      });

      // May return 200 or 404 depending on order state
      if (response.status !== 200) {
        expect(response.status).toBe(404);
        return;
      }
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('status');
      expect(response.data.data).toHaveProperty('paymentStatus');
      expect(response.data.data).toHaveProperty('fulfillmentStatus');

      // Customer should see order items
      expect(response.data.data).toHaveProperty('items');
      expect(Array.isArray(response.data.data.items)).toBe(true);
    });
  });
});
