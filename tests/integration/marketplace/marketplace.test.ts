/**
 * Marketplace Module Integration Tests
 * Covers vendor CRUD, lifecycle, commission rules, and payouts
 */

import { AxiosInstance } from 'axios';
import { createTestClient, loginTestAdmin, expectStatus } from '../testUtils';

describe('Marketplace Module Integration Tests', () => {
  let client: AxiosInstance;
  let orgToken: string;
  let vendorId: string;
  let commissionRuleId: string;
  let payoutId: string;

  beforeAll(async () => {
    client = createTestClient();
    orgToken = await loginTestAdmin(client);
  });

  afterAll(async () => {
    if (orgToken && commissionRuleId) {
      await client.delete(`/business/commission-rules/${commissionRuleId}`, {
        headers: { Authorization: `Bearer ${orgToken}` },
      });
    }
  });

  describe('Vendor CRUD', () => {
    it('POST /business/vendors creates a vendor', async () => {
      if (!orgToken) return;
      const resp = await client.post(
        '/business/vendors',
        {
          name: 'Test Vendor',
          email: 'vendor@test.com',
          phone: '+1234567890',
        },
        { headers: { Authorization: `Bearer ${orgToken}` } },
      );
      expect([201, 200]).toContain(resp.status);
      if (resp.data.success) {
        vendorId = resp.data.data?.vendorId || resp.data.data?.id || '';
      }
    });

    it('GET /business/vendors returns list', async () => {
      if (!orgToken) return;
      const resp = await client.get('/business/vendors', {
        headers: { Authorization: `Bearer ${orgToken}` },
      });
      expectStatus(resp, 200);
      expect(resp.data.success).toBe(true);
      const items = resp.data.data?.data || resp.data.data || [];
      expect(Array.isArray(items)).toBe(true);
    });

    it('GET /business/vendors/:vendorId returns single vendor', async () => {
      if (!orgToken || !vendorId) return;
      const resp = await client.get(`/business/vendors/${vendorId}`, {
        headers: { Authorization: `Bearer ${orgToken}` },
      });
      expectStatus(resp, 200);
    });

    it('PUT /business/vendors/:vendorId updates vendor', async () => {
      if (!orgToken || !vendorId) return;
      const resp = await client.put(
        `/business/vendors/${vendorId}`,
        { name: 'Updated Vendor' },
        { headers: { Authorization: `Bearer ${orgToken}` } },
      );
      expectStatus(resp, 200);
    });

    it('PUT /business/vendors/:vendorId/address sets address', async () => {
      if (!orgToken || !vendorId) return;
      const resp = await client.put(
        `/business/vendors/${vendorId}/address`,
        { street: '123 Main St', city: 'Test City', country: 'US', postalCode: '12345' },
        { headers: { Authorization: `Bearer ${orgToken}` } },
      );
      expect([200, 400]).toContain(resp.status);
    });

    it('PUT /business/vendors/:vendorId/bank-info sets bank info', async () => {
      if (!orgToken || !vendorId) return;
      const resp = await client.put(
        `/business/vendors/${vendorId}/bank-info`,
        { bankName: 'Test Bank', accountNumber: '123456789', routingNumber: '123456789' },
        { headers: { Authorization: `Bearer ${orgToken}` } },
      );
      expect([200, 400]).toContain(resp.status);
    });
  });

  describe('Vendor lifecycle', () => {
    it('POST /business/vendors/:vendorId/approve approves vendor', async () => {
      if (!orgToken || !vendorId) return;
      const resp = await client.post(
        `/business/vendors/${vendorId}/approve`,
        {},
        { headers: { Authorization: `Bearer ${orgToken}` } },
      );
      expect([200, 400]).toContain(resp.status);
    });

    it('POST /business/vendors/:vendorId/suspend suspends vendor', async () => {
      if (!orgToken || !vendorId) return;
      const resp = await client.post(
        `/business/vendors/${vendorId}/suspend`,
        { reason: 'Policy violation' },
        { headers: { Authorization: `Bearer ${orgToken}` } },
      );
      expect([200, 400]).toContain(resp.status);
    });

    it('PUT /business/vendors/:vendorId/tier sets vendor tier', async () => {
      if (!orgToken || !vendorId) return;
      const resp = await client.put(
        `/business/vendors/${vendorId}/tier`,
        { tier: 'gold' },
        { headers: { Authorization: `Bearer ${orgToken}` } },
      );
      expect([200, 400]).toContain(resp.status);
    });

    it('PUT /business/vendors/:vendorId/commission-rate sets commission', async () => {
      if (!orgToken || !vendorId) return;
      const resp = await client.put(
        `/business/vendors/${vendorId}/commission-rate`,
        { commissionRate: 0.15 },
        { headers: { Authorization: `Bearer ${orgToken}` } },
      );
      expect([200, 400]).toContain(resp.status);
    });
  });

  describe('Commission rules', () => {
    it('POST /business/commission-rules creates a rule', async () => {
      if (!orgToken) return;
      const resp = await client.post(
        '/business/commission-rules',
        {
          name: 'Default Commission',
          rate: 0.10,
          priority: 1,
        },
        { headers: { Authorization: `Bearer ${orgToken}` } },
      );
      expect([201, 200]).toContain(resp.status);
      if (resp.data.success) {
        commissionRuleId = resp.data.data?.ruleId || resp.data.data?.id || '';
      }
    });

    it('GET /business/commission-rules returns list', async () => {
      if (!orgToken) return;
      const resp = await client.get('/business/commission-rules', {
        headers: { Authorization: `Bearer ${orgToken}` },
      });
      expectStatus(resp, 200);
    });

    it('GET /business/commission-rules/:ruleId returns single rule', async () => {
      if (!orgToken || !commissionRuleId) return;
      const resp = await client.get(`/business/commission-rules/${commissionRuleId}`, {
        headers: { Authorization: `Bearer ${orgToken}` },
      });
      expectStatus(resp, 200);
    });

    it('PUT /business/commission-rules/:ruleId/rate updates rate', async () => {
      if (!orgToken || !commissionRuleId) return;
      const resp = await client.put(
        `/business/commission-rules/${commissionRuleId}/rate`,
        { rate: 0.12 },
        { headers: { Authorization: `Bearer ${orgToken}` } },
      );
      expectStatus(resp, 200);
    });

    it('POST /business/commission-rules/:ruleId/activate activates rule', async () => {
      if (!orgToken || !commissionRuleId) return;
      const resp = await client.post(
        `/business/commission-rules/${commissionRuleId}/activate`,
        {},
        { headers: { Authorization: `Bearer ${orgToken}` } },
      );
      expectStatus(resp, 200);
    });

    it('POST /business/commission-rules/:ruleId/deactivate deactivates rule', async () => {
      if (!orgToken || !commissionRuleId) return;
      const resp = await client.post(
        `/business/commission-rules/${commissionRuleId}/deactivate`,
        {},
        { headers: { Authorization: `Bearer ${orgToken}` } },
      );
      expectStatus(resp, 200);
    });

    it('POST /business/commission-rules/calculate calculates commission', async () => {
      if (!orgToken) return;
      const resp = await client.post(
        '/business/commission-rules/calculate',
        { vendorId: vendorId || '00000000-0000-0000-0000-000000000001', amount: 100.0 },
        { headers: { Authorization: `Bearer ${orgToken}` } },
      );
      expect([200, 400]).toContain(resp.status);
    });
  });

  describe('Payouts', () => {
    it('POST /business/payouts creates a payout', async () => {
      if (!orgToken || !vendorId) return;
      const resp = await client.post(
        '/business/payouts',
        { vendorId, amount: 50.0, currency: 'USD' },
        { headers: { Authorization: `Bearer ${orgToken}` } },
      );
      expect([201, 200]).toContain(resp.status);
      if (resp.data.success) {
        payoutId = resp.data.data?.payoutId || resp.data.data?.id || '';
      }
    });

    it('GET /business/payouts returns list', async () => {
      if (!orgToken) return;
      const resp = await client.get('/business/payouts', {
        headers: { Authorization: `Bearer ${orgToken}` },
      });
      expectStatus(resp, 200);
    });

    it('GET /business/payouts/:payoutId returns single payout', async () => {
      if (!orgToken || !payoutId) return;
      const resp = await client.get(`/business/payouts/${payoutId}`, {
        headers: { Authorization: `Bearer ${orgToken}` },
      });
      expectStatus(resp, 200);
    });

    it('POST /business/payouts/:payoutId/process processes payout', async () => {
      if (!orgToken || !payoutId) return;
      const resp = await client.post(
        `/business/payouts/${payoutId}/process`,
        {},
        { headers: { Authorization: `Bearer ${orgToken}` } },
      );
      expect([200, 400]).toContain(resp.status);
    });

    it('POST /business/payouts/:payoutId/cancel cancels payout', async () => {
      if (!orgToken || !payoutId) return;
      const resp = await client.post(
        `/business/payouts/${payoutId}/cancel`,
        { reason: 'Test cancellation' },
        { headers: { Authorization: `Bearer ${orgToken}` } },
      );
      expect([200, 400]).toContain(resp.status);
    });
  });

  describe('Auth', () => {
    it('requests without auth token → 401', async () => {
      const resp = await client.get('/business/vendors');
      expect(resp.status).toBe(401);
    });
  });
});
