import { AxiosInstance } from 'axios';
import { setupProductTests, SEEDED_PRODUCT_1_ID, SEEDED_PRODUCT_2_ID } from './testUtils';

describe('Product Tests', () => {
  let client: AxiosInstance;
  let adminToken: string;
  let testProductId: string;

  beforeAll(async () => {
    const setup = await setupProductTests();
    client = setup.client;
    adminToken = setup.adminToken;
    testProductId = SEEDED_PRODUCT_1_ID;
  });

  describe('Product CRUD Operations', () => {
    it('should get a product by ID', async () => {
      const response = await client.get(`/business/products/${testProductId}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      // Check for productId (from seeded data)
      expect(response.data.data).toHaveProperty('productId', testProductId);
      expect(response.data.data).toHaveProperty('name', 'Test Product One');

      // Verify camelCase property names in response (TypeScript interface)
      expect(response.data.data).toHaveProperty('price');
      expect(response.data.data).toHaveProperty('createdAt');
      expect(response.data.data).toHaveProperty('updatedAt');
    });

    it('should list all products with pagination', async () => {
      const response = await client.get('/business/products', {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data.products).toBeDefined();
      expect(Array.isArray(response.data.data.products)).toBe(true);
      expect(response.data.data.total).toBeDefined();
      expect(response.data.data.limit).toBeDefined();
      expect(response.data.data.offset).toBeDefined();
    });

    it('should update a product', async () => {
      const updatedData = {
        name: 'Updated Test Product',
        description: 'Updated description for test',
        basePrice: 129.99,
      };

      const response = await client.put(`/business/products/${testProductId}`, updatedData, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('name', updatedData.name);
      expect(response.data.data).toHaveProperty('description', updatedData.description);
      expect(response.data.data).toHaveProperty('basePrice', updatedData.basePrice);
    });

    it('should search products', async () => {
      const response = await client.get('/business/products?search=Test', {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(Array.isArray(response.data.data.products || response.data.data)).toBe(true);
    });

    it('should update product status', async () => {
      const statusData = { status: 'draft' };

      const response = await client.put(`/business/products/${testProductId}/status`, statusData, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('status', statusData.status);

      // Reset to active
      await client.put(
        `/business/products/${testProductId}/status`,
        { status: 'active' },
        {
          headers: { Authorization: `Bearer ${adminToken}` },
        },
      );
    });

    it('should update product visibility', async () => {
      const visibilityData = { visibility: 'not_visible' };

      const response = await client.put(`/business/products/${testProductId}/visibility`, visibilityData, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('visibility', visibilityData.visibility);

      // Reset to visible
      await client.put(
        `/business/products/${testProductId}/visibility`,
        { visibility: 'visible' },
        {
          headers: { Authorization: `Bearer ${adminToken}` },
        },
      );
    });
  });

  describe('Product with Variants', () => {
    it('should get a product with variants', async () => {
      const response = await client.get(`/business/products/${SEEDED_PRODUCT_2_ID}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('hasVariants', true);
    });
  });
});
