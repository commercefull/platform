/**
 * Integration tests for product downloads
 * Covers:
 * - Business: download CRUD (create, list, update, delete)
 * - Business: validation (missing name, missing fileUrl)
 * - Customer: list active downloads
 * - Auth guards on download endpoints
 */

import { AxiosInstance } from 'axios';
import { createTestClient, loginTestAdmin, expectStatus } from '../../testUtils';
import { SEEDED_PRODUCT_1_ID, SEEDED_PRODUCT_2_ID } from '../testUtils';

describe('Download Management', () => {
  let client: AxiosInstance;
  let adminToken: string;
  let createdDownloadId: string | null = null;

  beforeAll(async () => {
    client = createTestClient();
    adminToken = await loginTestAdmin(client);
  });

  afterAll(async () => {
    if (createdDownloadId) {
      await client
        .delete(`/business/downloads/${createdDownloadId}`, { headers: { Authorization: `Bearer ${adminToken}` } })
        .catch(() => {});
    }
  });

  // ── Organization: Download CRUD ──────────────────────────────────────────────

  describe('Organization: Download CRUD', () => {
    it('should create a download for a product', async () => {
      const res = await client.post(
        `/business/products/${SEEDED_PRODUCT_1_ID}/downloads`,
        {
          name: 'Test Download',
          fileUrl: 'https://example.com/test-file.pdf',
          fileSize: 1024000,
          mimeType: 'application/pdf',
          maxDownloads: 5,
          daysValid: 30,
          isActive: true,
          sortOrder: 1,
        },
        { headers: { Authorization: `Bearer ${adminToken}` } },
      );

      expect(res.status).toBe(201);
      expect(res.data.success).toBe(true);
      expect(res.data.data).toHaveProperty('productDownloadId');
      expect(res.data.data.name).toBe('Test Download');
      expect(res.data.data.fileUrl).toBe('https://example.com/test-file.pdf');
      createdDownloadId = res.data.data.productDownloadId;
    });

    it('should list downloads for a product', async () => {
      const res = await client.get(`/business/products/${SEEDED_PRODUCT_1_ID}/downloads`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(res.status).toBe(200);
      expect(res.data.success).toBe(true);
      expect(Array.isArray(res.data.data)).toBe(true);
      expect(res.data.data.length).toBeGreaterThanOrEqual(1);
    });

    it('should list only active downloads when activeOnly=true', async () => {
      const res = await client.get(`/business/products/${SEEDED_PRODUCT_1_ID}/downloads?activeOnly=true`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(res.status).toBe(200);
      expect(Array.isArray(res.data.data)).toBe(true);
      for (const dl of res.data.data) {
        expect(dl.isActive).toBe(true);
      }
    });

    it('should update a download', async () => {
      if (!createdDownloadId) return;

      const res = await client.put(
        `/business/downloads/${createdDownloadId}`,
        { name: 'Updated Download', maxDownloads: 10 },
        { headers: { Authorization: `Bearer ${adminToken}` } },
      );

      expect(res.status).toBe(200);
      expect(res.data.success).toBe(true);
      expect(res.data.data.name).toBe('Updated Download');
      expect(res.data.data.maxDownloads).toBe(10);
    });

    it('should delete a download', async () => {
      if (!createdDownloadId) return;

      const res = await client.delete(`/business/downloads/${createdDownloadId}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(res.status).toBe(200);
      expect(res.data.success).toBe(true);
      expect(res.data.data.deleted).toBe(true);
      createdDownloadId = null;
    });

    it('should return 404 when deleting non-existent download', async () => {
      const fakeId = '99999999-9999-9999-9999-999999999999';
      const res = await client.delete(`/business/downloads/${fakeId}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(res.status).toBe(404);
    });
  });

  // ── Organization: Download Validation ────────────────────────────────────────

  describe('Organization: Download Validation', () => {
    it('should reject download creation without name', async () => {
      const res = await client.post(
        `/business/products/${SEEDED_PRODUCT_1_ID}/downloads`,
        { fileUrl: 'https://example.com/file.pdf' },
        { headers: { Authorization: `Bearer ${adminToken}` } },
      );

      expect(res.status).toBe(400);
      expect(res.data.success).toBe(false);
    });

    it('should reject download creation without fileUrl', async () => {
      const res = await client.post(
        `/business/products/${SEEDED_PRODUCT_1_ID}/downloads`,
        { name: 'Test' },
        { headers: { Authorization: `Bearer ${adminToken}` } },
      );

      expect(res.status).toBe(400);
      expect(res.data.success).toBe(false);
    });
  });

  // ── Customer: Downloads ──────────────────────────────────────────────────

  describe('Customer: Product Downloads', () => {
    it('should list active downloads for a product', async () => {
      const createRes = await client.post(
        `/business/products/${SEEDED_PRODUCT_2_ID}/downloads`,
        {
          name: 'Customer Test Download',
          fileUrl: 'https://example.com/customer-file.pdf',
          isActive: true,
          sortOrder: 1,
        },
        { headers: { Authorization: `Bearer ${adminToken}` } },
      );
      const dlId = createRes.data.data.productDownloadId;

      const res = await client.get(`/customer/products/${SEEDED_PRODUCT_2_ID}/downloads`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.data.data)).toBe(true);
      expect(res.data.data.length).toBeGreaterThanOrEqual(1);
      for (const dl of res.data.data) {
        expect(dl.isActive).toBe(true);
      }

      await client.delete(`/business/downloads/${dlId}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
    });
  });

  // ── Auth Guards ──────────────────────────────────────────────────────────

  describe('Auth Guards', () => {
    it('should reject download listing without auth', async () => {
      const res = await client.get(`/business/products/${SEEDED_PRODUCT_1_ID}/downloads`);
      expectStatus(res, 401);
    });

    it('should reject download creation without auth', async () => {
      const res = await client.post(`/business/products/${SEEDED_PRODUCT_1_ID}/downloads`, {
        name: 'Test',
        fileUrl: 'https://example.com/file.pdf',
      });
      expectStatus(res, 401);
    });
  });
});
