import { AxiosInstance } from 'axios';
import {
  setupCurrencyTests,
  cleanupCurrencyTests,
  testCurrency,
  testCurrencyRegion,
  testPriceRule
} from './testUtils';

describe('Currency Feature Tests', () => {
  let client: AxiosInstance;
  let adminToken: string;
  let testCurrencyCode: string;
  let testCurrencyRegionId: string;
  let testCurrencyRegionCode: string;
  let testPriceRuleId: string;

  beforeAll(async () => {
    // Use a longer timeout for setup as it creates multiple test entities
    jest.setTimeout(30000);
    
    try {
      const setup = await setupCurrencyTests();
      client = setup.client;
      adminToken = setup.adminToken;
      testCurrencyCode = setup.testCurrencyCode;
      testCurrencyRegionId = setup.testCurrencyRegionId;
      testCurrencyRegionCode = setup.testCurrencyRegionCode;
      testPriceRuleId = setup.testPriceRuleId;
    } catch (error) {
      console.error('Setup failed:', error);
      throw error;
    }
  });

  afterAll(async () => {
    await cleanupCurrencyTests(client, adminToken, {
      testCurrencyCode,
      testCurrencyRegionCode,
      testPriceRuleId
    });
  });

  describe('Currency API', () => {
    it('should get currency by code with camelCase properties', async () => {
      const response = await client.get(`/business/currencies/${testCurrencyCode}`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('code', testCurrencyCode);
      
      // Verify properties from TypeScript interface are in camelCase
      expect(response.data.data).toHaveProperty('symbol', testCurrency.symbol);
      expect(response.data.data).toHaveProperty('decimals', testCurrency.decimals);
      expect(response.data.data).toHaveProperty('isDefault', testCurrency.isDefault);
      expect(response.data.data).toHaveProperty('isActive', testCurrency.isActive);
      expect(response.data.data).toHaveProperty('position', testCurrency.position);
      expect(response.data.data).toHaveProperty('thousandsSeparator', testCurrency.thousandsSeparator);
      expect(response.data.data).toHaveProperty('decimalSeparator', testCurrency.decimalSeparator);
      
      // Make sure no snake_case properties leaked through
      expect(response.data.data).not.toHaveProperty('decimal_places');
      expect(response.data.data).not.toHaveProperty('is_default');
      expect(response.data.data).not.toHaveProperty('is_active');
      expect(response.data.data).not.toHaveProperty('symbol_position');
      expect(response.data.data).not.toHaveProperty('thousands_separator');
      expect(response.data.data).not.toHaveProperty('decimal_separator');
    });

    it('should update a currency with camelCase properties', async () => {
      const updateData = {
        name: 'Updated Test Currency',
        symbol: '₸',
        decimals: 3,
        exchangeRate: 1.5
      };
      
      const response = await client.put(`/business/currencies/${testCurrencyCode}`, updateData, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      
      // Verify the update worked
      expect(response.data.data).toHaveProperty('name', updateData.name);
      expect(response.data.data).toHaveProperty('symbol', updateData.symbol);
      expect(response.data.data).toHaveProperty('decimals', updateData.decimals);
      expect(response.data.data).toHaveProperty('exchangeRate', updateData.exchangeRate);
      
      // Verify that non-updated fields are preserved
      expect(response.data.data).toHaveProperty('code', testCurrencyCode);
      expect(response.data.data).toHaveProperty('isActive', testCurrency.isActive);
      
      // Verify response is using camelCase
      expect(response.data.data).not.toHaveProperty('decimal_places');
      expect(response.data.data).not.toHaveProperty('exchange_rate');
    });

    it('should list all currencies with camelCase properties', async () => {
      const response = await client.get('/business/currencies', {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(Array.isArray(response.data.data)).toBe(true);
      
      // Find our test currency in the results
      const currency = response.data.data.find((c: any) => c.code === testCurrencyCode);
      expect(currency).toBeDefined();
      
      if (currency) {
        // Verify properties use camelCase
        expect(currency).toHaveProperty('name');
        expect(currency).toHaveProperty('symbol');
        expect(currency).toHaveProperty('decimals');
        expect(currency).toHaveProperty('isDefault');
        expect(currency).toHaveProperty('isActive');
        
        expect(currency).not.toHaveProperty('decimal_places');
        expect(currency).not.toHaveProperty('is_default');
        expect(currency).not.toHaveProperty('is_active');
      }
    });

    it('should get default currency with camelCase properties', async () => {
      const response = await client.get('/api/default-currency');
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      
      const currency = response.data.data;
      
      // Verify properties use camelCase
      expect(currency).toHaveProperty('code');
      expect(currency).toHaveProperty('name');
      expect(currency).toHaveProperty('symbol');
      expect(currency).toHaveProperty('decimals');
      expect(currency).toHaveProperty('isDefault', true);
      
      expect(currency).not.toHaveProperty('decimal_places');
      expect(currency).not.toHaveProperty('is_default');
    });
  });

  describe('Currency Region API', () => {
    it('should get currency region by code with camelCase properties', async () => {
      const response = await client.get(`/business/currency-regions/${testCurrencyRegionCode}`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('regionCode', testCurrencyRegionCode);
      
      // Verify properties from TypeScript interface are in camelCase
      expect(response.data.data).toHaveProperty('regionName', testCurrencyRegion.regionName);
      expect(response.data.data).toHaveProperty('currencyCode', testCurrencyCode);
      expect(response.data.data).toHaveProperty('isActive', testCurrencyRegion.isActive);
      
      // Make sure no snake_case properties leaked through
      expect(response.data.data).not.toHaveProperty('region_code');
      expect(response.data.data).not.toHaveProperty('region_name');
      expect(response.data.data).not.toHaveProperty('currency_code');
      expect(response.data.data).not.toHaveProperty('is_active');
    });

    it('should list currency regions with camelCase properties', async () => {
      const response = await client.get('/business/currency-regions', {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(Array.isArray(response.data.data)).toBe(true);
      
      // Find our test region in the results
      const region = response.data.data.find((r: any) => r.regionCode === testCurrencyRegionCode);
      expect(region).toBeDefined();
      
      if (region) {
        // Verify properties use camelCase
        expect(region).toHaveProperty('regionName');
        expect(region).toHaveProperty('currencyCode');
        expect(region).toHaveProperty('isActive');
        expect(region).toHaveProperty('createdAt');
        expect(region).toHaveProperty('updatedAt');
        
        expect(region).not.toHaveProperty('region_name');
        expect(region).not.toHaveProperty('currency_code');
        expect(region).not.toHaveProperty('is_active');
        expect(region).not.toHaveProperty('created_at');
        expect(region).not.toHaveProperty('updated_at');
      }
    });

    it('should get currency for region with camelCase properties', async () => {
      const response = await client.get(`/api/regions/${testCurrencyRegionCode}/currency`);
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      
      const currency = response.data.data;
      
      // Verify properties use camelCase 
      expect(currency).toHaveProperty('code', testCurrencyCode);
      expect(currency).toHaveProperty('name');
      expect(currency).toHaveProperty('symbol');
      expect(currency).toHaveProperty('decimals');
      expect(currency).toHaveProperty('isActive');
      
      expect(currency).not.toHaveProperty('decimal_places');
      expect(currency).not.toHaveProperty('is_active');
    });
  });

  describe('Price Rule API', () => {
    it('should get price rule by ID with camelCase properties', async () => {
      const response = await client.get(`/business/currency-price-rules/${testPriceRuleId}`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('id', testPriceRuleId);
      
      // Verify properties from TypeScript interface are in camelCase
      expect(response.data.data).toHaveProperty('name', testPriceRule.name);
      expect(response.data.data).toHaveProperty('description', testPriceRule.description);
      expect(response.data.data).toHaveProperty('type', testPriceRule.type);
      expect(response.data.data).toHaveProperty('value', testPriceRule.value);
      expect(response.data.data).toHaveProperty('currencyCode', testCurrencyCode);
      expect(response.data.data).toHaveProperty('priority', testPriceRule.priority);
      expect(response.data.data).toHaveProperty('isActive', testPriceRule.isActive);
      
      // Make sure no snake_case properties leaked through
      expect(response.data.data).not.toHaveProperty('currency_code');
      expect(response.data.data).not.toHaveProperty('is_active');
      expect(response.data.data).not.toHaveProperty('min_order_value');
      expect(response.data.data).not.toHaveProperty('max_order_value');
    });

    it('should list price rules with camelCase properties', async () => {
      const response = await client.get('/business/currency-price-rules', {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(Array.isArray(response.data.data)).toBe(true);
      
      // Find our test rule in the results
      const rule = response.data.data.find((r: any) => r.id === testPriceRuleId);
      expect(rule).toBeDefined();
      
      if (rule) {
        // Verify properties use camelCase
        expect(rule).toHaveProperty('name');
        expect(rule).toHaveProperty('description');
        expect(rule).toHaveProperty('type');
        expect(rule).toHaveProperty('value');
        expect(rule).toHaveProperty('currencyCode');
        expect(rule).toHaveProperty('priority');
        expect(rule).toHaveProperty('isActive');
        expect(rule).toHaveProperty('createdAt');
        expect(rule).toHaveProperty('updatedAt');
        
        expect(rule).not.toHaveProperty('currency_code');
        expect(rule).not.toHaveProperty('is_active');
        expect(rule).not.toHaveProperty('created_at');
        expect(rule).not.toHaveProperty('updated_at');
      }
    });
  });

  describe('Currency Conversion Functionality', () => {
    it('should convert price with camelCase properties in request and response', async () => {
      const convertRequest = {
        amount: 100,
        fromCurrency: 'USD',
        toCurrency: testCurrencyCode
      };
      
      const response = await client.post('/api/convert', convertRequest);
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      
      const result = response.data.data;
      
      // Verify properties use camelCase
      expect(result).toHaveProperty('originalAmount');
      expect(result).toHaveProperty('convertedAmount');
      expect(result).toHaveProperty('fromCurrency');
      expect(result).toHaveProperty('toCurrency');
      expect(result).toHaveProperty('exchangeRate');
      
      expect(result).not.toHaveProperty('original_amount');
      expect(result).not.toHaveProperty('converted_amount');
      expect(result).not.toHaveProperty('from_currency');
      expect(result).not.toHaveProperty('to_currency');
      expect(result).not.toHaveProperty('exchange_rate');
    });
  });
});
