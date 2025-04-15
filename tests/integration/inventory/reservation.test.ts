import { AxiosInstance } from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { setupInventoryTests, cleanupInventoryTests } from './testUtils';

describe('Inventory Reservation Tests', () => {
  let client: AxiosInstance;
  let adminToken: string;
  let testProductId: string;
  let testLocationId: string;
  let testInventoryItemId: string;
  let testCartId: string;
  let testReservationId: string;

  beforeAll(async () => {
    const setup = await setupInventoryTests();
    client = setup.client;
    adminToken = setup.adminToken;
    testProductId = setup.testProductId;
    testLocationId = setup.testLocationId;
    testInventoryItemId = setup.testInventoryItemId;
    
    // Generate a test cart ID
    testCartId = `test-cart-${uuidv4()}`;
  });

  afterAll(async () => {
    await cleanupInventoryTests(client, adminToken, testInventoryItemId, testLocationId);
  });

  describe('Reservation Workflow', () => {
    it('should create a reservation for cart items', async () => {
      // First reset the inventory quantity to a known value
      await client.put(`/api/admin/inventory/items/${testInventoryItemId}`, {
        quantity: 100,
        reservedQuantity: 0,
        availableQuantity: 100
      }, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });

      const reservation = {
        inventoryId: testInventoryItemId,
        quantity: 5,
        cartId: testCartId,
        expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // Expire in 30 minutes
        status: 'active'
      };

      const response = await client.post('/api/inventory/cart/reserve', {
        items: [reservation]
      });
      
      expect(response.status).toBe(201);
      expect(response.data.success).toBe(true);
      expect(Array.isArray(response.data.data)).toBe(true);
      expect(response.data.data.length).toBe(1);
      expect(response.data.data[0]).toHaveProperty('inventoryId', testInventoryItemId);
      expect(response.data.data[0]).toHaveProperty('quantity', 5);
      
      // Save the reservation ID for later tests
      testReservationId = response.data.data[0].id;
    });

    it('should update inventory reserved quantity after reservation', async () => {
      const response = await client.get(`/api/admin/inventory/items/${testInventoryItemId}`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      expect(response.status).toBe(200);
      expect(response.data.data).toHaveProperty('quantity', 100);
      expect(response.data.data).toHaveProperty('reservedQuantity', 5);
      expect(response.data.data).toHaveProperty('availableQuantity', 95);
    });

    it('should get all reservations for a cart', async () => {
      const response = await client.get(`/api/inventory/cart/${testCartId}/reservations`);
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(Array.isArray(response.data.data)).toBe(true);
      expect(response.data.data.length).toBeGreaterThan(0);
      
      // Verify all returned reservations belong to the test cart
      response.data.data.forEach((reservation: any) => {
        expect(reservation.cartId).toBe(testCartId);
      });
    });

    it('should update a reservation status', async () => {
      const response = await client.put(`/api/admin/inventory/reservations/${testReservationId}/status`, {
        status: 'fulfilled'
      }, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('id', testReservationId);
      expect(response.data.data).toHaveProperty('status', 'fulfilled');
    });

    it('should release inventory when reservation is fulfilled', async () => {
      const response = await client.get(`/api/admin/inventory/items/${testInventoryItemId}`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      // Reserved quantity should be back to 0 since reservation was fulfilled
      expect(response.status).toBe(200);
      expect(response.data.data).toHaveProperty('reservedQuantity', 0);
      // But the total quantity should be reduced (since we fulfilled/consumed the reservation)
      expect(response.data.data).toHaveProperty('quantity', 95);
      expect(response.data.data).toHaveProperty('availableQuantity', 95);
    });

    it('should handle multiple reservations for same inventory item', async () => {
      // Create two more test cart IDs
      const testCartId2 = `test-cart-${uuidv4()}`;
      const testCartId3 = `test-cart-${uuidv4()}`;
      
      // Make two reservations
      await client.post('/api/inventory/cart/reserve', {
        items: [{
          inventoryId: testInventoryItemId,
          quantity: 10,
          cartId: testCartId2,
          expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
          status: 'active'
        }]
      });
      
      await client.post('/api/inventory/cart/reserve', {
        items: [{
          inventoryId: testInventoryItemId,
          quantity: 15,
          cartId: testCartId3,
          expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
          status: 'active'
        }]
      });
      
      // Check the reserved and available quantities
      const response = await client.get(`/api/admin/inventory/items/${testInventoryItemId}`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      expect(response.status).toBe(200);
      expect(response.data.data).toHaveProperty('quantity', 95);
      expect(response.data.data).toHaveProperty('reservedQuantity', 25); // 10 + 15
      expect(response.data.data).toHaveProperty('availableQuantity', 70); // 95 - 25
    });

    it('should release reservations for a cart', async () => {
      // Create another test cart ID
      const testCartId4 = `test-cart-${uuidv4()}`;
      
      // Make a reservation
      await client.post('/api/inventory/cart/reserve', {
        items: [{
          inventoryId: testInventoryItemId,
          quantity: 5,
          cartId: testCartId4,
          expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
          status: 'active'
        }]
      });
      
      // Now release this cart's reservations
      const releaseResponse = await client.post(`/api/inventory/cart/${testCartId4}/release`);
      
      expect(releaseResponse.status).toBe(200);
      expect(releaseResponse.data.success).toBe(true);
      
      // Check that the inventory has been updated
      const inventoryResponse = await client.get(`/api/admin/inventory/items/${testInventoryItemId}`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      // Reserved quantity should now be 25 (from previous test) and not include the 5 we just released
      expect(inventoryResponse.data.data.reservedQuantity).toBe(25);
    });

    it('should handle expired reservations', async () => {
      // Create a reservation that is already expired
      const expiredReservation = {
        inventoryId: testInventoryItemId,
        quantity: 8,
        cartId: `expired-cart-${uuidv4()}`,
        expiresAt: new Date(Date.now() - 60 * 1000).toISOString(), // 1 minute in the past
        status: 'active'
      };
      
      await client.post('/api/inventory/cart/reserve', {
        items: [expiredReservation]
      });
      
      // Run the expired reservations cleanup job
      const cleanupResponse = await client.post('/api/admin/inventory/reservations/cleanup', {}, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      expect(cleanupResponse.status).toBe(200);
      expect(cleanupResponse.data.success).toBe(true);
      
      // The expired reservation should now be marked as expired
      const reservationsResponse = await client.get('/api/admin/inventory/reservations', {
        headers: { Authorization: `Bearer ${adminToken}` },
        params: { status: 'expired' }
      });
      
      expect(reservationsResponse.status).toBe(200);
      expect(Array.isArray(reservationsResponse.data.data)).toBe(true);
      
      // Find our expired reservation
      const foundExpired = reservationsResponse.data.data.some((res: any) => 
        res.cartId === expiredReservation.cartId && res.status === 'expired'
      );
      
      expect(foundExpired).toBe(true);
    });
  });
});
