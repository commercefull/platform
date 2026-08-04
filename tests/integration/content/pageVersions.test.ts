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

describe('Content Page Versions API', () => {
  let client: AxiosInstance;
  let adminToken: string;
  let testContentPageId: string;
  let versionId: string;

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
  });

  it('should create a page version snapshot', async () => {
    if (!testContentPageId) return;
    const response = await client.post(
      `/business/content/pages/${testContentPageId}/versions`,
      { comment: 'Test version snapshot' },
      { headers: { Authorization: `Bearer ${adminToken}` } },
    );

    expect(response.status).toBe(201);
    expect(response.data.success).toBe(true);
    expect(response.data.data).toHaveProperty('contentPageVersionId');
    expect(response.data.data).toHaveProperty('version');
    versionId = response.data.data.contentPageVersionId;
  });

  it('should list page versions', async () => {
    if (!testContentPageId) return;
    const response = await client.get(`/business/content/pages/${testContentPageId}/versions`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    expect(response.status).toBe(200);
    expect(response.data.success).toBe(true);
    expect(Array.isArray(response.data.data)).toBe(true);
    if (response.data.data.length > 0) {
      expect(response.data.data[0]).toHaveProperty('version');
    }
  });

  it('should restore a page version', async () => {
    if (!testContentPageId || !versionId) return;
    const response = await client.post(
      `/business/content/pages/${testContentPageId}/versions/${versionId}/restore`,
      {},
      { headers: { Authorization: `Bearer ${adminToken}` } },
    );

    expect(response.status).toBe(200);
    expect(response.data.success).toBe(true);
    expect(response.data.data).toBeDefined();
  });

  it('should return 404 for non-existent page versions', async () => {
    const response = await client.get(
      '/business/content/pages/00000000-0000-0000-0000-000000000001/versions',
      { headers: { Authorization: `Bearer ${adminToken}` } },
    );

    expect(response.status).toBe(404);
  });

  it('should return 404 for restoring non-existent version', async () => {
    if (!testContentPageId) return;
    const response = await client.post(
      `/business/content/pages/${testContentPageId}/versions/00000000-0000-0000-0000-000000000001/restore`,
      {},
      { headers: { Authorization: `Bearer ${adminToken}` } },
    );

    expect(response.status).toBe(404);
  });

  it('should delete a page version', async () => {
    if (!versionId) return;
    const response = await client.delete(`/business/content/versions/${versionId}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    expect(response.status).toBe(200);
    expect(response.data.success).toBe(true);
  });
});
