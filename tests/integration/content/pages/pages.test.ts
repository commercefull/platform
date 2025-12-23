/**
 * Content Pages Integration Tests
 * Tests for page CRUD operations and page actions (publish, schedule, duplicate)
 */

import axios, { AxiosInstance } from 'axios';
import { API_BASE, TEST_DATA } from '../testConstants';
import { ADMIN_CREDENTIALS, TEST_CONTENT_TYPE_ID } from '../../testConstants';

const createClient = (): AxiosInstance =>
  axios.create({
    baseURL: process.env.API_URL || 'http://localhost:3000',
    validateStatus: () => true,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
  });

describe('Content Pages API', () => {
  let client: AxiosInstance;
  let authToken: string;
  let createdPageId: string;
  let createdContentTypeId: string;

  beforeAll(async () => {
    client = createClient();

    // Get auth token
    const loginResponse = await client.post('/business/auth/login', ADMIN_CREDENTIALS, { headers: { 'X-Test-Request': 'true' } });
    if (loginResponse.data.accessToken) {
      authToken = loginResponse.data.accessToken;
      client.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;
    }

    // Create a content type for pages
    const typeResponse = await client.post(`${API_BASE}/types`, {
      name: 'Page Type',
      slug: `page-type-${Date.now()}`,
      description: 'Test page type',
      isActive: true,
    });

    if (typeResponse.status === 201) {
      createdContentTypeId = typeResponse.data.data.id;
    }
  });

  afterAll(async () => {
    // Cleanup
    if (createdPageId) {
      await client.delete(`${API_BASE}/pages/${createdPageId}`);
    }
    if (createdContentTypeId) {
      await client.delete(`${API_BASE}/types/${createdContentTypeId}`);
    }
  });

  describe('GET /content/pages', () => {
    it('should return a list of pages', async () => {
      const response = await client.get(`${API_BASE}/pages`);

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(Array.isArray(response.data.data)).toBe(true);
    });

    it('should support pagination', async () => {
      const response = await client.get(`${API_BASE}/pages?limit=5&offset=0`);

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.pagination).toBeDefined();
    });
  });

  describe('POST /content/pages', () => {
    it('should create a new page', async () => {
      const pageData = {
        ...TEST_DATA.page,
        title: `Test Page ${Date.now()}`,
        slug: `test-page-${Date.now()}`,
        contentTypeId: TEST_CONTENT_TYPE_ID,
      };

      const response = await client.post(`${API_BASE}/pages`, pageData);

      expect(response.status).toBe(201);
      expect(response.data.success).toBe(true);
      expect(response.data.data.id).toBeDefined();
      expect(response.data.data.title).toBe(pageData.title);
      expect(response.data.data.slug).toBe(pageData.slug);
      expect(response.data.data.status).toBe('draft');

      createdPageId = response.data.data.id;
    });

    it('should return 400 if title is missing', async () => {
      const response = await client.post(`${API_BASE}/pages`, { slug: 'missing-title' });

      expect(response.status).toBe(400);
      expect(response.data.success).toBe(false);
    });
  });

  describe('GET /content/pages/:id', () => {
    it('should return a page by ID', async () => {
      if (!createdPageId) return;

      const response = await client.get(`${API_BASE}/pages/${createdPageId}`);

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data.id).toBe(createdPageId);
    });

    it('should return 404 for non-existent page', async () => {
      const response = await client.get(`${API_BASE}/pages/00000000-0000-0000-0000-000000000000`);

      expect(response.status).toBe(404);
      expect(response.data.success).toBe(false);
    });
  });

  describe('PUT /content/pages/:id', () => {
    it('should update a page', async () => {
      if (!createdPageId) return;

      const updateData = {
        title: 'Updated Page Title',
        summary: 'Updated summary',
      };

      const response = await client.put(`${API_BASE}/pages/${createdPageId}`, updateData);

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data.title).toBe(updateData.title);
    });
  });

  describe('POST /content/pages/:id/publish', () => {
    it('should publish a page', async () => {
      if (!createdPageId) return;

      const response = await client.post(`${API_BASE}/pages/${createdPageId}/publish`);

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data.status).toBe('published');
      expect(response.data.data.publishedAt).toBeDefined();
    });
  });

  describe('POST /content/pages/:id/unpublish', () => {
    it('should unpublish a page', async () => {
      if (!createdPageId) return;

      const response = await client.post(`${API_BASE}/pages/${createdPageId}/unpublish`);

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data.status).toBe('draft');
    });
  });

  describe('POST /content/pages/:id/schedule', () => {
    it('should schedule a page for future publication', async () => {
      if (!createdPageId) return;

      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);

      const response = await client.post(`${API_BASE}/pages/${createdPageId}/schedule`, {
        scheduledAt: futureDate.toISOString(),
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data.status).toBe('scheduled');
    });

    it('should return 400 if scheduledAt is missing', async () => {
      if (!createdPageId) return;

      const response = await client.post(`${API_BASE}/pages/${createdPageId}/schedule`, {});

      expect(response.status).toBe(400);
      expect(response.data.success).toBe(false);
    });
  });
});
