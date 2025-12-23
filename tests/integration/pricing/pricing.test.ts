import { AxiosInstance } from 'axios';
import axios from 'axios';
import {
  cleanupPricingTests,
  createTestPricingRule,
  createTestTierPrice,
  createTestPriceList,
  createTestCurrency,
  createTestCurrencyRegion,
  createTestCurrencyPriceRule,
} from './testUtils';

const createClient = () =>
  axios.create({
    baseURL: process.env.API_URL || 'http://localhost:3000',
    validateStatus: () => true,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'X-Test-Request': 'true',
    },
  });

describe('Pricing Feature Tests', () => {
  let client: AxiosInstance;
  let adminToken: string;
  const createdResources = {
    ruleIds: [] as string[],
    tierIds: [] as string[],
    priceListIds: [] as string[],
    currencyCodes: [] as string[],
    regionIds: [] as string[],
    priceRuleIds: [] as string[],
  };

  beforeAll(async () => {
    jest.setTimeout(30000);
    client = createClient();

    try {
      const loginResponse = await client.post(
        '/business/auth/login',
        {
          email: 'merchant@example.com',
          password: 'password123',
        },
        { headers: { 'X-Test-Request': 'true' } },
      );

      adminToken = loginResponse.data?.accessToken || '';
    } catch (error) {
      console.log('Warning: Login failed for pricing tests:', error instanceof Error ? error.message : String(error));
    }
  });

  afterAll(async () => {
    await cleanupPricingTests(client, adminToken, createdResources);
  });

  // ============================================================================
  // Pricing Rules Tests (UC-PRC-001 to UC-PRC-005)
  // ============================================================================

  describe('Pricing Rules', () => {
    let testRuleId: string;

    it('UC-PRC-003: should create a pricing rule', async () => {
      const ruleData = createTestPricingRule();

      const response = await client.post('/business/pricing/rules', ruleData, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(response.status).toBe(201);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('pricingRuleId');
      expect(response.data.data).toHaveProperty('name', ruleData.name);
      expect(response.data.data).toHaveProperty('ruleType');

      testRuleId = response.data.data.pricingRuleId;
      createdResources.ruleIds.push(testRuleId);
    });

    it('UC-PRC-001: should list pricing rules', async () => {
      const response = await client.get('/business/pricing/rules', {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('rules');
      expect(Array.isArray(response.data.data.rules)).toBe(true);
    });

    it('UC-PRC-002: should get a specific pricing rule', async () => {
      const response = await client.get(`/business/pricing/rules/${testRuleId}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('pricingRuleId', testRuleId);
    });

    it('UC-PRC-004: should update a pricing rule', async () => {
      // Create a rule to update
      const createResponse = await client.post('/business/pricing/rules', createTestPricingRule(), {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      const ruleId = createResponse.data.data.pricingRuleId;

      const updateData = {
        name: 'Updated Rule Name',
      };

      const response = await client.put(`/business/pricing/rules/${ruleId}`, updateData, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('name', 'Updated Rule Name');
    });

    it('UC-PRC-005: should delete a pricing rule', async () => {
      // Create a rule to delete
      const createResponse = await client.post('/business/pricing/rules', createTestPricingRule(), {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      const ruleId = createResponse.data.data.pricingRuleId;

      const response = await client.delete(`/business/pricing/rules/${ruleId}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
    });

    it('should create pricing rule with conditions', async () => {
      const ruleData = createTestPricingRule({
        conditions: [
          { type: 'min_quantity', parameters: { value: 5 } },
          { type: 'max_quantity', parameters: { value: 100 } },
        ],
      });

      const response = await client.post('/business/pricing/rules', ruleData, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(response.status).toBe(201);
      expect(response.data.data).toHaveProperty('pricingRuleId');
      createdResources.ruleIds.push(response.data.data.pricingRuleId);
    });
  });

  // ============================================================================
  // Tier Pricing Tests (UC-PRC-006 to UC-PRC-010)
  // ============================================================================

  describe('Tier Pricing', () => {
    let testTierId: string;
    const testProductId = '00000000-0000-0000-0000-000000000001';

    it('UC-PRC-008: should create a tier price', async () => {
      const tierData = createTestTierPrice(testProductId);

      const response = await client.post('/business/pricing/tier-prices', tierData, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(response.status).toBe(201);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('tierPriceId');
      expect(response.data.data).toHaveProperty('productId', testProductId);
      expect(response.data.data).toHaveProperty('quantityMin', 10);

      testTierId = response.data.data.tierPriceId;
      createdResources.tierIds.push(testTierId);
    });

    it('UC-PRC-006: should list tier prices', async () => {
      const response = await client.get('/business/pricing/tier-prices', {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(Array.isArray(response.data.data)).toBe(true);
    });

    it('UC-PRC-007: should get a specific tier price', async () => {
      const response = await client.get(`/business/pricing/tier-prices/${testTierId}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('tierPriceId', testTierId);
    });

    it('UC-PRC-009: should update a tier price', async () => {
      // Create a tier price to update using seeded product
      const createResponse = await client.post(
        '/business/pricing/tier-prices',
        createTestTierPrice('00000000-0000-0000-0000-000000000003'),
        {
          headers: { Authorization: `Bearer ${adminToken}` },
        },
      );
      expect(createResponse.status).toBe(201);
      const tierId = createResponse.data.data.tierPriceId;

      const updateData = {
        quantityMin: 20,
        price: 8.99,
      };

      const response = await client.put(`/business/pricing/tier-prices/${tierId}`, updateData, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('quantityMin', 20);
    });

    it('UC-PRC-010: should delete a tier price', async () => {
      // Create a tier to delete
      const createResponse = await client.post(
        '/business/pricing/tier-prices',
        createTestTierPrice('00000000-0000-0000-0000-000000000002'),
        {
          headers: { Authorization: `Bearer ${adminToken}` },
        },
      );
      const tierId = createResponse.data.data.tierPriceId;

      const response = await client.delete(`/business/pricing/tier-prices/${tierId}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
    });
  });

  // ============================================================================
  // Price Lists Tests (UC-PRC-011 to UC-PRC-016)
  // ============================================================================

  describe('Price Lists', () => {
    let testPriceListId: string;

    it('UC-PRC-013: should create a price list', async () => {
      const priceListData = createTestPriceList();

      const response = await client.post('/business/pricing/price-lists', priceListData, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(response.status).toBe(201);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('priceListId');
      expect(response.data.data).toHaveProperty('name', priceListData.name);

      testPriceListId = response.data.data.priceListId;
      createdResources.priceListIds.push(testPriceListId);
    });

    it('UC-PRC-011: should list price lists', async () => {
      const response = await client.get('/business/pricing/price-lists', {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(Array.isArray(response.data.data)).toBe(true);
    });

    it('UC-PRC-012: should get a specific price list', async () => {
      const response = await client.get(`/business/pricing/price-lists/${testPriceListId}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('priceListId', testPriceListId);
    });

    it('UC-PRC-014: should update a price list', async () => {
      const updateData = {
        name: 'Updated Price List',
        priority: 5,
      };

      const response = await client.put(`/business/pricing/price-lists/${testPriceListId}`, updateData, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('name', 'Updated Price List');
    });

    it('UC-PRC-016: should add a price to a price list', async () => {
      // Uses seeded product ID
      const priceData = {
        productId: '00000000-0000-0000-0000-000000000001',
        adjustmentType: 'fixed',
        adjustmentValue: 49.99,
      };

      const response = await client.post(`/business/pricing/price-lists/${testPriceListId}/prices`, priceData, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(response.status).toBe(201);
      expect(response.data.success).toBe(true);
    });

    it('UC-PRC-015: should delete a price list', async () => {
      // Create a price list to delete
      const createResponse = await client.post('/business/pricing/price-lists', createTestPriceList(), {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      const priceListId = createResponse.data.data.priceListId;

      const response = await client.delete(`/business/pricing/price-lists/${priceListId}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
    });
  });

  // ============================================================================
  // Currency Management Tests (UC-PRC-017 to UC-PRC-021)
  // ============================================================================

  describe('Currency Management', () => {
    const testCurrencyCode = 'XTS'; // Test currency code

    it('UC-PRC-019: should save/create a currency', async () => {
      const currencyData = createTestCurrency({ code: testCurrencyCode });

      const response = await client.post('/business/pricing/currencies', currencyData, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(response.status).toBe(201);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('code', testCurrencyCode);

      createdResources.currencyCodes.push(testCurrencyCode);
    });

    it('UC-PRC-017: should list currencies', async () => {
      const response = await client.get('/business/pricing/currencies', {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(Array.isArray(response.data.data)).toBe(true);
    });

    it('UC-PRC-018: should get a specific currency', async () => {
      const response = await client.get(`/business/pricing/currencies/${testCurrencyCode}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('code', testCurrencyCode);
    });

    it('UC-PRC-021: should update exchange rates', async () => {
      const response = await client.post(
        '/business/pricing/currencies/update-exchange-rates',
        { source: 'manual' },
        {
          headers: { Authorization: `Bearer ${adminToken}` },
        },
      );

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
    });

    it('UC-PRC-020: should delete a currency', async () => {
      // Create a currency to delete
      const currencyCode = 'XTD';
      await client.post('/business/pricing/currencies', createTestCurrency({ code: currencyCode }), {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      const response = await client.delete(`/business/pricing/currencies/${currencyCode}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
    });
  });

  // ============================================================================
  // Currency Regions Tests (UC-PRC-022 to UC-PRC-025)
  // ============================================================================

  describe('Currency Regions', () => {
    let testRegionId: string;

    it('UC-PRC-023: should create a currency region', async () => {
      const regionData = createTestCurrencyRegion();

      const response = await client.post('/business/pricing/currency-regions', regionData, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(response.status).toBe(201);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('currencyRegionId');
      expect(response.data.data).toHaveProperty('name', regionData.name);

      testRegionId = response.data.data.currencyRegionId;
      createdResources.regionIds.push(testRegionId);
    });

    it('UC-PRC-022: should list currency regions', async () => {
      const response = await client.get('/business/pricing/currency-regions', {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(Array.isArray(response.data.data)).toBe(true);
    });

    it('should get a specific currency region', async () => {
      const response = await client.get(`/business/pricing/currency-regions/${testRegionId}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('currencyRegionId', testRegionId);
    });

    it('UC-PRC-024: should update a currency region', async () => {
      const updateData = {
        name: 'Updated Region',
        countries: ['ZZ'],
      };

      const response = await client.put(`/business/pricing/currency-regions/${testRegionId}`, updateData, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
    });

    it('UC-PRC-025: should delete a currency region', async () => {
      // Create a region to delete
      const createResponse = await client.post('/business/pricing/currency-regions', createTestCurrencyRegion(), {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      const regionId = createResponse.data.data.currencyRegionId;

      const response = await client.delete(`/business/pricing/currency-regions/${regionId}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
    });
  });

  // ============================================================================
  // Currency Price Rules Tests (UC-PRC-026 to UC-PRC-029)
  // ============================================================================

  describe('Currency Price Rules', () => {
    let testPriceRuleId: string;

    it('UC-PRC-027: should create a currency price rule', async () => {
      const ruleData = createTestCurrencyPriceRule();

      const response = await client.post('/business/pricing/currency-price-rules', ruleData, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(response.status).toBe(201);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('pricingRuleId');
      expect(response.data.data).toHaveProperty('currencyCode', 'USD');

      testPriceRuleId = response.data.data.pricingRuleId;
      createdResources.priceRuleIds.push(testPriceRuleId);
    });

    it('UC-PRC-026: should list currency price rules', async () => {
      const response = await client.get('/business/pricing/currency-price-rules', {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(Array.isArray(response.data.data)).toBe(true);
    });

    it('should get a specific currency price rule', async () => {
      // Create a rule to get
      const createResponse = await client.post(
        '/business/pricing/currency-price-rules',
        createTestCurrencyPriceRule({ currencyCode: 'EUR' }),
        {
          headers: { Authorization: `Bearer ${adminToken}` },
        },
      );
      expect(createResponse.status).toBe(201);
      const ruleId = createResponse.data.data.pricingRuleId;

      const response = await client.get(`/business/pricing/currency-price-rules/${ruleId}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('pricingRuleId', ruleId);
    });

    it('UC-PRC-028: should update a currency price rule', async () => {
      // Create a rule to update
      const createResponse = await client.post(
        '/business/pricing/currency-price-rules',
        createTestCurrencyPriceRule({ currencyCode: 'CAD' }),
        {
          headers: { Authorization: `Bearer ${adminToken}` },
        },
      );
      expect(createResponse.status).toBe(201);
      const ruleId = createResponse.data.data.pricingRuleId;

      const updateData = {
        name: 'Updated Currency Price Rule',
      };

      const response = await client.put(`/business/pricing/currency-price-rules/${ruleId}`, updateData, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
    });

    it('UC-PRC-029: should delete a currency price rule', async () => {
      // Create a rule to delete
      const createResponse = await client.post(
        '/business/pricing/currency-price-rules',
        createTestCurrencyPriceRule({ currencyCode: 'GBP' }),
        {
          headers: { Authorization: `Bearer ${adminToken}` },
        },
      );
      const ruleId = createResponse.data.data.pricingRuleId;

      const response = await client.delete(`/business/pricing/currency-price-rules/${ruleId}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
    });
  });

  // ============================================================================
  // Authorization Tests
  // ============================================================================

  describe('Authorization', () => {
    it('should require authentication for pricing rules', async () => {
      const response = await client.get('/business/pricing/rules');
      expect(response.status).toBe(401);
    });

    it('should require authentication for currencies', async () => {
      const response = await client.get('/business/pricing/currencies');
      expect(response.status).toBe(401);
    });

    it('should reject invalid tokens', async () => {
      const response = await client.get('/business/pricing/rules', {
        headers: { Authorization: 'Bearer invalid-token' },
      });
      // Auth middleware returns 401 for invalid tokens (per HTTP standard)
      expect(response.status).toBe(401);
    });
  });
});
