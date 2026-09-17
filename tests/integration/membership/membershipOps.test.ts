/**
 * Membership Operations Integration Tests
 *
 * Covers endpoints not exercised by membership.test.ts:
 * - GET  /business/membership/user-memberships           — list user memberships
 * - POST /business/membership/user-memberships/:id/cancel — cancel user membership
 * - GET  /business/membership/users/:userId/membership    — membership by user
 * - GET  /business/membership/users/:userId/benefits      — benefits by user (business)
 * - GET  /customer/membership/user/:userId/benefits       — benefits by user (customer)
 */

import { AxiosInstance } from 'axios';
import { createTestClient, loginTestAdmin, expectStatus } from '../testUtils';
import { loginTestUser } from '../testUtils';

describe('Membership Operations Tests', () => {
  let client: AxiosInstance;
  let adminToken: string;
  let customerToken: string;
  let customerId: string;

  // Seeded in seeds/20240805002205_seedMembershipOpsData.js (active membership for customer@example.com)
  const membershipId = '0193f001-0000-7000-8000-000000000001';

  const adminHeaders = () => ({ Authorization: `Bearer ${adminToken}` });
  const customerHeaders = () => ({ Authorization: `Bearer ${customerToken}` });

  beforeAll(async () => {
    jest.setTimeout(30000);
    client = createTestClient();
    adminToken = await loginTestAdmin(client);
    customerToken = await loginTestUser(client, 'customer@example.com', 'password123');
    if (!adminToken) throw new Error('Failed to get admin token for Membership tests');

    if (customerToken) {
      const payload = JSON.parse(Buffer.from(customerToken.split('.')[1], 'base64url').toString()) as { id?: string };
      customerId = payload.id || '';
    }
  });

  // ============================================================================
  // User Memberships (business)
  // ============================================================================

  describe('User Memberships', () => {

    it('should list user memberships', async () => {
      const response = await client.get('/business/membership/user-memberships', { headers: adminHeaders() });
      expectStatus(response, 200);
      expect(response.data.success).toBe(true);
      expect(Array.isArray(response.data.data)).toBe(true);
    });

    it('should get a membership by user ID', async () => {
      if (!customerId) return;

      const response = await client.get(`/business/membership/users/${customerId}/membership`, { headers: adminHeaders() });
      expectStatus(response, 200);
      expect(response.data.success).toBe(true);
    });

    it('should get membership benefits by user ID', async () => {
      if (!customerId) return;

      const response = await client.get(`/business/membership/users/${customerId}/benefits`, { headers: adminHeaders() });
      expectStatus(response, 200);
      expect(response.data.success).toBe(true);
    });

    it('should get membership benefits via the customer API', async () => {
      if (!customerId || !customerToken) return;

      const response = await client.get(`/customer/membership/user/${customerId}/benefits`, { headers: customerHeaders() });
      expectStatus(response, 200);
      expect(response.data.success).toBe(true);
    });

    it('should cancel a user membership', async () => {
      const response = await client.post(`/business/membership/user-memberships/${membershipId}/cancel`, {}, { headers: adminHeaders() });
      expectStatus(response, 200);
      expect(response.data.success).toBe(true);
    });
  });
});
