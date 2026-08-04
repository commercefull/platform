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

describe('Content Media & Redirects API', () => {
  let client: AxiosInstance;
  let adminToken: string;
  let mediaId: string;
  let folderId: string;
  let redirectId: string;

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

  // Media Folder tests
  describe('Media Folders', () => {
    it('should create a media folder', async () => {
      const response = await client.post(
        '/business/content/media-folders',
        { name: 'Test Folder ' + Date.now() },
        { headers: { Authorization: `Bearer ${adminToken}` } },
      );

      expect(response.status).toBe(201);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('contentMediaFolderId');
      folderId = response.data.data.contentMediaFolderId;
    });

    it('should list media folders', async () => {
      const response = await client.get('/business/content/media-folders', {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(Array.isArray(response.data.data)).toBe(true);
    });

    it('should return 400 when missing folder name', async () => {
      const response = await client.post(
        '/business/content/media-folders',
        {},
        { headers: { Authorization: `Bearer ${adminToken}` } },
      );

      expect(response.status).toBe(400);
    });

    it('should update a media folder', async () => {
      if (!folderId) return;
      const response = await client.put(
        `/business/content/media-folders/${folderId}`,
        { name: 'Updated Folder Name' },
        { headers: { Authorization: `Bearer ${adminToken}` } },
      );

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
    });
  });

  // Media tests
  describe('Media CRUD', () => {
    it('should upload media (metadata)', async () => {
      const response = await client.post(
        '/business/content/media',
        {
          title: 'Test Media ' + Date.now(),
          fileName: 'test-image.jpg',
          filePath: '/uploads/test-image.jpg',
          fileType: 'image/jpeg',
          fileSize: 102400,
          url: 'https://example.com/test-image.jpg',
          altText: 'Test image',
          folderId: folderId || null,
        },
        { headers: { Authorization: `Bearer ${adminToken}` } },
      );

      expect(response.status).toBe(201);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('contentMediaId');
      mediaId = response.data.data.contentMediaId;
    });

    it('should list media', async () => {
      const response = await client.get('/business/content/media', {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(Array.isArray(response.data.data)).toBe(true);
    });

    it('should get media by ID', async () => {
      if (!mediaId) return;
      const response = await client.get(`/business/content/media/${mediaId}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('contentMediaId', mediaId);
    });

    it('should return 404 for non-existent media', async () => {
      const response = await client.get('/business/content/media/00000000-0000-0000-0000-000000000001', {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(response.status).toBe(404);
    });

    it('should update media', async () => {
      if (!mediaId) return;
      const response = await client.put(
        `/business/content/media/${mediaId}`,
        { title: 'Updated Media Title', altText: 'Updated alt text' },
        { headers: { Authorization: `Bearer ${adminToken}` } },
      );

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
    });

    it('should return 400 when missing required media fields', async () => {
      const response = await client.post(
        '/business/content/media',
        { title: 'Test' },
        { headers: { Authorization: `Bearer ${adminToken}` } },
      );

      expect(response.status).toBe(400);
    });
  });

  // Media Usage tests
  describe('Media Usage', () => {
    it('should track media usage', async () => {
      if (!mediaId) return;
      const response = await client.post(
        '/business/content/media/usage',
        {
          mediaId,
          entityType: 'contentPage',
          entityId: '00000000-0000-0000-0000-000000005002',
          field: 'featuredImage',
        },
        { headers: { Authorization: `Bearer ${adminToken}` } },
      );

      expect(response.status).toBe(201);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('contentMediaUsageId');
    });

    it('should get media usage', async () => {
      if (!mediaId) return;
      const response = await client.get(`/business/content/media/${mediaId}/usage`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(Array.isArray(response.data.data)).toBe(true);
    });

    it('should get media usage count', async () => {
      if (!mediaId) return;
      const response = await client.get(`/business/content/media/${mediaId}/usage/count`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('usageCount');
    });

    it('should get media usage by entity', async () => {
      const response = await client.get(
        '/business/content/media/usage/contentPage/00000000-0000-0000-0000-000000005002',
        { headers: { Authorization: `Bearer ${adminToken}` } },
      );

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(Array.isArray(response.data.data)).toBe(true);
    });

    it('should return 400 when missing required usage fields', async () => {
      const response = await client.post(
        '/business/content/media/usage',
        { mediaId: '00000000-0000-0000-0000-000000000001' },
        { headers: { Authorization: `Bearer ${adminToken}` } },
      );

      expect(response.status).toBe(400);
    });
  });

  // Redirect tests
  describe('Redirects CRUD', () => {
    it('should create a redirect', async () => {
      const response = await client.post(
        '/business/content/redirects',
        {
          sourceUrl: '/old-page-' + Date.now(),
          targetUrl: '/new-page',
          statusCode: '301',
          isActive: true,
        },
        { headers: { Authorization: `Bearer ${adminToken}` } },
      );

      expect(response.status).toBe(201);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('contentRedirectId');
      redirectId = response.data.data.contentRedirectId;
    });

    it('should list redirects', async () => {
      const response = await client.get('/business/content/redirects', {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(Array.isArray(response.data.data)).toBe(true);
    });

    it('should get redirect by ID', async () => {
      if (!redirectId) return;
      const response = await client.get(`/business/content/redirects/${redirectId}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('contentRedirectId', redirectId);
    });

    it('should update a redirect', async () => {
      if (!redirectId) return;
      const response = await client.put(
        `/business/content/redirects/${redirectId}`,
        { targetUrl: '/updated-target', notes: 'Updated redirect notes' },
        { headers: { Authorization: `Bearer ${adminToken}` } },
      );

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
    });

    it('should return 400 when missing sourceUrl or targetUrl', async () => {
      const response = await client.post(
        '/business/content/redirects',
        { statusCode: '301' },
        { headers: { Authorization: `Bearer ${adminToken}` } },
      );

      expect(response.status).toBe(400);
    });

    it('should delete a redirect', async () => {
      if (!redirectId) return;
      const response = await client.delete(`/business/content/redirects/${redirectId}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
    });
  });

  afterAll(async () => {
    // Clean up media and folder
    if (mediaId && adminToken) {
      await client.delete(`/business/content/media/${mediaId}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
    }
    if (folderId && adminToken) {
      await client.delete(`/business/content/media-folders/${folderId}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
    }
  });
});
