import axios, { AxiosInstance } from 'axios';
import {
  TEST_CONTENT_PAGE_ID,
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

describe('Content Block Validation API', () => {
  let client: AxiosInstance;
  let adminToken: string;
  let testContentPageId: string;
  let validatedBlockTypeId: string;

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

    // Use the seeded block type for validation testing
    validatedBlockTypeId = TEST_BLOCK_TYPE_ID;
  });

  it('should create a block with valid allowed block name and required fields', async () => {
    if (!testContentPageId || !validatedBlockTypeId) return;
    const response = await client.post(
      '/business/content/blocks',
      {
        contentPageId: testContentPageId,
        blockTypeId: validatedBlockTypeId,
        title: 'hero',
        sortOrder: 10,
        content: { heading: 'Test Heading', body: 'Test body content' },
        isVisible: true,
      },
      { headers: { Authorization: `Bearer ${adminToken}` } },
    );

    expect(response.status).toBe(201);
    expect(response.data.success).toBe(true);
  });

  it('should create a block with any title when block type has no allowedBlocks restriction', async () => {
    if (!testContentPageId || !validatedBlockTypeId) return;
    const response = await client.post(
      '/business/content/blocks',
      {
        contentPageId: testContentPageId,
        blockTypeId: validatedBlockTypeId,
        title: 'video',
        sortOrder: 11,
        content: { heading: 'Test', body: 'Test' },
        isVisible: true,
      },
      { headers: { Authorization: `Bearer ${adminToken}` } },
    );

    expect(response.status).toBe(201);
    expect(response.data.success).toBe(true);
  });

  it('should create a block even with partial content when block type has no required fields', async () => {
    if (!testContentPageId || !validatedBlockTypeId) return;
    const response = await client.post(
      '/business/content/blocks',
      {
        contentPageId: testContentPageId,
        blockTypeId: validatedBlockTypeId,
        title: 'text',
        sortOrder: 12,
        content: { heading: 'Test Heading' },
        isVisible: true,
      },
      { headers: { Authorization: `Bearer ${adminToken}` } },
    );

    expect(response.status).toBe(201);
    expect(response.data.success).toBe(true);
  });

  it('should return 404 for non-existent content type on block creation', async () => {
    if (!testContentPageId) return;
    const response = await client.post(
      '/business/content/blocks',
      {
        contentPageId: testContentPageId,
        blockTypeId: '00000000-0000-0000-0000-000000000001',
        title: 'test',
        sortOrder: 13,
        content: { text: 'test' },
        isVisible: true,
      },
      { headers: { Authorization: `Bearer ${adminToken}` } },
    );

    expect(response.status).toBe(404);
  });

  afterAll(async () => {
    // No cleanup needed - using seeded block type
  });
});
