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
  options: Record<string, any>;
  costPrice?: number | string;
  profit?: number | string;
  metadata?: Record<string, any>;
  [key: string]: any;
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
    await cleanupOrderTests(
      client,
      adminToken,
      testOrderId,
      testOrderItemId
    );
  });

  describe('Admin Order Item Operations', () => {
    it('should get all items for an order (admin)', async () => {
      const response = await client.get(`/business/orders/${testOrderId}/items`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(Array.isArray(response.data.data)).toBe(true);
      expect(response.data.data.length).toBeGreaterThan(0);
      
      // Verify camelCase property names in response (TypeScript interface)
      const items = response.data.data as OrderItem[];
      expect(items[0]).toHaveProperty('productId');
      expect(items[0]).toHaveProperty('variantId');
      expect(items[0]).toHaveProperty('unitPrice');
      expect(items[0]).toHaveProperty('discountTotal');
      expect(items[0]).toHaveProperty('taxTotal');
      
      // Verify no snake_case properties are exposed in the API
      expect(items[0]).not.toHaveProperty('product_id');
      expect(items[0]).not.toHaveProperty('variant_id');
      expect(items[0]).not.toHaveProperty('unit_price');
      expect(items[0]).not.toHaveProperty('discount_total');
      expect(items[0]).not.toHaveProperty('tax_total');
    });

    it('should get an order item by ID (admin)', async () => {
      const response = await client.get(`/business/order-items/${testOrderItemId}`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('id', testOrderItemId);
      
      // Check order item properties match our test data
      const item = response.data.data as OrderItem;
      expect(item.name).toBe(testOrderItemData.name);
      expect(item.sku).toBe(testOrderItemData.sku);
      // Convert string to number if needed before comparison
      expect(parseFloat(String(item.unitPrice))).toBeCloseTo(testOrderItemData.unitPrice, 2);
      expect(item.quantity).toBe(testOrderItemData.quantity);
      
      // Verify options object
      expect(item.options).toEqual(testOrderItemData.options);
    });

    it('should create a new order item (admin)', async () => {
      const newItemData = {
        ...testOrderItemData,
        orderId: testOrderId,
        sku: `TEST-SKU-${Date.now()}`,
        name: 'New Test Product',
        quantity: 1,
        unitPrice: 29.99,
        price: 29.99,
        subtotal: 29.99,
        total: 29.99
      };
      
      const response = await client.post('/business/order-items', newItemData, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      expect(response.status).toBe(201);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('id');
      expect(response.data.data).toHaveProperty('name', newItemData.name);
      expect(response.data.data).toHaveProperty('sku', newItemData.sku);
      expect(parseFloat(String(response.data.data.unitPrice))).toBeCloseTo(newItemData.unitPrice, 2);
      
      // Clean up the new test item
      const newItemId = response.data.data.id;
      await client.delete(`/business/order-items/${newItemId}`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
    });

    it('should update an order item (admin)', async () => {
      const updateData = {
        quantity: 3,
        unitPrice: 39.99
      };
      
      const response = await client.put(`/business/order-items/${testOrderItemId}`, updateData, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('id', testOrderItemId);
      expect(response.data.data).toHaveProperty('quantity', updateData.quantity);
      expect(parseFloat(String(response.data.data.unitPrice))).toBeCloseTo(updateData.unitPrice, 2);
      
      // Verify subtotal recalculation
      const expectedSubtotal = updateData.quantity * updateData.unitPrice;
      expect(parseFloat(String(response.data.data.subtotal))).toBeCloseTo(expectedSubtotal, 2);
    });

    it('should recalculate order totals when items change', async () => {
      // Get current order totals
      const beforeResponse = await client.get(`/business/orders/${testOrderId}`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      const beforeTotals = beforeResponse.data.data;
      
      // Update an item quantity
      const updateData = {
        quantity: 5 // Increasing quantity
      };
      
      await client.put(`/business/order-items/${testOrderItemId}`, updateData, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      // Explicitly trigger order totals recalculation
      await client.post(`/business/orders/${testOrderId}/recalculate`, {}, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      // Get updated order totals
      const afterResponse = await client.get(`/business/orders/${testOrderId}`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      const afterTotals = afterResponse.data.data;
      
      // Verify totals have changed
      expect(parseFloat(String(afterTotals.subtotal))).toBeGreaterThan(parseFloat(String(beforeTotals.subtotal)));
      expect(parseFloat(String(afterTotals.totalAmount))).toBeGreaterThan(parseFloat(String(beforeTotals.totalAmount)));
    });
  });

  describe('Customer Order Item Views', () => {
    it('should include order items when customer views order details', async () => {
      const response = await client.get(`/api/account/orders/${testOrderId}`, {
        headers: { Authorization: `Bearer ${customerToken}` }
      });
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('items');
      expect(Array.isArray(response.data.data.items)).toBe(true);
      
      // Verify our test item is included
      const items = response.data.data.items as OrderItem[];
      const testItem = items.find((item: OrderItem) => item.id === testOrderItemId);
      expect(testItem).toBeDefined();
      expect(testItem!.sku).toBe(testOrderItemData.sku);
    });
    
    it('should not expose sensitive order item fields to customers', async () => {
      const response = await client.get(`/api/account/orders/${testOrderId}`, {
        headers: { Authorization: `Bearer ${customerToken}` }
      });
      
      // Find our test item
      const items = response.data.data.items as OrderItem[];
      const testItem = items.find((item: OrderItem) => item.id === testOrderItemId);
      
      // Verify sensitive fields are not exposed to customers
      expect(testItem).not.toHaveProperty('costPrice');
      expect(testItem).not.toHaveProperty('profit');
      expect(testItem).not.toHaveProperty('metadata');
    });
  });
});
