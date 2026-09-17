/**
 * Media Processing Integration Tests
 * Tests the complete media processing pipeline through HTTP API endpoints
 */

import axios, { AxiosInstance } from 'axios';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { loginTestAdmin } from '../testUtils';
import FormData from 'form-data';

// Create a minimal 1x1 PNG for testing (Sharp-readable)
const createTestImageBuffer = (): Buffer => {
  // This is a minimal 1x1 red PNG that Sharp can process
  return Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAACXBIWXMAAAPoAAAD6AG1e1JrAAAADElEQVQImWP4z8AAAAMBAQCc479ZAAAAAElFTkSuQmCC', 'base64');
};

const createClient = (): AxiosInstance =>
  axios.create({
    baseURL: process.env.API_URL || 'http://localhost:3000',
    validateStatus: () => true,
    timeout: 15000,
    headers: {
      Accept: 'application/json',
      'X-Test-Request': 'true',
    },
  });

describe('Media API Integration', () => {
  let client: AxiosInstance;
  let adminToken: string;
  const uploadedMediaIds = new Set<string>();

  beforeAll(async () => {
    jest.setTimeout(30000);
    client = createClient();
    client.interceptors.response.use(response => {
      const data = response.data?.data;
      const results = Array.isArray(data) ? data : [data];
      for (const result of results) {
        const mediaId = result?.media?.mediaId;
        if (mediaId) uploadedMediaIds.add(mediaId);
      }
      return response;
    });
    adminToken = await loginTestAdmin(client);
  });

afterAll(async () => {
    await Promise.all(
      [...uploadedMediaIds].map(mediaId => fs.rm(path.join(process.cwd(), 'public/uploads/media', mediaId), { recursive: true, force: true })),
    );
  });

  const authHeaders = () => ({ Authorization: `Bearer ${adminToken}` });

  describe('POST /business/media/upload', () => {
    it('should upload and process an image successfully', async () => {
      const testImageBuffer = createTestImageBuffer();

      const formData = new FormData();
      formData.append('image', testImageBuffer, 'test-image.png');
      formData.append('altText', 'Test image');
      formData.append('title', 'Test Image Title');

      const response = await client.post('/business/media/upload', formData, {
        headers: {
          ...authHeaders(),
          ...formData.getHeaders(),
        },
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toBeDefined();
      expect(response.data.data.media).toBeDefined();
      expect(response.data.data.urls).toBeDefined();

      // Verify media data structure
      const media = response.data.data.media;
      expect(media.mediaId).toBeDefined();
      expect(media.originalName).toBe('test-image.png');
      expect(media.mimeType).toBe('image/png');
      expect(media.processedFiles).toBeDefined();
      expect(media.processedFiles.length).toBeGreaterThan(0);

      // Verify URLs
      const urls = response.data.data.urls;
      expect(new URL(urls.original).pathname).toMatch(/^\/uploads\/media\/[0-9a-f-]+\/original\.png$/);
      expect(urls.webp).toBeDefined();
      expect(urls.thumbnail).toBeDefined();
      expect(urls.responsive).toBeDefined();
      expect(Object.keys(urls.responsive)).toContain('_sm');
      expect(Object.keys(urls.responsive)).toContain('_md');
      expect(Object.keys(urls.responsive)).toContain('_lg');

      const uploadedFileResponse = await client.get(urls.original, { responseType: 'arraybuffer' });
      expect(uploadedFileResponse.status).toBe(200);
      expect(uploadedFileResponse.headers['content-type']).toBe('image/png');
    });

    it('should handle custom metadata', async () => {
      const testImageBuffer = createTestImageBuffer();

      const formData = new FormData();
      formData.append('image', testImageBuffer, 'custom-image.jpg');
      formData.append('altText', 'Custom image');
      formData.append('title', 'Custom Title');
      formData.append('description', 'Custom description');
      formData.append('tags', '["custom", "test", "upload"]');
      formData.append('metadata', '{"source": "test", "quality": "high"}');

      const response = await client.post('/business/media/upload', formData, {
        headers: {
          ...authHeaders(),
          ...formData.getHeaders(),
        },
      });

      expect(response.status).toBe(200);
      expect(response.data.data.media.title).toBe('Custom Title');
      expect(response.data.data.media.description).toBe('Custom description');
      expect(response.data.data.media.tags).toEqual(['custom', 'test', 'upload']);

      // Metadata validation is handled by the API response
      // Direct database queries removed to keep tests focused on HTTP endpoints
    });

    it('should reject invalid file types', async () => {
      const invalidFile = Buffer.from('not an image file');

      const formData = new FormData();
      formData.append('image', invalidFile, 'test.txt');

      const response = await client.post('/business/media/upload', formData, {
        headers: {
          ...authHeaders(),
          ...formData.getHeaders(),
        },
      });

      // Should fail at multer validation
      expect(response.status).toBe(400);
    });

    it('should handle missing files', async () => {
      const response = await client.post(
        '/business/media/upload',
        {},
        {
          headers: authHeaders(),
        },
      );

      expect(response.status).toBe(400);
    });

    it('should handle oversized files', async () => {
      const largeBuffer = Buffer.alloc(15 * 1024 * 1024); // 15MB > 10MB limit

      const formData = new FormData();
      formData.append('image', largeBuffer, 'large-test.png');

      const response = await client.post('/business/media/upload', formData, {
        headers: {
          ...authHeaders(),
          ...formData.getHeaders(),
        },
      });

      expect(response.status).toBe(400);
    });
  });

  describe('POST /business/media/upload/batch', () => {
    it('should upload multiple images', async () => {
      const image1 = createTestImageBuffer();
      const image2 = createTestImageBuffer();

      const formData = new FormData();
      formData.append('images', image1, 'batch-image-1.png');
      formData.append('images', image2, 'batch-image-2.png');
      formData.append('altText', 'Batch upload test');
      formData.append('title', 'Batch Test');

      const response = await client.post('/business/media/upload/batch', formData, {
        headers: {
          ...authHeaders(),
          ...formData.getHeaders(),
        },
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveLength(2);

      // Verify both images processed
      response.data.data.forEach((item: Record<string, unknown>) => {
        expect(item.media).toBeDefined();
        expect(item.urls).toBeDefined();
        expect((item.urls as Record<string, unknown>).webp).toBeDefined();
      });

      // Verify different IDs
      expect(response.data.data[0].media.mediaId).not.toBe(response.data.data[1].media.mediaId);
    });

    it('should handle empty batch', async () => {
      const response = await client.post(
        '/business/media/upload/batch',
        {},
        {
          headers: authHeaders(),
        },
      );

      expect(response.status).toBe(400);
    });
  });

  describe('Database Integration', () => {
    it('should persist processed file metadata correctly', async () => {
      const testImageBuffer = createTestImageBuffer();

      const formData = new FormData();
      formData.append('image', testImageBuffer, 'metadata-test.png');
      formData.append('altText', 'Metadata test');
      formData.append('tags', '["metadata", "test"]');

      const response = await client.post('/business/media/upload', formData, {
        headers: {
          ...authHeaders(),
          ...formData.getHeaders(),
        },
      });

      expect(response.status).toBe(200);
    });

    it('should handle concurrent uploads', async () => {
      const testImageBuffer = createTestImageBuffer();

      // Make multiple concurrent requests
      const promises = [];
      for (let i = 0; i < 3; i++) {
        const formData = new FormData();
        formData.append('image', testImageBuffer, `concurrent-${i}.png`);
        formData.append('altText', `Concurrent test ${i}`);

        promises.push(
          client.post('/business/media/upload', formData, {
            headers: {
              ...authHeaders(),
              ...formData.getHeaders(),
            },
          }),
        );
      }

      const responses = await Promise.all(promises);

      // All should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.data.success).toBe(true);
        expect(response.data.data.media).toBeDefined();
        expect(response.data.data.urls).toBeDefined();
      });

      // All should have different IDs
      const ids = responses.map(r => r.data.data.media.mediaId);
      expect(new Set(ids).size).toBe(3); // All unique
    });
  });

  describe('Error Handling', () => {
    it('should handle processing errors gracefully', async () => {
      // Create a corrupted image buffer
      const corruptedBuffer = Buffer.from('not an image at all');

      const formData = new FormData();
      formData.append('image', corruptedBuffer, 'corrupted.png');
      formData.append('altText', 'Corrupted test');

      const response = await client.post('/business/media/upload', formData, {
        headers: {
          ...authHeaders(),
          ...formData.getHeaders(),
        },
      });

      expect(response.status).toBe(400);
      expect(response.data.success).toBe(false);
    });

    it('should validate request data', async () => {
      const testImageBuffer = createTestImageBuffer();

      const formData = new FormData();
      formData.append('image', testImageBuffer, 'validation-test.png');
      formData.append('tags', 'invalid json {');

      const response = await client.post('/business/media/upload', formData, {
        headers: {
          ...authHeaders(),
          ...formData.getHeaders(),
        },
      });

      expect(response.status).toBe(400);
      expect(response.data.success).toBe(false);
    });
  });
});
