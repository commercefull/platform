/**
 * Subscription Expanded Integration Tests
 *
 * Covers endpoints not exercised by subscription.test.ts:
 *
 * Business:
 * - PUT    /business/subscriptions/products/:id                        — update subscription product
 * - POST   /business/subscriptions/products/:productId/plans           — create plan
 * - PUT    /business/subscriptions/products/:productId/plans/:planId   — update plan
 * - DELETE /business/subscriptions/products/:productId/plans/:planId   — delete plan
 * - POST   /business/subscriptions/:id/pause                           — admin pause
 * - POST   /business/subscriptions/:id/resume                          — admin resume
 * - POST   /business/subscriptions/orders/:orderId/retry               — retry order
 * - POST   /business/subscriptions/orders/:orderId/skip                — skip order
 * - POST   /business/subscriptions/:id/bill                            — process billing cycle
 *
 * Customer:
 * - POST /customer/subscriptions/subscribe              — create subscription
 * - GET  /customer/subscriptions/mine/:id               — get my subscription
 * - PUT  /customer/subscriptions/mine/:id               — update my subscription
 * - POST /customer/subscriptions/mine/:id/change-plan   — change plan
 * - POST /customer/subscriptions/mine/:id/pause         — pause
 * - POST /customer/subscriptions/mine/:id/resume        — resume
 * - POST /customer/subscriptions/mine/:id/cancel        — cancel
 * - POST /customer/subscriptions/mine/:id/reactivate    — reactivate
 * - POST /customer/subscriptions/mine/:id/skip          — skip next delivery
 * - GET  /customer/subscriptions/mine/:id/orders        — subscription orders
 */

import { AxiosInstance } from 'axios';
import { createTestSubscriptionProduct, createTestSubscriptionPlan, SEEDED_CUSTOMER_SUBSCRIPTION_IDS } from './testUtils';
import { randomUUID } from 'node:crypto';
import { createTestClient, loginTestAdmin, loginTestUser } from '../testUtils';

// Seeded fixtures (see seeds/20240805001700_seedSubscriptionTestData.js):
// a product linked to a subscription product, a no-trial plan so new
// subscriptions start 'active', and a mutable plan for update/delete tests.
const SEEDED = {
  PRODUCT_ID: '01937010-0000-7000-8000-000000000001',
  SUBSCRIPTION_PRODUCT_ID: '01937010-0000-7000-8000-000000000002',
  PLAN_NO_TRIAL_ID: '01937010-0000-7000-8000-000000000003',
  PLAN_MUTABLE_ID: '01937010-0000-7000-8000-000000000004',
};

