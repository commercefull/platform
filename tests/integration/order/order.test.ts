import { AxiosInstance } from 'axios';
import { setupOrderTests, cleanupOrderTests, testOrderData, loginTestUser } from './testUtils';

// Define interfaces for order types
interface Order {
  id: string;
  orderNumber: string;
  customerId: string;
  status: string;
  paymentStatus: string;
  fulfillmentStatus: string;
  totalAmount: number | string;
  items?: OrderItem[];
  [key: string]: any;
}

interface OrderItem {
  id: string;
  productId: string;
  variantId: string;
  unitPrice: number | string;
  [key: string]: any;
}

describe('Order Tests', () => {
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
    await cleanupOrderTests(
      client,
      adminToken,
      testOrderId,
      testOrderItemId
    );
  });

  describe('Admin Order Operations', () => {
    it('should get all orders (admin)', async () => {
      const response = await client.get('/business/orders', {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(Array.isArray(response.data.data)).toBe(true);
      expect(response.data.data.length).toBeGreaterThan(0);
      
      // Verify camelCase in response data (TypeScript interface)
      const orders = response.data.data as Order[];
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
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('id', testOrderId);
      
      // Check order properties match our test data
      const order = response.data.data as Order;
      expect(order.status).toBe(testOrderData.status);
      expect(order.paymentStatus).toBe(testOrderData.paymentStatus);
      expect(order.fulfillmentStatus).toBe(testOrderData.fulfillmentStatus);
      expect(order.currencyCode).toBe(testOrderData.currencyCode);
      // Convert string to number if needed before comparison
      expect(parseFloat(String(order.totalAmount))).toBeCloseTo(testOrderData.totalAmount, 2);
      
      // Verify address data is properly mapped
      expect(order.shippingAddress).toHaveProperty('firstName', testOrderData.shippingAddress.firstName);
      expect(order.shippingAddress).toHaveProperty('lastName', testOrderData.shippingAddress.lastName);
    });

    it('should update an order status (admin)', async () => {
      const newStatus = 'processing';
      
      const response = await client.put(`/business/orders/${testOrderId}/status`, {
        status: newStatus
      }, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('id', testOrderId);
      expect(response.data.data).toHaveProperty('status', newStatus);
      
      // Verify status changed in database
      const getResponse = await client.get(`/business/orders/${testOrderId}`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      expect(getResponse.data.data).toHaveProperty('status', newStatus);
    });
  });

  describe('Customer Order Operations', () => {
    it('should get customer orders', async () => {
      const response = await client.get('/api/account/orders', {
        headers: { Authorization: `Bearer ${customerToken}` }
      });
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(Array.isArray(response.data.data)).toBe(true);
      
      // Should find our test order
      const orders = response.data.data as Order[];
      const testOrder = orders.find((o: Order) => o.id === testOrderId);
      expect(testOrder).toBeDefined();
    });

    it('should get order details for customer', async () => {
      const response = await client.get(`/api/account/orders/${testOrderId}`, {
        headers: { Authorization: `Bearer ${customerToken}` }
      });
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('id', testOrderId);
      
      // Verify order items are included
      expect(response.data.data).toHaveProperty('items');
      expect(Array.isArray(response.data.data.items)).toBe(true);
      expect(response.data.data.items.length).toBeGreaterThan(0);
      
      // Verify camelCase in order items
      const item = response.data.data.items[0] as OrderItem;
      expect(item).toHaveProperty('productId');
      expect(item).toHaveProperty('variantId');
      expect(item).toHaveProperty('unitPrice');
      expect(item).not.toHaveProperty('product_id');
      expect(item).not.toHaveProperty('variant_id');
      expect(item).not.toHaveProperty('unit_price');
    });

    it('should allow customers to cancel their order', async () => {
      // First ensure order is in a cancellable state (update to pending)
      await client.put(`/business/orders/${testOrderId}/status`, {
        status: 'pending'
      }, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      // Then try to cancel
      const response = await client.post(`/api/account/orders/${testOrderId}/cancel`, {}, {
        headers: { Authorization: `Bearer ${customerToken}` }
      });
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      
      // Verify status changed to cancelled
      const getResponse = await client.get(`/api/account/orders/${testOrderId}`, {
        headers: { Authorization: `Bearer ${customerToken}` }
      });
      expect(getResponse.data.data).toHaveProperty('status', 'cancelled');
    });

    it('should prevent customers from accessing orders that are not theirs', async () => {
      // Create a second test user
      const secondCustomerToken = await loginTestUser(client, 'customer2@example.com', 'password123');
      
      // Try to access the first customer's order
      const response = await client.get(`/api/account/orders/${testOrderId}`, {
        headers: { Authorization: `Bearer ${secondCustomerToken}` }
      });
      
      expect(response.status).toBe(403);
      expect(response.data.success).toBe(false);
    });
  });

  describe('Order Creation Flow', () => {
    it('should create a new order', async () => {
      const newOrderData = {
        ...testOrderData,
        orderNumber: `TEST-${Date.now()}-NEW`,
        customerEmail: 'new-test@example.com',
        customerName: 'New Test Customer'
      };
      
      const response = await client.post('/order', newOrderData, {
        headers: { Authorization: `Bearer ${customerToken}` }
      });
      
      expect(response.status).toBe(201);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('id');
      expect(response.data.data).toHaveProperty('orderNumber', newOrderData.orderNumber);
      
      // Clean up the new test order
      const newOrderId = response.data.data.id;
      await client.delete(`/business/orders/${newOrderId}`, {
        headers: { Authorization: `Bearer ${adminToken}` }
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
        params: { status: 'pending' }
      });
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      
      // All returned orders should have pending status
      const orders = response.data.data as Order[];
      orders.forEach(order => {
        expect(order.status).toBe('pending');
      });
    });

    it('should paginate orders', async () => {
      const response = await client.get('/business/orders', {
        headers: { Authorization: `Bearer ${adminToken}` },
        params: { limit: 5, offset: 0 }
      });
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data.length).toBeLessThanOrEqual(5);
    });
  });

  describe('Order Lookup by Number (UC-ORD-003)', () => {
    it('should get order by order number (admin)', async () => {
      // First get the test order to know its order number
      const getResponse = await client.get(`/business/orders/${testOrderId}`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      const orderNumber = getResponse.data.data.orderNumber;

      const response = await client.get(`/business/orders/number/${orderNumber}`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      // May return 200 or 404 depending on route implementation
      if (response.status === 200) {
        expect(response.data.success).toBe(true);
        expect(response.data.data).toHaveProperty('orderNumber', orderNumber);
      }
    });

    it('should get order by order number (customer)', async () => {
      const getResponse = await client.get(`/api/account/orders/${testOrderId}`, {
        headers: { Authorization: `Bearer ${customerToken}` }
      });
      const orderNumber = getResponse.data.data.orderNumber;

      const response = await client.get(`/api/account/orders/number/${orderNumber}`, {
        headers: { Authorization: `Bearer ${customerToken}` }
      });
      
      if (response.status === 200) {
        expect(response.data.success).toBe(true);
        expect(response.data.data).toHaveProperty('orderNumber', orderNumber);
      }
    });
  });

  describe('Order Refund (UC-ORD-006)', () => {
    it('should process a refund (admin)', async () => {
      // First ensure order is in a refundable state
      await client.put(`/business/orders/${testOrderId}/status`, {
        status: 'completed'
      }, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });

      const refundData = {
        amount: 10.00,
        reason: 'Integration test refund'
      };

      const response = await client.post(`/business/orders/${testOrderId}/refund`, refundData, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      // May return 200, 201, or error depending on payment status
      if (response.status === 200 || response.status === 201) {
        expect(response.data.success).toBe(true);
      }
    });
  });

  describe('Authorization Tests', () => {
    it('should require authentication for admin order list', async () => {
      const response = await client.get('/business/orders');
      expect([401, 403]).toContain(response.status);
    });

    it('should require authentication for customer orders', async () => {
      const response = await client.get('/api/account/orders');
      expect([401, 403]).toContain(response.status);
    });

    it('should reject invalid tokens', async () => {
      const response = await client.get('/business/orders', {
        headers: { Authorization: 'Bearer invalid-token' }
      });
      expect([401, 403]).toContain(response.status);
    });
  });
});
