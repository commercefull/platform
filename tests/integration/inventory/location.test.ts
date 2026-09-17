import { AxiosInstance } from 'axios';
import { randomUUID } from 'node:crypto';
import { SEEDED_INVENTORY_LOCATION_ID } from './testUtils';
import { createTestClient, loginTestAdmin } from '../testUtils';

describe('Inventory Location Tests', () => {
  let client: AxiosInstance;
  let adminToken: string;
  const testLocationId = SEEDED_INVENTORY_LOCATION_ID;
  let additionalLocationId: string;

  beforeAll(async () => {
    client = createTestClient();
    adminToken = await loginTestAdmin(client);
  });

  describe('Location CRUD Operations', () => {
    it('should get a location by ID', async () => {
      const response = await client.get(`/business/inventory/locations/${testLocationId}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      // DB returns inventoryLocationId, not id
      const locationId = response.data.data.inventoryLocationId || response.data.data.id;
      expect(locationId).toBe(testLocationId);
    });

    it('should list all active locations', async () => {
      const response = await client.get('/business/inventory/locations', {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(Array.isArray(response.data.data)).toBe(true);

      // Our test location should be in the list - uses inventoryLocationId
      const testLocation = response.data.data.find(
        (loc: Record<string, unknown>) => (loc.inventoryLocationId || loc.id) === testLocationId,
      );
      expect(testLocation).toBeDefined();
    });

    it('should create a new location', async () => {
      const newLocation = {
        name: `Test Store ${randomUUID().substring(0, 8)}`,
        type: 'store',
        address: '456 Test Blvd',
        city: 'Testopolis',
        state: 'TS',
        country: 'Testland',
        postalCode: '54321',
        isActive: true,
      };

      const response = await client.post('/business/inventory/locations', newLocation, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(response.status).toBe(201);
      expect(response.data.success).toBe(true);
      // DB returns inventoryLocationId, not id
      expect(response.data.data.inventoryLocationId || response.data.data.id).toBeTruthy();
      expect(response.data.data).toHaveProperty('name', newLocation.name);

      // Save ID for cleanup - uses inventoryLocationId
      additionalLocationId = response.data.data.inventoryLocationId || response.data.data.id;
    });

    it('should update a location', async () => {
      const updateData = {
        name: `Updated Location ${randomUUID().substring(0, 8)}`,
        isActive: false,
      };

      const response = await client.put(`/business/inventory/locations/${additionalLocationId}`, updateData, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('name', updateData.name);
      expect(response.data.data).toHaveProperty('isActive', updateData.isActive);
    });

    it('should only return active locations with the isActive filter', async () => {
      const response = await client.get('/business/inventory/locations', {
        headers: { Authorization: `Bearer ${adminToken}` },
        params: { includeInactive: false },
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);

      // All returned locations should be active (if isActive property exists)
      response.data.data.forEach((location: Record<string, unknown>) => {
        if (Object.prototype.hasOwnProperty.call(location, 'isActive')) {
          expect(location.isActive).toBe(true);
        }
      });

      // Our inactive location should not be in the results
      const inactiveLocation = response.data.data.find(
        (loc: Record<string, unknown>) => (loc.inventoryLocationId || loc.id) === additionalLocationId,
      );
      expect(inactiveLocation).toBeUndefined();
    });
  });
});
