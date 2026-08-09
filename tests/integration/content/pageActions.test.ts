import axios, { AxiosInstance } from 'axios';
import {
  TEST_CONTENT_TYPE_ID,
  TEST_CONTENT_PAGE_ID,
  TEST_CONTENT_TEMPLATE_ID,
  ADMIN_CREDENTIALS,
} from '../testConstants';

const createClient = () =>
  axios.create({
    baseURL: process.env.API_URL || 'http://localhost:3000',
    validateStatus: () => true,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
  });

describe('Content Page Actions API', () => {
  let client: AxiosInstance;
  let adminToken: string;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let testContentTypeId: string;
   
  let testContentPageId: string;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let testContentTemplateId: string;
  let duplicatePageId: string;

  beforeAll(async () => {
    jest.setTimeout(30000);
    client = createClient();

    try {
      const loginResponse = await client.post('/business/auth/login', ADMIN_CREDENTIALS, {
        headers: { 'X-Test-Request': 'true' },
      });
      adminToken = loginResponse.data?.accessToken || '';
      if (!adminToken) return;
    } catch {
      adminToken = '';
      return;
    }

    testContentTypeId = TEST_CONTENT_TYPE_ID;
    testContentTemplateId = TEST_CONTENT_TEMPLATE_ID;
    testContentPageId = TEST_CONTENT_PAGE_ID;
  });

  describe('Page Search', () => {
    it('should search pages by title', async () => {
      const response = await client.get('/business/content/pages?search=Integration', {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(Array.isArray(response.data.data)).toBe(true);
    });

    it('should filter pages by status', async () => {
      const response = await client.get('/business/content/pages?status=published', {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      if (response.data.data.length > 0) {
        expect(response.data.data[0]).toHaveProperty('status', 'published');
      }
    });
  });

  describe('Publish / Unpublish', () => {
    it('should publish a page', async () => {
      if (!testContentPageId) return;
      const response = await client.post(
        `/business/content/pages/${testContentPageId}/publish`,
        {},
        { headers: { Authorization: `Bearer ${adminToken}` } },
      );

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('status', 'published');
    });

    it('should unpublish a page', async () => {
      if (!testContentPageId) return;
      const response = await client.post(
        `/business/content/pages/${testContentPageId}/unpublish`,
        {},
        { headers: { Authorization: `Bearer ${adminToken}` } },
      );

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('status', 'draft');
    });

    it('should return 404 for non-existent page publish', async () => {
      const response = await client.post(
        '/business/content/pages/00000000-0000-0000-0000-000000000001/publish',
        {},
        { headers: { Authorization: `Bearer ${adminToken}` } },
      );

      expect(response.status).toBe(404);
    });
  });

  describe('Schedule Page', () => {
    it('should schedule a page', async () => {
      if (!testContentPageId) return;
      const futureDate = new Date(Date.now() + 86400000).toISOString();

      const response = await client.post(
        `/business/content/pages/${testContentPageId}/schedule`,
        { scheduledAt: futureDate },
        { headers: { Authorization: `Bearer ${adminToken}` } },
      );

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('status', 'scheduled');
    });

    it('should return 400 when missing scheduledAt', async () => {
      if (!testContentPageId) return;
      const response = await client.post(
        `/business/content/pages/${testContentPageId}/schedule`,
        {},
        { headers: { Authorization: `Bearer ${adminToken}` } },
      );

      expect(response.status).toBe(400);
    });
  });

  describe('Duplicate Page', () => {
    it('should duplicate a page', async () => {
      if (!testContentPageId) return;
      const response = await client.post(
        `/business/content/pages/${testContentPageId}/duplicate`,
        {
          title: 'Duplicated Test Page ' + Date.now(),
          slug: 'duplicated-test-page-' + Date.now(),
        },
        { headers: { Authorization: `Bearer ${adminToken}` } },
      );

      expect(response.status).toBe(201);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('contentPageId');
      duplicatePageId = response.data.data.contentPageId;
    });

    it('should return 400 when missing title or slug', async () => {
      if (!testContentPageId) return;
      const response = await client.post(
        `/business/content/pages/${testContentPageId}/duplicate`,
        {},
        { headers: { Authorization: `Bearer ${adminToken}` } },
      );

      expect(response.status).toBe(400);
    });

    it('should return 404 for non-existent page duplicate', async () => {
      const response = await client.post(
        '/business/content/pages/00000000-0000-0000-0000-000000000001/duplicate',
        { title: 'Test', slug: 'test' },
        { headers: { Authorization: `Bearer ${adminToken}` } },
      );

      expect(response.status).toBe(404);
    });
  });

  describe('Full Page View', () => {
    it('should get full page with blocks and template', async () => {
      if (!testContentPageId) return;
      const response = await client.get(`/business/content/pages/${testContentPageId}/full`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toBeDefined();
    });
  });

  afterAll(async () => {
    // Clean up duplicated page
    if (duplicatePageId && adminToken) {
      await client.delete(`/business/content/pages/${duplicatePageId}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
    }
    // Re-publish the shared test page since the unpublish test changed its state
    if (testContentPageId && adminToken) {
      await client.post(
        `/business/content/pages/${testContentPageId}/publish`,
        {},
        { headers: { Authorization: `Bearer ${adminToken}` } },
      );
    }
  });
});
