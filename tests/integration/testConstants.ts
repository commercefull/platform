/**
 * Integration Test Constants
 *
 * These IDs match the pre-seeded data in seeds/20240805002001_seedIntegrationTestData.js
 * Using pre-seeded data accelerates test execution by avoiding dynamic data creation.
 */

// Test Product IDs
export const TEST_PRODUCT_1_ID = '00000000-0000-0000-0000-000000000001';
export const TEST_PRODUCT_2_ID = '00000000-0000-0000-0000-000000000002';

// Test Customer
export const TEST_CUSTOMER_ID = '00000000-0000-0000-0000-000000001001';

// Test Baskets
export const TEST_GUEST_BASKET_ID = '00000000-0000-0000-0000-000000002001';
export const TEST_CUSTOMER_BASKET_ID = '00000000-0000-0000-0000-000000002002';

// Test Checkout
export const TEST_CHECKOUT_ID = '00000000-0000-0000-0000-000000003001';
export const TEST_PICKUP_LOCATION_ID = '00000000-0000-0000-0000-000000003010';

// Test Content
export const TEST_CONTENT_TYPE_ID = '00000000-0000-0000-0000-000000005001';
export const TEST_CONTENT_PAGE_ID = '00000000-0000-0000-0000-000000005002';
export const TEST_CONTENT_BLOCK_ID = '00000000-0000-0000-0000-000000005003';
export const TEST_CONTENT_TEMPLATE_ID = '00000000-0000-0000-0000-000000005004';
export const TEST_BLOCK_TYPE_ID = '00000000-0000-0000-0000-000000005005';
export const TEST_CONTENT_CATEGORY_ID = '00000000-0000-0000-0000-000000005006';

// Test Credentials (must match seeded organization/customer data)
export const ADMIN_CREDENTIALS = {
  email: 'merchant@example.com',
  password: 'password123',
};

export const CUSTOMER_CREDENTIALS = {
  email: 'customer@example.com',
  password: 'password123',
};



// Test Address Data
export const TEST_SHIPPING_ADDRESS = {
  firstName: 'Jane',
  lastName: 'Doe',
  addressLine1: '123 Main St',
  city: 'Portland',
  region: 'OR',
  postalCode: '97201',
  country: 'US',
  phone: '555-123-4567',
};

export const TEST_BILLING_ADDRESS = {
  firstName: 'Jane',
  lastName: 'Doe',
  addressLine1: '123 Main St',
  city: 'Portland',
  region: 'OR',
  postalCode: '97201',
  country: 'US',
  phone: '555-123-4567',
};


// Test Content Page Data
export const TEST_CONTENT_PAGE = {
  id: TEST_CONTENT_PAGE_ID,
  title: 'Integration Test Page',
  slug: 'integration-test-page',
  contentTypeId: TEST_CONTENT_TYPE_ID,
  templateId: TEST_CONTENT_TEMPLATE_ID,
  status: 'published',
  visibility: 'public',
  summary: 'Test page for integration testing',
  metaTitle: 'Integration Test Page',
  metaDescription: 'This is a test page for integration testing',
  isHomePage: false,
};




