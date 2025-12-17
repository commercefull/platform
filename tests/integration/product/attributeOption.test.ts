import { AxiosInstance } from 'axios';
import { setupProductTests, cleanupProductTests, testAttributeOption } from './testUtils';

describe('Attribute Option Tests', () => {
  let client: AxiosInstance;
  let adminToken: string;
  let testProductId: string | null;
  let testCategoryId: string | null;
  let testAttributeGroupId: string | null;
  let testAttributeId: string | null;
  let testAttributeOptionId: string | null;
  let createdOptionId: string;

  beforeAll(async () => {
    const setup = await setupProductTests();
    client = setup.client;
    adminToken = setup.adminToken;
    testProductId = setup.testProductId;
    testCategoryId = setup.testCategoryId;
    testAttributeGroupId = setup.testAttributeGroupId;
    testAttributeId = setup.testAttributeId;
    testAttributeOptionId = setup.testAttributeOptionId;
  });

  describe('Attribute Option CRUD Operations', () => {
    it('should create a new attribute option', async () => {
      const newOption = {
        ...testAttributeOption,
        value: 'New Test Option',
        label: 'New Test Option Label',
        attributeId: testAttributeId
      };
      
      const response = await client.post('/business/attribute-options', newOption, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      expect(response.status).toBe(201);
      expect(response.data.success).toBe(true);
      // DB returns productAttributeOptionId, not id
      const optionId = response.data.data.productAttributeOptionId || response.data.data.id;
      expect(optionId).toBeTruthy();
      expect(response.data.data).toHaveProperty('value', newOption.value);
      expect(response.data.data).toHaveProperty('label', newOption.label);

      // Verify camelCase property names in response (TypeScript interface)
      expect(response.data.data).toHaveProperty('sortOrder');
      expect(response.data.data).toHaveProperty('createdAt');
      
      // Save the ID for later tests
      createdOptionId = optionId;
    });

    it('should get an attribute option by ID', async () => {
      const response = await client.get(`/business/attribute-options/${testAttributeOptionId}`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      // DB returns productAttributeOptionId, not id
      const optionId = response.data.data.productAttributeOptionId || response.data.data.id;
      expect(optionId).toBe(testAttributeOptionId);
    });
    
    it('should get options by attribute', async () => {
      const response = await client.get(`/business/attribute-options/attribute/${testAttributeId}`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(Array.isArray(response.data.data)).toBe(true);
      expect(response.data.data.length).toBeGreaterThan(0);
      
      // Should find our test options - uses productAttributeOptionId
      const foundOriginalOption = response.data.data.find((o: any) => (o.productAttributeOptionId || o.id) === testAttributeOptionId);
      const foundNewOption = response.data.data.find((o: any) => (o.productAttributeOptionId || o.id) === createdOptionId);
      
      expect(foundOriginalOption).toBeDefined();
      expect(foundNewOption).toBeDefined();
    });
    
    it('should find option by value', async () => {
      // First get the option to find its value
      const getResponse = await client.get(`/business/attribute-options/${createdOptionId}`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      const optionValue = getResponse.data.data.value;
      
      const response = await client.get(`/business/attribute-options/attribute/${testAttributeId}/value/${optionValue}`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('id', createdOptionId);
      expect(response.data.data).toHaveProperty('value', optionValue);
    });

    it('should update an attribute option', async () => {
      const updatedData = {
        value: 'Updated Option Value',
        label: 'Updated Option Label',
        sortOrder: 2
      };
      
      const response = await client.put(`/business/attribute-options/${createdOptionId}`, updatedData, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('value', updatedData.value);
      expect(response.data.data).toHaveProperty('label', updatedData.label);
      expect(response.data.data).toHaveProperty('sortOrder', updatedData.sortOrder);
    });

    it('should delete an attribute option', async () => {
      const response = await client.delete(`/business/attribute-options/${createdOptionId}`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      
      // Verify the option is deleted
      const getResponse = await client.get(`/business/attribute-options/${createdOptionId}`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      expect(getResponse.status).toBe(404);
    });
  });

  afterAll(async () => {
    await cleanupProductTests(client, adminToken, testProductId, testCategoryId, testAttributeGroupId);
  });
});
