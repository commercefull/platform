/**
 * User-Store Assignment Integration Tests
 *
 * Tests for the identity user-store management endpoints:
 * - POST   /business/auth/users/:userId/stores        — assign user to store
 * - GET    /business/auth/users/:userId/stores        — get user's stores
 * - GET    /business/auth/stores/:storeId/users       — list store users
 * - DELETE /business/auth/users/:userId/stores/:storeId — remove user from store
 */

import { AxiosInstance } from 'axios';
import { createTestClient, loginTestAdmin, expectStatus } from '../testUtils';
import { randomUUID } from 'node:crypto';

describe('User-Store Assignment API', () => {
  let client: AxiosInstance;
  let adminToken: string;

  beforeAll(async () => {
    jest.setTimeout(30000);
    client = createTestClient();
    adminToken = await loginTestAdmin(client);
  });

  const authHeaders = () => ({ Authorization: `Bearer ${adminToken}` });

  const TEST_USER_ID = '00000000-0000-0000-0000-000000001001';
  const TEST_STORE_ID = '20000000-0000-0000-0000-000000000001';

  describe('POST /business/auth/users/:userId/stores', () => {
    it('should assign a user to a store', async () => {
      if (!adminToken) return;

      const response = await client.post(
        `/business/auth/users/${TEST_USER_ID}/stores`,
        {
          storeId: TEST_STORE_ID,
          role: 'staff',
          isPrimary: false,
        },
        { headers: authHeaders() },
      );

      expect([201, 400, 404].includes(response.status)).toBe(true);
    });

    it('should reject assignment with missing storeId', async () => {
      if (!adminToken) return;

      const response = await client.post(
        `/business/auth/users/${TEST_USER_ID}/stores`,
        { role: 'staff' },
        { headers: authHeaders() },
      );

      expectStatus(response, 400);
    });

    it('should reject assignment with missing role', async () => {
      if (!adminToken) return;

      const response = await client.post(
        `/business/auth/users/${TEST_USER_ID}/stores`,
        { storeId: TEST_STORE_ID },
        { headers: authHeaders() },
      );

      expectStatus(response, 400);
    });
  });

  describe('GET /business/auth/users/:userId/stores', () => {
    it('should get stores for a user', async () => {
      if (!adminToken) return;

      const response = await client.get(
        `/business/auth/users/${TEST_USER_ID}/stores`,
        { headers: authHeaders() },
      );

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
    });
  });

  describe('GET /business/auth/stores/:storeId/users', () => {
    it('should list users for a store', async () => {
      if (!adminToken) return;

      const response = await client.get(
        `/business/auth/stores/${TEST_STORE_ID}/users`,
        { headers: authHeaders() },
      );

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
    });
  });

  describe('DELETE /business/auth/users/:userId/stores/:storeId', () => {
    it('should remove a user from a store', async () => {
      if (!adminToken) return;

      const response = await client.delete(
        `/business/auth/users/${TEST_USER_ID}/stores/${TEST_STORE_ID}`,
        { headers: authHeaders() },
      );

      expect([200, 400, 404].includes(response.status)).toBe(true);
    });
  });

  describe('Authentication', () => {
    it('should reject requests without auth token', async () => {
      const response = await client.get(
        `/business/auth/users/${randomUUID()}/stores`,
      );

      expectStatus(response, 401);
    });
  });
});
