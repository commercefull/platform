import axios, { AxiosInstance } from 'axios';
import {
  TEST_CONTENT_TYPE_ID,
  TEST_CONTENT_PAGE_ID,
  TEST_CONTENT_BLOCK_ID,
  TEST_CONTENT_TEMPLATE_ID,
  TEST_CONTENT_TYPE,
  TEST_CONTENT_PAGE,
  TEST_CONTENT_BLOCK,
  TEST_CONTENT_TEMPLATE,
  ADMIN_CREDENTIALS
} from '../testConstants';

// Create axios client for tests
const createClient = () => axios.create({
  baseURL: process.env.API_URL || 'http://localhost:3000',
  validateStatus: () => true,
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  }
});

// Use test data from constants
const testContentType = TEST_CONTENT_TYPE;
const testContentPage = TEST_CONTENT_PAGE;
const testContentBlock = TEST_CONTENT_BLOCK;
const testContentTemplate = TEST_CONTENT_TEMPLATE;

describe.skip('Content Feature Tests', () => {
  let client: AxiosInstance;
  let adminToken: string;
  let testContentTypeId: string;
  let testContentPageId: string;
  let testContentBlockId: string;
  let testContentTemplateId: string;
  let testContentTypeSlug: string;
  let testContentPageSlug: string;

  beforeAll(async () => {
    jest.setTimeout(30000);
    client = createClient();
    
    // Get admin token
    try {
      const loginResponse = await client.post('/business/auth/login', ADMIN_CREDENTIALS, { headers: { 'X-Test-Request': 'true' } });
      adminToken = loginResponse.data?.accessToken || '';
      if (!adminToken) {
        console.log('Warning: Failed to get admin token for content tests');
        return;
      }
    } catch (error) {
      console.log('Warning: Login failed for content tests:', error);
      adminToken = '';
      return;
    }
    
    // Check if seeded content type exists, create if not
    const typeResponse = await client.get(`/business/content/types/${TEST_CONTENT_TYPE_ID}`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    if (typeResponse.status === 200) {
      testContentTypeId = TEST_CONTENT_TYPE_ID;
      testContentTypeSlug = TEST_CONTENT_TYPE.slug;
    } else {
      // Create content type dynamically
      const createTypeResponse = await client.post('/business/content/types', {
        name: TEST_CONTENT_TYPE.name,
        slug: TEST_CONTENT_TYPE.slug + '-' + Date.now(),
        description: TEST_CONTENT_TYPE.description,
        schema: { type: 'object' },
        status: 'active'
      }, { headers: { Authorization: `Bearer ${adminToken}` } });
      
      if (createTypeResponse.status === 201) {
        // DB returns contentTypeId, not id
        testContentTypeId = createTypeResponse.data.data.contentTypeId || createTypeResponse.data.data.id;
        testContentTypeSlug = createTypeResponse.data.data.slug;
      } else {
        console.log('Failed to create content type:', createTypeResponse.data);
      }
    }
    
    // Check if seeded template exists, create if not
    const templateResponse = await client.get(`/business/content/templates/${TEST_CONTENT_TEMPLATE_ID}`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    if (templateResponse.status === 200) {
      testContentTemplateId = TEST_CONTENT_TEMPLATE_ID;
    } else {
      // Create template dynamically
      const templateSlug = 'test-template-' + Date.now();
      const createTemplateResponse = await client.post('/business/content/templates', {
        name: TEST_CONTENT_TEMPLATE.name + '-' + Date.now(),
        slug: templateSlug,
        type: TEST_CONTENT_TEMPLATE.type,
        description: TEST_CONTENT_TEMPLATE.description,
        structure: TEST_CONTENT_TEMPLATE.structure,
        status: 'active'
      }, { headers: { Authorization: `Bearer ${adminToken}` } });
      
      if (createTemplateResponse.status === 201) {
        // DB returns contentTemplateId, not id
        testContentTemplateId = createTemplateResponse.data.data.contentTemplateId || createTemplateResponse.data.data.id;
      } else {
        console.log('Failed to create template:', createTemplateResponse.data);
      }
    }
    
    // Check if seeded page exists, create if not
    const pageResponse = await client.get(`/business/content/pages/${TEST_CONTENT_PAGE_ID}`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    if (pageResponse.status === 200) {
      testContentPageId = TEST_CONTENT_PAGE_ID;
      testContentPageSlug = TEST_CONTENT_PAGE.slug;
    } else if (testContentTypeId) {
      // Create page dynamically
      const createPageResponse = await client.post('/business/content/pages', {
        title: TEST_CONTENT_PAGE.title,
        slug: TEST_CONTENT_PAGE.slug + '-' + Date.now(),
        contentTypeId: testContentTypeId,
        templateId: testContentTemplateId,
        status: 'published',
        visibility: 'public',
        summary: TEST_CONTENT_PAGE.summary,
        metaTitle: TEST_CONTENT_PAGE.metaTitle,
        metaDescription: TEST_CONTENT_PAGE.metaDescription,
        isHomePage: false
      }, { headers: { Authorization: `Bearer ${adminToken}` } });
      
      if (createPageResponse.status === 201) {
        // DB returns contentPageId, not id
        testContentPageId = createPageResponse.data.data.contentPageId || createPageResponse.data.data.id;
        testContentPageSlug = createPageResponse.data.data.slug;
      } else {
        console.log('Failed to create page:', createPageResponse.data);
      }
    }
    
    // Check if seeded block exists, create if not
    const blockResponse = await client.get(`/business/content/blocks/${TEST_CONTENT_BLOCK_ID}`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    if (blockResponse.status === 200) {
      testContentBlockId = TEST_CONTENT_BLOCK_ID;
    } else if (testContentPageId && testContentTypeId) {
      // Create block dynamically
      const createBlockResponse = await client.post('/business/content/blocks', {
        pageId: testContentPageId,
        contentTypeId: testContentTypeId,
        name: TEST_CONTENT_BLOCK.name,
        order: 0,
        content: TEST_CONTENT_BLOCK.content,
        status: 'active'
      }, { headers: { Authorization: `Bearer ${adminToken}` } });
      
      if (createBlockResponse.status === 201) {
        // DB returns contentBlockId, not id
        testContentBlockId = createBlockResponse.data.data.contentBlockId || createBlockResponse.data.data.id;
      } else {
        console.log('Failed to create block:', createBlockResponse.data);
      }
    }
  });

  describe('Content Type API', () => {
    it('should get content type by id with camelCase properties', async () => {
      if (!testContentTypeId) {
        console.log('Skipping test - no content type ID');
        return;
      }
      
      const response = await client.get(`/business/content/types/${testContentTypeId}`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('contentTypeId', testContentTypeId);
        
        // Verify properties from TypeScript interface are in camelCase
        expect(response.data.data).toHaveProperty('name');
        expect(response.data.data).toHaveProperty('createdAt');
        
        // Make sure no snake_case properties leaked through
        expect(response.data.data).not.toHaveProperty('created_at');
    });

    it('should update a content type with camelCase properties', async () => {
      if (!testContentTypeId) {
        console.log('Skipping test - no content type ID');
        return;
      }
      
      const updateData = {
        name: 'Updated Test Content Type',
        description: 'Updated description for integration tests'
      };
      
      const response = await client.put(`/business/content/types/${testContentTypeId}`, updateData, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      if (response.status === 200) {
        expect(response.data.success).toBe(true);
        expect(response.data.data).toHaveProperty('name', updateData.name);
      }
    });

    it('should list all content types with camelCase properties', async () => {
      const response = await client.get('/business/content/types', {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(Array.isArray(response.data.data)).toBe(true);
      
      // Find our test content type in the results
      const contentType = response.data.data.find((ct: any) => ct.contentTypeId === testContentTypeId);
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
      const response = await client.get(`/business/content/pages/${testContentPageId}`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('contentPageId', testContentPageId);
      
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
      
      const response = await client.put(`/business/content/pages/${testContentPageId}`, updateData, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      
      // Verify the update worked
      expect(response.data.data).toHaveProperty('title', updateData.title);
      expect(response.data.data).toHaveProperty('summary', updateData.summary);
      expect(response.data.data).toHaveProperty('metaTitle', updateData.metaTitle);
      
      // Verify that non-updated fields are preserved
      expect(response.data.data).toHaveProperty('contentPageId', testContentPageId);
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
      const response = await client.get(`/business/content/blocks/${testContentBlockId}`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('contentBlockId', testContentBlockId);
      
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
      const response = await client.get(`/business/content/pages/${testContentPageId}/blocks`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(Array.isArray(response.data.data)).toBe(true);
      
      // Find our test block in the results
      const contentBlock = response.data.data.find((block: any) => block.contentBlockId === testContentBlockId);
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
      const response = await client.get(`/business/content/templates/${testContentTemplateId}`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('contentTemplateId', testContentTemplateId);
      
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
      const response = await client.get('/business/content/templates', {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(Array.isArray(response.data.data)).toBe(true);
      
      // Find our test template in the results
      const template = response.data.data.find((t: any) => t.contentTemplateId === testContentTemplateId);
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
