/**
 * Content Templates Integration Tests
 * Tests for template CRUD operations and duplication
 */

import axios, { AxiosInstance } from 'axios';
import { API_BASE, TEST_DATA } from '../testConstants';
import { ADMIN_CREDENTIALS } from '../../testConstants';

const createClient = (): AxiosInstance => axios.create({
  baseURL: process.env.API_URL || 'http://localhost:3000',
  validateStatus: () => true,
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  }
});

describe('Content Templates API', () => {
  let client: AxiosInstance;
  let createdTemplateId: string;
  let duplicatedTemplateId: string;

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
    if (duplicatedTemplateId) {
      await client.delete(`${API_BASE}/templates/${duplicatedTemplateId}`);
    }
    if (createdTemplateId) {
      await client.delete(`${API_BASE}/templates/${createdTemplateId}`);
    }
  });

  describe('GET /content/templates', () => {
    it('should return a list of templates', async () => {
      const response = await client.get(`${API_BASE}/templates`);

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(Array.isArray(response.data.data)).toBe(true);
    });

    it('should support pagination', async () => {
      const response = await client.get(`${API_BASE}/templates?limit=10&offset=0`);

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
    });
  });

  describe('POST /content/templates', () => {
    it('should create a new template', async () => {
      const templateData = {
        ...TEST_DATA.template,
        name: `Test Template ${Date.now()}`,
        slug: `test-template-${Date.now()}`,
        htmlStructure: '<div class="container"><header>{{header}}</header><main>{{content}}</main><footer>{{footer}}</footer></div>',
        cssStyles: '.container { max-width: 1200px; margin: 0 auto; }',
        areas: {
          header: { name: 'Header', allowedBlocks: ['navigation', 'logo'] },
          content: { name: 'Main Content', allowedBlocks: ['hero', 'text', 'image'] },
          footer: { name: 'Footer', allowedBlocks: ['navigation', 'social'] }
        }
      };

      const response = await client.post(`${API_BASE}/templates`, templateData);

      expect(response.status).toBe(201);
      expect(response.data.success).toBe(true);
      expect(response.data.data.id).toBeDefined();
      expect(response.data.data.name).toBe(templateData.name);
      expect(response.data.data.slug).toBe(templateData.slug);

      createdTemplateId = response.data.data.id;
    });

    it('should return 400 if name is missing', async () => {
      const response = await client.post(`${API_BASE}/templates`, {
        slug: 'missing-name'
      });

      expect(response.status).toBe(400);
      expect(response.data.success).toBe(false);
    });

    it('should return 400 if slug is missing', async () => {
      const response = await client.post(`${API_BASE}/templates`, {
        name: 'Missing Slug'
      });

      expect(response.status).toBe(400);
      expect(response.data.success).toBe(false);
    });
  });

  describe('GET /content/templates/:id', () => {
    it('should return a template by ID', async () => {
      if (!createdTemplateId) return;

      const response = await client.get(`${API_BASE}/templates/${createdTemplateId}`);

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data.id).toBe(createdTemplateId);
    });

    it('should return 404 for non-existent template', async () => {
      const response = await client.get(`${API_BASE}/templates/00000000-0000-0000-0000-000000000000`);

      expect(response.status).toBe(404);
      expect(response.data.success).toBe(false);
    });
  });

  describe('PUT /content/templates/:id', () => {
    it('should update a template', async () => {
      if (!createdTemplateId) return;

      const updateData = {
        name: 'Updated Template Name',
        description: 'Updated template description',
        cssStyles: '.container { max-width: 1400px; }'
      };

      const response = await client.put(`${API_BASE}/templates/${createdTemplateId}`, updateData);

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data.name).toBe(updateData.name);
    });

    it('should deactivate a template', async () => {
      if (!createdTemplateId) return;

      const response = await client.put(`${API_BASE}/templates/${createdTemplateId}`, {
        isActive: false
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data.isActive).toBe(false);
    });

    it('should reactivate a template', async () => {
      if (!createdTemplateId) return;

      const response = await client.put(`${API_BASE}/templates/${createdTemplateId}`, {
        isActive: true
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data.isActive).toBe(true);
    });
  });

  describe('POST /content/templates/:id/duplicate', () => {
    it('should duplicate a template', async () => {
      if (!createdTemplateId) return;

      const duplicateData = {
        name: `Duplicated Template ${Date.now()}`,
        slug: `duplicated-template-${Date.now()}`
      };

      const response = await client.post(`${API_BASE}/templates/${createdTemplateId}/duplicate`, duplicateData);

      expect(response.status).toBe(201);
      expect(response.data.success).toBe(true);
      expect(response.data.data.id).toBeDefined();
      expect(response.data.data.name).toBe(duplicateData.name);
      expect(response.data.data.slug).toBe(duplicateData.slug);
      expect(response.data.data.isSystem).toBe(false); // Duplicates are never system templates

      duplicatedTemplateId = response.data.data.id;
    });

    it('should return 400 if name is missing for duplicate', async () => {
      if (!createdTemplateId) return;

      const response = await client.post(`${API_BASE}/templates/${createdTemplateId}/duplicate`, {
        slug: 'missing-name'
      });

      expect(response.status).toBe(400);
      expect(response.data.success).toBe(false);
    });

    it('should return 404 when duplicating non-existent template', async () => {
      const response = await client.post(`${API_BASE}/templates/00000000-0000-0000-0000-000000000000/duplicate`, {
        name: 'Test',
        slug: 'test'
      });

      expect(response.status).toBe(404);
      expect(response.data.success).toBe(false);
    });
  });

  describe('DELETE /content/templates/:id', () => {
    it('should delete a duplicated template', async () => {
      if (!duplicatedTemplateId) return;

      const response = await client.delete(`${API_BASE}/templates/${duplicatedTemplateId}`);

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      duplicatedTemplateId = '';
    });

    it('should delete the original template', async () => {
      if (!createdTemplateId) return;

      const response = await client.delete(`${API_BASE}/templates/${createdTemplateId}`);

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      createdTemplateId = '';
    });
  });
});
