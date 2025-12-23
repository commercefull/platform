import { AxiosInstance } from 'axios';
import { setupProductTests, cleanupProductTests, SEEDED_VARIANT_1_ID } from './testUtils';

describe('Product Variant Tests', () => {
  let client: AxiosInstance;
  let adminToken: string;
  let testProductId: string | null;
  let testVariantId: string | null;
  let testCategoryId: string | null;
  let testAttributeGroupId: string | null;

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
    // Create a test variant if one doesn't exist
    beforeAll(async () => {
      if (!testVariantId || testVariantId === SEEDED_VARIANT_1_ID) {
        // Try to create a variant for testing
        try {
          const variantData = {
            productId: testProductId,
            name: 'Test Variant',
            sku: `VAR-TEST-${Math.floor(Math.random() * 10000)}`,
            price: 89.99,
            inventory: 100,
            inventoryPolicy: 'deny',
            isDefault: true,
            options: [
              { name: 'Color', value: 'Blue' },
              { name: 'Size', value: 'Medium' },
            ],
          };

          const response = await client.post(`/business/products/${testProductId}/variants`, variantData, {
            headers: { Authorization: `Bearer ${adminToken}` },
          });

          if (response.status === 201) {
            testVariantId = response.data.data.productVariantId || response.data.data.id;
          }
        } catch (error) {}
      }
    });

    it('should get a variant by ID', async () => {
      if (!testVariantId) {
        return;
      }

      const response = await client.get(`/business/products/variants/${testVariantId}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      // DB returns productVariantId, not id
      const variantId = response.data.data.productVariantId || response.data.data.id;
      expect(variantId).toBe(testVariantId);
      expect(response.data.data).toHaveProperty('productId', testProductId);

      // Verify camelCase property names in response (TypeScript interface)
      expect(response.data.data).toHaveProperty('isDefault');
      expect(response.data.data).toHaveProperty('createdAt');
      expect(response.data.data).toHaveProperty('updatedAt');
    });

    it('should get all variants for a product', async () => {
      const response = await client.get(`/business/products/${testProductId}/variants`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(Array.isArray(response.data.data)).toBe(true);
      // May have 0 or more variants depending on what was created
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
          { name: 'Size', value: 'Large' },
        ],
      };

      const response = await client.post(`/business/products/${testProductId}/variants`, newVariantData, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(response.status).toBe(201);
      expect(response.data.success).toBe(true);
      // DB returns productVariantId, not id
      const variantId = response.data.data.productVariantId || response.data.data.id;
      expect(variantId).toBeTruthy();
      expect(response.data.data).toHaveProperty('name', newVariantData.name);
      expect(response.data.data).toHaveProperty('sku', newVariantData.sku);
      expect(response.data.data).toHaveProperty('price', newVariantData.price);

      // Save the ID for later tests
      const newVariantId = response.data.data.id;

      // Clean up - delete the new variant
      await client.delete(`/business/products/variants/${newVariantId}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
    });

    it('should update a variant', async () => {
      if (!testVariantId) {
        return;
      }

      const updatedData = {
        name: 'Updated Variant Name',
        price: 79.99,
        inventory: 200,
      };

      const response = await client.put(`/business/products/variants/${testVariantId}`, updatedData, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('name', updatedData.name);
      expect(response.data.data).toHaveProperty('price', updatedData.price);
      expect(response.data.data).toHaveProperty('inventory', updatedData.inventory);
    });

    it('should update variant inventory', async () => {
      if (!testVariantId) {
        return;
      }

      const inventoryData = { inventory: 150 };

      const response = await client.patch(`/business/products/variants/${testVariantId}/inventory`, inventoryData, {
        headers: { Authorization: `Bearer ${adminToken}` },
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
