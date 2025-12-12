import { AxiosInstance } from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { setupInventoryTests, cleanupInventoryTests, testInventoryLocation } from './testUtils';

describe('Inventory Location Tests', () => {
  let client: AxiosInstance;
  let adminToken: string;
  let testLocationId: string;
  let testInventoryItemId: string;
  let additionalLocationId: string;

  beforeAll(async () => {
    const setup = await setupInventoryTests();
    client = setup.client;
    adminToken = setup.adminToken;
    testLocationId = setup.testLocationId;
    testInventoryItemId = setup.testInventoryItemId;
  });

  afterAll(async () => {
    // Clean up the original test data
    await cleanupInventoryTests(client, adminToken, testInventoryItemId, testLocationId);
    
    // Delete additional location if it was created
    if (additionalLocationId) {
      await client.delete(`/business/inventory/locations/${additionalLocationId}`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
    }
  });

  describe('Location CRUD Operations', () => {
    it('should get a location by ID', async () => {
      const response = await client.get(`/business/inventory/locations/${testLocationId}`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('id', testLocationId);
      expect(response.data.data).toHaveProperty('name', testInventoryLocation.name);
      expect(response.data.data).toHaveProperty('type', testInventoryLocation.type);
    });

    it('should list all active locations', async () => {
      const response = await client.get('/business/inventory/locations', {
        headers: { Authorization: `Bearer ${adminToken}` }
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(Array.isArray(response.data.data)).toBe(true);
      
      // Our test location should be in the list
      const testLocation = response.data.data.find((loc: any) => loc.id === testLocationId);
      expect(testLocation).toBeDefined();
    });

    it('should create a new location', async () => {
      const newLocation = {
        name: `Test Store ${uuidv4().substring(0, 8)}`,
        type: 'store',
        address: '456 Test Blvd',
        city: 'Testopolis',
        state: 'TS',
        country: 'Testland',
        postalCode: '54321',
        isActive: true
      };

      const response = await client.post('/business/inventory/locations', newLocation, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });

      expect(response.status).toBe(201);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('id');
      expect(response.data.data).toHaveProperty('name', newLocation.name);
      expect(response.data.data).toHaveProperty('type', newLocation.type);
      
      // Save ID for cleanup
      additionalLocationId = response.data.data.id;
    });

    it('should update a location', async () => {
      const updateData = {
        name: `Updated Location ${uuidv4().substring(0, 8)}`,
        isActive: false
      };

      const response = await client.put(`/business/inventory/locations/${additionalLocationId}`, updateData, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('name', updateData.name);
      expect(response.data.data).toHaveProperty('isActive', updateData.isActive);
    });

    it('should only return active locations with the isActive filter', async () => {
      const response = await client.get('/business/inventory/locations', {
        headers: { Authorization: `Bearer ${adminToken}` },
        params: { includeInactive: false }
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      
      // All returned locations should be active
      response.data.data.forEach((location: any) => {
        expect(location.isActive).toBe(true);
      });
      
      // Our inactive location should not be in the results
      const inactiveLocation = response.data.data.find((loc: any) => loc.id === additionalLocationId);
      expect(inactiveLocation).toBeUndefined();
    });
  });
});
