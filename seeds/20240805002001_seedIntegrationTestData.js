/**
 * Seed Integration Test Data
 * Pre-seeds data required for integration tests to accelerate test execution
 * 
 * This seed creates:
 * - Test customers with known credentials
 * - Test products with known IDs
 * - Test baskets for guest and customer flows
 * - Test checkout sessions
 * - Test B2B companies and quotes
 * - Test analytics data
 */

const TEST_PRODUCT_1_ID = '00000000-0000-0000-0000-000000000001';
const TEST_PRODUCT_2_ID = '00000000-0000-0000-0000-000000000002';
const TEST_CUSTOMER_ID = '00000000-0000-0000-0000-000000001001';
const TEST_GUEST_BASKET_ID = '00000000-0000-0000-0000-000000002001';
const TEST_CUSTOMER_BASKET_ID = '00000000-0000-0000-0000-000000002002';
const TEST_CHECKOUT_BASKET_ID = '00000000-0000-0000-0000-000000002003';
const TEST_CHECKOUT_ID = '00000000-0000-0000-0000-000000003001';
const TEST_B2B_COMPANY_ID = '00000000-0000-0000-0000-000000004001';
const TEST_B2B_QUOTE_ID = '00000000-0000-0000-0000-000000004002';

// Content test IDs
const TEST_CONTENT_TYPE_ID = '00000000-0000-0000-0000-000000005001';
const TEST_CONTENT_PAGE_ID = '00000000-0000-0000-0000-000000005002';
const TEST_CONTENT_BLOCK_ID = '00000000-0000-0000-0000-000000005003';
const TEST_CONTENT_TEMPLATE_ID = '00000000-0000-0000-0000-000000005004';
const TEST_BLOCK_TYPE_ID = '00000000-0000-0000-0000-000000005005';

// Subscription test IDs
const TEST_SUBSCRIPTION_PRODUCT_ID = '00000000-0000-0000-0000-000000007001';
const TEST_SUBSCRIPTION_PLAN_ID = '00000000-0000-0000-0000-000000007002';

