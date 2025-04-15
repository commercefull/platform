import axios, { AxiosInstance } from 'axios';
import { v4 as uuidv4 } from 'uuid';

const API_URL = process.env.API_URL || 'http://localhost:3000';

// Sample test data
export const testInventoryItem = {
  productId: '00000000-0000-0000-0000-000000000001', // Will be replaced with actual product ID
  sku: 'TEST-SKU-001',
  quantity: 100,
  reservedQuantity: 0,
  availableQuantity: 100,
  lowStockThreshold: 10,
  reorderPoint: 20,
  reorderQuantity: 50
};

export const testInventoryLocation = {
  name: 'Test Warehouse',
  type: 'warehouse',
  address: '123 Test St',
  city: 'Testville',
  state: 'TS',
  country: 'Testland',
  postalCode: '12345',
  isActive: true
};

// Setup helper function
export const setupInventoryTests = async () => {
  const client = axios.create({
    baseURL: API_URL,
    validateStatus: () => true // Don't throw HTTP errors
  });

  // Get admin token
  const adminLogin = await client.post('/api/admin/auth/login', {
    email: process.env.ADMIN_EMAIL || 'admin@commercefull.com',
    password: process.env.ADMIN_PASSWORD || 'admin123'
  });
  
  const adminToken = adminLogin.data.data.token;

  // Create test product if needed
  const productResponse = await client.get('/api/admin/products', {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  
  let testProductId;
  if (productResponse.data.data && productResponse.data.data.length > 0) {
    testProductId = productResponse.data.data[0].id;
  } else {
    // Create a test product
    const newProduct = await client.post('/api/admin/products', {
      name: 'Test Inventory Product',
      sku: 'TEST-INVENTORY-SKU',
      price: 29.99,
      status: 'active'
    }, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    testProductId = newProduct.data.data.id;
  }

  // Create a test inventory location
  const locationResponse = await client.post('/api/admin/inventory/locations', testInventoryLocation, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  const testLocationId = locationResponse.data.data.id;

  // Create a test inventory item
  const inventoryItemData = {
    ...testInventoryItem,
    productId: testProductId,
    locationId: testLocationId
  };
  
  const itemResponse = await client.post('/api/admin/inventory/items', inventoryItemData, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  const testInventoryItemId = itemResponse.data.data.id;

  return {
    client,
    adminToken,
    testProductId,
    testLocationId,
    testInventoryItemId
  };
};

// Cleanup helper function
export const cleanupInventoryTests = async (
  client: AxiosInstance,
  adminToken: string,
  testInventoryItemId: string,
  testLocationId: string
) => {
  // Delete test inventory item
  await client.delete(`/api/admin/inventory/items/${testInventoryItemId}`, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  
  // Delete test location
  await client.delete(`/api/admin/inventory/locations/${testLocationId}`, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
};
