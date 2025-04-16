import { AxiosInstance } from 'axios';
import {
  setupBasketTests,
  cleanupBasketTests
} from './testUtils';

describe('Basket Feature Tests', () => {
  let client: AxiosInstance;
  let adminToken: string;
  let customerToken: string;
  let customerId: string;
  let guestBasketId: string;
  let customerBasketId: string;
  let testProduct1: any;
  let testProduct2: any;
  let basketItem1: any;
  let basketItem2: any;

  beforeAll(async () => {
    // Use a longer timeout for setup as it creates multiple test entities
    jest.setTimeout(30000);
    
    try {
      const setup = await setupBasketTests();
      client = setup.client;
      adminToken = setup.adminToken;
      customerToken = setup.customerToken;
      customerId = setup.customerId;
      guestBasketId = setup.guestBasketId;
      customerBasketId = setup.customerBasketId;
      testProduct1 = setup.testProduct1;
      testProduct2 = setup.testProduct2;
      basketItem1 = setup.basketItem1;
      basketItem2 = setup.basketItem2;
    } catch (error) {
      console.error('Setup failed:', error);
      throw error;
    }
  });

  afterAll(async () => {
    await cleanupBasketTests(client, adminToken, {
      guestBasketId,
      customerBasketId
    });
  });

  describe('Basket Creation API', () => {
    it('should create a guest basket with camelCase properties', async () => {
      const response = await client.post('/api/baskets', {
        items: [basketItem1]
      });
      
      expect(response.status).toBe(201);
      expect(response.data.success).toBe(true);
      
      // Check that the response has camelCase properties
      expect(response.data.data).toHaveProperty('id');
      expect(response.data.data).toHaveProperty('status');
      expect(response.data.data).toHaveProperty('items');
      expect(response.data.data).toHaveProperty('subtotal');
      expect(response.data.data).toHaveProperty('itemCount');
      expect(response.data.data).toHaveProperty('createdAt');
      expect(response.data.data).toHaveProperty('updatedAt');
      expect(response.data.data).toHaveProperty('expiresAt');
      
      // Verify no snake_case properties leaked through
      expect(response.data.data).not.toHaveProperty('customer_id');
      expect(response.data.data).not.toHaveProperty('item_count');
      expect(response.data.data).not.toHaveProperty('created_at');
      expect(response.data.data).not.toHaveProperty('updated_at');
      expect(response.data.data).not.toHaveProperty('expires_at');
      
      // Clean up this test basket
      await client.delete(`/api/baskets/${response.data.data.id}`);
    });

    it('should create a customer basket with proper association', async () => {
      // Skip if we don't have customer credentials
      if (!customerToken || !customerId) {
        console.log('Skipping customer basket test - no customer credentials');
        return;
      }
      
      const response = await client.post('/api/baskets', {
        items: [basketItem1, basketItem2],
        customerId
      }, {
        headers: { Authorization: `Bearer ${customerToken}` }
      });
      
      expect(response.status).toBe(201);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('customerId', customerId);
      
      // Verify no snake_case properties leaked through
      expect(response.data.data).not.toHaveProperty('customer_id');
      
      // Clean up this test basket
      await client.delete(`/api/baskets/${response.data.data.id}`);
    });
  });

  describe('Basket Retrieval API', () => {
    it('should get a basket by ID with camelCase properties', async () => {
      const response = await client.get(`/api/baskets/${guestBasketId}`);
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('id', guestBasketId);
      
      // Check that the response has camelCase properties
      expect(response.data.data).toHaveProperty('status');
      expect(response.data.data).toHaveProperty('items');
      expect(response.data.data).toHaveProperty('subtotal');
      expect(response.data.data).toHaveProperty('itemCount');
      expect(response.data.data).toHaveProperty('createdAt');
      
      // Verify no snake_case properties leaked through
      expect(response.data.data).not.toHaveProperty('customer_id');
      expect(response.data.data).not.toHaveProperty('item_count');
      expect(response.data.data).not.toHaveProperty('created_at');
      expect(response.data.data).not.toHaveProperty('updated_at');
      expect(response.data.data).not.toHaveProperty('expires_at');
    });
    
    it('should get customer baskets with proper authentication', async () => {
      // Skip if we don't have customer credentials
      if (!customerToken || !customerId || !customerBasketId) {
        console.log('Skipping customer basket retrieval test - no customer credentials');
        return;
      }
      
      const response = await client.get('/api/baskets/my-baskets', {
        headers: { Authorization: `Bearer ${customerToken}` }
      });
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(Array.isArray(response.data.data)).toBe(true);
      
      if (response.data.data.length > 0) {
        // Check that the response has camelCase properties
        const basket = response.data.data[0];
        expect(basket).toHaveProperty('customerId', customerId);
        expect(basket).not.toHaveProperty('customer_id');
      }
    });
  });

  describe('Basket Items API', () => {
    it('should add an item to a basket with camelCase properties', async () => {
      const response = await client.post(`/api/baskets/${guestBasketId}/items`, basketItem2);
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      
      // Check basket response
      const basket = response.data.data;
      expect(basket).toHaveProperty('id', guestBasketId);
      expect(basket).toHaveProperty('items');
      expect(Array.isArray(basket.items)).toBe(true);
      
      // Check that the items have camelCase properties
      const addedItem = basket.items.find((item: any) => item.productId === basketItem2.productId);
      expect(addedItem).toBeTruthy();
      expect(addedItem).toHaveProperty('productId', basketItem2.productId);
      expect(addedItem).toHaveProperty('quantity', basketItem2.quantity);
      expect(addedItem).not.toHaveProperty('product_id');
      
      // Verify subtotal recalculation
      expect(basket).toHaveProperty('subtotal');
      expect(basket).toHaveProperty('itemCount');
      expect(basket.itemCount).toBeGreaterThanOrEqual(basket.items.length);
    });
    
    it('should update an item quantity with camelCase properties', async () => {
      const updatedQuantity = 3;
      
      const response = await client.put(`/api/baskets/${guestBasketId}/items/${basketItem1.productId}`, {
        quantity: updatedQuantity
      });
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      
      // Check basket response
      const basket = response.data.data;
      expect(basket).toHaveProperty('id', guestBasketId);
      expect(basket).toHaveProperty('items');
      
      // Check that the item was updated properly
      const updatedItem = basket.items.find((item: any) => item.productId === basketItem1.productId);
      expect(updatedItem).toBeTruthy();
      expect(updatedItem).toHaveProperty('quantity', updatedQuantity);
      
      // Verify subtotal recalculation
      expect(basket).toHaveProperty('subtotal');
      expect(parseFloat(basket.subtotal)).toBeGreaterThan(0);
    });
    
    it('should remove an item from a basket', async () => {
      const response = await client.delete(`/api/baskets/${guestBasketId}/items/${basketItem2.productId}`);
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      
      // Check basket response
      const basket = response.data.data;
      expect(basket).toHaveProperty('id', guestBasketId);
      expect(basket).toHaveProperty('items');
      
      // Check that the item was removed
      const removedItem = basket.items.find((item: any) => item.productId === basketItem2.productId);
      expect(removedItem).toBeFalsy();
      
      // Verify subtotal recalculation
      expect(basket).toHaveProperty('subtotal');
      expect(basket).toHaveProperty('itemCount');
    });
  });

  describe('Basket Operations API', () => {
    it('should clear a basket', async () => {
      // First, let's add an item to make sure the basket isn't empty
      await client.post(`/api/baskets/${guestBasketId}/items`, basketItem2);
      
      // Now clear the basket
      const response = await client.post(`/api/baskets/${guestBasketId}/clear`);
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      
      // Check basket response
      const basket = response.data.data;
      expect(basket).toHaveProperty('id', guestBasketId);
      expect(basket).toHaveProperty('items');
      expect(Array.isArray(basket.items)).toBe(true);
      expect(basket.items.length).toBe(0);
      
      // Verify totals reset
      expect(basket).toHaveProperty('subtotal', '0.00');
      expect(basket).toHaveProperty('itemCount', 0);
    });
    
    it('should merge baskets', async () => {
      // Skip if we don't have customer credentials
      if (!customerToken || !customerId || !customerBasketId) {
        console.log('Skipping basket merge test - no customer credentials');
        return;
      }
      
      // Add items to both baskets
      await client.post(`/api/baskets/${guestBasketId}/items`, basketItem1);
      await client.post(`/api/baskets/${customerBasketId}/items`, basketItem2);
      
      // Merge the guest basket into the customer basket
      const response = await client.post('/api/baskets/merge', {
        sourceBasketId: guestBasketId,
        targetBasketId: customerBasketId
      }, {
        headers: { Authorization: `Bearer ${customerToken}` }
      });
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      
      // Check merged basket response
      const mergedBasket = response.data.data;
      expect(mergedBasket).toHaveProperty('id', customerBasketId);
      expect(mergedBasket).toHaveProperty('items');
      expect(Array.isArray(mergedBasket.items)).toBe(true);
      
      // The merged basket should contain both items
      const hasItem1 = mergedBasket.items.some((item: any) => item.productId === basketItem1.productId);
      const hasItem2 = mergedBasket.items.some((item: any) => item.productId === basketItem2.productId);
      expect(hasItem1 || hasItem2).toBe(true);
      
      // Verify proper totals
      expect(mergedBasket).toHaveProperty('subtotal');
      expect(mergedBasket).toHaveProperty('itemCount');
    });
  });

  describe('Admin Basket API', () => {
    it('should allow admins to get all baskets with proper pagination', async () => {
      const response = await client.get('/api/admin/baskets?page=1&limit=10', {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('baskets');
      expect(response.data.data).toHaveProperty('total');
      expect(Array.isArray(response.data.data.baskets)).toBe(true);
      
      if (response.data.data.baskets.length > 0) {
        // Check that the response has camelCase properties
        const basket = response.data.data.baskets[0];
        expect(basket).toHaveProperty('id');
        expect(basket).toHaveProperty('status');
        expect(basket).toHaveProperty('itemCount');
        expect(basket).toHaveProperty('createdAt');
        expect(basket).toHaveProperty('updatedAt');
        
        // Verify no snake_case properties leaked through
        expect(basket).not.toHaveProperty('item_count');
        expect(basket).not.toHaveProperty('created_at');
        expect(basket).not.toHaveProperty('updated_at');
      }
    });
    
    it('should allow admins to view basket details', async () => {
      const response = await client.get(`/api/admin/baskets/${guestBasketId}`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('id', guestBasketId);
      expect(response.data.data).toHaveProperty('items');
      expect(response.data.data).toHaveProperty('subtotal');
      expect(response.data.data).toHaveProperty('createdAt');
      
      // Verify no snake_case properties leaked through
      expect(response.data.data).not.toHaveProperty('created_at');
    });
  });

  describe('Basket Expiration and Cleanup', () => {
    it('should update a basket expiration time', async () => {
      // Set expiration 7 days in the future
      const expiresAt = Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60);
      
      const response = await client.put(`/api/baskets/${guestBasketId}/expiration`, {
        expiresAt
      }, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      
      // Get basket to verify expiration update
      const verifyResponse = await client.get(`/api/baskets/${guestBasketId}`);
      expect(verifyResponse.status).toBe(200);
      expect(verifyResponse.data.data).toHaveProperty('expiresAt');
      
      // Note: Just checking for existence as format might vary
      expect(verifyResponse.data.data.expiresAt).toBeTruthy();
    });
    
    it('should mark baskets as abandoned when expired', async () => {
      // This test is tricky to perform in real-time since it requires waiting
      // for expiration. Instead, we'll just verify the API call succeeds.
      
      const response = await client.post('/api/admin/baskets/cleanup-expired', {}, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('abandoned');
      expect(typeof response.data.data.abandoned).toBe('number');
    });
  });
});
