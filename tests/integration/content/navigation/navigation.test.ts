/**
 * Content Navigation Integration Tests
 * Tests for navigation menus and navigation items
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

describe('Content Navigation API', () => {
  let client: AxiosInstance;
  let createdNavigationId: string;
  let createdItemId: string;
  let createdChildItemId: string;

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
    if (createdChildItemId) {
      await client.delete(`${API_BASE}/navigation-items/${createdChildItemId}`);
    }
    if (createdItemId) {
      await client.delete(`${API_BASE}/navigation-items/${createdItemId}`);
    }
    if (createdNavigationId) {
      await client.delete(`${API_BASE}/navigations/${createdNavigationId}`);
    }
  });

  describe('GET /content/navigations', () => {
    it('should return a list of navigations', async () => {
      const response = await client.get(`${API_BASE}/navigations`);

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(Array.isArray(response.data.data)).toBe(true);
    });
  });

  describe('POST /content/navigations', () => {
    it('should create a new navigation', async () => {
      const navigationData = {
        ...TEST_DATA.navigation,
        name: `Test Navigation ${Date.now()}`,
        slug: `test-navigation-${Date.now()}`
      };

      const response = await client.post(`${API_BASE}/navigations`, navigationData);

      expect(response.status).toBe(201);
      expect(response.data.success).toBe(true);
      expect(response.data.data.id).toBeDefined();
      expect(response.data.data.name).toBe(navigationData.name);
      expect(response.data.data.location).toBe(navigationData.location);

      createdNavigationId = response.data.data.id;
    });

    it('should return 400 if name is missing', async () => {
      const response = await client.post(`${API_BASE}/navigations`, { slug: 'missing-name' });

      expect(response.status).toBe(400);
      expect(response.data.success).toBe(false);
    });
  });

  describe('GET /content/navigations/:id', () => {
    it('should return a navigation by ID', async () => {
      if (!createdNavigationId) return;

      const response = await client.get(`${API_BASE}/navigations/${createdNavigationId}`);

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data.id).toBe(createdNavigationId);
    });

    it('should return 404 for non-existent navigation', async () => {
      const response = await client.get(`${API_BASE}/navigations/00000000-0000-0000-0000-000000000000`);

      expect(response.status).toBe(404);
      expect(response.data.success).toBe(false);
    });
  });

  describe('PUT /content/navigations/:id', () => {
    it('should update a navigation', async () => {
      if (!createdNavigationId) return;

      const updateData = {
        name: 'Updated Navigation Name',
        location: 'footer'
      };

      const response = await client.put(`${API_BASE}/navigations/${createdNavigationId}`, updateData);

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data.name).toBe(updateData.name);
    });
  });

  describe('POST /content/navigations/:navigationId/items', () => {
    it('should add a navigation item', async () => {
      if (!createdNavigationId) return;

      const itemData = {
        ...TEST_DATA.navigationItem,
        title: 'Home'
      };

      const response = await client.post(`${API_BASE}/navigations/${createdNavigationId}/items`, itemData);

      expect(response.status).toBe(201);
      expect(response.data.success).toBe(true);
      expect(response.data.data.id).toBeDefined();
      expect(response.data.data.title).toBe(itemData.title);
      expect(response.data.data.navigationId).toBe(createdNavigationId);

      createdItemId = response.data.data.id;
    });

    it('should add a child navigation item', async () => {
      if (!createdNavigationId || !createdItemId) return;

      const childItemData = {
        title: 'About Us',
        type: 'url',
        url: '/about',
        parentId: createdItemId,
        sortOrder: 0
      };

      const response = await client.post(`${API_BASE}/navigations/${createdNavigationId}/items`, childItemData);

      expect(response.status).toBe(201);
      expect(response.data.success).toBe(true);
      expect(response.data.data.parentId).toBe(createdItemId);

      createdChildItemId = response.data.data.id;
    });

    it('should return 400 if title is missing', async () => {
      if (!createdNavigationId) return;

      const response = await client.post(`${API_BASE}/navigations/${createdNavigationId}/items`, {
        type: 'url',
        url: '/test'
      });

      expect(response.status).toBe(400);
      expect(response.data.success).toBe(false);
    });
  });

  describe('GET /content/navigations/:id/items', () => {
    it('should return navigation with all items', async () => {
      if (!createdNavigationId) return;

      const response = await client.get(`${API_BASE}/navigations/${createdNavigationId}/items`);

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data.navigation).toBeDefined();
      expect(response.data.data.items).toBeDefined();
      expect(Array.isArray(response.data.data.items)).toBe(true);
    });
  });

  describe('PUT /content/navigation-items/:id', () => {
    it('should update a navigation item', async () => {
      if (!createdItemId) return;

      const updateData = {
        title: 'Updated Home',
        url: '/home'
      };

      const response = await client.put(`${API_BASE}/navigation-items/${createdItemId}`, updateData);

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data.title).toBe(updateData.title);
    });
  });

  describe('POST /content/navigations/:navigationId/items/reorder', () => {
    it('should reorder navigation items', async () => {
      if (!createdNavigationId || !createdItemId || !createdChildItemId) return;

      const response = await client.post(`${API_BASE}/navigations/${createdNavigationId}/items/reorder`, {
        itemOrders: [
          { id: createdItemId, order: 1 },
          { id: createdChildItemId, order: 0 }
        ]
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
    });
  });

  describe('DELETE /content/navigation-items/:id', () => {
    it('should delete a child navigation item', async () => {
      if (!createdChildItemId) return;

      const response = await client.delete(`${API_BASE}/navigation-items/${createdChildItemId}`);

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      createdChildItemId = '';
    });

    it('should delete a parent navigation item', async () => {
      if (!createdItemId) return;

      const response = await client.delete(`${API_BASE}/navigation-items/${createdItemId}`);

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      createdItemId = '';
    });
  });

  describe('DELETE /content/navigations/:id', () => {
    it('should delete a navigation', async () => {
      if (!createdNavigationId) return;

      const response = await client.delete(`${API_BASE}/navigations/${createdNavigationId}`);

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      createdNavigationId = '';
    });
  });
});
