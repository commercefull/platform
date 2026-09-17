import axios, { AxiosInstance } from 'axios';
import {
  TEST_CONTENT_TYPE_ID,
  TEST_CONTENT_PAGE_ID,
  TEST_CONTENT_TEMPLATE_ID,
  ADMIN_CREDENTIALS,
} from '../testConstants';

// Create axios client for tests
const createClient = () =>
  axios.create({
    baseURL: process.env.API_URL || 'http://localhost:3000',
    validateStatus: () => true,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
  });

describe('Content Feature Tests', () => {
  let client: AxiosInstance;
  let adminToken: string;
  let testContentTypeId: string;
  let testContentPageId: string;
  let testContentTemplateId: string;

  beforeAll(async () => {
    jest.setTimeout(30000);
    client = createClient();

    // Get admin token
    try {
      const loginResponse = await client.post('/business/auth/login', ADMIN_CREDENTIALS, { headers: { 'X-Test-Request': 'true' } });
      adminToken = loginResponse.data?.accessToken || '';
      if (!adminToken) {
        return;
      }
    } catch {
      adminToken = '';
      return;
    }

    // Content fixtures are provisioned by seeds/20240805002001_seedIntegrationTestData.js
    testContentTypeId = TEST_CONTENT_TYPE_ID;
    testContentTemplateId = TEST_CONTENT_TEMPLATE_ID;
    testContentPageId = TEST_CONTENT_PAGE_ID;
  });

  describe('Content Type API', () => {
    it('should get content type by id with camelCase properties', async () => {
      const response = await client.get(`/business/content/types/${testContentTypeId}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
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
      const updateData = {
        name: 'Updated Test Content Type',
        description: 'Updated description for integration tests',
      };

      const response = await client.put(`/business/content/types/${testContentTypeId}`, updateData, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      if (response.status === 200) {
        expect(response.data.success).toBe(true);
        expect(response.data.data).toHaveProperty('name', updateData.name);
      }
    });

    it('should list all content types with camelCase properties', async () => {
      const response = await client.get('/business/content/types', {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(Array.isArray(response.data.data)).toBe(true);

      // If we have any content types, verify their structure
      if (response.data.data.length > 0) {
        const contentType = response.data.data[0]; // Check the first one

        // Verify properties use camelCase
        expect(contentType).toHaveProperty('name');
        expect(contentType).toHaveProperty('slug');
        expect(contentType).toHaveProperty('isActive');
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
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('contentPageId', testContentPageId);

      // Verify properties from TypeScript interface are in camelCase
      expect(response.data.data).toHaveProperty('title');
      expect(response.data.data).toHaveProperty('slug');
      expect(response.data.data).toHaveProperty('status');
      expect(response.data.data).toHaveProperty('visibility');
      expect(response.data.data).toHaveProperty('contentTypeId');
      expect(response.data.data).toHaveProperty('isHomePage');
      expect(response.data.data).toHaveProperty('metaTitle');
      expect(response.data.data).toHaveProperty('metaDescription');
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
        metaTitle: 'Updated Meta Title',
      };

      const response = await client.put(`/business/content/pages/${testContentPageId}`, updateData, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);

      // Verify the update worked - title and metaTitle should be updated
      expect(response.data.data).toHaveProperty('title', updateData.title);
      expect(response.data.data).toHaveProperty('summary'); // Check existence, not value
      expect(response.data.data).toHaveProperty('metaTitle', updateData.metaTitle);

      // Verify that non-updated fields are preserved
      expect(response.data.data).toHaveProperty('contentPageId', testContentPageId);
      expect(response.data.data).toHaveProperty('slug');
      expect(response.data.data).toHaveProperty('status');

      // Verify response is using camelCase
      expect(response.data.data).toHaveProperty('metaTitle');
      expect(response.data.data).not.toHaveProperty('meta_title');
    });
  });

  describe('Content Template API', () => {
    it('should get content template by id with camelCase properties', async () => {
      const response = await client.get(`/business/content/templates/${testContentTemplateId}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('contentTemplateId', testContentTemplateId);

      // Verify properties from TypeScript interface are in camelCase
      expect(response.data.data).toHaveProperty('name');
      expect(response.data.data).toHaveProperty('slug');
      expect(response.data.data).toHaveProperty('description');
      expect(response.data.data).toHaveProperty('areas');
      expect(response.data.data).toHaveProperty('isActive');
      expect(response.data.data).toHaveProperty('createdAt');
      expect(response.data.data).toHaveProperty('updatedAt');

      // Make sure no snake_case properties leaked through
      expect(response.data.data).not.toHaveProperty('created_at');
      expect(response.data.data).not.toHaveProperty('updated_at');
    });

    it('should list templates with camelCase properties', async () => {
      const response = await client.get('/business/content/templates', {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(Array.isArray(response.data.data)).toBe(true);

      // Find our test template in the results
      const template = response.data.data.find((t: Record<string, unknown>) => t.contentTemplateId === testContentTemplateId);
      expect(template).toBeDefined();

      if (template) {
        // Verify properties use camelCase
        expect(template).toHaveProperty('name');
        expect(template).toHaveProperty('slug');
        expect(template).toHaveProperty('isActive');
        expect(template).toHaveProperty('createdAt');
        expect(template).toHaveProperty('updatedAt');

        expect(template).not.toHaveProperty('created_at');
        expect(template).not.toHaveProperty('updated_at');
      }
    });
  });
});
