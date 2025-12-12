import { AxiosInstance } from 'axios';
import { createTestClient, loginTestUser } from '../testUtils';
import { Product, ProductStatus, ProductVisibility } from '../../../features/product/repos/productRepo';

// Common test data for product
export const testProduct: Partial<Product> = {
  name: 'Test Product',
  description: 'Test product for integration tests',
  slug: `test-product-${Math.floor(Math.random() * 10000)}`,
  status: ProductStatus.ACTIVE,
  visibility: ProductVisibility.VISIBLE,
  basePrice: 99.99,
  salePrice: 79.99,
  cost: 50.00,
  sku: `TST${Math.floor(Math.random() * 10000)}`,
  weight: 1.5,
  length: 10,
  width: 5,
  height: 2,
  isFeatured: true,
  isVirtual: false,
  isDownloadable: false,
  isSubscription: false,
  isTaxable: true,
  hasVariants: false,
  productTypeId: '1' // Assuming a default product type ID
};

// Common test data for attribute group
export const testAttributeGroup = {
  name: 'Test Attribute Group',
  description: 'Test attribute group for integration tests',
  code: `test-group-${Math.floor(Math.random() * 10000)}`,
  sortOrder: 1
};

// Common test data for attribute
export const testAttribute = {
  name: 'Test Attribute',
  code: `test-attr-${Math.floor(Math.random() * 10000)}`,
  description: 'Test attribute for integration tests',
  type: 'select',
  isRequired: true,
  isFilterable: true,
  isSearchable: true,
  sortOrder: 1
};

// Common test data for attribute option
export const testAttributeOption = {
  value: 'Test Option',
  label: 'Test Option Label',
  sortOrder: 1
};

// Common test data for category
export const testCategory = {
  name: 'Test Category',
  description: 'Test category for integration tests',
  code: `test-category-${Math.floor(Math.random() * 10000)}`,
  isActive: true,
  sortOrder: 1,
  parentId: null
};

// Helper function to create a test product
export async function createTestProduct(client: AxiosInstance, adminToken: string, categoryId?: string) {
  const productData: Partial<Product> = { ...testProduct };
  
  if (categoryId) {
    productData.categoryId = categoryId;
  }
  
  const response = await client.post('/business/products', productData, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  
  // Handle different response formats
  if (response.data?.data?.id) return response.data.data.id;
  if (response.data?.data?.productId) return response.data.data.productId;
  if (response.data?.id) return response.data.id;
  if (response.data?.productId) return response.data.productId;
  
  console.error('Failed to create product:', response.data);
  return null;
}

// Helper function to create a test product variant
export async function createTestProductVariant(client: AxiosInstance, adminToken: string, productId: string) {
  const variantData = {
    productId,
    name: 'Test Variant',
    sku: `VAR-${Math.floor(Math.random() * 10000)}`,
    price: 89.99,
    inventory: 100,
    inventoryPolicy: 'deny', // don't allow purchases when out of stock
    isDefault: true,
    options: [
      { name: 'Color', value: 'Blue' },
      { name: 'Size', value: 'Medium' }
    ]
  };
  
  const response = await client.post(`/business/products/${productId}/variants`, variantData, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  
  return response.data.data.id;
}

// Helper function to create a test category
export async function createTestCategory(client: AxiosInstance, adminToken: string) {
  const response = await client.post('/business/categories', testCategory, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  
  // Handle different response formats
  if (response.data?.data?.id) return response.data.data.id;
  if (response.data?.data?.categoryId) return response.data.data.categoryId;
  if (response.data?.id) return response.data.id;
  if (response.data?.categoryId) return response.data.categoryId;
  
  console.error('Failed to create category:', response.data);
  return null;
}

// Helper function to create a test attribute group
export async function createTestAttributeGroup(client: AxiosInstance, adminToken: string) {
  const response = await client.post('/business/attribute-groups', testAttributeGroup, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  
  return response.data.data.id;
}

// Helper function to create a test attribute
export async function createTestAttribute(client: AxiosInstance, adminToken: string, attributeGroupId: string) {
  const attributeData = {
    ...testAttribute,
    attributeGroupId
  };
  
  const response = await client.post('/business/attributes', attributeData, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  
  return response.data.data.id;
}

// Helper function to create a test attribute option
export async function createTestAttributeOption(client: AxiosInstance, adminToken: string, attributeId: string) {
  const optionData = {
    ...testAttributeOption,
    attributeId
  };
  
  const response = await client.post('/business/attribute-options', optionData, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  
  return response.data.data.id;
}

// Setup function to initialize client and test data for product tests
export async function setupProductTests() {
  const client = createTestClient();
  // Use merchant login for business routes
  const loginResponse = await client.post('/business/auth/login', {
    email: 'merchant@example.com',
    password: 'password123'
  });
  const adminToken = loginResponse.data.accessToken;
  
  if (!adminToken) {
    throw new Error('Failed to get admin token for product tests');
  }
  
  // Create test category
  const testCategoryId = await createTestCategory(client, adminToken);
  
  // Create test product
  const testProductId = await createTestProduct(client, adminToken, testCategoryId);
  
  // Create test variant
  const testVariantId = await createTestProductVariant(client, adminToken, testProductId);
  
  // Create test attribute group
  const testAttributeGroupId = await createTestAttributeGroup(client, adminToken);
  
  // Create test attribute
  const testAttributeId = await createTestAttribute(client, adminToken, testAttributeGroupId);
  
  // Create test attribute option
  const testAttributeOptionId = await createTestAttributeOption(client, adminToken, testAttributeId);
  
  return {
    client,
    adminToken,
    testCategoryId,
    testProductId,
    testVariantId,
    testAttributeGroupId,
    testAttributeId,
    testAttributeOptionId
  };
}

// Cleanup function to remove test resources
export async function cleanupProductTests(
  client: AxiosInstance,
  adminToken: string,
  testProductId: string,
  testCategoryId: string,
  testAttributeGroupId: string
) {
  try {
    // Delete test product (this should cascade delete variants)
    await client.delete(`/business/products/${testProductId}`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    // Delete test category
    await client.delete(`/business/categories/${testCategoryId}`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    // Delete test attribute group (this should cascade delete attributes and options)
    await client.delete(`/business/attribute-groups/${testAttributeGroupId}`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
  } catch (error) {
    console.error('Error cleaning up test resources:', error);
  }
}
