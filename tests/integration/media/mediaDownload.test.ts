/**
 * Media Download Integration Tests
 *
 * Covers the endpoint not exercised by mediaProcessing.test.ts:
 * - POST /business/media/download
 */

import { AxiosInstance } from 'axios';
import { createTestClient, loginTestAdmin, expectStatus } from '../testUtils';

const API_URL = process.env.API_URL || 'http://localhost:3000';

describe('Media Download Tests', () => {
  let client: AxiosInstance;
  let adminToken: string;

  const headers = () => ({ Authorization: `Bearer ${adminToken}` });

  beforeAll(async () => {
    client = createTestClient();
    adminToken = await loginTestAdmin(client);
    if (!adminToken) throw new Error('Failed to get admin token for Media tests');
  });

  it('rejects a download without a URL', async () => {
    const resp = await client.post('/business/media/download', {}, { headers: headers() });
    expectStatus(resp, 400);
  });

  it('downloads and stores a remote image', async () => {
    const resp = await client.post(
      '/business/media/download',
      {
        url: `${API_URL}/images/storefront/hero-bag.jpg`,
        altText: 'Downloaded hero image',
        title: 'Hero Bag',
      },
      { headers: headers() },
    );
    expectStatus(resp, 200);
    expect(resp.data.success).toBe(true);
    expect(resp.data.data?.media).toBeDefined();
  });
});
