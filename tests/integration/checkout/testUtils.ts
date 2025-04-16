import axios, { AxiosInstance } from 'axios';
import { Address } from '../../../features/checkout/repos/checkoutRepo';

// Test data
export const testBasket = {
  id: `basket-${Math.floor(Math.random() * 10000)}`,
  customerId: null,
  items: [
    {
      productId: `product-${Math.floor(Math.random() * 10000)}`,
      quantity: 2,
      price: 29.99
    },
    {
      productId: `product-${Math.floor(Math.random() * 10000)}`,
      quantity: 1,
      price: 15.50
    }
  ],
  subtotal: 75.48, // (29.99 * 2) + 15.50
  createdAt: new Date().toISOString()
};

export const testShippingAddress: Address = {
  firstName: 'Jane',
  lastName: 'Doe',
  addressLine1: '123 Main St',
  city: 'Portland',
  region: 'OR',
  postalCode: '97201',
  country: 'US',
  phone: '555-123-4567'
};

export const testBillingAddress: Address = {
  firstName: 'Jane',
  lastName: 'Doe',
  addressLine1: '123 Main St',
  city: 'Portland',
  region: 'OR',
  postalCode: '97201',
  country: 'US',
  phone: '555-123-4567'
};

export const testShippingMethod = {
  id: `shipping-${Math.floor(Math.random() * 10000)}`,
  name: 'Standard Shipping',
  price: 5.99,
  estimatedDeliveryTime: '3-5 business days',
  isDefault: true,
  isEnabled: true
};

export const testPaymentMethod = {
  id: `payment-${Math.floor(Math.random() * 10000)}`,
  name: 'Credit Card',
  type: 'credit_card',
  isDefault: true,
  isEnabled: true
};

// Test credentials
const adminCredentials = {
  email: 'admin@example.com', // Replace with valid admin credentials
  password: 'password123'     // Replace with valid admin password
};

/**
 * Setup function for checkout integration tests
 */
export async function setupCheckoutTests() {
  // Create client
  const client = axios.create({
    baseURL: process.env.API_URL || 'http://localhost:3000',
    validateStatus: () => true // Don't throw HTTP errors
  });

  // Get admin token
  const loginResponse = await client.post('/api/auth/login', adminCredentials);
  const adminToken = loginResponse.data.token;

  if (!loginResponse.data.success || !adminToken) {
    throw new Error('Failed to get admin token');
  }

  // Step 1: Create a test basket
  const basketResponse = await client.post('/api/baskets', {
    items: testBasket.items
  });
  
  if (!basketResponse.data.success) {
    throw new Error('Failed to create test basket');
  }
  
  const basketId = basketResponse.data.data.id;

  // Step 2: Create a checkout session with the basket
  const checkoutResponse = await client.post('/api/checkout/session', {
    basketId
  });
  
  if (!checkoutResponse.data.success) {
    throw new Error('Failed to create checkout session');
  }
  
  const checkoutSessionId = checkoutResponse.data.data.id;

  // Step 3: Create a shipping method if needed
  let shippingMethodId = testShippingMethod.id;
  
  try {
    const shippingMethodExists = await client.get(`/api/admin/shipping/methods/${shippingMethodId}`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    if (!shippingMethodExists.data.success) {
      const createShippingMethod = await client.post('/api/admin/shipping/methods', testShippingMethod, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      if (createShippingMethod.data.success) {
        shippingMethodId = createShippingMethod.data.data.id;
      }
    }
  } catch (error) {
    console.log('Using test shipping method ID');
  }

  // Step 4: Create a payment method if needed
  let paymentMethodId = testPaymentMethod.id;
  
  try {
    const paymentMethodExists = await client.get(`/api/admin/payment/methods/${paymentMethodId}`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    if (!paymentMethodExists.data.success) {
      const createPaymentMethod = await client.post('/api/admin/payment/methods', testPaymentMethod, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      if (createPaymentMethod.data.success) {
        paymentMethodId = createPaymentMethod.data.data.id;
      }
    }
  } catch (error) {
    console.log('Using test payment method ID');
  }

  return {
    client,
    adminToken,
    basketId,
    checkoutSessionId,
    shippingMethodId,
    paymentMethodId
  };
}

/**
 * Cleanup function for checkout integration tests
 */
export async function cleanupCheckoutTests(
  client: AxiosInstance, 
  adminToken: string, 
  { 
    checkoutSessionId,
    basketId
  }: {
    checkoutSessionId: string,
    basketId: string
  }
) {
  try {
    // Abandon the checkout session
    await client.post(`/api/checkout/session/${checkoutSessionId}/abandon`);
    
    // Clear the basket
    await client.delete(`/api/baskets/${basketId}`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    // Any other cleanup needed
  } catch (error) {
    console.error('Error during checkout test cleanup:', error);
  }
}
