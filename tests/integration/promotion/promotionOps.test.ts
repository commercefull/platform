/**
 * Promotion Operations Integration Tests
 *
 * Covers endpoints not exercised by other promotion suites:
 * - POST /business/promotions/:id/activate
 * - POST /business/promotions/:id/pause
 * - GET  /business/category-promotions/active
 */

import { AxiosInstance } from 'axios';
import { randomUUID } from 'node:crypto';
import { createTestClient, loginTestAdmin, expectStatus } from '../testUtils';

describe('Promotion Operations Tests', () => {
  let client: AxiosInstance;
  let adminToken: string;

  // Seeded in seeds/20240805001500_seedPromotionTestData.js (status: disabled)
  const promotionId = '01935f00-0000-7000-8000-000000000003';

  const headers = () => ({ Authorization: `Bearer ${adminToken}` });

  beforeAll(async () => {
    client = createTestClient();
    adminToken = await loginTestAdmin(client);
    if (!adminToken) throw new Error('Failed to get admin token for Promotion tests');
  });

  describe('Promotion activation', () => {
    it('POST /business/promotions/:id/activate activates the promotion', async () => {
      const resp = await client.post(`/business/promotions/${promotionId}/activate`, {}, { headers: headers() });
      expectStatus(resp, 200);
      expect(resp.data.success).toBe(true);
    });

    it('POST /business/promotions/:id/pause pauses the promotion', async () => {
      const resp = await client.post(`/business/promotions/${promotionId}/pause`, {}, { headers: headers() });
      expectStatus(resp, 200);
      expect(resp.data.success).toBe(true);
    });

    it('POST /business/promotions/:id/activate returns 404 for unknown promotion', async () => {
      const resp = await client.post(`/business/promotions/${randomUUID()}/activate`, {}, { headers: headers() });
      expectStatus(resp, 404);
    });

    it('POST /business/promotions/:id/pause returns 404 for unknown promotion', async () => {
      const resp = await client.post(`/business/promotions/${randomUUID()}/pause`, {}, { headers: headers() });
      expectStatus(resp, 404);
    });
  });

  describe('Category promotions', () => {
    it('GET /business/category-promotions/active lists active category promotions', async () => {
      // Seeded promotionCategory row links the active seeded promotion to the seeded category
      const resp = await client.get('/business/category-promotions/active', { headers: headers() });
      expectStatus(resp, 200);
      expect(resp.data.success).toBe(true);
      expect(Array.isArray(resp.data.data)).toBe(true);
    });
  });
});
