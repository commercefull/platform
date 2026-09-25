/**
 * Membership Detail Endpoints Integration Tests
 *
 * Covers endpoints missed by membership.test.ts / membershipOps.test.ts:
 * - DELETE /business/membership/tiers/:id
 * - DELETE /business/membership/benefits/:id
 * - GET /customer/membership/user/:userId
 * - GET /customer/membership/user/:userId/benefits
 */

import { AxiosInstance } from 'axios';
import { expectStatus, createTestClient, loginTestAdmin, loginTestUser } from '../testUtils';
import { testTier, testBenefit } from './testUtils';

const UNKNOWN_ID = '00000000-0000-0000-0000-000000099999';

describe('Membership Detail Endpoints', () => {
  let client: AxiosInstance;
  let adminToken: string;
  let customerToken: string;
  let customerId: string;

  const auth = () => ({ headers: { Authorization: `Bearer ${adminToken}` } });
  const customerAuth = () => ({ headers: { Authorization: `Bearer ${customerToken}` } });

  beforeAll(async () => {
    client = createTestClient();
    adminToken = await loginTestAdmin(client);
    customerToken = await loginTestUser(client, 'customer@example.com', 'password123');
    customerId = JSON.parse(Buffer.from(customerToken.split('.')[1], 'base64url').toString()).id;
  });

  describe('Tier/benefit deletes', () => {
    it('POST + DELETE /business/membership/tiers/:id removes a tier', async () => {
      const create = await client.post(
        '/business/membership/tiers',
        { ...testTier, name: `Coverage Tier ${Date.now()}` },
        auth(),
      );
      expectStatus(create, 201);
      const tierId = create.data.data.membershipTierId || create.data.data.id;

      const del = await client.delete(`/business/membership/tiers/${tierId}`, auth());
      expectStatus(del, 200);

      const get = await client.get(`/business/membership/tiers/${tierId}`, auth());
      expectStatus(get, 404);
    });

    it('POST + DELETE /business/membership/benefits/:id removes a benefit', async () => {
      const tier = await client.post(
        '/business/membership/tiers',
        { ...testTier, name: `Benefit Tier ${Date.now()}` },
        auth(),
      );
      const tierId = tier.data.data.membershipTierId || tier.data.data.id;

      const create = await client.post(
        '/business/membership/benefits',
        { ...testBenefit, tierIds: [tierId], name: `Coverage Benefit ${Date.now()}` },
        auth(),
      );
      expectStatus(create, 201);
      const benefitId = create.data.data.membershipBenefitId || create.data.data.id;

      const del = await client.delete(`/business/membership/benefits/${benefitId}`, auth());
      expectStatus(del, 200);

      const get = await client.get(`/business/membership/benefits/${benefitId}`, auth());
      expectStatus(get, 404);
    });

    it('DELETE /business/membership/tiers/:id returns 404 for unknown ids', async () => {
      const resp = await client.delete(`/business/membership/tiers/${UNKNOWN_ID}`, auth());
      expectStatus(resp, 404);
    });
  });

  describe('Customer membership view', () => {
    it('GET /customer/membership/user/:userId returns the customer membership state', async () => {
      const resp = await client.get(`/customer/membership/user/${customerId}`, customerAuth());
      // Seeded customer has an active membership
      expectStatus(resp, 200);
      expect(resp.data.success).toBe(true);
    });

    it('GET /customer/membership/user/:userId/benefits returns the benefit list', async () => {
      const resp = await client.get(`/customer/membership/user/${customerId}/benefits`, customerAuth());
      expectStatus(resp, 200);
      expect(Array.isArray(resp.data.data)).toBe(true);
    });

    it('GET /customer/membership/user/:userId requires authentication', async () => {
      const resp = await client.get(`/customer/membership/user/${customerId}`);
      expectStatus(resp, 401);
    });
  });
});
