import { AxiosInstance } from 'axios';
import { setupProductTests, cleanupProductTests } from './testUtils';

describe('Product Variant Tests', () => {
  let client: AxiosInstance;
  let adminToken: string;
  let testProductId: string;
  let testVariantId: string;
  let testCategoryId: string;
  let testAttributeGroupId: string;

  beforeAll(async () => {
    const setup = await setupProductTests();
    client = setup.client;
    adminToken = setup.adminToken;
    testProductId = setup.testProductId;
    testVariantId = setup.testVariantId;
    testCategoryId = setup.testCategoryId;
    testAttributeGroupId = setup.testAttributeGroupId;
  });

  describe('Variant CRUD Operations', () => {
    it('should get a variant by ID', async () => {
      const response = await client.get(`/api/admin/products/variants/${testVariantId}`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('id', testVariantId);
      expect(response.data.data).toHaveProperty('productId', testProductId);
      
      // Verify camelCase property names in response (TypeScript interface)
      expect(response.data.data).toHaveProperty('isDefault');
      expect(response.data.data).toHaveProperty('createdAt');
      expect(response.data.data).toHaveProperty('updatedAt');
    });

    it('should get all variants for a product', async () => {
      const response = await client.get(`/api/admin/products/${testProductId}/variants`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(Array.isArray(response.data.data)).toBe(true);
      expect(response.data.data.length).toBeGreaterThan(0);
      
      // Should find our test variant
      const foundVariant = response.data.data.find((v: any) => v.id === testVariantId);
      expect(foundVariant).toBeDefined();
    });

    it('should create a new variant for a product', async () => {
      const newVariantData = {
        productId: testProductId,
        name: 'New Test Variant',
        sku: `VAR-NEW-${Math.floor(Math.random() * 10000)}`,
        price: 69.99,
        inventory: 50,
        inventoryPolicy: 'deny',
        isDefault: false,
        options: [
          { name: 'Color', value: 'Red' },
          { name: 'Size', value: 'Large' }
        ]
      };
      
      const response = await client.post(`/api/admin/products/${testProductId}/variants`, newVariantData, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      expect(response.status).toBe(201);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('id');
      expect(response.data.data).toHaveProperty('name', newVariantData.name);
      expect(response.data.data).toHaveProperty('sku', newVariantData.sku);
      expect(response.data.data).toHaveProperty('price', newVariantData.price);
      
      // Save the ID for later tests
      const newVariantId = response.data.data.id;
      
      // Clean up - delete the new variant
      await client.delete(`/api/admin/products/variants/${newVariantId}`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
    });

    it('should update a variant', async () => {
      const updatedData = {
        name: 'Updated Variant Name',
        price: 79.99,
        inventory: 200
      };
      
      const response = await client.put(`/api/admin/products/variants/${testVariantId}`, updatedData, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('name', updatedData.name);
      expect(response.data.data).toHaveProperty('price', updatedData.price);
      expect(response.data.data).toHaveProperty('inventory', updatedData.inventory);
    });

    it('should update variant inventory', async () => {
      const inventoryData = { inventory: 150 };
      
      const response = await client.patch(`/api/admin/products/variants/${testVariantId}/inventory`, inventoryData, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('inventory', inventoryData.inventory);
    });
  });

  afterAll(async () => {
    await cleanupProductTests(client, adminToken, testProductId, testCategoryId, testAttributeGroupId);
  });
});
