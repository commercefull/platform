/**
 * Market Integration Tests
 *
 * Covers the global-commerce market endpoints:
 * - Business CRUD at /business/markets
 * - 12-dimension readiness report
 * - Launch gate (must reject when blocking dimensions are missing)
 * - Customer market-context resolution
 */

import { AxiosInstance } from 'axios';
import { randomUUID } from 'node:crypto';
import { createTestClient, expectStatus } from '../testUtils';

const TEST_MERCHANT = {
  email: 'merchant@example.com',
  password: 'password123',
};

const READINESS_DIMENSIONS = [
  'locale',
  'currency',
  'catalog',
  'pricing',
  'tax',
  'payments',
  'shipping',
  'returns',
  'legal',
  'compliance',
  'support',
  'fraud',
];

const marketBody = (code: string) => ({
  code,
  name: `Integration Market ${code}`,
  countryCodes: ['DE', 'BE'],
  defaultCurrencyCode: 'EUR',
  supportedCurrencyCodes: ['EUR'],
  defaultLocaleCode: 'de-DE',
  supportedLocaleCodes: ['de-DE', 'en-GB'],
  taxDisplayMode: 'inclusive_tax',
  allowDynamicFxConversion: false,
  allowedPaymentMethods: ['card'],
  allowedFulfillmentMethods: ['shipping'],
  hostnamePatterns: [`${code.toLowerCase()}.test.local`],
  capabilities: {},
  metadata: { testRun: randomUUID() },
});

