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

describe('Content Categories API', () => {
  let client: AxiosInstance;
  let adminToken: string;
  let parentCategoryId: string;
  let childCategoryId: string;

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

  it('should create a parent category', async () => {
    const response = await client.post(
      '/business/content/categories',
      {
        name: 'Parent Category ' + Date.now(),
        slug: 'parent-cat-' + Date.now(),
        description: 'Parent category for integration tests',
        sortOrder: 0,
        isActive: true,
      },
      { headers: { Authorization: `Bearer ${adminToken}` } },
    );

    expect(response.status).toBe(201);
    expect(response.data.success).toBe(true);
    expect(response.data.data).toHaveProperty('contentCategoryId');
    parentCategoryId = response.data.data.contentCategoryId;
  });

  it('should create a child category', async () => {
    if (!parentCategoryId) return;
    const response = await client.post(
      '/business/content/categories',
      {
        name: 'Child Category ' + Date.now(),
        slug: 'child-cat-' + Date.now(),
        parentId: parentCategoryId,
        description: 'Child category for integration tests',
        sortOrder: 0,
        isActive: true,
      },
      { headers: { Authorization: `Bearer ${adminToken}` } },
    );

    expect(response.status).toBe(201);
    expect(response.data.success).toBe(true);
    expect(response.data.data).toHaveProperty('contentCategoryId');
    childCategoryId = response.data.data.contentCategoryId;
  });

  it('should list categories', async () => {
    const response = await client.get('/business/content/categories', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    expect(response.status).toBe(200);
    expect(response.data.success).toBe(true);
    expect(Array.isArray(response.data.data)).toBe(true);
  });

  it('should get category tree', async () => {
    const response = await client.get('/business/content/categories/tree', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    expect(response.status).toBe(200);
    expect(response.data.success).toBe(true);
    expect(Array.isArray(response.data.data)).toBe(true);
  });

  it('should get category by ID', async () => {
    if (!parentCategoryId) return;
    const response = await client.get(`/business/content/categories/${parentCategoryId}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    expect(response.status).toBe(200);
    expect(response.data.success).toBe(true);
    expect(response.data.data).toHaveProperty('contentCategoryId', parentCategoryId);
  });

  it('should update a category', async () => {
    if (!parentCategoryId) return;
    const response = await client.put(
      `/business/content/categories/${parentCategoryId}`,
      { name: 'Updated Parent Category', description: 'Updated description' },
      { headers: { Authorization: `Bearer ${adminToken}` } },
    );

    expect(response.status).toBe(200);
    expect(response.data.success).toBe(true);
  });

  it('should return 404 for non-existent category', async () => {
    const response = await client.get('/business/content/categories/00000000-0000-0000-0000-000000000001', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    expect(response.status).toBe(404);
  });

  it('should return 400 when missing name or slug', async () => {
    const response = await client.post(
      '/business/content/categories',
      { description: 'Missing name and slug' },
      { headers: { Authorization: `Bearer ${adminToken}` } },
    );

    expect(response.status).toBe(400);
  });

  it('should delete child category', async () => {
    if (!childCategoryId) return;
    const response = await client.delete(`/business/content/categories/${childCategoryId}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    expect(response.status).toBe(200);
    expect(response.data.success).toBe(true);
  });

  it('should delete parent category', async () => {
    if (!parentCategoryId) return;
    const response = await client.delete(`/business/content/categories/${parentCategoryId}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    expect(response.status).toBe(200);
    expect(response.data.success).toBe(true);
  });
});
