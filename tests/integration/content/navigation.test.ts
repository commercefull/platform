import axios, { AxiosInstance } from 'axios';
import { ADMIN_CREDENTIALS } from '../testConstants';

const createClient = () =>
  axios.create({
    baseURL: process.env.API_URL || 'http://localhost:3000',
    validateStatus: () => true,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
  });

describe('Content Navigation API', () => {
  let client: AxiosInstance;
  let adminToken: string;
  let navigationId: string;
  let navigationItemId: string;

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
  });

  it('should create a navigation', async () => {
    const response = await client.post(
      '/business/content/navigations',
      {
        name: 'Test Navigation ' + Date.now(),
        slug: 'test-nav-' + Date.now(),
        description: 'Test navigation for integration tests',
        location: 'header',
        isActive: true,
      },
      { headers: { Authorization: `Bearer ${adminToken}` } },
    );

    expect(response.status).toBe(201);
    expect(response.data.success).toBe(true);
    expect(response.data.data).toHaveProperty('contentNavigationId');
    navigationId = response.data.data.contentNavigationId;
  });

  it('should list navigations', async () => {
    const response = await client.get('/business/content/navigations', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    expect(response.status).toBe(200);
    expect(response.data.success).toBe(true);
    expect(Array.isArray(response.data.data)).toBe(true);
  });

  it('should get navigation by ID', async () => {
    if (!navigationId) return;
    const response = await client.get(`/business/content/navigations/${navigationId}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    expect(response.status).toBe(200);
    expect(response.data.success).toBe(true);
    expect(response.data.data).toHaveProperty('contentNavigationId', navigationId);
  });

  it('should update a navigation', async () => {
    if (!navigationId) return;
    const response = await client.put(
      `/business/content/navigations/${navigationId}`,
      { name: 'Updated Navigation Name' },
      { headers: { Authorization: `Bearer ${adminToken}` } },
    );

    expect(response.status).toBe(200);
    expect(response.data.success).toBe(true);
  });

  it('should add a navigation item', async () => {
    if (!navigationId) return;
    const response = await client.post(
      `/business/content/navigations/${navigationId}/items`,
      {
        title: 'Test Nav Item',
        type: 'url',
        url: '/test-page',
        sortOrder: 0,
        isActive: true,
      },
      { headers: { Authorization: `Bearer ${adminToken}` } },
    );

    expect(response.status).toBe(201);
    expect(response.data.success).toBe(true);
    expect(response.data.data).toHaveProperty('contentNavigationItemId');
    navigationItemId = response.data.data.contentNavigationItemId;
  });

  it('should get navigation with items', async () => {
    if (!navigationId) return;
    const response = await client.get(`/business/content/navigations/${navigationId}/items`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    expect(response.status).toBe(200);
    expect(response.data.success).toBe(true);
    expect(response.data.data).toHaveProperty('navigation');
    expect(response.data.data).toHaveProperty('items');
  });

  it('should update a navigation item', async () => {
    if (!navigationItemId) return;
    const response = await client.put(
      `/business/content/navigation-items/${navigationItemId}`,
      { title: 'Updated Nav Item', url: '/updated-page' },
      { headers: { Authorization: `Bearer ${adminToken}` } },
    );

    expect(response.status).toBe(200);
    expect(response.data.success).toBe(true);
  });

  it('should return 400 when missing title or type for nav item', async () => {
    if (!navigationId) return;
    const response = await client.post(
      `/business/content/navigations/${navigationId}/items`,
      { url: '/test' },
      { headers: { Authorization: `Bearer ${adminToken}` } },
    );

    expect(response.status).toBe(400);
  });

  it('should delete a navigation item', async () => {
    if (!navigationItemId) return;
    const response = await client.delete(`/business/content/navigation-items/${navigationItemId}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    expect(response.status).toBe(200);
    expect(response.data.success).toBe(true);
  });

  it('should delete a navigation', async () => {
    if (!navigationId) return;
    const response = await client.delete(`/business/content/navigations/${navigationId}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    expect(response.status).toBe(200);
    expect(response.data.success).toBe(true);
  });
});
