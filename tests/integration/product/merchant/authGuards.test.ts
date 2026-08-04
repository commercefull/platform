/**
 * Integration tests for authentication guards on business endpoints
 * Verifies that all /business/* product routes require a valid merchant token
 */

import { AxiosInstance } from 'axios';
import { createTestClient } from '../../testUtils';

describe('Auth Guards: Business Product Endpoints', () => {
  let client: AxiosInstance;

  beforeAll(async () => {
    client = createTestClient();
  });

  it('should reject GET /business/products without auth token', async () => {
    const res = await client.get('/business/products');
    expect(res.status).toBe(401);
  });

  it('should reject POST /business/products without auth token', async () => {
    const res = await client.post('/business/products', { name: 'No Auth' });
    expect(res.status).toBe(401);
  });

  it('should reject GET /business/categories without auth token', async () => {
    const res = await client.get('/business/categories');
    expect(res.status).toBe(401);
  });

  it('should reject GET /business/reviews without auth token', async () => {
    const res = await client.get('/business/reviews');
    expect(res.status).toBe(401);
  });

  it('should reject GET /business/bundles without auth token', async () => {
    const res = await client.get('/business/bundles');
    expect(res.status).toBe(401);
  });
});
