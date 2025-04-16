import { AxiosInstance } from 'axios';
import {
  setupCheckoutTests,
  cleanupCheckoutTests,
  testShippingAddress,
  testBillingAddress
} from './testUtils';

describe('Checkout Feature Tests', () => {
  let client: AxiosInstance;
  let adminToken: string;
  let basketId: string;
  let checkoutSessionId: string;
  let shippingMethodId: string;
  let paymentMethodId: string;

  beforeAll(async () => {
    // Use a longer timeout for setup as it creates multiple test entities
    jest.setTimeout(30000);
    
    try {
      const setup = await setupCheckoutTests();
      client = setup.client;
      adminToken = setup.adminToken;
      basketId = setup.basketId;
      checkoutSessionId = setup.checkoutSessionId;
      shippingMethodId = setup.shippingMethodId;
      paymentMethodId = setup.paymentMethodId;
    } catch (error) {
      console.error('Setup failed:', error);
      throw error;
    }
  });

  afterAll(async () => {
    await cleanupCheckoutTests(client, adminToken, {
      checkoutSessionId,
      basketId
    });
  });

  describe('Checkout Session API', () => {
    it('should create a checkout session with camelCase properties', async () => {
      const response = await client.post('/api/checkout/session', {
        basketId
      });
      
      expect(response.status).toBe(201);
      expect(response.data.success).toBe(true);
      
      // Check that the response has camelCase properties
      expect(response.data.data).toHaveProperty('id');
      expect(response.data.data).toHaveProperty('basketId');
      expect(response.data.data).toHaveProperty('status');
      expect(response.data.data).toHaveProperty('subtotal');
      expect(response.data.data).toHaveProperty('taxAmount');
      expect(response.data.data).toHaveProperty('shippingAmount');
      expect(response.data.data).toHaveProperty('discountAmount');
      expect(response.data.data).toHaveProperty('total');
      expect(response.data.data).toHaveProperty('createdAt');
      expect(response.data.data).toHaveProperty('updatedAt');
      
      // Verify no snake_case properties leaked through
      expect(response.data.data).not.toHaveProperty('basket_id');
      expect(response.data.data).not.toHaveProperty('tax_amount');
      expect(response.data.data).not.toHaveProperty('shipping_amount');
      expect(response.data.data).not.toHaveProperty('discount_amount');
      expect(response.data.data).not.toHaveProperty('created_at');
      expect(response.data.data).not.toHaveProperty('updated_at');
    });

    it('should get a checkout session by ID with camelCase properties', async () => {
      const response = await client.get(`/api/checkout/session/${checkoutSessionId}`);
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('id', checkoutSessionId);
      
      // Check that the response has camelCase properties
      expect(response.data.data).toHaveProperty('basketId');
      expect(response.data.data).toHaveProperty('status');
      expect(response.data.data).toHaveProperty('createdAt');
      expect(response.data.data).toHaveProperty('updatedAt');
      
      // Verify no snake_case properties leaked through
      expect(response.data.data).not.toHaveProperty('basket_id');
      expect(response.data.data).not.toHaveProperty('created_at');
      expect(response.data.data).not.toHaveProperty('updated_at');
    });
  });

  describe('Shipping and Billing Address API', () => {
    it('should update shipping address with camelCase properties', async () => {
      const response = await client.put(`/api/checkout/session/${checkoutSessionId}/shipping-address`, testShippingAddress);
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      
      // Verify the address was properly saved
      expect(response.data.data).toHaveProperty('shippingAddress');
      expect(response.data.data.shippingAddress).toHaveProperty('firstName', testShippingAddress.firstName);
      expect(response.data.data.shippingAddress).toHaveProperty('lastName', testShippingAddress.lastName);
      expect(response.data.data.shippingAddress).toHaveProperty('addressLine1', testShippingAddress.addressLine1);
      expect(response.data.data.shippingAddress).toHaveProperty('city', testShippingAddress.city);
      expect(response.data.data.shippingAddress).toHaveProperty('region', testShippingAddress.region);
      expect(response.data.data.shippingAddress).toHaveProperty('postalCode', testShippingAddress.postalCode);
      expect(response.data.data.shippingAddress).toHaveProperty('country', testShippingAddress.country);
      
      // Verify no snake_case properties leaked through
      const shippingAddress = response.data.data.shippingAddress;
      expect(shippingAddress).not.toHaveProperty('first_name');
      expect(shippingAddress).not.toHaveProperty('last_name');
      expect(shippingAddress).not.toHaveProperty('address_line1');
      expect(shippingAddress).not.toHaveProperty('postal_code');
    });

    it('should update billing address with camelCase properties', async () => {
      const response = await client.put(`/api/checkout/session/${checkoutSessionId}/billing-address`, testBillingAddress);
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      
      // Verify the address was properly saved
      expect(response.data.data).toHaveProperty('billingAddress');
      expect(response.data.data.billingAddress).toHaveProperty('firstName', testBillingAddress.firstName);
      expect(response.data.data.billingAddress).toHaveProperty('lastName', testBillingAddress.lastName);
      expect(response.data.data.billingAddress).toHaveProperty('addressLine1', testBillingAddress.addressLine1);
      expect(response.data.data.billingAddress).toHaveProperty('city', testBillingAddress.city);
      
      // Verify no snake_case properties leaked through
      const billingAddress = response.data.data.billingAddress;
      expect(billingAddress).not.toHaveProperty('first_name');
      expect(billingAddress).not.toHaveProperty('last_name');
      expect(billingAddress).not.toHaveProperty('address_line1');
      expect(billingAddress).not.toHaveProperty('postal_code');
    });
  });

  describe('Shipping and Payment Method API', () => {
    it('should get shipping methods with camelCase properties', async () => {
      const response = await client.get('/api/checkout/shipping-methods');
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(Array.isArray(response.data.data)).toBe(true);
      
      if (response.data.data.length > 0) {
        const method = response.data.data[0];
        
        // Check camelCase properties
        expect(method).toHaveProperty('id');
        expect(method).toHaveProperty('name');
        expect(method).toHaveProperty('price');
        expect(method).toHaveProperty('isDefault');
        expect(method).toHaveProperty('isEnabled');
        expect(method).toHaveProperty('estimatedDeliveryTime');
        
        // Verify no snake_case properties
        expect(method).not.toHaveProperty('is_default');
        expect(method).not.toHaveProperty('is_enabled');
        expect(method).not.toHaveProperty('estimated_delivery_time');
      }
    });

    it('should select a shipping method with camelCase properties', async () => {
      const response = await client.put(`/api/checkout/session/${checkoutSessionId}/shipping-method`, {
        shippingMethodId
      });
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      
      // Verify the shipping method was properly set
      expect(response.data.data).toHaveProperty('shippingMethodId', shippingMethodId);
      expect(response.data.data).toHaveProperty('shippingAmount');
      
      // Verify no snake_case properties leaked through
      expect(response.data.data).not.toHaveProperty('shipping_method_id');
      expect(response.data.data).not.toHaveProperty('shipping_amount');
    });

    it('should get payment methods with camelCase properties', async () => {
      const response = await client.get('/api/checkout/payment-methods');
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(Array.isArray(response.data.data)).toBe(true);
      
      if (response.data.data.length > 0) {
        const method = response.data.data[0];
        
        // Check camelCase properties
        expect(method).toHaveProperty('id');
        expect(method).toHaveProperty('name');
        expect(method).toHaveProperty('type');
        expect(method).toHaveProperty('isDefault');
        expect(method).toHaveProperty('isEnabled');
        
        // Verify no snake_case properties
        expect(method).not.toHaveProperty('is_default');
        expect(method).not.toHaveProperty('is_enabled');
      }
    });

    it('should select a payment method with camelCase properties', async () => {
      const response = await client.put(`/api/checkout/session/${checkoutSessionId}/payment-method`, {
        paymentMethodId
      });
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      
      // Verify the payment method was properly set
      expect(response.data.data).toHaveProperty('paymentMethodId', paymentMethodId);
      
      // Verify no snake_case properties leaked through
      expect(response.data.data).not.toHaveProperty('payment_method_id');
    });
  });

  describe('Tax Calculation API', () => {
    it('should calculate taxes with camelCase properties', async () => {
      // First ensure shipping address is set
      await client.put(`/api/checkout/session/${checkoutSessionId}/shipping-address`, testShippingAddress);
      
      const response = await client.get(`/api/checkout/session/${checkoutSessionId}/calculate`);
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      
      // Check calculation properties
      expect(response.data.data).toHaveProperty('subtotal');
      expect(response.data.data).toHaveProperty('taxAmount');
      expect(response.data.data).toHaveProperty('shippingAmount');
      expect(response.data.data).toHaveProperty('discountAmount');
      expect(response.data.data).toHaveProperty('total');
      
      // Verify no snake_case properties leaked through
      expect(response.data.data).not.toHaveProperty('tax_amount');
      expect(response.data.data).not.toHaveProperty('shipping_amount');
      expect(response.data.data).not.toHaveProperty('discount_amount');
    });
  });

  describe('Checkout Validation and Completion', () => {
    it('should validate checkout with camelCase error fields', async () => {
      const response = await client.post(`/api/checkout/session/${checkoutSessionId}/validate`);
      
      // We're not testing for success/failure, just the property naming
      if (!response.data.success) {
        expect(response.data).toHaveProperty('errors');
        
        if (Array.isArray(response.data.errors) && response.data.errors.length > 0) {
          const error = response.data.errors[0];
          expect(error).toHaveProperty('code');
          expect(error).toHaveProperty('message');
          expect(error).toHaveProperty('field');
        }
      }
    });

    it('should abandon checkout with proper response format', async () => {
      const response = await client.post(`/api/checkout/session/${checkoutSessionId}/abandon`);
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data).toHaveProperty('message');
    });
  });
});
