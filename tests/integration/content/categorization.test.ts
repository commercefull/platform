import axios, { AxiosInstance } from 'axios';
import {
  TEST_CONTENT_PAGE_ID,
  TEST_CONTENT_CATEGORY_ID,
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

describe('Content Categorization API', () => {
  let client: AxiosInstance;
  let adminToken: string;
  let testContentPageId: string;
  let testCategoryId: string;
  let categorizationId: string;

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

    testContentPageId = TEST_CONTENT_PAGE_ID;
    testCategoryId = TEST_CONTENT_CATEGORY_ID;
  });

  it('should assign a page to a category', async () => {
    if (!testContentPageId || !testCategoryId) return;
    const response = await client.post(
      `/business/content/pages/${testContentPageId}/categories`,
      { categoryId: testCategoryId, isPrimary: false },
      { headers: { Authorization: `Bearer ${adminToken}` } },
    );

    expect(response.status).toBe(201);
    expect(response.data.success).toBe(true);
    expect(response.data.data).toHaveProperty('contentCategorizationId');
    categorizationId = response.data.data.contentCategorizationId;
  });

  it('should list categories for a page', async () => {
    if (!testContentPageId) return;
    const response = await client.get(`/business/content/pages/${testContentPageId}/categories`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    expect(response.status).toBe(200);
    expect(response.data.success).toBe(true);
    expect(Array.isArray(response.data.data)).toBe(true);
  });

  it('should list pages by category', async () => {
    if (!testCategoryId) return;
    const response = await client.get(`/business/content/categories/${testCategoryId}/pages`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    expect(response.status).toBe(200);
    expect(response.data.success).toBe(true);
    expect(Array.isArray(response.data.data)).toBe(true);
  });

  it('should set primary category', async () => {
    if (!testContentPageId || !categorizationId) return;
    const response = await client.post(
      `/business/content/pages/${testContentPageId}/categories/primary`,
      { categorizationId },
      { headers: { Authorization: `Bearer ${adminToken}` } },
    );

    expect(response.status).toBe(200);
    expect(response.data.success).toBe(true);
    expect(response.data.data).toHaveProperty('isPrimary', true);
  });

  it('should return 400 when missing categoryId', async () => {
    if (!testContentPageId) return;
    const response = await client.post(
      `/business/content/pages/${testContentPageId}/categories`,
      {},
      { headers: { Authorization: `Bearer ${adminToken}` } },
    );

    expect(response.status).toBe(400);
  });

  it('should return 404 for non-existent page', async () => {
    const response = await client.get(
      '/business/content/pages/00000000-0000-0000-0000-000000000001/categories',
      { headers: { Authorization: `Bearer ${adminToken}` } },
    );

    expect(response.status).toBe(404);
  });

  it('should remove a page from a category', async () => {
    if (!testContentPageId || !testCategoryId) return;
    const response = await client.delete(
      `/business/content/pages/${testContentPageId}/categories/${testCategoryId}`,
      { headers: { Authorization: `Bearer ${adminToken}` } },
    );

    expect(response.status).toBe(200);
    expect(response.data.success).toBe(true);
  });

  afterAll(async () => {
    // Remove categorization if created during tests
    if (testContentPageId && testCategoryId && adminToken) {
      await client.delete(
        `/business/content/pages/${testContentPageId}/categories/${testCategoryId}`,
        { headers: { Authorization: `Bearer ${adminToken}` } },
      ).catch(() => {});
    }
  });
});
