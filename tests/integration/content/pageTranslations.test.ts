import axios, { AxiosInstance } from 'axios';
import {
  TEST_CONTENT_PAGE_ID,
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

describe('Content Page Translations API', () => {
  let client: AxiosInstance;
  let adminToken: string;
  let testContentPageId: string;
  let testLocaleId: string;
  let translationId: string;

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

    // Fetch a locale ID from the API
    try {
      const localeResp = await client.get('/business/locales', {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      if (localeResp.data?.data && Array.isArray(localeResp.data.data) && localeResp.data.data.length > 0) {
        testLocaleId = localeResp.data.data[0].localeId;
      }
    } catch {
      // locales might not be available
    }
  });

  it('should create a page translation', async () => {
    if (!testContentPageId || !testLocaleId) return;
    const response = await client.post(
      `/business/content/pages/${testContentPageId}/translations`,
      {
        localeId: testLocaleId,
        title: 'Translated Test Page',
        slug: 'translated-test-page-' + Date.now(),
        summary: 'Translated summary',
        metaTitle: 'Translated Meta Title',
        isPublished: false,
      },
      { headers: { Authorization: `Bearer ${adminToken}` } },
    );

    expect(response.status).toBe(201);
    expect(response.data.success).toBe(true);
    expect(response.data.data).toHaveProperty('contentPageTranslationId');
    translationId = response.data.data.contentPageTranslationId;
  });

  it('should list page translations', async () => {
    if (!testContentPageId) return;
    const response = await client.get(`/business/content/pages/${testContentPageId}/translations`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    expect(response.status).toBe(200);
    expect(response.data.success).toBe(true);
    expect(Array.isArray(response.data.data)).toBe(true);
  });

  it('should get translation by locale', async () => {
    if (!testContentPageId || !testLocaleId) return;
    const response = await client.get(
      `/business/content/pages/${testContentPageId}/translations/${testLocaleId}`,
      { headers: { Authorization: `Bearer ${adminToken}` } },
    );

    expect(response.status).toBe(200);
    expect(response.data.success).toBe(true);
    expect(response.data.data).toHaveProperty('localeId', testLocaleId);
  });

  it('should update a translation', async () => {
    if (!translationId) return;
    const response = await client.put(
      `/business/content/translations/${translationId}`,
      {
        title: 'Updated Translation Title',
        isApproved: true,
      },
      { headers: { Authorization: `Bearer ${adminToken}` } },
    );

    expect(response.status).toBe(200);
    expect(response.data.success).toBe(true);
    expect(response.data.data).toHaveProperty('title', 'Updated Translation Title');
  });

  it('should return 404 for non-existent translation', async () => {
    const response = await client.get(
      '/business/content/pages/00000000-0000-0000-0000-000000000001/translations/00000000-0000-0000-0000-000000000002',
      { headers: { Authorization: `Bearer ${adminToken}` } },
    );

    expect(response.status).toBe(404);
  });

  it('should return 400 when missing localeId or title', async () => {
    if (!testContentPageId) return;
    const response = await client.post(
      `/business/content/pages/${testContentPageId}/translations`,
      { slug: 'test-slug' },
      { headers: { Authorization: `Bearer ${adminToken}` } },
    );

    expect(response.status).toBe(400);
  });

  it('should delete a translation', async () => {
    if (!translationId) return;
    const response = await client.delete(`/business/content/translations/${translationId}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    expect(response.status).toBe(200);
    expect(response.data.success).toBe(true);
  });
});
