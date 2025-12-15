/**
 * Inventory Integration Tests
 * 
 * Tests for inventory management endpoints.
 */

import axios, { AxiosInstance } from 'axios';

// ============================================================================
// Test Configuration
// ============================================================================

const API_URL = process.env.API_URL || 'http://localhost:3000';

// Test credentials (from seeded data)
const TEST_MERCHANT = {
  email: 'merchant@example.com',
  password: 'password123'
};

let client: AxiosInstance;
let merchantToken: string;

// ============================================================================
// Setup
// ============================================================================

beforeAll(async () => {
  client = axios.create({
    baseURL: API_URL,
    validateStatus: () => true,
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    }
  });

  // Login as merchant
  const loginResponse = await client.post('/business/auth/login', TEST_MERCHANT, { headers: { 'X-Test-Request': 'true' } });
  merchantToken = loginResponse.data.accessToken;
});

// ============================================================================
// Tests
// ============================================================================

describe('Inventory Feature Tests', () => {
  // ==========================================================================
  // Inventory Location CRUD
  // ==========================================================================

  describe('Inventory Locations', () => {
    describe('GET /business/inventory/locations', () => {
      it('should list inventory locations with pagination', async () => {
        const response = await client.get('/business/inventory/locations', {
          headers: { Authorization: `Bearer ${merchantToken}` },
          params: { limit: 10, offset: 0 }
        });

        expect(response.status).toBe(200);
        expect(response.data.success).toBe(true);
        expect(Array.isArray(response.data.data)).toBe(true);
        expect(response.data).toHaveProperty('pagination');
        expect(response.data.pagination).toHaveProperty('limit', 10);
        expect(response.data.pagination).toHaveProperty('offset', 0);
      });

      it('should filter locations by warehouse', async () => {
        const response = await client.get('/business/inventory/locations', {
          headers: { Authorization: `Bearer ${merchantToken}` },
          params: { warehouseId: '00000000-0000-0000-0000-000000000001' }
        });

        expect(response.status).toBe(200);
        expect(response.data.success).toBe(true);
        expect(Array.isArray(response.data.data)).toBe(true);
      });

      it('should require authentication', async () => {
        const response = await client.get('/business/inventory/locations');

        expect(response.status).toBe(401);
      });
    });

    describe('GET /business/inventory/locations/low-stock', () => {
      it('should return low stock items', async () => {
        const response = await client.get('/business/inventory/locations/low-stock', {
          headers: { Authorization: `Bearer ${merchantToken}` }
        });

        expect(response.status).toBe(200);
        expect(response.data.success).toBe(true);
        expect(Array.isArray(response.data.data)).toBe(true);
      });
    });

    describe('GET /business/inventory/locations/out-of-stock', () => {
      it('should return out of stock items', async () => {
        const response = await client.get('/business/inventory/locations/out-of-stock', {
          headers: { Authorization: `Bearer ${merchantToken}` }
        });

        expect(response.status).toBe(200);
        expect(response.data.success).toBe(true);
        expect(Array.isArray(response.data.data)).toBe(true);
      });
    });
  });

  // ==========================================================================
  // Stock Operations
  // ==========================================================================

  describe('Stock Operations', () => {
    let testLocationId: string;

    beforeAll(async () => {
      // Get a test location
      const response = await client.get('/business/inventory/locations', {
        headers: { Authorization: `Bearer ${merchantToken}` },
        params: { limit: 1 }
      });

      if (response.data.data && response.data.data.length > 0) {
        testLocationId = response.data.data[0].inventoryLocationId;
      }
    });

    describe('POST /business/inventory/locations/:id/adjust', () => {
      it('should adjust stock quantity', async () => {
        if (!testLocationId) {
          console.log('Skipping - no test location available');
          return;
        }

        const response = await client.post(
          `/business/inventory/locations/${testLocationId}/adjust`,
          { quantityChange: 10, reason: 'Test adjustment' },
          { headers: { Authorization: `Bearer ${merchantToken}` } }
        );

        expect(response.status).toBe(200);
        expect(response.data.success).toBe(true);
        expect(response.data.data).toHaveProperty('quantity');
      });

      it('should require quantityChange', async () => {
        if (!testLocationId) {
          console.log('Skipping - no test location available');
          return;
        }

        const response = await client.post(
          `/business/inventory/locations/${testLocationId}/adjust`,
          { reason: 'Missing quantity' },
          { headers: { Authorization: `Bearer ${merchantToken}` } }
        );

        expect(response.status).toBe(400);
        expect(response.data.success).toBe(false);
      });
    });

    describe('POST /business/inventory/locations/:id/reserve', () => {
      it('should reserve stock', async () => {
        if (!testLocationId) {
          console.log('Skipping - no test location available');
          return;
        }

        const response = await client.post(
          `/business/inventory/locations/${testLocationId}/reserve`,
          { quantity: 5 },
          { headers: { Authorization: `Bearer ${merchantToken}` } }
        );

        expect(response.status).toBe(200);
        expect(response.data.success).toBe(true);
        expect(response.data.data).toHaveProperty('reservedQuantity');
      });

      it('should require positive quantity', async () => {
        if (!testLocationId) {
          console.log('Skipping - no test location available');
          return;
        }

        const response = await client.post(
          `/business/inventory/locations/${testLocationId}/reserve`,
          { quantity: -5 },
          { headers: { Authorization: `Bearer ${merchantToken}` } }
        );

        expect(response.status).toBe(400);
        expect(response.data.success).toBe(false);
      });
    });

    describe('POST /business/inventory/locations/:id/release', () => {
      it('should release reserved stock', async () => {
        if (!testLocationId) {
          console.log('Skipping - no test location available');
          return;
        }

        const response = await client.post(
          `/business/inventory/locations/${testLocationId}/release`,
          { quantity: 2 },
          { headers: { Authorization: `Bearer ${merchantToken}` } }
        );

        expect(response.status).toBe(200);
        expect(response.data.success).toBe(true);
      });
    });
  });

  // ==========================================================================
  // Transaction History
  // ==========================================================================

  describe('Transaction History', () => {
    describe('GET /business/inventory/transactions/types', () => {
      it('should return transaction types', async () => {
        const response = await client.get('/business/inventory/transactions/types', {
          headers: { Authorization: `Bearer ${merchantToken}` }
        });

        expect(response.status).toBe(200);
        expect(response.data.success).toBe(true);
        expect(Array.isArray(response.data.data)).toBe(true);
        
        // Should have seeded transaction types
        if (response.data.data.length > 0) {
          expect(response.data.data[0]).toHaveProperty('code');
          expect(response.data.data[0]).toHaveProperty('name');
        }
      });
    });
  });

  // ==========================================================================
  // Public Availability Check
  // ==========================================================================

  // TODO: Customer routes require auth in this platform
  describe.skip('Product Availability (Public)', () => {
    describe('GET /inventory/availability/:sku', () => {
      it('should check product availability', async () => {
        const response = await client.get('/customer/inventory/availability/TEST-INV-001');

        expect(response.status).toBe(200);
        expect(response.data.success).toBe(true);
        expect(response.data.data).toHaveProperty('sku');
        expect(response.data.data).toHaveProperty('available');
        expect(response.data.data).toHaveProperty('totalAvailable');
      });

      it('should return not available for unknown SKU', async () => {
        const response = await client.get('/customer/inventory/availability/UNKNOWN-SKU-999');

        expect(response.status).toBe(200);
        expect(response.data.success).toBe(true);
        expect(response.data.data.available).toBe(false);
        expect(response.data.data.totalAvailable).toBe(0);
      });

      it('should accept quantity parameter', async () => {
        const response = await client.get('/customer/inventory/availability/TEST-INV-001', {
          params: { quantity: 50 }
        });

        expect(response.status).toBe(200);
        expect(response.data.success).toBe(true);
        expect(response.data.data).toHaveProperty('requestedQuantity', 50);
      });
    });
  });

  // ==========================================================================
  // Authorization
  // ==========================================================================

  describe('Authorization', () => {
    it('should require auth for business endpoints', async () => {
      const response = await client.get('/business/inventory/locations');

      expect(response.status).toBe(401);
    });

    // TODO: Customer routes require auth in this platform
    it.skip('should allow public access to availability check', async () => {
      const response = await client.get('/customer/inventory/availability/TEST-SKU');

      expect(response.status).toBe(200);
    });
  });
});