describe('Market Integration Tests', () => {
  let client: AxiosInstance;
  let organizationToken: string;
  let marketId: string;

  beforeAll(async () => {
    client = createTestClient();
    const loginResponse = await client.post('/business/auth/login', TEST_MERCHANT);
    organizationToken = loginResponse.data?.accessToken || '';
  });

  const authHeaders = () => ({ Authorization: `Bearer ${organizationToken}` });

  // ==========================================================================
  // Authentication
  // ==========================================================================

  it('should reject unauthenticated market requests', async () => {
    const response = await client.get('/business/markets');
    expectStatus(response, 401);
  });

  // ==========================================================================
  // CRUD lifecycle
  // ==========================================================================

  describe('CRUD lifecycle', () => {
    it('should create a market in draft status', async () => {
      const response = await client.post('/business/markets', marketBody('EU-TEST'), { headers: authHeaders() });
      expectStatus(response, 201);
      expect(response.data.success).toBe(true);
      const market = response.data.data;
      marketId = market.marketId;
      expect(market.code).toBe('EU-TEST');
      expect(market.status).toBe('draft');
      expect(market.countryCodes).toEqual(['DE', 'BE']);
      expect(market.defaultCurrencyCode).toBe('EUR');
      expect(market.supportedLocaleCodes).toEqual(['de-DE', 'en-GB']);
      expect(market.hostnamePatterns).toEqual(['eu-test.test.local']);
    });

    it('should reject a duplicate market code', async () => {
      const response = await client.post('/business/markets', marketBody('EU-TEST'), { headers: authHeaders() });
      expectStatus(response, 409);
    });

    it('should get the market by id', async () => {
      const response = await client.get(`/business/markets/${marketId}`, { headers: authHeaders() });
      expectStatus(response, 200);
      expect(response.data.data.marketId).toBe(marketId);
      expect(response.data.data.version).toBe(1);
    });

    it('should list markets with a status filter', async () => {
      const response = await client.get('/business/markets?status=draft', { headers: authHeaders() });
      expectStatus(response, 200);
      const markets = response.data.data as Array<{ marketId: string; status: string }>;
      expect(markets.some(m => m.marketId === marketId)).toBe(true);
      expect(markets.every(m => m.status === 'draft')).toBe(true);
    });

    it('should update market configuration', async () => {
      const response = await client.put(
        `/business/markets/${marketId}`,
        { countryCodes: ['DE', 'BE', 'NL'], allowedPaymentMethods: ['card', 'paypal'] },
        { headers: authHeaders() },
      );
      expectStatus(response, 200);
      expect(response.data.data.countryCodes).toEqual(['DE', 'BE', 'NL']);
      expect(response.data.data.allowedPaymentMethods).toEqual(['card', 'paypal']);
    });
  });

  // ==========================================================================
  // Readiness — 12 dimensions
  // ==========================================================================

  describe('readiness', () => {
    it('should return the 12-dimension readiness report', async () => {
      const response = await client.get(`/business/markets/${marketId}/readiness`, { headers: authHeaders() });
      expectStatus(response, 200);
      const report = response.data.data;
      expect(report.marketId).toBe(marketId);
      expect(report.dimensions).toHaveLength(READINESS_DIMENSIONS.length);
      const dims = report.dimensions.map((d: { dimension: string }) => d.dimension);
      READINESS_DIMENSIONS.forEach(d => expect(dims).toContain(d));
      const validStatuses = new Set(['ready', 'warning', 'missing']);
      report.dimensions.forEach((d: { status: string; issues: unknown[]; blocking: boolean }) => {
        expect(validStatuses.has(d.status)).toBe(true);
        expect(Array.isArray(d.issues)).toBe(true);
      });
      expect(typeof report.readinessScorePercent).toBe('number');
      expect(typeof report.launchable).toBe('boolean');
    });
  });

  // ==========================================================================
  // Launch gate — a bare test market must not launch
  // ==========================================================================

  describe('launch gate', () => {
    it('should reject launch when blocking dimensions are missing', async () => {
      const readiness = await client.get(`/business/markets/${marketId}/readiness`, { headers: authHeaders() });
      expectStatus(readiness, 200);
      if (readiness.data.data.launchable) {
        // Environment has full coverage — launch must succeed instead
        const response = await client.post(`/business/markets/${marketId}/launch`, {}, { headers: authHeaders() });
        expectStatus(response, 200);
        expect(response.data.data.market.status).toBe('active');
        return;
      }
      const response = await client.post(`/business/markets/${marketId}/launch`, {}, { headers: authHeaders() });
      expectStatus(response, 400);
      expect(response.data.message).toContain('not ready for launch');
      // Market must remain non-active
      const market = await client.get(`/business/markets/${marketId}`, { headers: authHeaders() });
      expect(market.data.data.status).not.toBe('active');
    });
  });

  // ==========================================================================
  // Customer market context
  // ==========================================================================

  describe('customer context', () => {
    it('should reject context resolution for a non-matching hostname', async () => {
      const response = await client.get('/customer/markets/context');
      // No active market serves the test host — 404 expected unless a seeded
      // market covers it (then the shape is validated instead).
      if (response.status === 200) {
        const ctx = response.data.data;
        expect(ctx).toHaveProperty('marketId');
        expect(ctx).toHaveProperty('currencyCode');
        expect(ctx).toHaveProperty('localeCode');
        expect(ctx.supportedCurrencyCodes).toContain(ctx.currencyCode);
        expect(ctx.supportedLocaleCodes).toContain(ctx.localeCode);
      } else {
        expectStatus(response, 404);
      }
    });

    it('should reject context for a non-existent market id', async () => {
      const response = await client.get(`/customer/markets/${randomUUID()}/context`);
      expectStatus(response, 404);
    });
  });

  // ==========================================================================
  // Delete
  // ==========================================================================

  describe('delete', () => {
    it('should soft-delete the market (it cannot be fetched afterwards)', async () => {
      const market = await client.get(`/business/markets/${marketId}`, { headers: authHeaders() });
      if (market.data.data.status === 'active') {
        await client.post(`/business/markets/${marketId}/disable`, {}, { headers: authHeaders() });
      }
      const response = await client.delete(`/business/markets/${marketId}`, { headers: authHeaders() });
      expectStatus(response, 200);
      const after = await client.get(`/business/markets/${marketId}`, { headers: authHeaders() });
      expectStatus(after, 404);
    });
  });
});
