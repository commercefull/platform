import axios, { AxiosInstance } from 'axios';
import {
  TEST_CONTENT_TYPE_ID,
  TEST_CONTENT_PAGE_ID,
  TEST_CONTENT_BLOCK_ID,
  TEST_CONTENT_TEMPLATE_ID,
  TEST_BLOCK_TYPE_ID,
  TEST_CONTENT_TYPE,
  TEST_CONTENT_PAGE,
  TEST_CONTENT_BLOCK,
  TEST_CONTENT_TEMPLATE,
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
  let testContentTypeId: string;
  let testContentPageId: string;
  let testContentBlockId: string;
  let testContentTemplateId: string;

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

    // Ensure content type exists
    const typeResp = await client.get(`/business/content/types/${TEST_CONTENT_TYPE_ID}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    if (typeResp.status === 200) {
      testContentTypeId = TEST_CONTENT_TYPE_ID;
    } else {
      const createTypeResp = await client.post(
        '/business/content/types',
        {
          name: TEST_CONTENT_TYPE.name,
          slug: TEST_CONTENT_TYPE.slug + '-' + Date.now(),
          description: TEST_CONTENT_TYPE.description,
          status: 'active',
        },
        { headers: { Authorization: `Bearer ${adminToken}` } },
      );
      testContentTypeId = createTypeResp.data?.data?.contentTypeId || createTypeResp.data?.data?.id;
    }

    // Ensure template exists
    const templateResp = await client.get(`/business/content/templates/${TEST_CONTENT_TEMPLATE_ID}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    if (templateResp.status === 200) {
      testContentTemplateId = TEST_CONTENT_TEMPLATE_ID;
    } else {
      const createTemplateResp = await client.post(
        '/business/content/templates',
        {
          name: TEST_CONTENT_TEMPLATE.name + '-' + Date.now(),
          slug: 'test-template-' + Date.now(),
          description: TEST_CONTENT_TEMPLATE.description,
          status: 'active',
        },
        { headers: { Authorization: `Bearer ${adminToken}` } },
      );
      testContentTemplateId =
        createTemplateResp.data?.data?.contentTemplateId || createTemplateResp.data?.data?.id;
    }

    // Ensure page exists
    const pageResp = await client.get(`/business/content/pages/${TEST_CONTENT_PAGE_ID}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    if (pageResp.status === 200) {
      testContentPageId = TEST_CONTENT_PAGE_ID;
    } else if (testContentTypeId) {
      const createPageResp = await client.post(
        '/business/content/pages',
        {
          title: TEST_CONTENT_PAGE.title,
          slug: TEST_CONTENT_PAGE.slug + '-' + Date.now(),
          contentTypeId: testContentTypeId,
          templateId: testContentTemplateId,
          status: 'published',
          visibility: 'public',
          summary: TEST_CONTENT_PAGE.summary,
          isHomePage: false,
        },
        { headers: { Authorization: `Bearer ${adminToken}` } },
      );
      testContentPageId =
        createPageResp.data?.data?.contentPageId || createPageResp.data?.data?.id;
    }

    // Ensure block exists
    const blockResp = await client.get(`/business/content/blocks/${TEST_CONTENT_BLOCK_ID}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    if (blockResp.status === 200) {
      testContentBlockId = TEST_CONTENT_BLOCK_ID;
    } else if (testContentPageId && testContentTypeId) {
      const createBlockResp = await client.post(
        '/business/content/blocks',
        {
          contentPageId: testContentPageId,
          blockTypeId: TEST_BLOCK_TYPE_ID,
          title: TEST_CONTENT_BLOCK.title,
          sortOrder: 0,
          content: TEST_CONTENT_BLOCK.content,
          isVisible: true,
        },
        { headers: { Authorization: `Bearer ${adminToken}` } },
      );
      testContentBlockId =
        createBlockResp.data?.data?.contentBlockId || createBlockResp.data?.data?.id;
    }
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
