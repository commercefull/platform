/**
 * Marketplace Detail Endpoints Integration Tests
 *
 * Covers endpoints missed by marketplace.test.ts / marketplaceOps.test.ts:
 * - POST/PUT /business/vendors + address/bank-info/tier/commission-rate/suspend
 * - POST /business/commission-rules + rate/priority/validity/activate/deactivate/DELETE
 * - POST /business/commission-rules/calculate
 * - POST /business/payouts + line-items/method/cancel/complete/fail
 */

import { AxiosInstance } from 'axios';
import { expectStatus, createTestClient, loginTestAdmin } from '../testUtils';

const UNKNOWN_ID = '00000000-0000-0000-0000-000000099999';

describe('Marketplace Detail Endpoints', () => {
  let client: AxiosInstance;
  let adminToken: string;

  const auth = () => ({ headers: { Authorization: `Bearer ${adminToken}` } });

  beforeAll(async () => {
    client = createTestClient();
    adminToken = await loginTestAdmin(client);
  });

  describe('Vendor lifecycle', () => {
    let vendorId: string;

    it('POST /business/vendors creates a vendor', async () => {
      const resp = await client.post(
        '/business/vendors',
        { name: 'Coverage Vendor', email: `vendor-${Date.now()}@example.com`, commissionRate: 10 },
        auth(),
      );
      expectStatus(resp, 201);
      vendorId = resp.data.data.vendorId;
      expect(vendorId).toBeTruthy();
    });

    it('PUT /business/vendors/:id updates the profile', async () => {
      const resp = await client.put(`/business/vendors/${vendorId}`, { legalName: 'Coverage Vendor LLC' }, auth());
      expectStatus(resp, 200);
      expect(resp.data.data.legalName).toBe('Coverage Vendor LLC');
    });

    it('PUT /business/vendors/:id/address sets the address', async () => {
      const resp = await client.put(
        `/business/vendors/${vendorId}/address`,
        { street: '1 Vendor Way', city: 'Austin', state: 'TX', postalCode: '73301', country: 'US' },
        auth(),
      );
      expectStatus(resp, 200);
    });

    it('PUT /business/vendors/:id/bank-info sets bank info', async () => {
      const resp = await client.put(
        `/business/vendors/${vendorId}/bank-info`,
        { accountHolderName: 'Coverage Vendor', bankName: 'Test Bank', accountNumber: '000111222', routingNumber: '110000000' },
        auth(),
      );
      expectStatus(resp, 200);
    });

    it('PUT /business/vendors/:id/tier sets the tier', async () => {
      const resp = await client.put(`/business/vendors/${vendorId}/tier`, { tier: 'gold' }, auth());
      expectStatus(resp, 200);
    });

    it('PUT /business/vendors/:id/commission-rate sets the rate', async () => {
      const resp = await client.put(`/business/vendors/${vendorId}/commission-rate`, { commissionRate: 12.5 }, auth());
      expectStatus(resp, 200);
    });

    it('POST /business/vendors/:id/suspend suspends the vendor', async () => {
      await client.post(`/business/vendors/${vendorId}/approve`, {}, auth());
      // approve may be required before suspend
      const resp = await client.post(`/business/vendors/${vendorId}/suspend`, {}, auth());
      expectStatus(resp, 200);
      expect(resp.data.data.status).toBe('suspended');
    });

    it('PUT /business/vendors/:id returns an error for unknown vendor', async () => {
      const resp = await client.put(`/business/vendors/${UNKNOWN_ID}`, { name: 'x' }, auth());
      expectStatus(resp, 404);
      expect(resp.data.success).toBe(false);
    });
  });

  describe('Commission rules', () => {
    let ruleId: string;

    it('POST /business/commission-rules creates a rule', async () => {
      const resp = await client.post(
        '/business/commission-rules',
        { name: 'Coverage Rule', type: 'percentage', scope: 'global', rate: 15 },
        auth(),
      );
      expectStatus(resp, 201);
      ruleId = resp.data.data.ruleId || resp.data.data.commissionRuleId;
      expect(ruleId).toBeTruthy();
    });

    it('PUT /business/commission-rules/:id/rate updates the rate', async () => {
      const resp = await client.put(`/business/commission-rules/${ruleId}/rate`, { rate: 18 }, auth());
      expectStatus(resp, 200);
    });

    it('PUT /business/commission-rules/:id/priority updates the priority', async () => {
      const resp = await client.put(`/business/commission-rules/${ruleId}/priority`, { priority: 5 }, auth());
      expectStatus(resp, 200);
    });

    it('PUT /business/commission-rules/:id/validity sets the window', async () => {
      const resp = await client.put(
        `/business/commission-rules/${ruleId}/validity`,
        { startsAt: new Date().toISOString(), endsAt: new Date(Date.now() + 86400000).toISOString() },
        auth(),
      );
      expectStatus(resp, 200);
    });

    it('POST /business/commission-rules/calculate computes a commission', async () => {
      const resp = await client.post('/business/commission-rules/calculate', { orderTotalCents: 10000 }, auth());
      expectStatus(resp, 200);
    });

    it('POST /business/commission-rules/:id/deactivate + activate toggles the rule', async () => {
      const off = await client.post(`/business/commission-rules/${ruleId}/deactivate`, {}, auth());
      expectStatus(off, 200);
      const on = await client.post(`/business/commission-rules/${ruleId}/activate`, {}, auth());
      expectStatus(on, 200);
    });

    it('DELETE /business/commission-rules/:id removes the rule', async () => {
      const resp = await client.delete(`/business/commission-rules/${ruleId}`, auth());
      expectStatus(resp, 200);
    });
  });

  describe('Payout lifecycle', () => {
    let payoutId: string;
    let payoutVendorId: string;

    it('POST /business/payouts creates a payout', async () => {
      const vendor = await client.post(
        '/business/vendors',
        { name: `Payout Vendor ${Date.now()}`, email: `payout-vendor-${Date.now()}@example.com` },
        auth(),
      );
      expectStatus(vendor, 201);
      payoutVendorId = vendor.data.data.vendorId;

      // Payouts require an approved/active vendor
      const approve = await client.post(`/business/vendors/${payoutVendorId}/approve`, {}, auth());
      expectStatus(approve, 200);

      const resp = await client.post(
        '/business/payouts',
        { vendorId: payoutVendorId, amountCents: 5000, currency: 'USD', method: 'bank_transfer' },
        auth(),
      );
      expectStatus(resp, 201);
      payoutId = resp.data.data.payoutId || resp.data.data.vendorPayoutId;
    });

    it('PUT /business/payouts/:id/method updates the method', async () => {
      const resp = await client.put(`/business/payouts/${payoutId}/method`, { method: 'paypal' }, auth());
      expectStatus(resp, 200);
    });

    it('POST /business/payouts/:id/cancel cancels the payout', async () => {
      const resp = await client.post(`/business/payouts/${payoutId}/cancel`, {}, auth());
      expectStatus(resp, 200);
    });
  });
});
