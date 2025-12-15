import { AxiosInstance } from 'axios';
import { createTestClient, loginTestAdmin } from '../testUtils';
import {
  SEEDED_PRODUCT_TYPE_SIMPLE_ID,
  SEEDED_PRODUCT_TYPE_CONFIGURABLE_ID,
  SEEDED_ATTRIBUTE_SET_APPAREL_ID
} from './testUtils';

describe('Product Type Tests', () => {
  let client: AxiosInstance;
  let adminToken: string;
  let createdProductTypeId: string | null = null;

  beforeAll(async () => {
    client = createTestClient();
    adminToken = await loginTestAdmin(client);
  });

  describe('Product Type CRUD Operations', () => {
    it('should list all product types', async () => {
      const response = await client.get('/business/product-types', {
        headers: { Authorization: `Bearer ${adminToken}` }
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(Array.isArray(response.data.data)).toBe(true);
      expect(response.data.data.length).toBeGreaterThan(0);
    });

    it('should list product types with active filter (returns all since no isActive column)', async () => {
      const response = await client.get('/business/product-types?active=true', {
        headers: { Authorization: `Bearer ${adminToken}` }
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(Array.isArray(response.data.data)).toBe(true);
    });

    it('should get a seeded product type by ID', async () => {
      const response = await client.get(`/business/product-types/${SEEDED_PRODUCT_TYPE_SIMPLE_ID}`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data.slug).toBe('simple-test');
    });

    it('should get a product type by slug', async () => {
      const response = await client.get('/business/product-types/slug/configurable-test', {
        headers: { Authorization: `Bearer ${adminToken}` }
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data.productTypeId).toBe(SEEDED_PRODUCT_TYPE_CONFIGURABLE_ID);
    });

    it('should create a new product type', async () => {
      const productTypeData = {
        name: 'Test Product Type',
        slug: `test-type-${Date.now()}`
      };

      const response = await client.post('/business/product-types', productTypeData, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });

      expect(response.status).toBe(201);
      expect(response.data.success).toBe(true);
      expect(response.data.data.name).toBe('Test Product Type');
      
      createdProductTypeId = response.data.data.productTypeId;
    });

    it('should update a product type', async () => {
      if (!createdProductTypeId) {
        console.warn('Skipping: No product type was created');
        return;
      }

      const updateData = {
        name: 'Updated Product Type',
        description: 'Updated by integration test'
      };

      const response = await client.put(`/business/product-types/${createdProductTypeId}`, updateData, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data.name).toBe('Updated Product Type');
    });

    it('should get attributes for a product type', async () => {
      const response = await client.get(`/business/product-types/${SEEDED_PRODUCT_TYPE_CONFIGURABLE_ID}/attributes`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(Array.isArray(response.data.data)).toBe(true);
    });

    it('should return 404 for non-existent product type', async () => {
      try {
        await client.get('/business/product-types/00000000-0000-0000-0000-000000000000', {
          headers: { Authorization: `Bearer ${adminToken}` }
        });
        fail('Expected 404 error');
      } catch (error: any) {
        expect(error.response.status).toBe(404);
        expect(error.response.data.success).toBe(false);
      }
    });

    it('should prevent duplicate slugs', async () => {
      const productTypeData = {
        name: 'Duplicate Test',
        slug: 'simple-test', // Already exists
        description: 'Should fail'
      };

      try {
        await client.post('/business/product-types', productTypeData, {
          headers: { Authorization: `Bearer ${adminToken}` }
        });
        fail('Expected 400 error');
      } catch (error: any) {
        expect(error.response.status).toBe(400);
        expect(error.response.data.success).toBe(false);
      }
    });
  });

  describe('Cleanup', () => {
    it('should delete the created product type', async () => {
      if (!createdProductTypeId) {
        console.warn('Skipping: No product type was created');
        return;
      }

      const response = await client.delete(`/business/product-types/${createdProductTypeId}`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
    });
  });
});
