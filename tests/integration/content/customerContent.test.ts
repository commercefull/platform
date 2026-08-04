import axios, { AxiosInstance } from 'axios';
import {
  TEST_CONTENT_TYPE_ID,
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

describe('Content Customer API', () => {
  let client: AxiosInstance;
  let adminToken: string;
  let createdPageId: string;
  let createdPageSlug: string;

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

    // Create a dedicated published page for this test suite
    const slug = 'customer-api-test-' + Date.now();
    const response = await client.post(
      '/business/content/pages',
      {
        title: 'Customer API Test Page',
        slug,
        contentTypeId: TEST_CONTENT_TYPE_ID,
        templateId: TEST_CONTENT_TEMPLATE_ID,
        status: 'published',
        visibility: 'public',
        summary: 'Test page for customer API tests',
        isHomePage: false,
      },
      { headers: { Authorization: `Bearer ${adminToken}` } },
    );

    if (response.status === 201) {
      createdPageId = response.data.data.contentPageId || response.data.data.id;
      createdPageSlug = response.data.data.slug || slug;

      // Ensure it's published
      await client.post(
        `/business/content/pages/${createdPageId}/publish`,
        {},
        { headers: { Authorization: `Bearer ${adminToken}` } },
      );
    }
  });

  afterAll(async () => {
    if (createdPageId && adminToken) {
      await client.delete(`/business/content/pages/${createdPageId}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
    }
  });

  it('should get published pages via customer endpoint', async () => {
    const response = await client.get('/customer/content/pages');

    expect(response.status).toBe(200);
    expect(response.data.success).toBe(true);
    expect(Array.isArray(response.data.data)).toBe(true);
  });

  it('should get a published page by slug via customer endpoint', async () => {
    if (!createdPageSlug) return;

    const response = await client.get(`/customer/content/pages/${createdPageSlug}`);

    expect(response.status).toBe(200);
    expect(response.data.success).toBe(true);
    expect(response.data.data).toHaveProperty('page');
    expect(response.data.data).toHaveProperty('blocks');
  });

  it('should return 404 for non-existent slug via customer endpoint', async () => {
    const response = await client.get('/customer/content/pages/non-existent-slug-12345');

    expect(response.status).toBe(404);
  });

  it('should get active content types via customer endpoint', async () => {
    const response = await client.get('/customer/content/types');

    expect(response.status).toBe(200);
    expect(response.data.success).toBe(true);
    expect(Array.isArray(response.data.data)).toBe(true);
  });
});
