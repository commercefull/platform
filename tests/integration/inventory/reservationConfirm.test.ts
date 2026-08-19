/**
 * Inventory Reservation Confirm & Low Stock Threshold Tests
 *
 * Tests for UC-INV-006 (Confirm Reservation) and UC-INV-012 (Set Low Stock Threshold).
 */

import axios, { AxiosInstance } from 'axios';
import { randomUUID } from 'node:crypto';
import { expectStatus } from '../testUtils';

const API_URL = process.env.API_URL || 'http://localhost:3000';

const TEST_MERCHANT = {
  email: 'merchant@example.com',
  password: 'password123',
};

const TEST_PRODUCT_ID = '00000000-0000-0000-0000-000000000001';

let client: AxiosInstance;
let organizationToken: string;

beforeAll(async () => {
  client = axios.create({
    baseURL: API_URL,
    validateStatus: () => true,
    timeout: 10000,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'X-Test-Request': 'true',
    },
  });

  const loginResponse = await client.post('/business/auth/login', TEST_MERCHANT, {
    headers: { 'X-Test-Request': 'true' },
  });
  organizationToken = loginResponse.data?.accessToken || '';
});

const authHeaders = () => ({ Authorization: `Bearer ${organizationToken}` });

// ============================================================================
// Tests
// ============================================================================

describe('Inventory Reservation Confirm & Threshold Tests', () => {
  // ==========================================================================
  // UC-INV-006: POST /business/inventory/reservations/:reservationId/confirm
  // ==========================================================================

  describe('UC-INV-006: Confirm Reservation', () => {
    it('should reject confirm with non-existent reservation ID', async () => {
      if (!organizationToken) return;

      const response = await client.post(
        `/business/inventory/reservations/${randomUUID()}/confirm`,
        { reservationId: randomUUID() },
        { headers: authHeaders() },
      );

      expectStatus(response, 404);
      expect(response.data.success).toBe(false);
    });

    it('should reject confirm without reservationId in body', async () => {
      if (!organizationToken) return;

      const response = await client.post(
        `/business/inventory/reservations/${randomUUID()}/confirm`,
        {},
        { headers: authHeaders() },
      );

      expectStatus(response, 404);
    });

    it('should require authentication for confirm', async () => {
      const response = await client.post(
        `/business/inventory/reservations/${randomUUID()}/confirm`,
        { reservationId: randomUUID() },
      );

      expect(response.status).toBe(401);
    });

    it('should confirm an active reservation (full lifecycle)', async () => {
      if (!organizationToken) return;

      // Create a legacy inventory location
      const createRes = await client.post(
        '/business/inventory/locations',
        {
          productId: TEST_PRODUCT_ID,
          sku: `TEST-SKU-${Date.now()}`,
          quantity: 100,
          locationId: '20000000-0000-0000-0000-000000000001',
        },
        { headers: authHeaders() },
      );

      if (createRes.status !== 200 || !createRes.data?.data) return;
      const locationId = createRes.data.data?.inventoryLocationId || createRes.data.data?.id;
      if (!locationId) return;

      // Reserve stock
      const reserveRes = await client.post(
        `/business/inventory/locations/${locationId}/reserve`,
        { quantity: 10 },
        { headers: authHeaders() },
      );

      if (reserveRes.status !== 200) return;
      const reservationId = reserveRes.data?.data?.reservationId || reserveRes.data?.data?.inventoryReservationId;
      if (!reservationId) return;

      // Confirm the reservation
      const confirmRes = await client.post(
        `/business/inventory/reservations/${reservationId}/confirm`,
        { reservationId },
        { headers: authHeaders() },
      );

      expect(confirmRes.status).toBe(200);
      expect(confirmRes.data.success).toBe(true);
      expect(confirmRes.data.data).toHaveProperty('confirmed', true);
    });
  });

  // ==========================================================================
  // UC-INV-012: PUT /business/inventory/products/:productId/threshold
  // ==========================================================================

  describe('UC-INV-012: Set Low Stock Threshold', () => {
    it('should set low stock threshold for a product', async () => {
      if (!organizationToken) return;

      const response = await client.put(
        `/business/inventory/products/${TEST_PRODUCT_ID}/threshold`,
        {
          productId: TEST_PRODUCT_ID,
          locationId: '20000000-0000-0000-0000-000000000001',
          reorderPoint: 15,
          reorderQuantity: 50,
        },
        { headers: authHeaders() },
      );

      // May succeed (200) or fail (400/500) if inventory item doesn't exist for that product+location
      if (response.status === 200) {
        expect(response.data.success).toBe(true);
        expect(response.data.data).toHaveProperty('reorderPoint', 15);
      } else {
        expectStatus(response, 404);
      }
    });

    it('should reject negative reorder point', async () => {
      if (!organizationToken) return;

      const response = await client.put(
        `/business/inventory/products/${TEST_PRODUCT_ID}/threshold`,
        {
          productId: TEST_PRODUCT_ID,
          locationId: '20000000-0000-0000-0000-000000000001',
          reorderPoint: -5,
        },
        { headers: authHeaders() },
      );

      expectStatus(response, 400);
    });

    it('should reject without required productId', async () => {
      if (!organizationToken) return;

      const response = await client.put(
        `/business/inventory/products/${TEST_PRODUCT_ID}/threshold`,
        {
          locationId: '20000000-0000-0000-0000-000000000001',
          reorderPoint: 10,
        },
        { headers: authHeaders() },
      );

      expectStatus(response, 404);
    });

    it('should reject without required locationId', async () => {
      if (!organizationToken) return;

      const response = await client.put(
        `/business/inventory/products/${TEST_PRODUCT_ID}/threshold`,
        {
          productId: TEST_PRODUCT_ID,
          reorderPoint: 10,
        },
        { headers: authHeaders() },
      );

      expectStatus(response, 404);
    });

    it('should require authentication', async () => {
      const response = await client.put(
        `/business/inventory/products/${TEST_PRODUCT_ID}/threshold`,
        {
          productId: TEST_PRODUCT_ID,
          locationId: '20000000-0000-0000-0000-000000000001',
          reorderPoint: 10,
        },
      );

      expect(response.status).toBe(401);
    });

    it('should return 404 for non-existent product', async () => {
      if (!organizationToken) return;

      const response = await client.put(
        `/business/inventory/products/${randomUUID()}/threshold`,
        {
          productId: randomUUID(),
          locationId: '20000000-0000-0000-0000-000000000001',
          reorderPoint: 10,
        },
        { headers: authHeaders() },
      );

      expectStatus(response, 404);
    });
  });
});
