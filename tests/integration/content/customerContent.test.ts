import axios, { AxiosInstance } from 'axios';
import { TEST_CONTENT_PAGE } from '../testConstants';

const createClient = () =>
  axios.create({
    baseURL: process.env.API_URL || 'http://localhost:3000',
    validateStatus: () => true,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
  });

describe('Content Customer API', () => {
  let client: AxiosInstance;
  // Seeded published page (seeds/20240805002001_seedIntegrationTestData.js)
  const createdPageSlug = TEST_CONTENT_PAGE.slug;

  beforeAll(async () => {
    jest.setTimeout(30000);
    client = createClient();
  });

  it('should get published pages via customer endpoint', async () => {
    const response = await client.get('/customer/content/pages');

    expect(response.status).toBe(200);
    expect(response.data.success).toBe(true);
    expect(Array.isArray(response.data.data)).toBe(true);
  });

  it('should get a published page by slug via customer endpoint', async () => {
    if (!createdPageSlug) return;

    const response = await client.get(`/customer/content/pages/${createdPageSlug}`);

    expect(response.status).toBe(200);
    expect(response.data.success).toBe(true);
    expect(response.data.data).toHaveProperty('page');
    expect(response.data.data).toHaveProperty('blocks');
  });

  it('should return 404 for non-existent slug via customer endpoint', async () => {
    const response = await client.get('/customer/content/pages/non-existent-slug-12345');

    expect(response.status).toBe(404);
  });

  it('should get active content types via customer endpoint', async () => {
    const response = await client.get('/customer/content/types');

    expect(response.status).toBe(200);
    expect(response.data.success).toBe(true);
    expect(Array.isArray(response.data.data)).toBe(true);
  });
});
