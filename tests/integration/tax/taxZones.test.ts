import { AxiosInstance } from 'axios';
import { createTestClient, loginTestAdmin, loginTestUser } from '../testUtils';

describe('Tax Zones API Integration Tests', () => {
  let client: AxiosInstance;
  let adminToken: string;
  let userToken: string;
  const createdZoneIds: string[] = [];

  beforeAll(async () => {
    client = createTestClient();
    adminToken = await loginTestAdmin(client);
    userToken = await loginTestUser(client);
  });

  afterAll(async () => {
    // Cleanup: delete any remaining test zones
    for (const id of createdZoneIds) {
      try {
        await client.delete(`/business/tax/zones/${id}`, {
          headers: { Authorization: `Bearer ${adminToken}` },
        });
      } catch {
        // ignore
      }
    }
  });

  const authHeaders = () => ({ Authorization: `Bearer ${adminToken}` });

  // ============================================================================
  // Tax Zone CRUD (UC-TAX-011 to UC-TAX-014)
  // ============================================================================

  describe('UC-TAX-011: List and Get Tax Zones', () => {
    it('should list tax zones when authenticated as admin', async () => {
      if (!adminToken) return;

      const response = await client.get('/business/tax/zones', {
        headers: authHeaders(),
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(Array.isArray(response.data.data)).toBe(true);
    });

    it('should reject access when not authenticated', async () => {
      const response = await client.get('/business/tax/zones');
      expect(response.status).toBe(401);
    });

    it('should reject access when authenticated as non-admin user', async () => {
      if (!userToken) return;

      const response = await client.get('/business/tax/zones', {
        headers: { Authorization: `Bearer ${userToken}` },
      });
      expect(response.status).toBe(401);
    });

    it('should filter zones by active status', async () => {
      if (!adminToken) return;

      const response = await client.get('/business/tax/zones?status=active', {
        headers: authHeaders(),
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
    });

    it('should get a tax zone by ID', async () => {
      if (!adminToken) return;

      // First create a zone to get
      const createResponse = await client.post(
        '/business/tax/zones',
        {
          name: 'Test Zone Get',
          code: `TZG${Date.now().toString(36)}`,
          countries: ['US'],
          isActive: true,
        },
        { headers: authHeaders() },
      );

      if (createResponse.data.success) {
        const zoneId = createResponse.data.data.id || createResponse.data.data.taxZoneId;
        createdZoneIds.push(zoneId);

        const response = await client.get(`/business/tax/zones/${zoneId}`, {
          headers: authHeaders(),
        });

        expect(response.status).toBe(200);
        expect(response.data.success).toBe(true);
        expect(response.data.data).toHaveProperty('id', zoneId);
      }
    });

    it('should return 404 for non-existent tax zone', async () => {
      if (!adminToken) return;

      const response = await client.get('/business/tax/zones/00000000-0000-0000-0000-000000000000', {
        headers: authHeaders(),
      });

      expect(response.status).toBe(404);
    });
  });

  describe('UC-TAX-012: Create Tax Zone', () => {
    it('should create a tax zone with valid data', async () => {
      if (!adminToken) return;

      const zoneData = {
        name: 'Test Tax Zone',
        code: `TTZ${Date.now().toString(36)}`,
        description: 'Test tax zone for integration tests',
        isDefault: false,
        countries: ['US', 'CA'],
        states: ['CA', 'NY'],
        isActive: true,
      };

      const response = await client.post('/business/tax/zones', zoneData, {
        headers: authHeaders(),
      });

      expect(response.status).toBe(201);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('id');
      expect(response.data.data).toHaveProperty('name', zoneData.name);
      expect(response.data.data).toHaveProperty('code', zoneData.code);
      expect(response.data.data).toHaveProperty('countries');
      createdZoneIds.push(response.data.data.id);
    });

    it('should reject creation without required fields (name)', async () => {
      if (!adminToken) return;

      const response = await client.post(
        '/business/tax/zones',
        { code: 'TEST123', countries: ['US'] },
        { headers: authHeaders() },
      );

      expect(response.status).toBe(400);
    });

    it('should reject creation without required fields (code)', async () => {
      if (!adminToken) return;

      const response = await client.post(
        '/business/tax/zones',
        { name: 'Missing Code', countries: ['US'] },
        { headers: authHeaders() },
      );

      expect(response.status).toBe(400);
    });

    it('should reject creation without required fields (countries)', async () => {
      if (!adminToken) return;

      const response = await client.post(
        '/business/tax/zones',
        { name: 'Missing Countries', code: 'NOCOUNTRY' },
        { headers: authHeaders() },
      );

      expect(response.status).toBe(400);
    });

    it('should reject creation with empty countries array', async () => {
      if (!adminToken) return;

      const response = await client.post(
        '/business/tax/zones',
        { name: 'Empty Countries', code: 'EMPTY1', countries: [] },
        { headers: authHeaders() },
      );

      expect(response.status).toBe(400);
    });
  });

  describe('UC-TAX-013: Update Tax Zone', () => {
    it('should update a tax zone name and description', async () => {
      if (!adminToken) return;

      // Create a zone first
      const createResponse = await client.post(
        '/business/tax/zones',
        { name: 'Update Test Zone', code: `UTZ${Date.now().toString(36)}`, countries: ['US'] },
        { headers: authHeaders() },
      );

      if (!createResponse.data.success) return;
      const zoneId = createResponse.data.data.id;
      createdZoneIds.push(zoneId);

      const response = await client.put(
        `/business/tax/zones/${zoneId}`,
        { name: 'Updated Zone Name', description: 'Updated description' },
        { headers: authHeaders() },
      );

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('name', 'Updated Zone Name');
    });

    it('should update zone countries', async () => {
      if (!adminToken) return;

      const createResponse = await client.post(
        '/business/tax/zones',
        { name: 'Country Update Zone', code: `CUZ${Date.now().toString(36)}`, countries: ['US'] },
        { headers: authHeaders() },
      );

      if (!createResponse.data.success) return;
      const zoneId = createResponse.data.data.id;
      createdZoneIds.push(zoneId);

      const response = await client.put(
        `/business/tax/zones/${zoneId}`,
        { countries: ['US', 'CA', 'MX'] },
        { headers: authHeaders() },
      );

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
    });

    it('should reject update with empty countries array', async () => {
      if (!adminToken) return;

      const createResponse = await client.post(
        '/business/tax/zones',
        { name: 'Reject Empty Zone', code: `REZ${Date.now().toString(36)}`, countries: ['US'] },
        { headers: authHeaders() },
      );

      if (!createResponse.data.success) return;
      const zoneId = createResponse.data.data.id;
      createdZoneIds.push(zoneId);

      const response = await client.put(
        `/business/tax/zones/${zoneId}`,
        { countries: [] },
        { headers: authHeaders() },
      );

      expect(response.status).toBe(400);
    });

    it('should return 404 when updating non-existent zone', async () => {
      if (!adminToken) return;

      const response = await client.put(
        '/business/tax/zones/00000000-0000-0000-0000-000000000000',
        { name: 'Non-existent' },
        { headers: authHeaders() },
      );

      expect(response.status).toBe(404);
    });
  });

  describe('UC-TAX-014: Delete Tax Zone', () => {
    it('should delete a tax zone', async () => {
      if (!adminToken) return;

      // Create a zone to delete
      const createResponse = await client.post(
        '/business/tax/zones',
        { name: 'Delete Test Zone', code: `DTZ${Date.now().toString(36)}`, countries: ['US'] },
        { headers: authHeaders() },
      );

      if (!createResponse.data.success) return;
      const zoneId = createResponse.data.data.id;

      const response = await client.delete(`/business/tax/zones/${zoneId}`, {
        headers: authHeaders(),
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);

      // Verify it's gone
      const getResponse = await client.get(`/business/tax/zones/${zoneId}`, {
        headers: authHeaders(),
      });
      expect(getResponse.status).toBe(404);
    });

    it('should return 404 when deleting non-existent zone', async () => {
      if (!adminToken) return;

      const response = await client.delete('/business/tax/zones/00000000-0000-0000-0000-000000000000', {
        headers: authHeaders(),
      });

      expect(response.status).toBe(404);
    });
  });
});