describe('Subscription Expanded Tests', () => {
  let client: AxiosInstance;
  let adminToken: string;
  let customerToken: string;

  const subscriptionProductId = SEEDED.SUBSCRIPTION_PRODUCT_ID;
  const linkedProductId = SEEDED.PRODUCT_ID;
  const noTrialPlanId = SEEDED.PLAN_NO_TRIAL_ID;

  const adminHeaders = () => ({ Authorization: `Bearer ${adminToken}` });
  const customerHeaders = () => ({ Authorization: `Bearer ${customerToken}` });

  beforeAll(async () => {
    jest.setTimeout(30000);
    client = createTestClient();
    adminToken = await loginTestAdmin(client);
    customerToken = await loginTestUser(client, 'customer@example.com', 'password123');
  });

  // ============================================================================
  // Subscription Product Update (Business)
  // ============================================================================

  describe('Subscription Product Update (Business)', () => {
    it('should update a subscription product', async () => {
      if (!adminToken || !subscriptionProductId) return;

      // saveSubscriptionProduct rewrites all columns — send the full body
      const response = await client.put(
        `/business/subscriptions/products/${subscriptionProductId}`,
        createTestSubscriptionProduct(linkedProductId, { maxPauseDays: 60, trialDays: 7 }),
        { headers: adminHeaders() },
      );

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
    });
  });

  // ============================================================================
  // Subscription Plan Management (Business)
  // ============================================================================

  describe('Subscription Plan Management (Business)', () => {
    it('should create a subscription plan', async () => {
      const response = await client.post(
        `/business/subscriptions/products/${subscriptionProductId}/plans`,
        createTestSubscriptionPlan(subscriptionProductId),
        { headers: adminHeaders() },
      );

      expect(response.status).toBe(201);
      expect(response.data.success).toBe(true);
      expect(response.data.data?.subscriptionPlanId || response.data.data?.id).toBeTruthy();
    });

    it('should update a subscription plan', async () => {
      const response = await client.put(
        `/business/subscriptions/products/${subscriptionProductId}/plans/${SEEDED.PLAN_MUTABLE_ID}`,
        createTestSubscriptionPlan(subscriptionProductId, { name: 'Updated Ops Plan', priceCents: 3999 }),
        { headers: adminHeaders() },
      );

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
    });

    it('should delete a subscription plan', async () => {
      const response = await client.delete(
        `/business/subscriptions/products/${subscriptionProductId}/plans/${SEEDED.PLAN_MUTABLE_ID}`,
        { headers: adminHeaders() },
      );

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
    });
  });

  // ============================================================================
  // Admin Pause/Resume + Billing (Business)
  // ============================================================================

  describe('Admin Subscription Operations (Business)', () => {
    let subscriptionOrderId: string;

    it('should pause a subscription as admin', async () => {
      if (!adminToken) return;

      const response = await client.post(
        `/business/subscriptions/${SEEDED_CUSTOMER_SUBSCRIPTION_IDS.ACTIVE_MONTHLY}/pause`,
        { reason: 'Admin pause test' },
        { headers: adminHeaders() },
      );

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
    });

    it('should resume a paused subscription as admin', async () => {
      if (!adminToken) return;

      const response = await client.post(
        `/business/subscriptions/${SEEDED_CUSTOMER_SUBSCRIPTION_IDS.PAUSED_WEEKLY}/resume`,
        {},
        { headers: adminHeaders() },
      );

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
    });

    it('should process a billing cycle for a subscription', async () => {
      if (!adminToken) return;

      const response = await client.post(
        `/business/subscriptions/${SEEDED_CUSTOMER_SUBSCRIPTION_IDS.ACTIVE_MONTHLY}/bill`,
        {},
        { headers: adminHeaders() },
      );

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);

      subscriptionOrderId =
        response.data.data?.subscriptionOrderId || response.data.data?.id || response.data.data?.subscriptionOrder?.subscriptionOrderId;
    });

    it('should retry a subscription order', async () => {
      if (!adminToken || !subscriptionOrderId) return;

      const response = await client.post(
        `/business/subscriptions/orders/${subscriptionOrderId}/retry`,
        {},
        { headers: adminHeaders() },
      );

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
    });

    it('should skip a subscription order', async () => {
      if (!adminToken || !subscriptionOrderId) return;

      const response = await client.post(
        `/business/subscriptions/orders/${subscriptionOrderId}/skip`,
        {},
        { headers: adminHeaders() },
      );

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
    });
  });

  // ============================================================================
  // Customer Self-Service
  // ============================================================================

  describe('Customer Self-Service', () => {
    let mySubscriptionId: string;

    it('should create a subscription via subscribe', async () => {
      if (!customerToken || !noTrialPlanId) return;

      const response = await client.post(
        '/customer/subscriptions/subscribe',
        { subscriptionPlanId: noTrialPlanId, quantity: 1 },
        { headers: customerHeaders() },
      );

      expect(response.status).toBe(201);
      expect(response.data.success).toBe(true);

      mySubscriptionId =
        response.data.data?.customerSubscriptionId || response.data.data?.id || response.data.data?.subscriptionId;
      expect(mySubscriptionId).toBeTruthy();
    });

    it('should reject subscribe with an invalid plan', async () => {
      if (!customerToken) return;

      const response = await client.post(
        '/customer/subscriptions/subscribe',
        { subscriptionPlanId: randomUUID() },
        { headers: customerHeaders() },
      );

      expect(response.status).toBe(400);
      expect(response.data.success).toBe(false);
    });

    it('should get my subscription by ID', async () => {
      if (!customerToken || !mySubscriptionId) return;

      const response = await client.get(`/customer/subscriptions/mine/${mySubscriptionId}`, { headers: customerHeaders() });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('plan');
      expect(response.data.data).toHaveProperty('orders');
    });

    it('should update my subscription', async () => {
      if (!customerToken || !mySubscriptionId) return;

      const response = await client.put(
        `/customer/subscriptions/mine/${mySubscriptionId}`,
        { quantity: 2 },
        { headers: customerHeaders() },
      );

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
    });

    it('should change to another active plan', async () => {
      if (!customerToken || !mySubscriptionId) return;

      const response = await client.post(
        `/customer/subscriptions/mine/${mySubscriptionId}/change-plan`,
        { newPlanId: noTrialPlanId },
        { headers: customerHeaders() },
      );

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
    });

    it('should reject change-plan with an invalid plan', async () => {
      if (!customerToken || !mySubscriptionId) return;

      const response = await client.post(
        `/customer/subscriptions/mine/${mySubscriptionId}/change-plan`,
        { newPlanId: randomUUID() },
        { headers: customerHeaders() },
      );

      expect(response.status).toBe(400);
      expect(response.data.success).toBe(false);
    });

    it('should list my subscription orders', async () => {
      if (!customerToken || !mySubscriptionId) return;

      const response = await client.get(`/customer/subscriptions/mine/${mySubscriptionId}/orders`, {
        headers: customerHeaders(),
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
    });

    it('should skip the next delivery', async () => {
      if (!customerToken || !mySubscriptionId) return;

      const response = await client.post(`/customer/subscriptions/mine/${mySubscriptionId}/skip`, {}, { headers: customerHeaders() });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
    });

    it('should pause my subscription', async () => {
      if (!customerToken || !mySubscriptionId) return;

      const response = await client.post(
        `/customer/subscriptions/mine/${mySubscriptionId}/pause`,
        { reason: 'Going on vacation' },
        { headers: customerHeaders() },
      );

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
    });

    it('should resume my paused subscription', async () => {
      if (!customerToken || !mySubscriptionId) return;

      const response = await client.post(
        `/customer/subscriptions/mine/${mySubscriptionId}/resume`,
        {},
        { headers: customerHeaders() },
      );

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
    });

    it('should cancel my subscription at period end', async () => {
      if (!customerToken || !mySubscriptionId) return;

      const response = await client.post(
        `/customer/subscriptions/mine/${mySubscriptionId}/cancel`,
        { reason: 'No longer needed', cancelAtPeriodEnd: true },
        { headers: customerHeaders() },
      );

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
    });

    it('should reactivate a subscription cancelled at period end', async () => {
      if (!customerToken || !mySubscriptionId) return;

      const response = await client.post(
        `/customer/subscriptions/mine/${mySubscriptionId}/reactivate`,
        {},
        { headers: customerHeaders() },
      );

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
    });

    it('should require auth for self-service endpoints', async () => {
      const response = await client.post('/customer/subscriptions/subscribe', {
        subscriptionPlanId: randomUUID(),
      });

      expect(response.status).toBe(401);
    });
  });
});
