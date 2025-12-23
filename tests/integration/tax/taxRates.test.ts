import { AxiosInstance } from 'axios';
import { createTestClient, loginTestAdmin, loginTestUser } from '../testUtils';

describe('Tax Rates API Integration Tests', () => {
  let client: AxiosInstance;
  let adminToken: string;
  let userToken: string;

  beforeAll(async () => {
    client = createTestClient();
    adminToken = await loginTestAdmin(client);
    userToken = await loginTestUser(client);
  });

  describe('GET /business/tax/rates', () => {
    it('should return tax rates when authenticated as admin', async () => {
      const response = await client.get('/business/tax/rates', {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(Array.isArray(response.data.data)).toBeTruthy();

      if (response.data.data.length > 0) {
        // Verify structure of a tax rate - uses taxRateId not id
        const taxRate = response.data.data[0];
        expect(taxRate).toHaveProperty('taxRateId');
        expect(taxRate).toHaveProperty('name');
        expect(taxRate).toHaveProperty('rate');
        expect(taxRate).toHaveProperty('taxCategoryId');
        expect(taxRate).toHaveProperty('taxZoneId');
      }
    });

    it('should reject access when not authenticated', async () => {
      const response = await client.get('/business/tax/rates');
      expect(response.status).toBe(401);
    });

    it('should reject access when authenticated as non-admin user', async () => {
      const response = await client.get('/business/tax/rates', {
        headers: { Authorization: `Bearer ${userToken}` },
      });
      expect(response.status).toBe(401);
    });

    it('should support filtering by country', async () => {
      const response = await client.get('/business/tax/rates?country=US', {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);

      // Check all returned tax rates are from US tax zones
      const data = response.data.data || [];
      if (data.length > 0) {
        // We'd need to check the taxZoneId for each rate and verify it's a US zone
        // This is a simplified check and would need to be adapted based on your actual implementation
        const taxRateIds = data.map((tr: any) => tr.taxRateId || tr.id);

        // Get the tax zones for these rates to verify
        const taxZonePromises = taxRateIds.map((id: string) =>
          client.get(`/business/tax/zones/${id}`, {
            headers: { Authorization: `Bearer ${adminToken}` },
          }),
        );

        const taxZones = await Promise.all(taxZonePromises);

        // Check that all tax zones include the US
        taxZones.forEach(zone => {
          if (zone.status === 200) {
            expect(zone.data.countries).toContain('US');
          }
        });
      }
    });
  });

  describe('POST /business/tax/rates', () => {
    it('should create a new tax rate when authenticated as admin', async () => {
      // First, get a valid tax category and tax zone to reference
      const categoriesResponse = await client.get('/business/tax/categories', {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      const zonesResponse = await client.get('/business/tax/zones', {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      const taxCategoryId = categoriesResponse.data[0].id;
      const taxZoneId = zonesResponse.data[0].id;

      const newTaxRate = {
        name: 'Test Tax Rate',
        description: 'Tax rate created during integration test',
        rate: 5.5,
        taxCategoryId,
        taxZoneId,
        type: 'percentage',
        priority: 1,
        isCompound: false,
        includeInPrice: false,
        isShippingTaxable: false,
        isActive: true,
        startDate: Date.now() / 1000, // Convert to unix timestamp
      };

      const response = await client.post('/business/tax/rates', newTaxRate, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(response.status).toBe(201);
      expect(response.data).toHaveProperty('id');
      expect(response.data.name).toBe(newTaxRate.name);
      expect(response.data.rate).toBe(newTaxRate.rate);

      // Store the id for use in other tests
      const createdTaxRateId = response.data.id;

      // Clean up - delete the tax rate we just created
      await client.delete(`/business/tax/rates/${createdTaxRateId}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
    });

    it('should validate required fields', async () => {
      const invalidTaxRate = {
        // Missing required fields
        name: 'Invalid Tax Rate',
      };

      const response = await client.post('/business/tax/rates', invalidTaxRate, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(response.status).toBe(400);
    });
  });

  describe('PUT /business/tax/rates/:id', () => {
    let testTaxRateId: string;

    beforeEach(async () => {
      // Create a tax rate for testing updates
      const categoriesResponse = await client.get('/business/tax/categories', {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      const zonesResponse = await client.get('/business/tax/zones', {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      if (categoriesResponse.data.length === 0 || zonesResponse.data.length === 0) {
        // Skip setup if we don't have required data

        return;
      }

      const taxCategoryId = categoriesResponse.data[0].id;
      const taxZoneId = zonesResponse.data[0].id;

      const newTaxRate = {
        name: 'Update Test Tax Rate',
        description: 'Tax rate for update testing',
        rate: 7.5,
        taxCategoryId,
        taxZoneId,
        type: 'percentage',
        priority: 1,
        isCompound: false,
        includeInPrice: false,
        isShippingTaxable: false,
        isActive: true,
        startDate: Date.now() / 1000,
      };

      const createResponse = await client.post('/business/tax/rates', newTaxRate, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      if (createResponse.status === 201) {
        testTaxRateId = createResponse.data.id;
      }
    });

    afterEach(async () => {
      // Clean up - delete the test tax rate if it exists
      if (testTaxRateId) {
        await client.delete(`/business/tax/rates/${testTaxRateId}`, {
          headers: { Authorization: `Bearer ${adminToken}` },
        });
      }
    });

    it('should update an existing tax rate when authenticated as admin', async () => {
      const updateData = {
        name: 'Updated Tax Rate Name',
        rate: 8.0,
        description: 'Updated description',
      };

      const response = await client.put(`/business/tax/rates/${testTaxRateId}`, updateData, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(response.status).toBe(200);
      expect(response.data.name).toBe(updateData.name);
      expect(response.data.rate).toBe(updateData.rate);
      expect(response.data.description).toBe(updateData.description);
    });

    it('should return 404 for non-existent tax rate', async () => {
      const response = await client.put(
        '/business/tax/rates/non-existent-id',
        { name: 'Test' },
        {
          headers: { Authorization: `Bearer ${adminToken}` },
        },
      );

      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /business/tax/rates/:id', () => {
    let testTaxRateId: string;

    beforeEach(async () => {
      // Create a tax rate for testing deletion
      const categoriesResponse = await client.get('/business/tax/categories', {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      const zonesResponse = await client.get('/business/tax/zones', {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      if (categoriesResponse.data.length === 0 || zonesResponse.data.length === 0) {
        // Skip setup if we don't have required data

        return;
      }

      const taxCategoryId = categoriesResponse.data[0].id;
      const taxZoneId = zonesResponse.data[0].id;

      const newTaxRate = {
        name: 'Delete Test Tax Rate',
        description: 'Tax rate for deletion testing',
        rate: 9.0,
        taxCategoryId,
        taxZoneId,
        type: 'percentage',
        priority: 1,
        isCompound: false,
        includeInPrice: false,
        isShippingTaxable: false,
        isActive: true,
        startDate: Date.now() / 1000,
      };

      const createResponse = await client.post('/business/tax/rates', newTaxRate, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      if (createResponse.status === 201) {
        testTaxRateId = createResponse.data.id;
      }
    });

    it('should delete a tax rate when authenticated as admin', async () => {
      const response = await client.delete(`/business/tax/rates/${testTaxRateId}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(response.status).toBe(200);

      // Verify it's really gone
      const getResponse = await client.get(`/business/tax/rates/${testTaxRateId}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(getResponse.status).toBe(404);
    });

    it('should return 404 for non-existent tax rate', async () => {
      const response = await client.delete('/business/tax/rates/non-existent-id', {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(response.status).toBe(404);
    });
  });
});
