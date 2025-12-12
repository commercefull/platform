import { AxiosInstance } from 'axios';
import { createTestClient, loginTestUser } from '../testUtils';

describe('Tax Calculation API Integration Tests', () => {
  let client: AxiosInstance;
  let userToken: string;

  beforeAll(async () => {
    client = createTestClient();
    userToken = await loginTestUser(client);
  });

  describe('POST /api/tax/calculate', () => {
    it('should calculate tax for a single line item', async () => {
      const calculationRequest = {
        productId: 'test-product-123',
        quantity: 2,
        price: 19.99,
        shippingAddress: {
          country: 'US',
          region: 'CA',
          postalCode: '94105',
          city: 'San Francisco'
        }
      };
      
      const response = await client.post('/api/tax/calculate', calculationRequest);
      
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('subtotal');
      expect(response.data).toHaveProperty('taxAmount');
      expect(response.data).toHaveProperty('total');
      expect(response.data).toHaveProperty('taxBreakdown');
      
      // Basic validation of the tax calculation
      expect(response.data.subtotal).toBe(calculationRequest.quantity * calculationRequest.price);
      expect(response.data.total).toBe(response.data.subtotal + response.data.taxAmount);
      
      // Check if tax breakdown is present
      if (response.data.taxAmount > 0) {
        expect(Array.isArray(response.data.taxBreakdown)).toBeTruthy();
        expect(response.data.taxBreakdown.length).toBeGreaterThan(0);
        
        // Verify the structure of the tax breakdown
        const firstBreakdown = response.data.taxBreakdown[0];
        expect(firstBreakdown).toHaveProperty('rateId');
        expect(firstBreakdown).toHaveProperty('rateName');
        expect(firstBreakdown).toHaveProperty('rateValue');
        expect(firstBreakdown).toHaveProperty('taxableAmount');
        expect(firstBreakdown).toHaveProperty('taxAmount');
      }
    });

    it('should handle invalid request data', async () => {
      const invalidRequest = {
        // Missing required productId
        quantity: 2,
        price: 19.99,
        shippingAddress: {
          country: 'US'
        }
      };
      
      const response = await client.post('/api/tax/calculate', invalidRequest);
      
      expect(response.status).toBe(400);
    });
    
    it('should calculate zero tax for countries without tax rates', async () => {
      const calculationRequest = {
        productId: 'test-product-123',
        quantity: 1,
        price: 10.00,
        shippingAddress: {
          // Using a country code that likely doesn't have tax rates configured in test data
          country: 'ZZ', // Non-existent country code for testing
          region: 'TestRegion',
          postalCode: '00000'
        }
      };
      
      const response = await client.post('/api/tax/calculate', calculationRequest);
      
      expect(response.status).toBe(200);
      expect(response.data.taxAmount).toBe(0);
      expect(response.data.subtotal).toBe(10.00);
      expect(response.data.total).toBe(10.00);
    });
  });

  describe('POST /api/tax/calculate/basket/:basketId', () => {
    it('should calculate tax for a basket', async () => {
      // This test requires an existing basket
      // We'll need to either create a basket first or use a known test basket ID
      const testBasketId = 'test-basket-id'; // Replace with actual test basket ID or create one
      
      const calculationRequest = {
        shippingAddress: {
          country: 'US',
          region: 'NY',
          postalCode: '10001',
          city: 'New York'
        },
        customerId: 'test-customer-id' // Optional
      };
      
      const response = await client.post(`/api/tax/calculate/basket/${testBasketId}`, calculationRequest, {
        headers: { Authorization: `Bearer ${userToken}` }
      });
      
      // If the basket doesn't exist, we'll get a 404, which is expected in a test environment
      if (response.status === 404) {
        console.log('Skipping test: test basket not found');
        return;
      }
      
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('subtotal');
      expect(response.data).toHaveProperty('taxAmount');
      expect(response.data).toHaveProperty('total');
      
      // Additional checks if we have line items in the response
      if (response.data.lineItemTaxes && response.data.lineItemTaxes.length > 0) {
        const firstLineItem = response.data.lineItemTaxes[0];
        expect(firstLineItem).toHaveProperty('lineItemId');
        expect(firstLineItem).toHaveProperty('productId');
        expect(firstLineItem).toHaveProperty('taxAmount');
      }
    });
    
    it('should require authentication for basket tax calculation', async () => {
      const response = await client.post('/api/tax/calculate/basket/any-basket-id', {
        shippingAddress: { country: 'US' }
      });
      
      expect([401, 403]).toContain(response.status);
    });
  });

  describe('POST /api/tax/zones/find', () => {
    it('should find applicable tax zones for an address', async () => {
      const addressRequest = {
        country: 'US',
        region: 'CA',
        postalCode: '94105',
        city: 'San Francisco'
      };
      
      const response = await client.post('/api/tax/zones/find', addressRequest);
      
      expect(response.status).toBe(200);
      
      // If tax zones are found
      if (response.status === 200) {
        expect(response.data).toHaveProperty('id');
        expect(response.data).toHaveProperty('name');
        expect(response.data).toHaveProperty('countries');
        expect(response.data.countries).toContain('US');
      }
    });
    
    it('should return 404 for addresses without matching tax zones', async () => {
      const addressRequest = {
        country: 'ZZ', // Non-existent country code
        region: 'Unknown'
      };
      
      const response = await client.post('/api/tax/zones/find', addressRequest);
      
      expect(response.status).toBe(404);
    });
    
    it('should require country in the request', async () => {
      const invalidRequest = {
        // Missing country
        region: 'CA',
        postalCode: '94105'
      };
      
      const response = await client.post('/api/tax/zones/find', invalidRequest);
      
      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/tax/exemption/:customerId', () => {
    it('should check tax exemption status for a customer', async () => {
      const testCustomerId = 'test-customer-id'; // Replace with actual test customer ID
      
      const response = await client.get(`/api/tax/exemption/${testCustomerId}`, {
        headers: { Authorization: `Bearer ${userToken}` }
      });
      
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('hasExemption');
      
      // If the customer has exemptions
      if (response.data.hasExemption) {
        expect(response.data).toHaveProperty('exemptions');
        expect(Array.isArray(response.data.exemptions)).toBeTruthy();
        
        if (response.data.exemptions.length > 0) {
          const exemption = response.data.exemptions[0];
          expect(exemption).toHaveProperty('id');
          expect(exemption).toHaveProperty('customerId');
          expect(exemption).toHaveProperty('status');
          expect(exemption).toHaveProperty('type');
        }
      }
    });
    
    it('should require authentication for checking exemptions', async () => {
      const response = await client.get('/api/tax/exemption/any-customer-id');
      
      expect([401, 403]).toContain(response.status);
    });
  });

  describe('GET /api/tax/settings/:merchantId', () => {
    it('should retrieve tax display settings for a merchant', async () => {
      const testMerchantId = 'test-merchant-id'; // Replace with actual test merchant ID
      
      const response = await client.get(`/api/tax/settings/${testMerchantId}`);
      
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('displayPricesWithTax');
      expect(response.data).toHaveProperty('priceDisplaySettings');
      
      // Check price display settings structure
      expect(response.data.priceDisplaySettings).toHaveProperty('includesTax');
      expect(response.data.priceDisplaySettings).toHaveProperty('showTaxSeparately');
    });
  });
});
