import { AxiosInstance } from 'axios';
import { setupProductTests, cleanupProductTests, testAttributeGroup } from './testUtils';

describe('Attribute Group Tests', () => {
  let client: AxiosInstance;
  let adminToken: string;
  let testProductId: string | null;
  let testCategoryId: string | null;
  let testAttributeGroupId: string | null;
  let testAttributeId: string | null;
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
        code: `new-group-${Math.floor(Math.random() * 10000)}`,
      };

      const response = await client.post('/business/attribute-groups', newGroup, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(response.status).toBe(201);
      expect(response.data.success).toBe(true);
      // DB returns productAttributeGroupId, not id
      const groupId = response.data.data.productAttributeGroupId || response.data.data.id;
      expect(groupId).toBeTruthy();
      expect(response.data.data).toHaveProperty('name', newGroup.name);
      expect(response.data.data).toHaveProperty('code', newGroup.code);

      // Verify camelCase property names in response (TypeScript interface)
      expect(response.data.data).toHaveProperty('position');
      expect(response.data.data).toHaveProperty('createdAt');

      // Save the ID for later tests
      createdGroupId = groupId;
    });

    it('should get an attribute group by ID', async () => {
      const response = await client.get(`/business/attribute-groups/${testAttributeGroupId}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      // DB returns productAttributeGroupId, not id
      const groupId = response.data.data.productAttributeGroupId || response.data.data.id;
      expect(groupId).toBe(testAttributeGroupId);
      expect(response.data.data).toHaveProperty('name', testAttributeGroup.name);
    });

    it('should list all attribute groups', async () => {
      const response = await client.get('/business/attribute-groups', {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(Array.isArray(response.data.data)).toBe(true);
      expect(response.data.data.length).toBeGreaterThan(0);

      // Should find our test groups - uses productAttributeGroupId
      const foundOriginalGroup = response.data.data.find((g: any) => (g.productAttributeGroupId || g.id) === testAttributeGroupId);

      expect(foundOriginalGroup).toBeDefined();

      // Only check for new group if it was created
      if (createdGroupId) {
        const foundNewGroup = response.data.data.find((g: any) => (g.productAttributeGroupId || g.id) === createdGroupId);
        expect(foundNewGroup).toBeDefined();
      }
    });

    it('should update an attribute group', async () => {
      const updatedData = {
        name: 'Updated Group Name',
        description: 'Updated group description',
        sortOrder: 2,
      };

      const response = await client.put(`/business/attribute-groups/${createdGroupId}`, updatedData, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('name', updatedData.name);
      expect(response.data.data).toHaveProperty('description', updatedData.description);
      // DB uses position, not sortOrder
      expect(response.data.data).toHaveProperty('position');
    });

    it('should delete an attribute group', async () => {
      const response = await client.delete(`/business/attribute-groups/${createdGroupId}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);

      // Verify the group is deleted
      const getResponse = await client.get(`/business/attribute-groups/${createdGroupId}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(getResponse.status).toBe(404);
    });
  });

  afterAll(async () => {
    await cleanupProductTests(client, adminToken, testProductId, testCategoryId, testAttributeGroupId);
  });
});
