import { AxiosInstance } from 'axios';
import { createTestClient, loginTestAdmin, loginTestUser } from '../testUtils';

describe('Tax Categories API Integration Tests', () => {
  let client: AxiosInstance;
  let adminToken: string;
  let userToken: string;

  beforeAll(async () => {
    client = createTestClient();
    adminToken = await loginTestAdmin(client);
    userToken = await loginTestUser(client);
  });

  describe('GET /business/tax/categories', () => {
    it('should return tax categories when authenticated as admin', async () => {
      const response = await client.get('/business/tax/categories', {
        headers: { Authorization: `Bearer ${adminToken}` }
      });

      expect(response.status).toBe(200);
      expect(Array.isArray(response.data)).toBeTruthy();
      
      if (response.data.length > 0) {
        // Verify structure of a tax category
        const taxCategory = response.data[0];
        expect(taxCategory).toHaveProperty('id');
        expect(taxCategory).toHaveProperty('name');
        expect(taxCategory).toHaveProperty('code');
        expect(taxCategory).toHaveProperty('isActive');
      }
    });

    it('should reject access when not authenticated', async () => {
      const response = await client.get('/business/tax/categories');
      expect(response.status).toBe(401);
    });

    it('should reject access when authenticated as non-admin user', async () => {
      const response = await client.get('/business/tax/categories', {
        headers: { Authorization: `Bearer ${userToken}` }
      });
      expect(response.status).toBe(403);
    });
  });

  describe('GET /api/tax/categories/:code', () => {
    it('should return a tax category by code for public API', async () => {
      // First get all categories to find a valid code
      const allCategoriesResponse = await client.get('/business/tax/categories', {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      if (allCategoriesResponse.data.length === 0) {
        console.log('Skipping test: no tax categories available');
        return;
      }
      
      const categoryCode = allCategoriesResponse.data[0].code;
      
      // Test the public endpoint
      const response = await client.get(`/api/tax/categories/${categoryCode}`);
      
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('id');
      expect(response.data).toHaveProperty('name');
      expect(response.data.code).toBe(categoryCode);
    });
    
    it('should return 404 for non-existent tax category code', async () => {
      const response = await client.get('/api/tax/categories/non-existent-code');
      expect(response.status).toBe(404);
    });
  });

  describe('POST /business/tax/categories', () => {
    it('should create a new tax category when authenticated as admin', async () => {
      const newTaxCategory = {
        name: 'Test Tax Category',
        code: `TEST-${Date.now()}`, // Ensure unique code
        description: 'Tax category created during integration test',
        isDefault: false,
        sortOrder: 100,
        isActive: true
      };
      
      const response = await client.post('/business/tax/categories', newTaxCategory, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      expect(response.status).toBe(201);
      expect(response.data).toHaveProperty('id');
      expect(response.data.name).toBe(newTaxCategory.name);
      expect(response.data.code).toBe(newTaxCategory.code);
      
      // Store the id for use in other tests and cleanup
      const createdTaxCategoryId = response.data.id;
      
      // Clean up - delete the tax category we just created
      await client.delete(`/business/tax/categories/${createdTaxCategoryId}`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
    });

    it('should validate required fields', async () => {
      const invalidTaxCategory = {
        // Missing required fields
        name: 'Invalid Tax Category'
        // No code provided
      };
      
      const response = await client.post('/business/tax/categories', invalidTaxCategory, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      expect(response.status).toBe(400);
    });
    
    it('should reject duplicate category codes', async () => {
      // First, create a category
      const newTaxCategory = {
        name: 'Test Tax Category',
        code: `DUPLICATE-${Date.now()}`, // Ensure unique code initially
        description: 'Tax category created during integration test',
        isDefault: false,
        sortOrder: 100,
        isActive: true
      };
      
      const firstResponse = await client.post('/business/tax/categories', newTaxCategory, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      if (firstResponse.status !== 201) {
        console.log('Skipping test: failed to create initial tax category');
        return;
      }
      
      const createdTaxCategoryId = firstResponse.data.id;
      
      // Try to create another category with the same code
      const duplicateTaxCategory = {
        name: 'Another Test Tax Category',
        code: newTaxCategory.code, // Same code as first category
        description: 'This should fail',
        isDefault: false,
        sortOrder: 101,
        isActive: true
      };
      
      const duplicateResponse = await client.post('/business/tax/categories', duplicateTaxCategory, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      expect(duplicateResponse.status).toBe(400);
      
      // Clean up - delete the tax category we created
      await client.delete(`/business/tax/categories/${createdTaxCategoryId}`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
    });
  });

  describe('PUT /business/tax/categories/:id', () => {
    let testCategoryId: string;
    
    beforeEach(async () => {
      // Create a tax category for testing updates
      const newTaxCategory = {
        name: 'Update Test Category',
        code: `UPDATE-${Date.now()}`,
        description: 'Tax category for update testing',
        isDefault: false,
        sortOrder: 200,
        isActive: true
      };
      
      const createResponse = await client.post('/business/tax/categories', newTaxCategory, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      if (createResponse.status === 201) {
        testCategoryId = createResponse.data.id;
      }
    });
    
    afterEach(async () => {
      // Clean up - delete the test category if it exists
      if (testCategoryId) {
        await client.delete(`/business/tax/categories/${testCategoryId}`, {
          headers: { Authorization: `Bearer ${adminToken}` }
        });
      }
    });
    
    it('should update an existing tax category when authenticated as admin', async () => {
      if (!testCategoryId) {
        console.log('Skipping test: failed to create test tax category');
        return;
      }
      
      const updateData = {
        name: 'Updated Category Name',
        description: 'Updated description',
        sortOrder: 201
      };
      
      const response = await client.put(`/business/tax/categories/${testCategoryId}`, updateData, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      expect(response.status).toBe(200);
      expect(response.data.name).toBe(updateData.name);
      expect(response.data.description).toBe(updateData.description);
      expect(response.data.sortOrder).toBe(updateData.sortOrder);
    });
    
    it('should return 404 for non-existent tax category', async () => {
      const response = await client.put('/business/tax/categories/non-existent-id', { name: 'Test' }, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /business/tax/categories/:id', () => {
    let testCategoryId: string;
    
    beforeEach(async () => {
      // Create a tax category for testing deletion
      const newTaxCategory = {
        name: 'Delete Test Category',
        code: `DELETE-${Date.now()}`,
        description: 'Tax category for deletion testing',
        isDefault: false,
        sortOrder: 300,
        isActive: true
      };
      
      const createResponse = await client.post('/business/tax/categories', newTaxCategory, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      if (createResponse.status === 201) {
        testCategoryId = createResponse.data.id;
      }
    });
    
    it('should delete a tax category when authenticated as admin', async () => {
      if (!testCategoryId) {
        console.log('Skipping test: failed to create test tax category');
        return;
      }
      
      const response = await client.delete(`/business/tax/categories/${testCategoryId}`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      expect(response.status).toBe(200);
      
      // Verify it's really gone
      const getResponse = await client.get(`/business/tax/categories/${testCategoryId}`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      expect(getResponse.status).toBe(404);
      
      // Clear the ID so afterEach doesn't try to delete again
      testCategoryId = '';
    });
    
    afterEach(async () => {
      // Clean up - delete the test category if it exists
      if (testCategoryId) {
        await client.delete(`/business/tax/categories/${testCategoryId}`, {
          headers: { Authorization: `Bearer ${adminToken}` }
        });
      }
    });
  });
});
