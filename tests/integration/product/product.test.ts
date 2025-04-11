import { AxiosInstance } from 'axios';
import { setupProductTests, cleanupProductTests, testProduct } from './testUtils';

describe('Product Tests', () => {
  let client: AxiosInstance;
  let adminToken: string;
  let testCategoryId: string;
  let testProductId: string;
  let testVariantId: string;
  let testAttributeGroupId: string;

  beforeAll(async () => {
    const setup = await setupProductTests();
    client = setup.client;
    adminToken = setup.adminToken;
    testCategoryId = setup.testCategoryId;
    testProductId = setup.testProductId;
    testVariantId = setup.testVariantId;
    testAttributeGroupId = setup.testAttributeGroupId;
  });

  describe('Product CRUD Operations', () => {
    it('should get a product by ID', async () => {
      const response = await client.get(`/api/admin/products/${testProductId}`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('id', testProductId);
      expect(response.data.data).toHaveProperty('name', testProduct.name);
      
      // Verify camelCase property names in response (TypeScript interface)
      expect(response.data.data).toHaveProperty('basePrice');
      expect(response.data.data).toHaveProperty('createdAt');
      expect(response.data.data).toHaveProperty('updatedAt');
    });

    it('should list all products with pagination', async () => {
      const response = await client.get('/api/admin/products', {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data.products).toBeDefined();
      expect(Array.isArray(response.data.data.products)).toBe(true);
      expect(response.data.data.pagination).toBeDefined();
    });

    it('should update a product', async () => {
      const updatedData = {
        name: 'Updated Test Product',
        description: 'Updated description for test',
        basePrice: 129.99
      };
      
      const response = await client.put(`/api/admin/products/${testProductId}`, updatedData, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('name', updatedData.name);
      expect(response.data.data).toHaveProperty('description', updatedData.description);
      expect(response.data.data).toHaveProperty('basePrice', updatedData.basePrice);
    });

    it('should get products by category', async () => {
      const response = await client.get(`/api/admin/products/category/${testCategoryId}`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(Array.isArray(response.data.data.products)).toBe(true);
      
      // Should find our test product in the category
      const foundProduct = response.data.data.products.find((p: any) => p.id === testProductId);
      expect(foundProduct).toBeDefined();
    });

    it('should update product status', async () => {
      const statusData = { status: 'draft' };
      
      const response = await client.patch(`/api/admin/products/${testProductId}/status`, statusData, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('status', statusData.status);
    });

    it('should update product visibility', async () => {
      const visibilityData = { visibility: 'hidden' };
      
      const response = await client.patch(`/api/admin/products/${testProductId}/visibility`, visibilityData, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('visibility', visibilityData.visibility);
    });
  });

  afterAll(async () => {
    await cleanupProductTests(client, adminToken, testProductId, testCategoryId, testAttributeGroupId);
  });
});
