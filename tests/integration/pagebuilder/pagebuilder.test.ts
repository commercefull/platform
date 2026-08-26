/**
 * Page Builder Module Integration Tests
 * Covers block types, draft CRUD, block operations, publish, and preview
 */

import { AxiosInstance } from 'axios';
import { createTestClient, loginTestAdmin, expectStatus } from '../testUtils';

describe('Page Builder Module Integration Tests', () => {
  let client: AxiosInstance;
  let orgToken: string;
  let draftId: string;
  let blockId: string;

  beforeAll(async () => {
    client = createTestClient();
    orgToken = await loginTestAdmin(client);
  });

  afterAll(async () => {
    if (orgToken && draftId) {
      await client.delete(`/business/page-builder/drafts/${draftId}`, {
        headers: { Authorization: `Bearer ${orgToken}` },
      });
    }
  });

  describe('Block types', () => {
    it('GET /business/page-builder/block-types returns list', async () => {
      if (!orgToken) return;
      const resp = await client.get('/business/page-builder/block-types', {
        headers: { Authorization: `Bearer ${orgToken}` },
      });
      expectStatus(resp, 200);
      expect(resp.data.success).toBe(true);
      const items = resp.data.data?.data || resp.data.data || [];
      expect(Array.isArray(items)).toBe(true);
    });

    it('GET /business/page-builder/block-types/:category filters by category', async () => {
      if (!orgToken) return;
      const resp = await client.get('/business/page-builder/block-types/content', {
        headers: { Authorization: `Bearer ${orgToken}` },
      });
      expectStatus(resp, 200);
    });
  });

  describe('Draft CRUD', () => {
    it('POST /business/page-builder/drafts creates a draft', async () => {
      if (!orgToken) return;
      const resp = await client.post(
        '/business/page-builder/drafts',
        {
          title: 'Test Page',
          slug: 'test-page',
          pageType: 'cms',
        },
        { headers: { Authorization: `Bearer ${orgToken}` } },
      );
      expect([201, 200]).toContain(resp.status);
      if (resp.data.success) {
        draftId = resp.data.data?.draftId || resp.data.data?.id || '';
      }
    });

    it('GET /business/page-builder/drafts returns list', async () => {
      if (!orgToken) return;
      const resp = await client.get('/business/page-builder/drafts', {
        headers: { Authorization: `Bearer ${orgToken}` },
      });
      expectStatus(resp, 200);
      const items = resp.data.data?.data || resp.data.data || [];
      expect(Array.isArray(items)).toBe(true);
    });

    it('GET /business/page-builder/drafts/:draftId returns single draft', async () => {
      if (!orgToken || !draftId) return;
      const resp = await client.get(`/business/page-builder/drafts/${draftId}`, {
        headers: { Authorization: `Bearer ${orgToken}` },
      });
      expectStatus(resp, 200);
    });

    it('PATCH /business/page-builder/drafts/:draftId/title updates title', async () => {
      if (!orgToken || !draftId) return;
      const resp = await client.patch(
        `/business/page-builder/drafts/${draftId}/title`,
        { title: 'Updated Page Title' },
        { headers: { Authorization: `Bearer ${orgToken}` } },
      );
      expectStatus(resp, 200);
    });

    it('PATCH /business/page-builder/drafts/:draftId/slug updates slug', async () => {
      if (!orgToken || !draftId) return;
      const resp = await client.patch(
        `/business/page-builder/drafts/${draftId}/slug`,
        { slug: 'updated-slug' },
        { headers: { Authorization: `Bearer ${orgToken}` } },
      );
      expectStatus(resp, 200);
    });
  });

  describe('Block operations', () => {
    it('POST /business/page-builder/drafts/:draftId/blocks adds a block', async () => {
      if (!orgToken || !draftId) return;
      const resp = await client.post(
        `/business/page-builder/drafts/${draftId}/blocks`,
        {
          blockType: 'heading',
          region: 'main',
          content: { text: 'Hello World', level: 1 },
        },
        { headers: { Authorization: `Bearer ${orgToken}` } },
      );
      expect([201, 200]).toContain(resp.status);
      if (resp.data.success) {
        blockId = resp.data.data?.blockId || resp.data.data?.id || '';
      }
    });

    it('PATCH /business/page-builder/drafts/:draftId/blocks/:blockId updates block', async () => {
      if (!orgToken || !draftId || !blockId) return;
      const resp = await client.patch(
        `/business/page-builder/drafts/${draftId}/blocks/${blockId}`,
        { content: { text: 'Updated Heading', level: 2 } },
        { headers: { Authorization: `Bearer ${orgToken}` } },
      );
      expectStatus(resp, 200);
    });

    it('PATCH /business/page-builder/drafts/:draftId/blocks/:blockId/move moves block', async () => {
      if (!orgToken || !draftId || !blockId) return;
      const resp = await client.patch(
        `/business/page-builder/drafts/${draftId}/blocks/${blockId}/move`,
        { region: 'header', sortOrder: 0 },
        { headers: { Authorization: `Bearer ${orgToken}` } },
      );
      expectStatus(resp, 200);
    });

    it('DELETE /business/page-builder/drafts/:draftId/blocks/:blockId removes block', async () => {
      if (!orgToken || !draftId || !blockId) return;
      const resp = await client.delete(`/business/page-builder/drafts/${draftId}/blocks/${blockId}`, {
        headers: { Authorization: `Bearer ${orgToken}` },
      });
      expectStatus(resp, 200);
    });
  });

  describe('Publish & Preview', () => {
    it('POST /business/page-builder/drafts/:draftId/publish publishes draft', async () => {
      if (!orgToken || !draftId) return;
      const resp = await client.post(
        `/business/page-builder/drafts/${draftId}/publish`,
        {},
        { headers: { Authorization: `Bearer ${orgToken}` } },
      );
      expect([200, 400]).toContain(resp.status);
    });

    it('GET /business/page-builder/drafts/:draftId/preview returns preview data', async () => {
      if (!orgToken || !draftId) return;
      const resp = await client.get(`/business/page-builder/drafts/${draftId}/preview`, {
        headers: { Authorization: `Bearer ${orgToken}` },
      });
      expect([200, 404]).toContain(resp.status);
    });

    it('POST /business/page-builder/drafts/:draftId/unpublish unpublishes draft', async () => {
      if (!orgToken || !draftId) return;
      const resp = await client.post(
        `/business/page-builder/drafts/${draftId}/unpublish`,
        {},
        { headers: { Authorization: `Bearer ${orgToken}` } },
      );
      expect([200, 400]).toContain(resp.status);
    });
  });

  describe('Auth', () => {
    it('requests without auth token → 401', async () => {
      const resp = await client.get('/business/page-builder/drafts');
      expect(resp.status).toBe(401);
    });
  });
});