// Customer test IDs
const TEST_CUSTOMER_ADDRESS_ID = '00000000-0000-0000-0000-000000006001';
const TEST_CUSTOMER_GROUP_ID = '00000000-0000-0000-0000-000000006002';

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.seed = async function(knex) {
  // =========================================================================
  // Test Customer
  // =========================================================================
  const existingCustomer = await knex('customer')
    .where('customerId', TEST_CUSTOMER_ID)
    .first();
  
  if (!existingCustomer) {
    await knex('customer').insert({
      customerId: TEST_CUSTOMER_ID,
      email: 'testcustomer@example.com',
      firstName: 'Test',
      lastName: 'Customer',
      password: '$2b$10$dummyhashedpasswordfortesting123456789',
      isActive: true,
      isVerified: true,
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }).onConflict('customerId').ignore();
  }

  // =========================================================================
  // Test Customer Address
  // =========================================================================
  const existingAddress = await knex('customerAddress')
    .where('customerAddressId', TEST_CUSTOMER_ADDRESS_ID)
    .first();
  
  if (!existingAddress) {
    await knex('customerAddress').insert({
      customerAddressId: TEST_CUSTOMER_ADDRESS_ID,
      customerId: TEST_CUSTOMER_ID,
      firstName: 'Test',
      lastName: 'Customer',
      addressLine1: '123 Test Street',
      city: 'Test City',
      state: 'TS',
      postalCode: '12345',
      country: 'US',
      addressType: 'shipping',
      isDefault: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }).onConflict('customerAddressId').ignore();
  }

  // =========================================================================
  // Test Customer Group
  // =========================================================================
  const existingGroup = await knex('customerGroup')
    .where('customerGroupId', TEST_CUSTOMER_GROUP_ID)
    .first();
  
  if (!existingGroup) {
    await knex('customerGroup').insert({
      customerGroupId: TEST_CUSTOMER_GROUP_ID,
      name: 'Test VIP Group',
      code: 'test-vip-group',
      description: 'Test customer group for integration tests',
      discountPercent: 10,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }).onConflict('customerGroupId').ignore();
  }

  // =========================================================================
  // Test Products
  // =========================================================================
  const existingProduct1 = await knex('product')
    .where('productId', TEST_PRODUCT_1_ID)
    .first();
  
  if (!existingProduct1) {
    await knex('product').insert({
      productId: TEST_PRODUCT_1_ID,
      sku: 'TEST-PROD-001',
      name: 'Integration Test Product 1',
      slug: 'integration-test-product-1',
      description: 'Product for integration testing',
      type: 'simple',
      status: 'active',
      visibility: 'visible',
      price: 99.99,
      currency: 'USD',
      createdAt: new Date(),
      updatedAt: new Date()
    }).onConflict('productId').ignore();
  }

  const existingProduct2 = await knex('product')
    .where('productId', TEST_PRODUCT_2_ID)
    .first();
  
  if (!existingProduct2) {
    await knex('product').insert({
      productId: TEST_PRODUCT_2_ID,
      sku: 'TEST-PROD-002',
      name: 'Integration Test Product 2',
      slug: 'integration-test-product-2',
      description: 'Second product for integration testing',
      type: 'simple',
      status: 'active',
      visibility: 'visible',
      price: 149.99,
      currency: 'USD',
      createdAt: new Date(),
      updatedAt: new Date()
    }).onConflict('productId').ignore();
  }

  // =========================================================================
  // Test Baskets
  // =========================================================================
  
  // Guest basket for basket tests
  const existingGuestBasket = await knex('basket')
    .where('basketId', TEST_GUEST_BASKET_ID)
    .first();
  
  if (!existingGuestBasket) {
    await knex('basket').insert({
      basketId: TEST_GUEST_BASKET_ID,
      sessionId: 'integration-test-guest-session',
      status: 'active',
      currency: 'USD',
      itemsCount: 0,
      subTotal: 0,
      taxAmount: 0,
      discountAmount: 0,
      shippingAmount: 0,
      grandTotal: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastActivityAt: new Date()
    }).onConflict('basketId').ignore();
  }

  // Customer basket for basket tests
  const existingCustomerBasket = await knex('basket')
    .where('basketId', TEST_CUSTOMER_BASKET_ID)
    .first();
  
  if (!existingCustomerBasket) {
    await knex('basket').insert({
      basketId: TEST_CUSTOMER_BASKET_ID,
      customerId: TEST_CUSTOMER_ID,
      sessionId: 'integration-test-customer-session',
      status: 'active',
      currency: 'USD',
      itemsCount: 0,
      subTotal: 0,
      taxAmount: 0,
      discountAmount: 0,
      shippingAmount: 0,
      grandTotal: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastActivityAt: new Date()
    }).onConflict('basketId').ignore();
  }

  // Basket for checkout tests (with item)
  const existingCheckoutBasket = await knex('basket')
    .where('basketId', TEST_CHECKOUT_BASKET_ID)
    .first();
  
  if (!existingCheckoutBasket) {
    await knex('basket').insert({
      basketId: TEST_CHECKOUT_BASKET_ID,
      sessionId: 'integration-test-checkout-session',
      status: 'active',
      currency: 'USD',
      itemsCount: 1,
      subTotal: 29.99,
      taxAmount: 0,
      discountAmount: 0,
      shippingAmount: 0,
      grandTotal: 29.99,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastActivityAt: new Date()
    }).onConflict('basketId').ignore();

    // Add item to checkout basket
    await knex('basketItem').insert({
      basketItemId: knex.raw('uuidv7()'),
      basketId: TEST_CHECKOUT_BASKET_ID,
      productId: TEST_PRODUCT_1_ID,
      sku: 'TEST-SKU-001',
      name: 'Integration Test Product 1',
      quantity: 1,
      unitPrice: 29.99,
      totalPrice: 29.99,
      discountAmount: 0,
      taxAmount: 0,
      finalPrice: 29.99,
      itemType: 'physical',
      isGift: false,
      createdAt: new Date(),
      updatedAt: new Date()
    }).onConflict().ignore();
  }

  // =========================================================================
  // Test Checkout Session
  // =========================================================================
  const existingCheckout = await knex('checkoutSession')
    .where('checkoutSessionId', TEST_CHECKOUT_ID)
    .first();
  
  if (!existingCheckout) {
    await knex('checkoutSession').insert({
      checkoutSessionId: TEST_CHECKOUT_ID,
      sessionId: 'integration-test-checkout-session-id',
      basketId: TEST_CHECKOUT_BASKET_ID,
      email: 'testcheckout@example.com',
      status: 'active',
      step: 'cart',
      sameBillingAsShipping: true,
      shippingCalculated: false,
      taxesCalculated: false,
      agreeToTerms: false,
      agreeToMarketing: false,
      expiresAt: new Date(Date.now() + 30 * 60 * 1000),
      createdAt: new Date(),
      updatedAt: new Date(),
      lastActivityAt: new Date()
    }).onConflict('checkoutSessionId').ignore();
  }

  // =========================================================================
  // Test B2B Company
  // =========================================================================
  try {
    const existingCompany = await knex('b2bCompany')
      .where('b2bCompanyId', TEST_B2B_COMPANY_ID)
      .first();
    
    if (!existingCompany) {
      await knex('b2bCompany').insert({
        b2bCompanyId: TEST_B2B_COMPANY_ID,
        name: 'Integration Test Company',
        taxId: 'TAX-TEST-001',
        industry: 'Technology',
        creditLimit: 50000,
        paymentTerms: 'net30',
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      }).onConflict('b2bCompanyId').ignore();
    }
  } catch (e) {
    // b2bCompany table may not exist
    console.log('Skipping B2B company seed - table may not exist');
  }

  // =========================================================================
  // Test B2B Quote
  // =========================================================================
  try {
    const existingQuote = await knex('b2bQuote')
      .where('b2bQuoteId', TEST_B2B_QUOTE_ID)
      .first();
    
    if (!existingQuote) {
      await knex('b2bQuote').insert({
        b2bQuoteId: TEST_B2B_QUOTE_ID,
        b2bCompanyId: TEST_B2B_COMPANY_ID,
        quoteNumber: 'QT-TEST-001',
        status: 'draft',
        subtotal: 999.90,
        taxAmount: 0,
        discountAmount: 0,
        total: 999.90,
        currency: 'USD',
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        notes: 'Integration test quote',
        createdAt: new Date(),
        updatedAt: new Date()
      }).onConflict('b2bQuoteId').ignore();
    }
  } catch (e) {
    // b2bQuote table may not exist
    console.log('Skipping B2B quote seed - table may not exist');
  }

  // =========================================================================
  // Test Content Type
  // =========================================================================
  try {
    const existingContentType = await knex('contentType')
      .where('contentTypeId', TEST_CONTENT_TYPE_ID)
      .first();
    
    if (!existingContentType) {
      await knex('contentType').insert({
        contentTypeId: TEST_CONTENT_TYPE_ID,
        name: 'Integration Test Content Type',
        slug: 'integration-test-type',
        description: 'Content type for integration testing',
        isSystem: false,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }).onConflict('contentTypeId').ignore();
    }
  } catch (e) {
    console.log('Skipping content type seed - table may not exist');
  }

  // =========================================================================
  // Test Block Type
  // =========================================================================
  try {
    const existingBlockType = await knex('contentBlockType')
      .where('contentBlockTypeId', TEST_BLOCK_TYPE_ID)
      .first();
    
    if (!existingBlockType) {
      await knex('contentBlockType').insert({
        contentBlockTypeId: TEST_BLOCK_TYPE_ID,
        name: 'Integration Test Block Type',
        slug: 'integration-test-block-type',
        description: 'Block type for integration testing',
        schema: JSON.stringify({ type: 'object', properties: { text: { type: 'string' } } }),
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }).onConflict('contentBlockTypeId').ignore();
    }
  } catch (e) {
    console.log('Skipping block type seed - table may not exist');
  }

  // =========================================================================
  // Test Content Template
  // =========================================================================
  try {
    const existingTemplate = await knex('contentTemplate')
      .where('contentTemplateId', TEST_CONTENT_TEMPLATE_ID)
      .first();
    
    if (!existingTemplate) {
      await knex('contentTemplate').insert({
        contentTemplateId: TEST_CONTENT_TEMPLATE_ID,
        name: 'Integration Test Template',
        type: 'layout',
        description: 'Template for integration testing',
        structure: JSON.stringify({ areas: ['main', 'sidebar'] }),
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }).onConflict('contentTemplateId').ignore();
    }
  } catch (e) {
    console.log('Skipping content template seed - table may not exist');
  }

  // =========================================================================
  // Test Content Page
  // =========================================================================
  try {
    const existingPage = await knex('contentPage')
      .where('contentPageId', TEST_CONTENT_PAGE_ID)
      .first();
    
    if (!existingPage) {
      await knex('contentPage').insert({
        contentPageId: TEST_CONTENT_PAGE_ID,
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
        createdAt: new Date(),
        updatedAt: new Date(),
        publishedAt: new Date()
      }).onConflict('contentPageId').ignore();
    }
  } catch (e) {
    console.log('Skipping content page seed - table may not exist');
  }

  // =========================================================================
  // Test Content Block
  // =========================================================================
  try {
    const existingBlock = await knex('contentBlock')
      .where('contentBlockId', TEST_CONTENT_BLOCK_ID)
      .first();
    
    if (!existingBlock) {
      await knex('contentBlock').insert({
        contentBlockId: TEST_CONTENT_BLOCK_ID,
        contentPageId: TEST_CONTENT_PAGE_ID,
        blockTypeId: TEST_BLOCK_TYPE_ID,
        title: 'Integration Test Block',
        area: 'main',
        sortOrder: 0,
        content: JSON.stringify({ text: 'Test content for integration testing' }),
        isVisible: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }).onConflict('contentBlockId').ignore();
    }
  } catch (e) {
    console.log('Skipping content block seed - table may not exist');
  }

  // =========================================================================
  // Test Subscription Product & Plan
  // =========================================================================
  try {
    const existingSubProduct = await knex('subscriptionProduct')
      .where('subscriptionProductId', TEST_SUBSCRIPTION_PRODUCT_ID)
      .first();
    
    if (!existingSubProduct) {
      await knex('subscriptionProduct').insert({
        subscriptionProductId: TEST_SUBSCRIPTION_PRODUCT_ID,
        productId: TEST_PRODUCT_1_ID,
        billingAnchor: 'subscription_start',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }).onConflict('subscriptionProductId').ignore();
    }

    const existingSubPlan = await knex('subscriptionPlan')
      .where('subscriptionPlanId', TEST_SUBSCRIPTION_PLAN_ID)
      .first();
    
    if (!existingSubPlan) {
      await knex('subscriptionPlan').insert({
        subscriptionPlanId: TEST_SUBSCRIPTION_PLAN_ID,
        subscriptionProductId: TEST_SUBSCRIPTION_PRODUCT_ID,
        name: 'Integration Test Plan',
        billingInterval: 'month',
        billingIntervalCount: 1,
        price: 29.99,
        currency: 'USD',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }).onConflict('subscriptionPlanId').ignore();
    }
  } catch (e) {
    console.log('Skipping subscription seed - table may not exist');
  }

  console.log('Integration test data seeded successfully');
};

// Export test IDs for use in tests
exports.TEST_IDS = {
  TEST_PRODUCT_1_ID,
  TEST_PRODUCT_2_ID,
  TEST_CUSTOMER_ID,
  TEST_CUSTOMER_ADDRESS_ID,
  TEST_CUSTOMER_GROUP_ID,
  TEST_GUEST_BASKET_ID,
  TEST_CUSTOMER_BASKET_ID,
  TEST_CHECKOUT_BASKET_ID,
  TEST_CHECKOUT_ID,
  TEST_B2B_COMPANY_ID,
  TEST_B2B_QUOTE_ID,
  TEST_CONTENT_TYPE_ID,
  TEST_CONTENT_PAGE_ID,
  TEST_CONTENT_BLOCK_ID,
  TEST_CONTENT_TEMPLATE_ID,
  TEST_BLOCK_TYPE_ID,
  TEST_SUBSCRIPTION_PRODUCT_ID,
  TEST_SUBSCRIPTION_PLAN_ID
};
