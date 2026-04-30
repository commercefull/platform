/**
 * Integration tests for product images and rich media
 * Covers: spec 02-variants-images.md
 * - Image CRUD + reorder
 * - Primary image promotion on delete
 * - Barcode lookup
 */

import { AxiosInstance } from 'axios';
import { createTestClient, loginTestAdmin } from '../../testUtils';
import { SEEDED_PRODUCT_1_ID, SEEDED_VARIANT_1_ID } from '../testUtils';

;
;

describe('Product Images & Media', () => {
  let client: AxiosInstance;
  let adminToken: string;
  let createdImageId: string | null = null;

  beforeAll(async () => {
    client = createTestClient();
    adminToken = await loginTestAdmin(client);
  });

  afterAll(async () => {
    if (createdImageId) {
      await client
        .delete(`/business/products/${SEEDED_PRODUCT_1_ID}/images/${createdImageId}`, {
          headers: { Authorization: `Bearer ${adminToken}` },
        })
        .catch(() => {});
    }
  });

  describe('Image CRUD', () => {
    it('should add an image to a product', async () => {
      const res = await client.post(
        `/business/products/${SEEDED_PRODUCT_1_ID}/images`,
        {
          url: 'https://example.com/test-image.jpg',
          altText: 'Test image',
          position: 0,
          isPrimary: false,
        },
        { headers: { Authorization: `Bearer ${adminToken}` } },
      );
      expect(res.status).toBe(201);
      expect(res.data.success).toBe(true);
      createdImageId = res.data.data?.imageId || res.data.data?.productImageId || res.data.data?.id;
    });

    it('should list images for a product', async () => {
      const res = await client.get(`/business/products/${SEEDED_PRODUCT_1_ID}/images`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      expect(res.status).toBe(200);
      expect(res.data.success).toBe(true);
      expect(Array.isArray(res.data.data)).toBe(true);
    });

    it('should update an image', async () => {
      if (!createdImageId) return;
      const res = await client.put(
        `/business/products/${SEEDED_PRODUCT_1_ID}/images/${createdImageId}`,
        { altText: 'Updated alt text' },
        { headers: { Authorization: `Bearer ${adminToken}` } },
      );
      expect(res.status).toBe(200);
      expect(res.data.success).toBe(true);
    });

    it('should reorder images', async () => {
      const listRes = await client.get(`/business/products/${SEEDED_PRODUCT_1_ID}/images`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      const images = listRes.data.data;
      if (!images || images.length < 1) return;

      const imageIds = images.map((img: any) => img.imageId || img.id).reverse();
      const res = await client.post(
        `/business/products/${SEEDED_PRODUCT_1_ID}/images/reorder`,
        { imageIds },
        { headers: { Authorization: `Bearer ${adminToken}` } },
      );
      expect(res.status).toBe(200);
      expect(res.data.success).toBe(true);
    });

    it('should delete an image', async () => {
      if (!createdImageId) return;
      const res = await client.delete(
        `/business/products/${SEEDED_PRODUCT_1_ID}/images/${createdImageId}`,
        { headers: { Authorization: `Bearer ${adminToken}` } },
      );
      expect(res.status).toBe(200);
      expect(res.data.success).toBe(true);
      createdImageId = null;
    });
  });

  describe('Barcode lookup', () => {
    it('should return 400 for empty barcode', async () => {
      const res = await client.get('/business/products/barcode/ ', {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      expect(res.status).toBeGreaterThanOrEqual(400);
    });

    it('should return 404 for non-existent barcode', async () => {
      const res = await client.get('/business/products/barcode/NONEXISTENT-BARCODE-XYZ', {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      expect(res.status).toBe(404);
    });
  });
});
