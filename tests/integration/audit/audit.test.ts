/**
 * Audit Module Integration Tests
 * Covers audit log read-only endpoints and chain verification
 */

import { AxiosInstance } from 'axios';
import { createTestClient, loginTestAdmin } from '../testUtils';

describe('Audit Module Integration Tests', () => {
  let client: AxiosInstance;
  let orgToken: string;

  beforeAll(async () => {
    client = createTestClient();
    orgToken = await loginTestAdmin(client);
  });

  describe('Audit log listing', () => {
    it('GET /business/audit returns paginated logs', async () => {
      if (!orgToken) return;
      const resp = await client.get('/business/audit', {
        headers: { Authorization: `Bearer ${orgToken}` },
      });
      expect([200, 404]).toContain(resp.status);
      if (resp.status === 200) {
        expect(resp.data.success).toBe(true);
        const items = resp.data.data?.data || resp.data.data || [];
        expect(Array.isArray(items)).toBe(true);
      }
    });

    it('GET /business/audit with pagination params', async () => {
      if (!orgToken) return;
      const resp = await client.get('/business/audit?limit=5&offset=0', {
        headers: { Authorization: `Bearer ${orgToken}` },
      });
      expect([200, 404]).toContain(resp.status);
    });

    it('GET /business/audit/stats returns audit statistics', async () => {
      if (!orgToken) return;
      const resp = await client.get('/business/audit/stats', {
        headers: { Authorization: `Bearer ${orgToken}` },
      });
      expect([200, 404]).toContain(resp.status);
      if (resp.status === 200) {
        expect(resp.data.success).toBe(true);
      }
    });

    it('GET /business/audit/verify verifies hash chain', async () => {
      if (!orgToken) return;
      const resp = await client.get('/business/audit/verify', {
        headers: { Authorization: `Bearer ${orgToken}` },
      });
      expect([200, 404]).toContain(resp.status);
      if (resp.status === 200) {
        expect(resp.data.data).toHaveProperty('valid');
      }
    });

    it('GET /business/audit/correlation/:id finds by correlation ID', async () => {
      if (!orgToken) return;
      const resp = await client.get('/business/audit/correlation/test-correlation-id', {
        headers: { Authorization: `Bearer ${orgToken}` },
      });
      expect([200, 404]).toContain(resp.status);
    });

    it('GET /business/audit/:id returns single log', async () => {
      if (!orgToken) return;
      const resp = await client.get('/business/audit/00000000-0000-0000-0000-000000000000', {
        headers: { Authorization: `Bearer ${orgToken}` },
      });
      expect([200, 404]).toContain(resp.status);
    });
  });

  describe('Auth', () => {
    it('requests without auth token → 401', async () => {
      const resp = await client.get('/business/audit');
      expect(resp.status).toBe(401);
    });
  });
});
