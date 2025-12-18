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
export const TEST_CUSTOMER_EMAIL = 'testcustomer@example.com';

// Test Baskets
export const TEST_GUEST_BASKET_ID = '00000000-0000-0000-0000-000000002001';
export const TEST_CUSTOMER_BASKET_ID = '00000000-0000-0000-0000-000000002002';
export const TEST_CHECKOUT_BASKET_ID = '00000000-0000-0000-0000-000000002003';

// Test Checkout
export const TEST_CHECKOUT_ID = '00000000-0000-0000-0000-000000003001';

// Test B2B
export const TEST_B2B_COMPANY_ID = '00000000-0000-0000-0000-000000004001';
export const TEST_B2B_QUOTE_ID = '00000000-0000-0000-0000-000000004002';

// Test Content
export const TEST_CONTENT_TYPE_ID = '00000000-0000-0000-0000-000000005001';
export const TEST_CONTENT_PAGE_ID = '00000000-0000-0000-0000-000000005002';
export const TEST_CONTENT_BLOCK_ID = '00000000-0000-0000-0000-000000005003';
export const TEST_CONTENT_TEMPLATE_ID = '00000000-0000-0000-0000-000000005004';
export const TEST_BLOCK_TYPE_ID = '00000000-0000-0000-0000-000000005005';

// Test Credentials (must match seeded merchant/customer data)
export const ADMIN_CREDENTIALS = {
  email: 'merchant@example.com',
  password: 'password123'
};

export const CUSTOMER_CREDENTIALS = {
  email: 'customer@example.com',
  password: 'password123'
};

// Test Product Data
export const TEST_PRODUCT_1 = {
  productId: TEST_PRODUCT_1_ID,
  name: 'Integration Test Product 1',
  sku: 'TEST-SKU-001',
  price: 29.99
};

export const TEST_PRODUCT_2 = {
  productId: TEST_PRODUCT_2_ID,
  name: 'Integration Test Product 2',
  sku: 'TEST-SKU-002',
  price: 15.50
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
  phone: '555-123-4567'
};

export const TEST_BILLING_ADDRESS = {
  firstName: 'Jane',
  lastName: 'Doe',
  addressLine1: '123 Main St',
  city: 'Portland',
  region: 'OR',
  postalCode: '97201',
  country: 'US',
  phone: '555-123-4567'
};

// Test B2B Company Data
export const TEST_B2B_COMPANY = {
  b2bCompanyId: TEST_B2B_COMPANY_ID,
  name: 'Integration Test Company',
  taxId: 'TAX-TEST-001',
  industry: 'Technology',
  creditLimit: 50000,
  paymentTerms: 'net30'
};

// Test B2B Quote Data
export const TEST_B2B_QUOTE = {
  b2bQuoteId: TEST_B2B_QUOTE_ID,
  b2bCompanyId: TEST_B2B_COMPANY_ID,
  quoteNumber: 'QT-TEST-001',
  status: 'draft'
};

// Test Content Type Data
export const TEST_CONTENT_TYPE = {
  id: TEST_CONTENT_TYPE_ID,
  name: 'Integration Test Content Type',
  slug: 'integration-test-type',
  description: 'Content type for integration testing',
  status: 'active'
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
  isHomePage: false
};

// Test Content Block Data
export const TEST_CONTENT_BLOCK = {
  id: TEST_CONTENT_BLOCK_ID,
  pageId: TEST_CONTENT_PAGE_ID,
  contentTypeId: TEST_BLOCK_TYPE_ID,
  name: 'Integration Test Block',
  order: 0,
  content: { text: 'Test content for integration testing' },
  status: 'active'
};

// Test Content Template Data
export const TEST_CONTENT_TEMPLATE = {
  id: TEST_CONTENT_TEMPLATE_ID,
  name: 'Integration Test Template',
  type: 'layout',
  description: 'Template for integration testing',
  structure: { areas: ['main', 'sidebar'] },
  status: 'active'
};

// Test Data Objects for API payloads
export const TEST_DATA = {
  category: {
    name: 'Test Category',
    slug: 'test-category',
    description: 'Test category description',
    featuredImage: 'https://example.com/image.jpg',
    metaTitle: 'Test Category',
    metaDescription: 'Test category meta description',
    sortOrder: 0,
    isActive: true
  },
  navigation: {
    name: 'Test Navigation',
    slug: 'test-navigation',
    description: 'Test navigation description',
    location: 'header'
  },
  navigationItem: {
    title: 'Home',
    type: 'url',
    url: '/',
    sortOrder: 0
  },
  media: {
    fileName: 'test-image.jpg',
    filePath: '/uploads/test-image.jpg',
    fileType: 'image/jpeg',
    fileSize: 1024000,
    url: 'https://example.com/test-image.jpg',
    title: 'Test Image',
    altText: 'Test image alt text',
    caption: 'Test image caption',
    description: 'Test image description',
    width: 1920,
    height: 1080,
    sortOrder: 0,
    tags: ['test', 'image'],
    isExternal: false
  }
};
