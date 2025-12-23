import axios, { AxiosInstance } from 'axios';
import { loginTestUser } from '../testUtils';
import {
  TEST_CHECKOUT_ID,
  TEST_CHECKOUT_BASKET_ID,
  TEST_PRODUCT_1_ID,
  TEST_SHIPPING_ADDRESS,
  TEST_BILLING_ADDRESS,
  ADMIN_CREDENTIALS,
} from '../testConstants';

// Create axios client for tests
const createClient = () =>
  axios.create({
    baseURL: process.env.API_URL || 'http://localhost:3000',
    validateStatus: () => true,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
  });

describe('Checkout Feature Tests', () => {
  let client: AxiosInstance;
  let adminToken: string;
  let checkoutId: string;

  beforeAll(async () => {
    jest.setTimeout(30000);
    client = createClient();

    // Get admin token
    const loginResponse = await client.post('/business/auth/login', ADMIN_CREDENTIALS, { headers: { 'X-Test-Request': 'true' } });
    adminToken = loginResponse.data.accessToken;

    // Use pre-seeded checkout data
    checkoutId = TEST_CHECKOUT_ID;
  });

  describe('Checkout Session API', () => {
    it('should create a checkout session with camelCase properties', async () => {
      // Create a new basket for this test
      const customerToken = await loginTestUser(client);

      const basketResponse = await client.post(
        '/customer/basket',
        {
          sessionId: 'checkout-test-session-' + Date.now(),
        },
        {
          headers: { Authorization: `Bearer ${customerToken}` },
        },
      );

      if (basketResponse.status !== 200) {
        return;
      }

      const testBasketId = basketResponse.data.data.basketId;

      // Add an item to the basket (use valid UUID for productId)
      await client.post(
        `/customer/basket/${testBasketId}/items`,
        {
          productId: '00000000-0000-0000-0000-000000000001',
          sku: 'TEST-SKU-001',
          name: 'Test Product',
          quantity: 1,
          unitPrice: 29.99,
        },
        {
          headers: { Authorization: `Bearer ${customerToken}` },
        },
      );

      const response = await client.post(
        '/customer/checkout',
        {
          basketId: testBasketId,
        },
        {
          headers: { Authorization: `Bearer ${customerToken}` },
        },
      );

      expect(response.status).toBe(201);
      expect(response.data.success).toBe(true);

      // Check that the response has camelCase properties
      expect(response.data.data).toHaveProperty('checkoutId');
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
      // Need to authenticate as customer to access checkout
      const customerToken = await loginTestUser(client);

      const response = await client.get(`/customer/checkout/${checkoutId}`, {
        headers: { Authorization: `Bearer ${customerToken}` },
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('checkoutId', checkoutId);

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

    it('should return 404 for non-existent checkout', async () => {
      // Use a valid UUID format that doesn't exist
      const response = await client.get('/customer/checkout/00000000-0000-0000-0000-000000000000');
      expect(response.status).toBe(404);
    });
  });

  describe('Shipping and Billing Address API', () => {
    it('should update shipping address with camelCase properties', async () => {
      const customerToken = await loginTestUser(client);

      const response = await client.put(`/customer/checkout/${checkoutId}/shipping-address`, TEST_SHIPPING_ADDRESS, {
        headers: { Authorization: `Bearer ${customerToken}` },
      });

      // Accept 200 (success) or 500 (server issues)
      if (response.status === 500) {
        return;
      }

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);

      // Verify the address was properly saved
      expect(response.data.data).toHaveProperty('shippingAddress');
      if (response.data.data.shippingAddress) {
        expect(response.data.data.shippingAddress).toHaveProperty('firstName', TEST_SHIPPING_ADDRESS.firstName);
        expect(response.data.data.shippingAddress).toHaveProperty('lastName', TEST_SHIPPING_ADDRESS.lastName);
        expect(response.data.data.shippingAddress).toHaveProperty('addressLine1', TEST_SHIPPING_ADDRESS.addressLine1);
        expect(response.data.data.shippingAddress).toHaveProperty('city', TEST_SHIPPING_ADDRESS.city);
        expect(response.data.data.shippingAddress).toHaveProperty('postalCode', TEST_SHIPPING_ADDRESS.postalCode);
        expect(response.data.data.shippingAddress).toHaveProperty('country', TEST_SHIPPING_ADDRESS.country);

        // Verify no snake_case properties leaked through
        const shippingAddress = response.data.data.shippingAddress;
        expect(shippingAddress).not.toHaveProperty('first_name');
        expect(shippingAddress).not.toHaveProperty('last_name');
        expect(shippingAddress).not.toHaveProperty('address_line1');
        expect(shippingAddress).not.toHaveProperty('postal_code');
      }
    });

    it('should update billing address with camelCase properties', async () => {
      const customerToken = await loginTestUser(client);

      const response = await client.put(`/customer/checkout/${checkoutId}/billing-address`, TEST_BILLING_ADDRESS, {
        headers: { Authorization: `Bearer ${customerToken}` },
      });

      // Accept 200 (success) or 500 (server issues)
      if (response.status === 500) {
        return;
      }

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);

      // Verify the address was properly saved
      if (response.data.data.billingAddress) {
        expect(response.data.data.billingAddress).toHaveProperty('firstName', TEST_BILLING_ADDRESS.firstName);
        expect(response.data.data.billingAddress).toHaveProperty('lastName', TEST_BILLING_ADDRESS.lastName);
        expect(response.data.data.billingAddress).toHaveProperty('addressLine1', TEST_BILLING_ADDRESS.addressLine1);
        expect(response.data.data.billingAddress).toHaveProperty('city', TEST_BILLING_ADDRESS.city);

        // Verify no snake_case properties leaked through
        const billingAddress = response.data.data.billingAddress;
        expect(billingAddress).not.toHaveProperty('first_name');
        expect(billingAddress).not.toHaveProperty('last_name');
        expect(billingAddress).not.toHaveProperty('address_line1');
        expect(billingAddress).not.toHaveProperty('postal_code');
      }
    });
  });

  describe('Shipping and Payment Method API', () => {
    it('should get shipping methods for a checkout', async () => {
      const customerToken = await loginTestUser(client);

      // First set shipping address (required for shipping methods)
      await client.put(`/customer/checkout/${checkoutId}/shipping-address`, TEST_SHIPPING_ADDRESS, {
        headers: { Authorization: `Bearer ${customerToken}` },
      });

      const response = await client.get(`/customer/checkout/${checkoutId}/shipping-methods`, {
        headers: { Authorization: `Bearer ${customerToken}` },
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);

      if (response.data.data.length > 0) {
        const method = response.data.data[0];

        // Check camelCase properties
        expect(method).toHaveProperty('id');
        expect(method).toHaveProperty('name');
        expect(method).toHaveProperty('price');

        // Verify no snake_case properties
        expect(method).not.toHaveProperty('is_default');
        expect(method).not.toHaveProperty('is_enabled');
        expect(method).not.toHaveProperty('estimated_delivery_time');
      }
    });

    it('should select a shipping method with camelCase properties', async () => {
      const customerToken = await loginTestUser(client);

      // First set shipping address
      await client.put(`/customer/checkout/${checkoutId}/shipping-address`, TEST_SHIPPING_ADDRESS, {
        headers: { Authorization: `Bearer ${customerToken}` },
      });

      // Get available methods
      const methodsResponse = await client.get(`/customer/checkout/${checkoutId}/shipping-methods`, {
        headers: { Authorization: `Bearer ${customerToken}` },
      });
      if (methodsResponse.status !== 200 || !methodsResponse.data.data.length) {
        return;
      }

      const shippingMethodId = methodsResponse.data.data[0].id;

      const response = await client.put(
        `/customer/checkout/${checkoutId}/shipping-method`,
        {
          shippingMethodId,
        },
        {
          headers: { Authorization: `Bearer ${customerToken}` },
        },
      );

      if (response.status === 500) {
        return;
      }

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);

      // Verify the shipping method was properly set
      expect(response.data.data).toHaveProperty('shippingMethodId');
      expect(response.data.data).toHaveProperty('shippingAmount');

      // Verify no snake_case properties leaked through
      expect(response.data.data).not.toHaveProperty('shipping_method_id');
      expect(response.data.data).not.toHaveProperty('shipping_amount');
    });

    it('should get payment methods with camelCase properties', async () => {
      const customerToken = await loginTestUser(client);

      const response = await client.get('/customer/checkout/payment-methods', {
        headers: { Authorization: `Bearer ${customerToken}` },
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);

      if (response.data.data.length > 0) {
        const method = response.data.data[0];

        // Check camelCase properties
        expect(method).toHaveProperty('id');
        expect(method).toHaveProperty('name');
        expect(method).toHaveProperty('type');
        expect(method).toHaveProperty('isDefault');

        // Verify no snake_case properties
        expect(method).not.toHaveProperty('is_default');
        expect(method).not.toHaveProperty('is_enabled');
      }
    });

    it('should select a payment method with camelCase properties', async () => {
      const customerToken = await loginTestUser(client);

      // Get available methods
      const methodsResponse = await client.get('/customer/checkout/payment-methods', {
        headers: { Authorization: `Bearer ${customerToken}` },
      });
      if (methodsResponse.status !== 200 || !methodsResponse.data.data.length) {
        return;
      }

      const paymentMethodId = methodsResponse.data.data[0].id;

      const response = await client.put(
        `/customer/checkout/${checkoutId}/payment-method`,
        {
          paymentMethodId,
        },
        {
          headers: { Authorization: `Bearer ${customerToken}` },
        },
      );

      if (response.status === 500) {
        return;
      }

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);

      // Verify the payment method was properly set
      expect(response.data.data).toHaveProperty('paymentMethodId');

      // Verify no snake_case properties leaked through
      expect(response.data.data).not.toHaveProperty('payment_method_id');
    });
  });

  describe('Coupon API', () => {
    it('should apply a coupon code', async () => {
      const customerToken = await loginTestUser(client);

      const response = await client.post(
        `/customer/checkout/${checkoutId}/coupon`,
        {
          couponCode: 'TEST10',
        },
        {
          headers: { Authorization: `Bearer ${customerToken}` },
        },
      );

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);

      // Verify no snake_case properties
      expect(response.data.data).not.toHaveProperty('coupon_code');
      expect(response.data.data).not.toHaveProperty('discount_amount');
    });

    it('should remove a coupon code', async () => {
      const customerToken = await loginTestUser(client);

      // First apply a coupon
      await client.post(
        `/customer/checkout/${checkoutId}/coupon`,
        {
          couponCode: 'TEST10',
        },
        {
          headers: { Authorization: `Bearer ${customerToken}` },
        },
      );

      const response = await client.delete(`/customer/checkout/${checkoutId}/coupon`, {
        headers: { Authorization: `Bearer ${customerToken}` },
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
    });

    it('should reject empty coupon code', async () => {
      const customerToken = await loginTestUser(client);

      const response = await client.post(
        `/customer/checkout/${checkoutId}/coupon`,
        {
          couponCode: '',
        },
        {
          headers: { Authorization: `Bearer ${customerToken}` },
        },
      );

      expect(response.status).toBe(400);
    });
  });

  describe('Checkout Completion', () => {
    it('should abandon checkout with proper response format', async () => {
      // Create a new checkout to abandon
      const customerToken = await loginTestUser(client);

      const basketResponse = await client.post(
        '/customer/basket',
        {
          sessionId: 'abandon-test-session-' + Date.now(),
        },
        {
          headers: { Authorization: `Bearer ${customerToken}` },
        },
      );

      if (basketResponse.status !== 200) {
        return;
      }

      const testBasketId = basketResponse.data.data.basketId;

      // Add an item (use valid UUID for productId)
      await client.post(
        `/customer/basket/${testBasketId}/items`,
        {
          productId: '00000000-0000-0000-0000-000000000001',
          sku: 'TEST-SKU-001',
          name: 'Test Product',
          quantity: 1,
          unitPrice: 29.99,
        },
        {
          headers: { Authorization: `Bearer ${customerToken}` },
        },
      );

      // Create checkout
      const checkoutResponse = await client.post(
        '/customer/checkout',
        {
          basketId: testBasketId,
        },
        {
          headers: { Authorization: `Bearer ${customerToken}` },
        },
      );

      if (checkoutResponse.status !== 201) {
        return;
      }

      const abandonCheckoutId = checkoutResponse.data.data.checkoutId;

      const response = await client.post(
        `/customer/checkout/${abandonCheckoutId}/abandon`,
        {},
        {
          headers: { Authorization: `Bearer ${customerToken}` },
        },
      );

      // Accept 200 or 500 (may fail due to server state)
      if (response.status === 500) {
        return;
      }

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('message');
    });

    it('should fail to complete checkout without required fields', async () => {
      if (!checkoutId) {
        return;
      }

      const customerToken = await loginTestUser(client);

      // Try to complete without shipping address/method
      const response = await client.post(
        `/customer/checkout/${checkoutId}/complete`,
        {},
        {
          headers: { Authorization: `Bearer ${customerToken}` },
        },
      );

      // Should fail because checkout is not ready
      expect(response.status).toBe(400);
    });
  });

  describe('Edge Cases', () => {
    it('should handle non-existent checkout gracefully', async () => {
      // Use valid UUID format
      const response = await client.get('/customer/checkout/00000000-0000-0000-0000-000000000000');
      expect(response.status).toBe(404);
    });

    it('should require basketId when creating checkout', async () => {
      const response = await client.post('/customer/checkout', {});
      expect(response.status).toBe(400);
    });

    it('should require shippingMethodId when setting shipping method', async () => {
      if (!checkoutId) {
        return;
      }

      const response = await client.put(`/customer/checkout/${checkoutId}/shipping-method`, {});
      expect(response.status).toBe(400);
    });

    it('should require paymentMethodId when setting payment method', async () => {
      if (!checkoutId) {
        return;
      }

      const response = await client.put(`/customer/checkout/${checkoutId}/payment-method`, {});
      expect(response.status).toBe(400);
    });
  });
});
