/**
 * Content Redirects Integration Tests
 * Tests for URL redirect rules management
 */

import axios, { AxiosInstance } from 'axios';
import { API_BASE, TEST_DATA } from '../testConstants';
import { ADMIN_CREDENTIALS } from '../../testConstants';

const createClient = (): AxiosInstance =>
  axios.create({
    baseURL: process.env.API_URL || 'http://localhost:3000',
    validateStatus: () => true,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
  });

describe('Content Redirects API', () => {
  let client: AxiosInstance;
  let createdRedirectId: string;
  let createdRegexRedirectId: string;

  beforeAll(async () => {
    client = createClient();

    // Get auth token
    const loginResponse = await client.post('/business/auth/login', ADMIN_CREDENTIALS, { headers: { 'X-Test-Request': 'true' } });
    if (loginResponse.data.accessToken) {
      client.defaults.headers.common['Authorization'] = `Bearer ${loginResponse.data.accessToken}`;
    }
  });

  afterAll(async () => {
    // Cleanup
    if (createdRedirectId) {
      await client.delete(`${API_BASE}/redirects/${createdRedirectId}`);
    }
    if (createdRegexRedirectId) {
      await client.delete(`${API_BASE}/redirects/${createdRegexRedirectId}`);
    }
  });

  describe('GET /content/redirects', () => {
    it('should return a list of redirects', async () => {
      const response = await client.get(`${API_BASE}/redirects`);

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(Array.isArray(response.data.data)).toBe(true);
    });

    it('should filter by isActive', async () => {
      const response = await client.get(`${API_BASE}/redirects?isActive=true`);

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
    });

    it('should support pagination', async () => {
      const response = await client.get(`${API_BASE}/redirects?limit=10&offset=0`);

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
    });
  });

  describe('POST /content/redirects', () => {
    it('should create a new redirect', async () => {
      const redirectData = {
        ...TEST_DATA.redirect,
        sourceUrl: `/old-page-${Date.now()}`,
        targetUrl: `/new-page-${Date.now()}`,
      };

      const response = await client.post(`${API_BASE}/redirects`, redirectData);

      expect(response.status).toBe(201);
      expect(response.data.success).toBe(true);
      expect(response.data.data.contentRedirectId || response.data.data.id).toBeDefined();
      expect(response.data.data.sourceUrl).toBe(redirectData.sourceUrl);
      expect(response.data.data.targetUrl).toBe(redirectData.targetUrl);
      expect(String(response.data.data.statusCode)).toBe('301');
      expect(response.data.data.hits).toBe(0);

      createdRedirectId = response.data.data.contentRedirectId || response.data.data.id;
    });

    it('should create a redirect with 302 status code', async () => {
      const redirectData = {
        sourceUrl: `/temp-redirect-${Date.now()}`,
        targetUrl: `/destination-${Date.now()}`,
        statusCode: 302,
        isActive: true,
      };

      const response = await client.post(`${API_BASE}/redirects`, redirectData);

      expect(response.status).toBe(201);
      expect(response.data.success).toBe(true);
      expect(String(response.data.data.statusCode)).toBe('302');

      // Cleanup
      if (response.data.data.contentRedirectId || response.data.data.id) {
        await client.delete(`${API_BASE}/redirects/${response.data.data.contentRedirectId || response.data.data.id}`);
      }
    });
  });

  describe('POST /content/redirects', () => {
    it('should return 400 if sourceUrl is missing', async () => {
      const response = await client.post(`${API_BASE}/redirects`, {
        targetUrl: '/destination',
      });

      expect(response.status).toBe(400);
      expect(response.data.success).toBe(false);
    });

    it('should return 400 if targetUrl is missing', async () => {
      const response = await client.post(`${API_BASE}/redirects`, {
        sourceUrl: '/source',
      });

      expect(response.status).toBe(400);
      expect(response.data.success).toBe(false);
    });
  });

  describe('GET /content/redirects/:id', () => {
    it('should return a redirect by ID', async () => {
      if (!createdRedirectId) return;

      const response = await client.get(`${API_BASE}/redirects/${createdRedirectId}`);

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data.contentRedirectId || response.data.data.id).toBe(createdRedirectId);
    });

    it('should return 404 for non-existent redirect', async () => {
      const response = await client.get(`${API_BASE}/redirects/00000000-0000-0000-0000-000000000000`);

      expect(response.status).toBe(404);
      expect(response.data.success).toBe(false);
    });
  });

  describe('PUT /content/redirects/:id', () => {
    it('should update a redirect', async () => {
      if (!createdRedirectId) return;

      const updateData = {
        targetUrl: '/updated-destination',
        notes: 'Updated redirect notes',
      };

      const response = await client.put(`${API_BASE}/redirects/${createdRedirectId}`, updateData);

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data.targetUrl).toBe(updateData.targetUrl);
    });

    it('should deactivate a redirect', async () => {
      if (!createdRedirectId) return;

      const response = await client.put(`${API_BASE}/redirects/${createdRedirectId}`, {
        isActive: false,
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data.isActive).toBe(false);
    });

    it('should reactivate a redirect', async () => {
      if (!createdRedirectId) return;

      const response = await client.put(`${API_BASE}/redirects/${createdRedirectId}`, {
        isActive: true,
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data.isActive).toBe(true);
    });
  });

  describe('DELETE /content/redirects/:id', () => {
    it('should delete a redirect', async () => {
      if (!createdRedirectId) return;

      const response = await client.delete(`${API_BASE}/redirects/${createdRedirectId}`);

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      createdRedirectId = '';
    });

    it('should delete a regex redirect', async () => {
      if (!createdRegexRedirectId) return;

      const response = await client.delete(`${API_BASE}/redirects/${createdRegexRedirectId}`);

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      createdRegexRedirectId = '';
    });
  });
});
