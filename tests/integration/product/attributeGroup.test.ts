import { AxiosInstance } from 'axios';
import { setupProductTests, cleanupProductTests, testAttributeGroup } from './testUtils';

describe('Attribute Group Tests', () => {
  let client: AxiosInstance;
  let adminToken: string;
  let testProductId: string;
  let testCategoryId: string;
  let testAttributeGroupId: string;
  let testAttributeId: string;
  let createdGroupId: string;

  beforeAll(async () => {
    const setup = await setupProductTests();
    client = setup.client;
    adminToken = setup.adminToken;
    testProductId = setup.testProductId;
    testCategoryId = setup.testCategoryId;
    testAttributeGroupId = setup.testAttributeGroupId;
    testAttributeId = setup.testAttributeId;
  });

  describe('Attribute Group CRUD Operations', () => {
    it('should create a new attribute group', async () => {
      const newGroup = {
        ...testAttributeGroup,
        name: 'New Test Group',
        code: `new-group-${Math.floor(Math.random() * 10000)}`
      };
      
      const response = await client.post('/business/attribute-groups', newGroup, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      expect(response.status).toBe(201);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('id');
      expect(response.data.data).toHaveProperty('name', newGroup.name);
      expect(response.data.data).toHaveProperty('code', newGroup.code);

      // Verify camelCase property names in response (TypeScript interface)
      expect(response.data.data).toHaveProperty('sortOrder');
      expect(response.data.data).toHaveProperty('createdAt');
      
      // Save the ID for later tests
      createdGroupId = response.data.data.id;
    });

    it('should get an attribute group by ID', async () => {
      const response = await client.get(`/business/attribute-groups/${testAttributeGroupId}`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('id', testAttributeGroupId);
      expect(response.data.data).toHaveProperty('name', testAttributeGroup.name);
    });
    
    it('should list all attribute groups', async () => {
      const response = await client.get('/business/attribute-groups', {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(Array.isArray(response.data.data)).toBe(true);
      expect(response.data.data.length).toBeGreaterThan(0);
      
      // Should find our test groups
      const foundOriginalGroup = response.data.data.find((g: any) => g.id === testAttributeGroupId);
      const foundNewGroup = response.data.data.find((g: any) => g.id === createdGroupId);
      
      expect(foundOriginalGroup).toBeDefined();
      expect(foundNewGroup).toBeDefined();
    });

    it('should update an attribute group', async () => {
      const updatedData = {
        name: 'Updated Group Name',
        description: 'Updated group description',
        sortOrder: 2
      };
      
      const response = await client.put(`/business/attribute-groups/${createdGroupId}`, updatedData, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('name', updatedData.name);
      expect(response.data.data).toHaveProperty('description', updatedData.description);
      expect(response.data.data).toHaveProperty('sortOrder', updatedData.sortOrder);
    });

    it('should delete an attribute group', async () => {
      const response = await client.delete(`/business/attribute-groups/${createdGroupId}`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      
      // Verify the group is deleted
      const getResponse = await client.get(`/business/attribute-groups/${createdGroupId}`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      expect(getResponse.status).toBe(404);
    });
  });

  afterAll(async () => {
    await cleanupProductTests(client, adminToken, testProductId, testCategoryId, testAttributeGroupId);
  });
});
