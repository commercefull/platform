/**
 * Content Detail Endpoints Integration Tests
 *
 * Covers endpoints missed by the existing content suites:
 * - POST/DELETE /business/content/types
 * - POST/DELETE /business/content/blocks
 * - DELETE /business/content/pages/:id
 * - POST /business/content/pages/:pageId/blocks/reorder
 * - POST /business/content/pages/:pageId/versions + restore
 * - POST /business/content/pages/:pageId/categories + /primary
 */

import { AxiosInstance } from 'axios';
import { expectStatus, createTestClient, loginTestAdmin } from '../testUtils';
import { TEST_DATA } from './testConstants';

const BLOCK_TYPE_ID = '00000000-0000-0000-0000-000000005005'; // seeded block type
const UNKNOWN_ID = '00000000-0000-0000-0000-000000099999';

describe('Content Detail Endpoints', () => {
  let client: AxiosInstance;
  let adminToken: string;
  let keptTypeId: string;

  const auth = () => ({ headers: { Authorization: `Bearer ${adminToken}` } });

  beforeAll(async () => {
    client = createTestClient();
    adminToken = await loginTestAdmin(client);
  });

  describe('Content types', () => {
    it('POST + DELETE /business/content/types creates and removes a type', async () => {
      const create = await client.post(
        '/business/content/types',
        { ...TEST_DATA.contentType, slug: `cov-type-${Date.now()}`, name: `Cov Type ${Date.now()}` },
        auth(),
      );
      expectStatus(create, 201);
      const typeId = create.data.data.contentTypeId || create.data.data.id;

      const del = await client.delete(`/business/content/types/${typeId}`, auth());
      expectStatus(del, 200);
    });

    it('creates a type kept for the page tests', async () => {
      const create = await client.post(
        '/business/content/types',
        { ...TEST_DATA.contentType, slug: `cov-kept-${Date.now()}`, name: `Cov Kept ${Date.now()}` },
        auth(),
      );
      expectStatus(create, 201);
      keptTypeId = create.data.data.contentTypeId || create.data.data.id;
    });
  });

  describe('Pages + blocks + versions', () => {
    let pageId: string;
    let blockId: string;
    let categorizationId: string;

    it('POST /business/content/pages creates a page', async () => {
      const resp = await client.post(
        '/business/content/pages',
        {
          ...TEST_DATA.page,
          slug: `cov-page-${Date.now()}`,
          contentTypeId: keptTypeId,
        },
        auth(),
      );
      expectStatus(resp, 201);
      pageId = resp.data.data.contentPageId || resp.data.data.id;
      expect(pageId).toBeTruthy();
    });

    it('POST /business/content/blocks adds a block to the page', async () => {
      const resp = await client.post(
        '/business/content/blocks',
        { contentPageId: pageId, blockTypeId: BLOCK_TYPE_ID, sortOrder: 0, content: { text: 'coverage' } },
        auth(),
      );
      expectStatus(resp, 201);
      blockId = resp.data.data.contentBlockId || resp.data.data.id;
      expect(blockId).toBeTruthy();
    });

    it('POST /business/content/blocks validates required fields', async () => {
      const resp = await client.post('/business/content/blocks', { contentPageId: pageId }, auth());
      expectStatus(resp, 400);
    });

    it('POST /business/content/pages/:pageId/blocks/reorder reorders blocks', async () => {
      const resp = await client.post(
        `/business/content/pages/${pageId}/blocks/reorder`,
        { blockOrders: [{ id: blockId, order: 1 }] },
        auth(),
      );
      expectStatus(resp, 200);
    });

    it('DELETE /business/content/blocks/:id removes the block', async () => {
      const resp = await client.delete(`/business/content/blocks/${blockId}`, auth());
      expectStatus(resp, 200);
    });

    it('POST /business/content/pages/:pageId/versions snapshots the page', async () => {
      const resp = await client.post(`/business/content/pages/${pageId}/versions`, { comment: 'coverage v1' }, auth());
      expectStatus(resp, 201);
    });

    it('POST /business/content/pages/:pageId/versions/:versionId/restore restores a version', async () => {
      const list = await client.get(`/business/content/pages/${pageId}/versions`, auth());
      const versions = list.data.data;
      if (!Array.isArray(versions) || versions.length === 0) return;
      const versionId = versions[0].contentPageVersionId || versions[0].versionId || versions[0].id;

      const resp = await client.post(`/business/content/pages/${pageId}/versions/${versionId}/restore`, {}, auth());
      expectStatus(resp, 200);
    });

    it('POST /business/content/pages/:pageId/categories assigns a category', async () => {
      const cat = await client.post(
        '/business/content/categories',
        { name: `Cov Cat ${Date.now()}`, slug: `cov-cat-${Date.now()}` },
        auth(),
      );
      expectStatus(cat, 201);
      const categoryId = cat.data.data.contentCategoryId || cat.data.data.id;

      const resp = await client.post(
        `/business/content/pages/${pageId}/categories`,
        { categoryId },
        auth(),
      );
      expectStatus(resp, 201);
      categorizationId = resp.data.data.categorizationId || resp.data.data.contentCategorizationId;
    });

    it('POST /business/content/pages/:pageId/categories/primary sets the primary category', async () => {
      const resp = await client.post(
        `/business/content/pages/${pageId}/categories/primary`,
        { categorizationId },
        auth(),
      );
      expectStatus(resp, 200);
    });

    it('DELETE /business/content/pages/:id removes the page', async () => {
      const resp = await client.delete(`/business/content/pages/${pageId}`, auth());
      expectStatus(resp, 200);

      const get = await client.get(`/business/content/pages/${pageId}`, auth());
      expectStatus(get, 404);
    });

    it('DELETE /business/content/pages/:id is stable for unknown ids', async () => {
      const resp = await client.delete(`/business/content/pages/${UNKNOWN_ID}`, auth());
      expectStatus(resp, 404);
    });
  });
});
