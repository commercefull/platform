/**
 * Content Categories Integration Tests
 * Tests for category CRUD operations and hierarchy management
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

describe('Content Categories API', () => {
  let client: AxiosInstance;
  let createdCategoryId: string;
  let createdChildCategoryId: string;

  beforeAll(async () => {
    client = createClient();
    
    // Get auth token
    const loginResponse = await client.post('/business/auth/login', ADMIN_CREDENTIALS, { headers: { 'X-Test-Request': 'true' } });
    if (loginResponse.data.accessToken) {
      client.defaults.headers.common['Authorization'] = `Bearer ${loginResponse.data.accessToken}`;
    }
  });

  afterAll(async () => {
    // Cleanup in reverse order (child first)
    if (createdChildCategoryId) {
      await client.delete(`${API_BASE}/categories/${createdChildCategoryId}`);
    }
    if (createdCategoryId) {
      await client.delete(`${API_BASE}/categories/${createdCategoryId}`);
    }
  });

  describe('GET /content/categories', () => {
    it('should return a list of categories', async () => {
      const response = await client.get(`${API_BASE}/categories`);

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(Array.isArray(response.data.data)).toBe(true);
    });

    it('should filter by isActive', async () => {
      const response = await client.get(`${API_BASE}/categories?isActive=true`);

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
    });
  });

  describe('POST /content/categories', () => {
    it('should create a new category', async () => {
      const categoryData = {
        ...TEST_DATA.category,
        name: `Test Category ${Date.now()}`,
        slug: `test-category-${Date.now()}`
      };

      const response = await client.post(`${API_BASE}/categories`, categoryData);

      expect(response.status).toBe(201);
      expect(response.data.success).toBe(true);
      expect(response.data.data.id).toBeDefined();
      expect(response.data.data.name).toBe(categoryData.name);
      expect(response.data.data.slug).toBe(categoryData.slug);

      createdCategoryId = response.data.data.id;
    });

    it('should create a child category', async () => {
      if (!createdCategoryId) return;

      const childCategoryData = {
        name: `Child Category ${Date.now()}`,
        slug: `child-category-${Date.now()}`,
        parentId: createdCategoryId,
        isActive: true
      };

      const response = await client.post(`${API_BASE}/categories`, childCategoryData);

      expect(response.status).toBe(201);
      expect(response.data.success).toBe(true);
      expect(response.data.data.parentId).toBe(createdCategoryId);

      createdChildCategoryId = response.data.data.id;
    });

    it('should return 400 if name is missing', async () => {
      const response = await client.post(`${API_BASE}/categories`, { slug: 'missing-name' });

      expect(response.status).toBe(400);
      expect(response.data.success).toBe(false);
    });
  });

  describe('GET /content/categories/tree', () => {
    it('should return categories as a tree structure', async () => {
      const response = await client.get(`${API_BASE}/categories/tree`);

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(Array.isArray(response.data.data)).toBe(true);
    });
  });

  describe('GET /content/categories/:id', () => {
    it('should return a category by ID', async () => {
      if (!createdCategoryId) return;

      const response = await client.get(`${API_BASE}/categories/${createdCategoryId}`);

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data.id).toBe(createdCategoryId);
    });

    it('should return 404 for non-existent category', async () => {
      const response = await client.get(`${API_BASE}/categories/00000000-0000-0000-0000-000000000000`);

      expect(response.status).toBe(404);
      expect(response.data.success).toBe(false);
    });
  });

  describe('PUT /content/categories/:id', () => {
    it('should update a category', async () => {
      if (!createdCategoryId) return;

      const updateData = {
        name: 'Updated Category Name',
        description: 'Updated description'
      };

      const response = await client.put(`${API_BASE}/categories/${createdCategoryId}`, updateData);

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data.name).toBe(updateData.name);
    });
  });

  describe('POST /content/categories/:id/move', () => {
    it('should move a category to a new parent', async () => {
      if (!createdChildCategoryId) return;

      // Move child to root (no parent)
      const response = await client.post(`${API_BASE}/categories/${createdChildCategoryId}/move`, {
        newParentId: null
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
    });

    it('should move a category back under parent', async () => {
      if (!createdChildCategoryId || !createdCategoryId) return;

      const response = await client.post(`${API_BASE}/categories/${createdChildCategoryId}/move`, {
        newParentId: createdCategoryId
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
    });
  });

  describe('DELETE /content/categories/:id', () => {
    it('should delete a child category first', async () => {
      if (!createdChildCategoryId) return;

      const response = await client.delete(`${API_BASE}/categories/${createdChildCategoryId}`);

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      createdChildCategoryId = '';
    });

    it('should delete a parent category', async () => {
      if (!createdCategoryId) return;

      const response = await client.delete(`${API_BASE}/categories/${createdCategoryId}`);

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      createdCategoryId = '';
    });
  });
});
