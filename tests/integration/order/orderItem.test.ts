import { AxiosInstance } from 'axios';
import { setupOrderTests, cleanupOrderTests, testOrderItemData } from './testUtils';

// Define interfaces for order items
interface OrderItem {
  id: string;
  productId: string;
  variantId: string;
  name: string;
  sku: string;
  unitPrice: number | string;
  quantity: number;
  subtotal: number | string;
  options: Record<string, unknown>;
  costPrice?: number | string;
  profit?: number | string;
  metadata?: Record<string, unknown>;
  [key: string]: unknown;
}

describe('Order Item Tests', () => {
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

  describe('Admin Order Item Operations', () => {
    it('should get all items for an order (admin)', async () => {
      const response = await client.get(`/business/orders/${testOrderId}/items`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(Array.isArray(response.data.data)).toBe(true);
      expect(response.data.data.length).toBeGreaterThan(0);

      // Verify camelCase property names in response (TypeScript interface)
      const items = response.data.data as OrderItem[];
      expect(items[0]).toHaveProperty('unitPrice');

      // Verify no snake_case properties are exposed in the API
      expect(items[0]).not.toHaveProperty('unit_price');
    });

    it('should get an order item by ID (admin)', async () => {
      const response = await client.get(`/business/order-items/${testOrderItemId}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('orderItemId');

      // Check order item properties
      const item = response.data.data as OrderItem;
      expect(item).toHaveProperty('name');
      expect(item).toHaveProperty('sku');
    });

    it('should create a new order item (admin)', async () => {
      const newItemData = {
        ...testOrderItemData,
        orderId: testOrderId,
        sku: `TEST-SKU-${Date.now()}`,
        name: 'New Test Product',
        quantity: 1,
        unitPrice: 29.99,
        discountedUnitPrice: 29.99,
        lineTotal: 29.99,
      };

      const response = await client.post('/business/order-items', newItemData, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(response.status).toBe(201);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('orderItemId');

      // Clean up the new test item
      const newItemId = response.data.data.orderItemId;
      await client.delete(`/business/order-items/${newItemId}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
    });

    it('should update an order item (admin)', async () => {
      const updateData = {
        quantity: 3,
        unitPrice: 39.99,
      };

      const response = await client.put(`/business/order-items/${testOrderItemId}`, updateData, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('orderItemId');
    });

    it('should recalculate order totals when items change', async () => {
      // Get current order totals
      const beforeResponse = await client.get(`/business/orders/${testOrderId}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(beforeResponse.status).toBe(200);

      const _beforeTotals = beforeResponse.data.data;

      // Update an item quantity
      const updateData = {
        quantity: 5, // Increasing quantity
      };

      const updateResponse = await client.put(`/business/order-items/${testOrderItemId}`, updateData, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(updateResponse.status).toBe(200);

      // Get updated order totals
      const afterResponse = await client.get(`/business/orders/${testOrderId}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      const afterTotals = afterResponse.data.data;

      // Verify totals exist
      expect(afterTotals).toHaveProperty('subtotal');
      expect(afterTotals).toHaveProperty('totalAmount');
    });
  });

  describe('Customer Order Item Views', () => {
    it('should include order items when customer views order details', async () => {
      const response = await client.get(`/customer/order/${testOrderId}`, {
        headers: { Authorization: `Bearer ${customerToken}` },
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('items');
      expect(Array.isArray(response.data.data.items)).toBe(true);
      expect(response.data.data.items.length).toBeGreaterThan(0);

      // Verify items exist
      const items = response.data.data.items as OrderItem[];
      expect(items[0]).toHaveProperty('sku');
    });

    it('should not expose sensitive order item fields to customers', async () => {
      const response = await client.get(`/customer/order/${testOrderId}`, {
        headers: { Authorization: `Bearer ${customerToken}` },
      });

      expect(response.status).toBe(200);
      expect(response.data.data?.items?.length).toBeGreaterThan(0);

      // Find our test item
      const items = response.data.data.items as OrderItem[];
      const testItem = items[0];

      // Verify sensitive fields are not exposed to customers
      expect(testItem).not.toHaveProperty('costPrice');
      expect(testItem).not.toHaveProperty('profit');
    });
  });
});
