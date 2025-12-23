import { AxiosInstance } from 'axios';
import { createTestClient, loginTestAdmin } from '../testUtils';

// Fixed UUIDs from seed data for consistent testing
export const SEEDED_PRODUCT_1_ID = '00000000-0000-0000-0000-000000000001';
export const SEEDED_PRODUCT_2_ID = '00000000-0000-0000-0000-000000000002';
export const SEEDED_PRODUCT_3_ID = '00000000-0000-0000-0000-000000000003';
export const SEEDED_VARIANT_1_ID = '20000000-0000-0000-0000-000000000001';
export const SEEDED_VARIANT_2_ID = '20000000-0000-0000-0000-000000000002';

// Dynamic Attribute System - Fixed UUIDs from seed data
export const SEEDED_PRODUCT_TYPE_SIMPLE_ID = '30000000-0000-0000-0000-000000000001';
export const SEEDED_PRODUCT_TYPE_CONFIGURABLE_ID = '30000000-0000-0000-0000-000000000002';
export const SEEDED_PRODUCT_TYPE_VIRTUAL_ID = '30000000-0000-0000-0000-000000000003';

export const SEEDED_ATTRIBUTE_SET_DEFAULT_ID = '40000000-0000-0000-0000-000000000001';
export const SEEDED_ATTRIBUTE_SET_APPAREL_ID = '40000000-0000-0000-0000-000000000002';
export const SEEDED_ATTRIBUTE_SET_ELECTRONICS_ID = '40000000-0000-0000-0000-000000000003';

export const SEEDED_ATTRIBUTE_COLOR_ID = '50000000-0000-0000-0000-000000000001';
export const SEEDED_ATTRIBUTE_SIZE_ID = '50000000-0000-0000-0000-000000000002';
export const SEEDED_ATTRIBUTE_MATERIAL_ID = '50000000-0000-0000-0000-000000000003';
export const SEEDED_ATTRIBUTE_WEIGHT_ID = '50000000-0000-0000-0000-000000000004';
export const SEEDED_ATTRIBUTE_BRAND_ID = '50000000-0000-0000-0000-000000000005';
export const SEEDED_ATTRIBUTE_SCREEN_SIZE_ID = '50000000-0000-0000-0000-000000000006';
export const SEEDED_ATTRIBUTE_RAM_ID = '50000000-0000-0000-0000-000000000007';
export const SEEDED_ATTRIBUTE_STORAGE_ID = '50000000-0000-0000-0000-000000000008';

export const SEEDED_ATTRIBUTE_VALUE_RED_ID = '60000000-0000-0000-0000-000000000001';
export const SEEDED_ATTRIBUTE_VALUE_BLUE_ID = '60000000-0000-0000-0000-000000000002';
export const SEEDED_ATTRIBUTE_VALUE_BLACK_ID = '60000000-0000-0000-0000-000000000003';
export const SEEDED_ATTRIBUTE_VALUE_SIZE_M_ID = '60000000-0000-0000-0000-000000000012';

export const SEEDED_ATTRIBUTE_GROUP_BASIC_ID = '70000000-0000-0000-0000-000000000001';
export const SEEDED_ATTRIBUTE_GROUP_PHYSICAL_ID = '70000000-0000-0000-0000-000000000002';
export const SEEDED_ATTRIBUTE_GROUP_TECH_ID = '70000000-0000-0000-0000-000000000003';

// Common test data for product
export const testProduct = {
  name: 'Test Product',
  description: 'Test product for integration tests',
  slug: `test-product-${Math.floor(Math.random() * 10000)}`,
  status: 'active',
  visibility: 'visible',
  price: 99.99,
  basePrice: 99.99,
  salePrice: 79.99,
  costPrice: 50.00,
  sku: `TST${Math.floor(Math.random() * 10000)}`,
  weight: 1.5,
  weightUnit: 'kg',
  length: 10,
  width: 5,
  height: 2,
  dimensionUnit: 'cm',
  isFeatured: true,
  isVirtual: false,
  isDownloadable: false,
  isSubscription: false,
  isTaxable: true,
  hasVariants: false,
  type: 'simple'
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
export async function createTestProduct(client: AxiosInstance, adminToken: string, brandId?: string) {
  const productData: any = { ...testProduct };
  
  if (brandId) {
    productData.brandId = brandId;
  }
  
  const response = await client.post('/business/products', productData, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  
  // Handle different response formats
  if (response.data?.data?.id) return response.data.data.id;
  if (response.data?.data?.productId) return response.data.data.productId;
  if (response.data?.id) return response.data.id;
  if (response.data?.productId) return response.data.productId;
  
  
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
// Uses seeded data from seeds/20240805001058_seedProductTestData.js
export async function setupProductTests() {
  const client = createTestClient();
  let adminToken = '';
  
  try {
    // Use merchant login for business routes
    adminToken = await loginTestAdmin(client);
  } catch (error) {
    
  }
  
  // Use seeded product data - these products are created by the seed file
  // with fixed UUIDs for consistent testing
  return {
    client,
    adminToken,
    testCategoryId: null as string | null,
    testProductId: SEEDED_PRODUCT_1_ID,
    testVariantId: SEEDED_VARIANT_1_ID,
    testAttributeGroupId: null as string | null,
    testAttributeId: null as string | null,
    testAttributeOptionId: null as string | null
  };
}

// Cleanup function to remove test resources
export async function cleanupProductTests(
  client: AxiosInstance,
  adminToken: string,
  testProductId: string | null,
  testCategoryId: string | null,
  testAttributeGroupId: string | null
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
    
  }
}
