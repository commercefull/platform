import axios, { AxiosInstance } from 'axios';
import {
  TEST_CONTENT_TYPE_ID,
  TEST_CONTENT_PAGE_ID,
  TEST_CONTENT_BLOCK_ID,
  TEST_CONTENT_TEMPLATE_ID,
  TEST_BLOCK_TYPE_ID,
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

describe('Content Blocks API', () => {
  let client: AxiosInstance;
  let adminToken: string;
  let _testContentTypeId: string;
  let testContentPageId: string;
  let testContentBlockId: string;
  let _testContentTemplateId: string;

  beforeAll(async () => {
    jest.setTimeout(30000);
    client = createClient();

    try {
      const loginResponse = await client.post('/business/auth/login', ADMIN_CREDENTIALS, {
        headers: { 'X-Test-Request': 'true' },
      });
      adminToken = loginResponse.data?.accessToken || '';
    } catch {
      adminToken = '';
      return;
    }

    // Use seeded content IDs
    _testContentTypeId = TEST_CONTENT_TYPE_ID;
    _testContentTemplateId = TEST_CONTENT_TEMPLATE_ID;
    testContentPageId = TEST_CONTENT_PAGE_ID;
    testContentBlockId = TEST_CONTENT_BLOCK_ID;
  });

  describe('Block CRUD', () => {
    it('should get blocks for a page', async () => {
      if (!testContentPageId) return;
      const response = await client.get(`/business/content/pages/${testContentPageId}/blocks`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(Array.isArray(response.data.data)).toBe(true);
    });

    it('should create a new block', async () => {
      if (!testContentPageId) return;
      const response = await client.post(
        '/business/content/blocks',
        {
          contentPageId: testContentPageId,
          blockTypeId: TEST_BLOCK_TYPE_ID,
          title: 'Test Block ' + Date.now(),
          sortOrder: 1,
          content: { text: 'New test block content' },
          isVisible: true,
        },
        { headers: { Authorization: `Bearer ${adminToken}` } },
      );

      expect(response.status).toBe(201);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('contentBlockId');
    });

    it('should update a block', async () => {
      if (!testContentBlockId) return;
      const response = await client.put(
        `/business/content/blocks/${testContentBlockId}`,
        {
          title: 'Updated Block Name',
          content: { text: 'Updated content' },
        },
        { headers: { Authorization: `Bearer ${adminToken}` } },
      );

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
    });

    it('should return 404 for non-existent block', async () => {
      const response = await client.get('/business/content/blocks/00000000-0000-0000-0000-000000000001', {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(response.status).toBe(404);
    });

    it('should return 400 when missing required fields', async () => {
      const response = await client.post(
        '/business/content/blocks',
        { contentPageId: testContentPageId },
        { headers: { Authorization: `Bearer ${adminToken}` } },
      );

      expect(response.status).toBe(400);
    });
  });

  describe('Block Reorder', () => {
    it('should reorder blocks', async () => {
      if (!testContentPageId) return;

      // Get current blocks
      const blocksResp = await client.get(`/business/content/pages/${testContentPageId}/blocks`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      if (blocksResp.data.data.length < 2) return;

      const blocks = blocksResp.data.data;
      const blockOrders = blocks.map((b: Record<string, unknown>, i: number) => ({
        id: b.contentBlockId,
        order: blocks.length - 1 - i,
      }));

      const response = await client.post(
        `/business/content/pages/${testContentPageId}/blocks/reorder`,
        { blockOrders },
        { headers: { Authorization: `Bearer ${adminToken}` } },
      );

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
    });

    it('should return 400 for invalid reorder payload', async () => {
      if (!testContentPageId) return;

      const response = await client.post(
        `/business/content/pages/${testContentPageId}/blocks/reorder`,
        { blockOrders: [] },
        { headers: { Authorization: `Bearer ${adminToken}` } },
      );

      expect(response.status).toBe(400);
    });
  });
});
