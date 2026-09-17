/**
 * Content Operations Integration Tests
 *
 * Covers endpoints not exercised by the other content suites:
 * - DELETE /business/content/types/:id                              — delete content type
 * - GET    /business/content/types/slug/:slug                       — get type by slug
 * - PUT    /business/content/templates/:id                          — update template
 * - DELETE /business/content/templates/:id                          — delete template
 * - POST   /business/content/templates/:id/duplicate                — duplicate template
 * - POST   /business/content/categories/:id/move                    — move category
 * - POST   /business/content/navigations/:navigationId/items/reorder — reorder items
 * - POST   /business/content/media/move                             — move media to folder
 * - GET    /business/content/media-folders/tree                     — media folder tree
 * - DELETE /business/content/media/usage/:usageId                   — untrack media usage
 */

import { AxiosInstance } from 'axios';
import { createTestClient, loginTestAdmin, expectStatus } from '../testUtils';

// Seeded in seeds/20241220000026_seedContentOpsData.js
const SEEDED = {
  CONTENT_TYPE_ID: '01942000-0000-7000-8000-000000000001',
  CONTENT_TYPE_SLUG: 'ops-test-type',
  TEMPLATE_ID: '01942001-0000-7000-8000-000000000001',
  CATEGORY_PARENT_ID: '01942002-0000-7000-8000-000000000001',
  CATEGORY_CHILD_ID: '01942002-0000-7000-8000-000000000002',
  NAVIGATION_ID: '01942003-0000-7000-8000-000000000001',
  NAV_ITEM_1_ID: '01942004-0000-7000-8000-000000000001',
  NAV_ITEM_2_ID: '01942004-0000-7000-8000-000000000002',
  MEDIA_FOLDER_ID: '01942005-0000-7000-8000-000000000001',
  MEDIA_ID: '01942006-0000-7000-8000-000000000001',
  MEDIA_USAGE_ID: '01942007-0000-7000-8000-000000000001',
};

describe('Content Operations Tests', () => {
  let client: AxiosInstance;
  let adminToken: string;

  const headers = () => ({ Authorization: `Bearer ${adminToken}` });

  beforeAll(async () => {
    jest.setTimeout(30000);
    client = createTestClient();
    adminToken = await loginTestAdmin(client);
    if (!adminToken) throw new Error('Failed to get admin token for Content tests');
  });

  // ============================================================================
  // Content Types
  // ============================================================================

  describe('Content Types', () => {
    it('should get a content type by slug', async () => {
      const bySlug = await client.get(`/business/content/types/slug/${SEEDED.CONTENT_TYPE_SLUG}`, { headers: headers() });
      expectStatus(bySlug, 200);
      expect(bySlug.data.data?.slug).toBe(SEEDED.CONTENT_TYPE_SLUG);
    });

    it('should delete the seeded content type', async () => {
      const deleteResponse = await client.delete(`/business/content/types/${SEEDED.CONTENT_TYPE_ID}`, { headers: headers() });
      expectStatus(deleteResponse, 200);
    });

    it('should return 404 for an unknown slug', async () => {
      const response = await client.get('/business/content/types/slug/definitely-missing-slug', { headers: headers() });
      expectStatus(response, 404);
    });
  });

  // ============================================================================
  // Templates
  // ============================================================================

  describe('Templates', () => {
    it('should update the seeded template', async () => {
      const response = await client.put(
        `/business/content/templates/${SEEDED.TEMPLATE_ID}`,
        { name: 'Ops Test Template Updated', description: 'Updated via integration test' },
        { headers: headers() },
      );
      expectStatus(response, 200);
    });

    it('should duplicate the seeded template', async () => {
      const response = await client.post(
        `/business/content/templates/${SEEDED.TEMPLATE_ID}/duplicate`,
        { name: 'Ops Test Template Copy', slug: 'ops-test-template-copy' },
        { headers: headers() },
      );
      expectStatus(response, 201);
    });

    it('should delete the seeded template', async () => {
      const response = await client.delete(`/business/content/templates/${SEEDED.TEMPLATE_ID}`, { headers: headers() });
      expectStatus(response, 200);
    });
  });

  // ============================================================================
  // Category Move
  // ============================================================================

  describe('Category Move', () => {
    it('should move the seeded child category under the seeded parent', async () => {
      const moveResponse = await client.post(
        `/business/content/categories/${SEEDED.CATEGORY_CHILD_ID}/move`,
        { newParentId: SEEDED.CATEGORY_PARENT_ID },
        { headers: headers() },
      );
      expectStatus(moveResponse, 200);
      expect(moveResponse.data.success).toBe(true);
    });
  });

  // ============================================================================
  // Navigation Reorder
  // ============================================================================

  describe('Navigation Reorder', () => {
    it('should reorder the seeded navigation items', async () => {
      const reorderResponse = await client.post(
        `/business/content/navigations/${SEEDED.NAVIGATION_ID}/items/reorder`,
        {
          itemOrders: [
            { id: SEEDED.NAV_ITEM_2_ID, order: 0 },
            { id: SEEDED.NAV_ITEM_1_ID, order: 1 },
          ],
        },
        { headers: headers() },
      );
      expectStatus(reorderResponse, 200);
      expect(reorderResponse.data.success).toBe(true);
    });
  });

  // ============================================================================
  // Media Move + Folder Tree + Usage
  // ============================================================================

  describe('Media Operations', () => {
    it('should move the seeded media into the seeded folder', async () => {
      const moveResponse = await client.post(
        '/business/content/media/move',
        { mediaIds: [SEEDED.MEDIA_ID], folderId: SEEDED.MEDIA_FOLDER_ID },
        { headers: headers() },
      );
      expectStatus(moveResponse, 200);
      expect(moveResponse.data.data?.movedCount).toBe(1);
    });

    it('should get the media folder tree', async () => {
      const response = await client.get('/business/content/media-folders/tree', { headers: headers() });
      expectStatus(response, 200);
      expect(response.data.success).toBe(true);
    });

    it('should untrack the seeded media usage', async () => {
      const untrackResponse = await client.delete(`/business/content/media/usage/${SEEDED.MEDIA_USAGE_ID}`, {
        headers: headers(),
      });
      expectStatus(untrackResponse, 200);
    });
  });
});
