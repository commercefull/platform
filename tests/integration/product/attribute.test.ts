import { AxiosInstance } from 'axios';
import { setupProductTests, cleanupProductTests, testAttribute } from './testUtils';

describe('Attribute Tests', () => {
  let client: AxiosInstance;
  let adminToken: string;
  let testProductId: string | null;
  let testCategoryId: string | null;
  let testAttributeGroupId: string | null;
  let testAttributeId: string | null;
  let createdAttributeId: string;

  beforeAll(async () => {
    const setup = await setupProductTests();
    client = setup.client;
    adminToken = setup.adminToken;
    testProductId = setup.testProductId;
    testCategoryId = setup.testCategoryId;
    testAttributeGroupId = setup.testAttributeGroupId;
    testAttributeId = setup.testAttributeId;
  });

  describe('Attribute CRUD Operations', () => {
    it('should create a new attribute', async () => {
      const newAttribute = {
        ...testAttribute,
        name: 'New Test Attribute',
        code: `new-attr-${Math.floor(Math.random() * 10000)}`,
        attributeGroupId: testAttributeGroupId
      };
      
      const response = await client.post('/business/attributes', newAttribute, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      expect(response.status).toBe(201);
      expect(response.data.success).toBe(true);
      // DB returns productAttributeId, not id
      const attrId = response.data.data.productAttributeId || response.data.data.id;
      expect(attrId).toBeTruthy();
      expect(response.data.data).toHaveProperty('name', newAttribute.name);
      expect(response.data.data).toHaveProperty('code', newAttribute.code);

      // Verify camelCase property names in response (TypeScript interface)
      expect(response.data.data).toHaveProperty('isRequired');
      expect(response.data.data).toHaveProperty('isFilterable');
      expect(response.data.data).toHaveProperty('isSearchable');
      expect(response.data.data).toHaveProperty('position');
      expect(response.data.data).toHaveProperty('createdAt');
      
      // Save the ID for later tests
      createdAttributeId = attrId;
    });

    it('should get an attribute by ID', async () => {
      const response = await client.get(`/business/attributes/${testAttributeId}`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      // DB returns productAttributeId, not id
      const attrId = response.data.data.productAttributeId || response.data.data.id;
      expect(attrId).toBe(testAttributeId);
      expect(response.data.data).toHaveProperty('name', testAttribute.name);
    });
    
    it('should get an attribute by code', async () => {
      // First get the attribute to find its code
      const getResponse = await client.get(`/business/attributes/${testAttributeId}`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      const attrCode = getResponse.data.data.code;
      
      const response = await client.get(`/business/attributes/code/${attrCode}`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      // DB returns productAttributeId, not id
      const attrId = response.data.data.productAttributeId || response.data.data.id;
      expect(attrId).toBe(testAttributeId);
      expect(response.data.data).toHaveProperty('code', attrCode);
    });
    
    it('should list all attributes', async () => {
      const response = await client.get('/business/attributes', {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(Array.isArray(response.data.data)).toBe(true);
      expect(response.data.data.length).toBeGreaterThan(0);
      
      // Should find our test attributes - uses productAttributeId
      const foundOriginalAttr = response.data.data.find((a: any) => (a.productAttributeId || a.id) === testAttributeId);
      const foundNewAttr = response.data.data.find((a: any) => (a.productAttributeId || a.id) === createdAttributeId);
      
      expect(foundOriginalAttr).toBeDefined();
      expect(foundNewAttr).toBeDefined();
    });
    
    it('should get attributes by group', async () => {
      const response = await client.get(`/business/attributes/group/${testAttributeGroupId}`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(Array.isArray(response.data.data)).toBe(true);
      expect(response.data.data.length).toBeGreaterThan(0);
      
      // Should find our test attributes in the group - uses productAttributeId
      const foundOriginalAttr = response.data.data.find((a: any) => (a.productAttributeId || a.id) === testAttributeId);
      const foundNewAttr = response.data.data.find((a: any) => (a.productAttributeId || a.id) === createdAttributeId);
      
      expect(foundOriginalAttr).toBeDefined();
      expect(foundNewAttr).toBeDefined();
    });

    it('should update an attribute', async () => {
      const updatedData = {
        name: 'Updated Attribute Name',
        description: 'Updated attribute description',
        isFilterable: false,
        sortOrder: 2
      };
      
      const response = await client.put(`/business/attributes/${createdAttributeId}`, updatedData, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('name', updatedData.name);
      expect(response.data.data).toHaveProperty('description', updatedData.description);
      expect(response.data.data).toHaveProperty('isFilterable', updatedData.isFilterable);
      expect(response.data.data).toHaveProperty('position', updatedData.sortOrder);
    });

    it('should delete an attribute', async () => {
      const response = await client.delete(`/business/attributes/${createdAttributeId}`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      
      // Verify the attribute is deleted
      const getResponse = await client.get(`/business/attributes/${createdAttributeId}`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      expect(getResponse.status).toBe(404);
    });
  });

  afterAll(async () => {
    await cleanupProductTests(client, adminToken, testProductId, testCategoryId, testAttributeGroupId);
  });
});
