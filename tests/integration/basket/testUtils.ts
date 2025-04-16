import axios, { AxiosInstance } from 'axios';

// Test data
export const testCustomer = {
  id: `customer-${Math.floor(Math.random() * 10000)}`,
  email: `test-${Math.floor(Math.random() * 10000)}@example.com`,
  firstName: 'Test',
  lastName: 'Customer'
};

export const testProduct1 = {
  id: `product-${Math.floor(Math.random() * 10000)}`,
  name: 'Test Product 1',
  price: 29.99,
  sku: `SKU-${Math.floor(Math.random() * 10000)}`
};

export const testProduct2 = {
  id: `product-${Math.floor(Math.random() * 10000)}`,
  name: 'Test Product 2',
  price: 15.50,
  sku: `SKU-${Math.floor(Math.random() * 10000)}`
};

export const testBasketItem1 = {
  productId: testProduct1.id,
  quantity: 2,
  price: testProduct1.price
};

export const testBasketItem2 = {
  productId: testProduct2.id,
  quantity: 1,
  price: testProduct2.price
};

// Test admin credentials
const adminCredentials = {
  email: 'admin@example.com', // Replace with valid admin credentials
  password: 'password123'     // Replace with valid admin password
};

// Customer login credentials
const customerCredentials = {
  email: 'customer@example.com',  // Replace with valid customer credentials
  password: 'password123'         // Replace with valid customer password
};

/**
 * Setup function for basket integration tests
 */
export async function setupBasketTests() {
  // Create client
  const client = axios.create({
    baseURL: process.env.API_URL || 'http://localhost:3000',
    validateStatus: () => true // Don't throw HTTP errors
  });

  // Get admin token
  const adminLoginResponse = await client.post('/api/auth/login', adminCredentials);
  const adminToken = adminLoginResponse.data.token;

  if (!adminLoginResponse.data.success || !adminToken) {
    throw new Error('Failed to get admin token');
  }

  // Get customer token
  let customerToken;
  let customerId;
  try {
    const customerLoginResponse = await client.post('/api/auth/login', customerCredentials);
    customerToken = customerLoginResponse.data.token;
    customerId = customerLoginResponse.data.user.id;
  } catch (error) {
    console.log('Using guest checkout flow');
  }

  // Step 1: Ensure test products exist
  const product1 = await ensureProductExists(client, adminToken, testProduct1);
  const product2 = await ensureProductExists(client, adminToken, testProduct2);

  // Update test basket items with correct product IDs
  const basketItem1 = { 
    ...testBasketItem1, 
    productId: product1.id 
  };
  
  const basketItem2 = { 
    ...testBasketItem2, 
    productId: product2.id 
  };

  // Step 2: Create a test basket for guest user
  const guestBasketResponse = await client.post('/api/baskets', {
    items: [basketItem1]
  });
  
  if (!guestBasketResponse.data.success) {
    throw new Error('Failed to create guest basket');
  }
  
  const guestBasketId = guestBasketResponse.data.data.id;

  // Step 3: Create a test basket for authenticated user if possible
  let customerBasketId;
  if (customerToken && customerId) {
    const customerBasketResponse = await client.post('/api/baskets', {
      items: [basketItem1, basketItem2],
      customerId
    }, {
      headers: { Authorization: `Bearer ${customerToken}` }
    });
    
    if (customerBasketResponse.data.success) {
      customerBasketId = customerBasketResponse.data.data.id;
    }
  }

  return {
    client,
    adminToken,
    customerToken,
    customerId,
    guestBasketId,
    customerBasketId,
    testProduct1: product1,
    testProduct2: product2,
    basketItem1,
    basketItem2
  };
}

/**
 * Helper function to ensure a test product exists
 */
async function ensureProductExists(client: AxiosInstance, adminToken: string, product: any) {
  try {
    // Try to find the product
    const productResponse = await client.get(`/api/admin/products/${product.id}`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    if (productResponse.data.success) {
      return productResponse.data.data;
    }
    
    // Create the product if it doesn't exist
    const createProductResponse = await client.post('/api/admin/products', {
      ...product,
      description: `Test product for integration tests - ${product.name}`,
      status: 'active',
      inventory: {
        quantity: 100,
        allowBackorders: true
      }
    }, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    if (createProductResponse.data.success) {
      return createProductResponse.data.data;
    }
    
    throw new Error(`Failed to create test product: ${product.name}`);
  } catch (error) {
    console.log(`Using test product ID: ${product.id}`);
    return product;
  }
}

/**
 * Cleanup function for basket integration tests
 */
export async function cleanupBasketTests(
  client: AxiosInstance, 
  adminToken: string, 
  { 
    guestBasketId,
    customerBasketId
  }: {
    guestBasketId?: string,
    customerBasketId?: string
  }
) {
  try {
    // Delete the guest basket
    if (guestBasketId) {
      await client.delete(`/api/baskets/${guestBasketId}`);
    }
    
    // Delete the customer basket
    if (customerBasketId) {
      await client.delete(`/api/baskets/${customerBasketId}`);
    }
    
    // Any other cleanup needed
  } catch (error) {
    console.error('Error during basket test cleanup:', error);
  }
}
