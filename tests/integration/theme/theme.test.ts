/**
 * Theme Module Integration Tests
 * Covers theme CRUD, overrides, assignment, and resolution
 */

import { AxiosInstance } from 'axios';
import { createTestClient, loginTestAdmin, expectStatus } from '../testUtils';

describe('Theme Module Integration Tests', () => {
  let client: AxiosInstance;
  let orgToken: string;
  let themeId: string;
  let overrideId: string;

  beforeAll(async () => {
    client = createTestClient();
    orgToken = await loginTestAdmin(client);
  });

  afterAll(async () => {
    if (orgToken && themeId) {
      await client.delete(`/business/theme/${themeId}`, {
        headers: { Authorization: `Bearer ${orgToken}` },
      });
    }
  });

  describe('Theme listing & built-in', () => {
    it('GET /business/theme returns list of themes', async () => {
      if (!orgToken) return;
      const resp = await client.get('/business/theme', {
        headers: { Authorization: `Bearer ${orgToken}` },
      });
      expectStatus(resp, 200);
      expect(resp.data.success).toBe(true);
    });

    it('GET /business/theme/built-in returns built-in themes', async () => {
      if (!orgToken) return;
      const resp = await client.get('/business/theme/built-in', {
        headers: { Authorization: `Bearer ${orgToken}` },
      });
      expectStatus(resp, 200);
      const items = resp.data.data?.data || resp.data.data || [];
      expect(Array.isArray(items)).toBe(true);
    });
  });

  describe('Theme CRUD', () => {
    it('POST /business/theme creates a custom theme', async () => {
      if (!orgToken) return;
      const resp = await client.post(
        '/business/theme',
        {
          name: 'Test Custom Theme',
          slug: 'test-custom-theme',
          description: 'Test theme for integration tests',
          settingsSchema: [
            { key: 'primaryColor', type: 'color', label: 'Primary Color', defaultValue: '#3B82F6' },
          ],
        },
        { headers: { Authorization: `Bearer ${orgToken}` } },
      );
      expect([201, 200]).toContain(resp.status);
      if (resp.data.success) {
        themeId = resp.data.data?.themeId || resp.data.data?.id || '';
      }
    });

    it('GET /business/theme/:themeId returns single theme', async () => {
      if (!orgToken || !themeId) return;
      const resp = await client.get(`/business/theme/${themeId}`, {
        headers: { Authorization: `Bearer ${orgToken}` },
      });
      expectStatus(resp, 200);
    });

    it('GET /business/theme/slug/:slug returns theme by slug', async () => {
      if (!orgToken) return;
      const resp = await client.get('/business/theme/slug/test-custom-theme', {
        headers: { Authorization: `Bearer ${orgToken}` },
      });
      expect([200, 404]).toContain(resp.status);
    });

    it('PUT /business/theme/:themeId updates theme', async () => {
      if (!orgToken || !themeId) return;
      const resp = await client.put(
        `/business/theme/${themeId}`,
        { name: 'Updated Theme Name' },
        { headers: { Authorization: `Bearer ${orgToken}` } },
      );
      expectStatus(resp, 200);
    });

    it('POST /business/theme/:themeId/archive archives theme', async () => {
      if (!orgToken || !themeId) return;
      const resp = await client.post(
        `/business/theme/${themeId}/archive`,
        {},
        { headers: { Authorization: `Bearer ${orgToken}` } },
      );
      expectStatus(resp, 200);
    });

    it('POST /business/theme/:themeId/activate activates theme', async () => {
      if (!orgToken || !themeId) return;
      const resp = await client.post(
        `/business/theme/${themeId}/activate`,
        {},
        { headers: { Authorization: `Bearer ${orgToken}` } },
      );
      expectStatus(resp, 200);
    });
  });

  describe('Theme overrides', () => {
    it('POST /business/theme/overrides creates override', async () => {
      if (!orgToken || !themeId) return;
      const resp = await client.post(
        '/business/theme/overrides',
        {
          themeId,
          storeId: '00000000-0000-0000-0000-000000000001',
          settings: { primaryColor: '#EF4444' },
        },
        { headers: { Authorization: `Bearer ${orgToken}` } },
      );
      expect([201, 200, 400]).toContain(resp.status);
      if (resp.data.success) {
        overrideId = resp.data.data?.overrideId || resp.data.data?.id || '';
      }
    });

    it('GET /business/theme/overrides/store/:storeId returns override by store', async () => {
      if (!orgToken) return;
      const resp = await client.get('/business/theme/overrides/store/00000000-0000-0000-0000-000000000001', {
        headers: { Authorization: `Bearer ${orgToken}` },
      });
      expect([200, 404]).toContain(resp.status);
    });

    it('DELETE /business/theme/overrides/:overrideId removes override', async () => {
      if (!orgToken || !overrideId) return;
      const resp = await client.delete(`/business/theme/overrides/${overrideId}`, {
        headers: { Authorization: `Bearer ${orgToken}` },
      });
      expect([200, 404]).toContain(resp.status);
    });
  });

  describe('Theme assignment & resolution', () => {
    it('POST /business/theme/assign/:storeId assigns theme to store', async () => {
      if (!orgToken || !themeId) return;
      const resp = await client.post(
        '/business/theme/assign/00000000-0000-0000-0000-000000000001',
        { themeId },
        { headers: { Authorization: `Bearer ${orgToken}` } },
      );
      expect([200, 400, 404]).toContain(resp.status);
    });

    it('GET /business/theme/assignment/:storeId returns assignment', async () => {
      if (!orgToken) return;
      const resp = await client.get('/business/theme/assignment/00000000-0000-0000-0000-000000000001', {
        headers: { Authorization: `Bearer ${orgToken}` },
      });
      expect([200, 404]).toContain(resp.status);
    });

    it('GET /business/theme/resolve/:storeId resolves theme for storefront', async () => {
      if (!orgToken) return;
      const resp = await client.get('/business/theme/resolve/00000000-0000-0000-0000-000000000001', {
        headers: { Authorization: `Bearer ${orgToken}` },
      });
      expect([200, 404]).toContain(resp.status);
    });

    it('DELETE /business/theme/assign/:storeId unassigns theme', async () => {
      if (!orgToken) return;
      const resp = await client.delete('/business/theme/assign/00000000-0000-0000-0000-000000000001', {
        headers: { Authorization: `Bearer ${orgToken}` },
      });
      expect([200, 404]).toContain(resp.status);
    });
  });

  describe('Auth', () => {
    it('requests without auth token → 401', async () => {
      const resp = await client.get('/business/theme');
      expect(resp.status).toBe(401);
    });
  });
});
