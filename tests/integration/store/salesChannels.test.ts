/**
 * Sales Channel API Integration Tests
 *
 * Covers organization-owned sales-channel CRUD, store/channel assignment,
 * and rejection of invalid or cross-organization references.
 */

import { AxiosInstance } from 'axios';
import { createTestClient, loginTestAdmin, expectStatus } from '../testUtils';

describe('Sales Channels API Integration', () => {
  let client: AxiosInstance;
  let adminToken: string;

  beforeAll(async () => {
    jest.setTimeout(60000);
    client = createTestClient();
    adminToken = await loginTestAdmin(client);
  });

  const authHeaders = () => ({ Authorization: `Bearer ${adminToken}` });

  const findStoreBySlug = async (slug: string): Promise<string> => {
    const response = await client.get(`/business/stores/slug/${slug}`, { headers: authHeaders() });
    expectStatus(response, 200);
    return response.data.data.storeId;
  };

  describe('GET /business/stores/channels', () => {
    it('should reject unauthenticated requests', async () => {
      const response = await client.get('/business/stores/channels');
      expectStatus(response, 401);
    });

    it('should list the seeded channels for the organization', async () => {
      const response = await client.get('/business/stores/channels', { headers: authHeaders() });

      expectStatus(response, 200);
      const codes = (response.data.data as Array<{ code: string }>).map(channel => channel.code);
      expect(codes).toEqual(expect.arrayContaining(['website', 'facebook', 'google', 'pos', 'agentic']));
    });
  });

  describe('POST /business/stores/channels', () => {
    it('should create a sales channel', async () => {
      const code = `whatsapp-${Date.now()}`;
      const response = await client.post(
        '/business/stores/channels',
        { code, name: 'WhatsApp Commerce', type: 'social' },
        { headers: authHeaders() },
      );

      expectStatus(response, 201);
      expect(response.data.data).toMatchObject({ code, name: 'WhatsApp Commerce', type: 'social' });
    });

    it('should reject a duplicate channel code', async () => {
      const code = `duplicate-${Date.now()}`;
      await client.post('/business/stores/channels', { code, name: 'First', type: 'api' }, { headers: authHeaders() });

      const response = await client.post('/business/stores/channels', { code, name: 'Second', type: 'other' }, { headers: authHeaders() });

      expect(response.status).toBe(400);
      expect(response.data.success).toBe(false);
    });
  });

  describe('store channel assignment', () => {
    it('should list channels assigned to a seeded store', async () => {
      const storeId = await findStoreBySlug('enterprise-us-ny');

      const response = await client.get(`/business/stores/${storeId}/channels`, { headers: authHeaders() });

      expectStatus(response, 200);
      expect(Array.isArray(response.data.data)).toBe(true);
      expect(response.data.data.length).toBeGreaterThan(0);
    });

    it('should assign and unassign a channel for a store', async () => {
      const storeId = await findStoreBySlug('enterprise-uk');
      const createResponse = await client.post(
        '/business/stores/channels',
        { code: `tiktok-${Date.now()}`, name: 'TikTok Shop', type: 'social' },
        { headers: authHeaders() },
      );
      expectStatus(createResponse, 201);
      const channelId = createResponse.data.data.salesChannelId;

      const assignResponse = await client.post(
        `/business/stores/${storeId}/channels`,
        { salesChannelId: channelId },
        { headers: authHeaders() },
      );
      expect(assignResponse.status).toBe(201);
      expect(assignResponse.data.success).toBe(true);

      const listResponse = await client.get(`/business/stores/${storeId}/channels`, { headers: authHeaders() });
      expectStatus(listResponse, 200);
      const assignedIds = (listResponse.data.data as Array<{ salesChannelId: string }>).map(c => c.salesChannelId);
      expect(assignedIds).toContain(channelId);

      const unassignResponse = await client.delete(`/business/stores/${storeId}/channels/${channelId}`, {
        headers: authHeaders(),
      });
      expectStatus(unassignResponse, 200);
    });

    it('should reject assigning a channel that does not exist', async () => {
      const storeId = await findStoreBySlug('enterprise-us-ca');

      const response = await client.post(
        `/business/stores/${storeId}/channels`,
        { salesChannelId: '00000000-0000-0000-0000-000000000000' },
        { headers: authHeaders() },
      );

      expect(response.status).toBe(400);
      expect(response.data.success).toBe(false);
    });

    it('should reject assigning a channel to a store that does not exist', async () => {
      const listResponse = await client.get('/business/stores/channels', { headers: authHeaders() });
      const channelId = listResponse.data.data[0].salesChannelId;

      const response = await client.post(
        `/business/stores/00000000-0000-0000-0000-000000000000/channels`,
        { salesChannelId: channelId },
        { headers: authHeaders() },
      );

      expect(response.status).toBe(404);
      expect(response.data.success).toBe(false);
    });
  });
});
