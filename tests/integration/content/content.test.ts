import { AxiosInstance } from 'axios';
import {
  setupContentTests,
  cleanupContentTests,
  testContentType,
  testContentPage,
  testContentBlock,
  testContentTemplate
} from './testUtils';

describe('Content Feature Tests', () => {
  let client: AxiosInstance;
  let adminToken: string;
  let testContentTypeId: string;
  let testContentPageId: string;
  let testContentBlockId: string;
  let testContentTemplateId: string;
  let testContentTypeSlug: string;
  let testContentPageSlug: string;

  beforeAll(async () => {
    // Use a longer timeout for setup as it creates multiple test entities
    jest.setTimeout(30000);
    
    try {
      const setup = await setupContentTests();
      client = setup.client;
      adminToken = setup.adminToken;
      testContentTypeId = setup.testContentTypeId;
      testContentPageId = setup.testContentPageId;
      testContentBlockId = setup.testContentBlockId;
      testContentTemplateId = setup.testContentTemplateId;
      testContentTypeSlug = setup.testContentTypeSlug;
      testContentPageSlug = setup.testContentPageSlug;
    } catch (error) {
      console.error('Setup failed:', error);
      throw error;
    }
  });

  afterAll(async () => {
    await cleanupContentTests(client, adminToken, {
      testContentBlockId,
      testContentPageId,
      testContentTypeId,
      testContentTemplateId
    });
  });

  describe('Content Type API', () => {
    it('should get content type by id with camelCase properties', async () => {
      const response = await client.get(`/api/admin/content/types/${testContentTypeId}`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('id', testContentTypeId);
      
      // Verify properties from TypeScript interface are in camelCase
      expect(response.data.data).toHaveProperty('name', testContentType.name);
      expect(response.data.data).toHaveProperty('slug', testContentType.slug);
      expect(response.data.data).toHaveProperty('description', testContentType.description);
      expect(response.data.data).toHaveProperty('schema');
      expect(response.data.data).toHaveProperty('status', testContentType.status);
      expect(response.data.data).toHaveProperty('createdAt');
      expect(response.data.data).toHaveProperty('updatedAt');
      
      // Make sure no snake_case properties leaked through
      expect(response.data.data).not.toHaveProperty('created_at');
      expect(response.data.data).not.toHaveProperty('updated_at');
    });

    it('should update a content type with camelCase properties', async () => {
      const updateData = {
        name: 'Updated Test Content Type',
        description: 'Updated description for integration tests'
      };
      
      const response = await client.put(`/api/admin/content/types/${testContentTypeId}`, updateData, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      
      // Verify the update worked
      expect(response.data.data).toHaveProperty('name', updateData.name);
      expect(response.data.data).toHaveProperty('description', updateData.description);
      
      // Verify that non-updated fields are preserved
      expect(response.data.data).toHaveProperty('id', testContentTypeId);
      expect(response.data.data).toHaveProperty('slug', testContentType.slug);
      expect(response.data.data).toHaveProperty('status', testContentType.status);
      
      // Verify response is using camelCase
      expect(response.data.data).toHaveProperty('createdAt');
      expect(response.data.data).toHaveProperty('updatedAt');
      expect(response.data.data).not.toHaveProperty('created_at');
      expect(response.data.data).not.toHaveProperty('updated_at');
    });

    it('should list all content types with camelCase properties', async () => {
      const response = await client.get('/api/admin/content/types', {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(Array.isArray(response.data.data)).toBe(true);
      
      // Find our test content type in the results
      const contentType = response.data.data.find((ct: any) => ct.id === testContentTypeId);
      expect(contentType).toBeDefined();
      
      if (contentType) {
        // Verify properties use camelCase
        expect(contentType).toHaveProperty('name');
        expect(contentType).toHaveProperty('slug');
        expect(contentType).toHaveProperty('status');
        expect(contentType).toHaveProperty('createdAt');
        expect(contentType).toHaveProperty('updatedAt');
        
        expect(contentType).not.toHaveProperty('created_at');
        expect(contentType).not.toHaveProperty('updated_at');
      }
    });
  });

  describe('Content Page API', () => {
    it('should get content page by id with camelCase properties', async () => {
      const response = await client.get(`/api/admin/content/pages/${testContentPageId}`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('id', testContentPageId);
      
      // Verify properties from TypeScript interface are in camelCase
      expect(response.data.data).toHaveProperty('title', testContentPage.title);
      expect(response.data.data).toHaveProperty('slug', testContentPage.slug);
      expect(response.data.data).toHaveProperty('status', testContentPage.status);
      expect(response.data.data).toHaveProperty('visibility', testContentPage.visibility);
      expect(response.data.data).toHaveProperty('contentTypeId');
      expect(response.data.data).toHaveProperty('isHomePage', testContentPage.isHomePage);
      expect(response.data.data).toHaveProperty('metaTitle', testContentPage.metaTitle);
      expect(response.data.data).toHaveProperty('metaDescription', testContentPage.metaDescription);
      expect(response.data.data).toHaveProperty('createdAt');
      expect(response.data.data).toHaveProperty('updatedAt');
      
      // Make sure no snake_case properties leaked through
      expect(response.data.data).not.toHaveProperty('content_type_id');
      expect(response.data.data).not.toHaveProperty('is_home_page');
      expect(response.data.data).not.toHaveProperty('meta_title');
      expect(response.data.data).not.toHaveProperty('meta_description');
      expect(response.data.data).not.toHaveProperty('created_at');
      expect(response.data.data).not.toHaveProperty('updated_at');
    });

    it('should update a content page with camelCase properties', async () => {
      const updateData = {
        title: 'Updated Test Page',
        summary: 'Updated summary for integration tests',
        metaTitle: 'Updated Meta Title'
      };
      
      const response = await client.put(`/api/admin/content/pages/${testContentPageId}`, updateData, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      
      // Verify the update worked
      expect(response.data.data).toHaveProperty('title', updateData.title);
      expect(response.data.data).toHaveProperty('summary', updateData.summary);
      expect(response.data.data).toHaveProperty('metaTitle', updateData.metaTitle);
      
      // Verify that non-updated fields are preserved
      expect(response.data.data).toHaveProperty('id', testContentPageId);
      expect(response.data.data).toHaveProperty('slug', testContentPage.slug);
      expect(response.data.data).toHaveProperty('status', testContentPage.status);
      
      // Verify response is using camelCase
      expect(response.data.data).toHaveProperty('metaTitle');
      expect(response.data.data).not.toHaveProperty('meta_title');
    });

    it('should get a published page by slug with camelCase properties', async () => {
      const response = await client.get(`/api/content/pages/${testContentPageSlug}`);
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('slug', testContentPage.slug);
      
      // Verify properties use camelCase
      expect(response.data.data).toHaveProperty('title');
      expect(response.data.data).toHaveProperty('contentTypeId');
      expect(response.data.data).toHaveProperty('metaTitle');
      expect(response.data.data).toHaveProperty('metaDescription');
      expect(response.data.data).toHaveProperty('isHomePage');
      
      expect(response.data.data).not.toHaveProperty('content_type_id');
      expect(response.data.data).not.toHaveProperty('meta_title');
      expect(response.data.data).not.toHaveProperty('meta_description');
      expect(response.data.data).not.toHaveProperty('is_home_page');
    });
  });

  describe('Content Block API', () => {
    it('should get content block by id with camelCase properties', async () => {
      const response = await client.get(`/api/admin/content/blocks/${testContentBlockId}`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('id', testContentBlockId);
      
      // Verify properties from TypeScript interface are in camelCase
      expect(response.data.data).toHaveProperty('name', testContentBlock.name);
      expect(response.data.data).toHaveProperty('pageId');
      expect(response.data.data).toHaveProperty('contentTypeId');
      expect(response.data.data).toHaveProperty('order', testContentBlock.order);
      expect(response.data.data).toHaveProperty('content');
      expect(response.data.data).toHaveProperty('status', testContentBlock.status);
      expect(response.data.data).toHaveProperty('createdAt');
      expect(response.data.data).toHaveProperty('updatedAt');
      
      // Make sure no snake_case properties leaked through
      expect(response.data.data).not.toHaveProperty('page_id');
      expect(response.data.data).not.toHaveProperty('content_type_id');
      expect(response.data.data).not.toHaveProperty('created_at');
      expect(response.data.data).not.toHaveProperty('updated_at');
    });

    it('should get blocks for a page with camelCase properties', async () => {
      const response = await client.get(`/api/admin/content/pages/${testContentPageId}/blocks`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(Array.isArray(response.data.data)).toBe(true);
      
      // Find our test block in the results
      const contentBlock = response.data.data.find((block: any) => block.id === testContentBlockId);
      expect(contentBlock).toBeDefined();
      
      if (contentBlock) {
        // Verify properties use camelCase
        expect(contentBlock).toHaveProperty('name');
        expect(contentBlock).toHaveProperty('pageId');
        expect(contentBlock).toHaveProperty('contentTypeId');
        expect(contentBlock).toHaveProperty('order');
        expect(contentBlock).toHaveProperty('createdAt');
        expect(contentBlock).toHaveProperty('updatedAt');
        
        expect(contentBlock).not.toHaveProperty('page_id');
        expect(contentBlock).not.toHaveProperty('content_type_id');
        expect(contentBlock).not.toHaveProperty('created_at');
        expect(contentBlock).not.toHaveProperty('updated_at');
      }
    });
  });

  describe('Content Template API', () => {
    it('should get content template by id with camelCase properties', async () => {
      const response = await client.get(`/api/admin/content/templates/${testContentTemplateId}`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('id', testContentTemplateId);
      
      // Verify properties from TypeScript interface are in camelCase
      expect(response.data.data).toHaveProperty('name', testContentTemplate.name);
      expect(response.data.data).toHaveProperty('type', testContentTemplate.type);
      expect(response.data.data).toHaveProperty('description', testContentTemplate.description);
      expect(response.data.data).toHaveProperty('structure');
      expect(response.data.data).toHaveProperty('status', testContentTemplate.status);
      expect(response.data.data).toHaveProperty('createdAt');
      expect(response.data.data).toHaveProperty('updatedAt');
      
      // Make sure no snake_case properties leaked through
      expect(response.data.data).not.toHaveProperty('created_at');
      expect(response.data.data).not.toHaveProperty('updated_at');
    });

    it('should list templates with camelCase properties', async () => {
      const response = await client.get('/api/admin/content/templates', {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(Array.isArray(response.data.data)).toBe(true);
      
      // Find our test template in the results
      const template = response.data.data.find((t: any) => t.id === testContentTemplateId);
      expect(template).toBeDefined();
      
      if (template) {
        // Verify properties use camelCase
        expect(template).toHaveProperty('name');
        expect(template).toHaveProperty('type');
        expect(template).toHaveProperty('status');
        expect(template).toHaveProperty('createdAt');
        expect(template).toHaveProperty('updatedAt');
        
        expect(template).not.toHaveProperty('created_at');
        expect(template).not.toHaveProperty('updated_at');
      }
    });
  });
});
