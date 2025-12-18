import { AxiosInstance } from 'axios';

// Create axios client for tests
const createClient = () => require('axios').create({
  baseURL: process.env.API_URL || 'http://localhost:3000',
  validateStatus: () => true,
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  }
});

describe('Currency Feature Tests', () => {
  let client: AxiosInstance;
  let adminToken: string;
  let testCurrencyCode: string;

  beforeAll(async () => {
    jest.setTimeout(30000);
    client = createClient();
    
    // Use a fixed currency code that should exist from seeds
    testCurrencyCode = 'USD';
    
    // Get admin token
    try {
      const loginResponse = await client.post('/business/auth/login', {
        email: 'merchant@example.com',
        password: 'password123'
      }, { headers: { 'X-Test-Request': 'true' } });
      
      adminToken = loginResponse.data?.accessToken || '';
    } catch (error) {
      console.log('Warning: Login failed for currency tests:', error instanceof Error ? error.message : String(error));
    }
  });

  describe('Currency API', () => {
    it('should get currency by code with camelCase properties', async () => {
      const response = await client.get(`/business/pricing/currencies/${testCurrencyCode}`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('code', testCurrencyCode);
      
      // Verify properties from TypeScript interface are in camelCase
      expect(response.data.data).toHaveProperty('symbol');
      expect(response.data.data).toHaveProperty('decimalPlaces');
      expect(response.data.data).toHaveProperty('isDefault');
      expect(response.data.data).toHaveProperty('isActive');
      expect(response.data.data).toHaveProperty('symbolPosition');
      expect(response.data.data).toHaveProperty('thousandsSeparator');
      expect(response.data.data).toHaveProperty('decimalSeparator');
      
      // Make sure no snake_case properties leaked through
      expect(response.data.data).not.toHaveProperty('decimal_places');
      expect(response.data.data).not.toHaveProperty('is_default');
      expect(response.data.data).not.toHaveProperty('is_active');
      expect(response.data.data).not.toHaveProperty('symbol_position');
      expect(response.data.data).not.toHaveProperty('thousands_separator');
      expect(response.data.data).not.toHaveProperty('decimal_separator');
    });

    it('should list all currencies with camelCase properties', async () => {
      const response = await client.get('/business/pricing/currencies', {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(Array.isArray(response.data.data)).toBe(true);
      
      // Check that we have at least one currency
      expect(response.data.data.length).toBeGreaterThan(0);
      
      // Verify properties use camelCase on the first currency
      const currency = response.data.data[0];
      expect(currency).toHaveProperty('code');
      expect(currency).toHaveProperty('name');
      expect(currency).toHaveProperty('symbol');
      expect(currency).toHaveProperty('decimalPlaces');
      
      expect(currency).not.toHaveProperty('decimal_places');
      expect(currency).not.toHaveProperty('is_active');
    });

    it('should get default currency with camelCase properties', async () => {
      const response = await client.get('/business/pricing/currencies/default', {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      
      const currency = response.data.data;
      
      // Verify properties use camelCase
      expect(currency).toHaveProperty('code');
      expect(currency).toHaveProperty('name');
      expect(currency).toHaveProperty('symbol');
      expect(currency).toHaveProperty('decimalPlaces');
      expect(currency).toHaveProperty('isDefault', true);
      
      expect(currency).not.toHaveProperty('decimal_places');
      expect(currency).not.toHaveProperty('is_default');
    });
  });
});
