/**
 * Seed Store Test Data
 * Creates test stores for integration testing
 */

const tableName = 'store';

// Use fixed UUIDs for test stores
const TEST_STORE_IDS = {
  ACTIVE: '20000000-0000-0000-0000-000000000001',
  INACTIVE: '20000000-0000-0000-0000-000000000002',
  FEATURED: '20000000-0000-0000-0000-000000000003',
  MERCHANT: '20000000-0000-0000-0000-000000000004'
};

// Merchant ID (if needed)
const TEST_MERCHANT_ID = '40000000-0000-0000-0000-000000000001';

// Reference business IDs from business seed
const TEST_BUSINESS_IDS = {
  MULTI_STORE: '10000000-0000-0000-0000-000000000001',
  SINGLE_STORE: '10000000-0000-0000-0000-000000000002',
  MARKETPLACE: '10000000-0000-0000-0000-000000000003'
};

exports.seed = async function (knex) {
  // Clean up existing test data
  await knex(tableName).whereIn('storeId', Object.values(TEST_STORE_IDS)).del();

  // Insert test stores
  await knex(tableName).insert([
    {
      storeId: TEST_STORE_IDS.ACTIVE,
      name: 'Active Test Store',
      slug: 'active-test-store',
      storeUrl: 'https://activeteststore.com',
      businessId: TEST_BUSINESS_IDS.MULTI_STORE,
      storeType: 'business_store',
      storeEmail: 'store@activeteststore.com',
      storePhone: '+1-555-0101',
      address: JSON.stringify({
        street1: '123 Main St',
        city: 'Test City',
        state: 'TS',
        postalCode: '12345',
        country: 'US'
      }),
      theme: 'modern',
      primaryColor: '#FF6B6B',
      secondaryColor: '#4ECDC4',
      defaultCurrency: 'USD',
      supportedCurrencies: ['USD', 'EUR', 'GBP'],
      settings: JSON.stringify({
        allowGuestCheckout: true,
        requireAccountForPurchase: false,
        enableWishlist: true,
        enableProductReviews: true,
        enableStoreLocator: false,
        inventoryDisplayMode: 'show_low_stock',
        priceDisplayMode: 'exclusive_tax'
      }),
      storePolicies: JSON.stringify({
        returnPolicy: '30-day return policy for all items',
        shippingPolicy: 'Free shipping over $50',
        privacyPolicy: 'We respect your privacy and data rights'
      }),
      openingHours: JSON.stringify({
        monday: { open: '09:00', close: '17:00' },
        tuesday: { open: '09:00', close: '17:00' },
        wednesday: { open: '09:00', close: '17:00' },
        thursday: { open: '09:00', close: '17:00' },
        friday: { open: '09:00', close: '17:00' },
        saturday: { open: '10:00', close: '16:00' }
      }),
      socialLinks: JSON.stringify({
        facebook: 'https://facebook.com/activeteststore',
        instagram: 'https://instagram.com/activeteststore',
        twitter: 'https://twitter.com/activeteststore'
      }),
      isActive: true,
      isVerified: true,
      isFeatured: false,
      storeRating: 4.2,
      reviewCount: 85,
      followerCount: 1200,
      productCount: 150,
      orderCount: 450,
      createdAt: knex.fn.now(),
      updatedAt: knex.fn.now()
    },
    {
      storeId: TEST_STORE_IDS.INACTIVE,
      name: 'Inactive Test Store',
      slug: 'inactive-test-store',
      storeUrl: 'https://inactiveteststore.com',
      businessId: TEST_BUSINESS_IDS.MULTI_STORE,
      storeType: 'business_store',
      storeEmail: 'store@inactiveteststore.com',
      defaultCurrency: 'USD',
      settings: JSON.stringify({
        allowGuestCheckout: false,
        requireAccountForPurchase: true,
        enableWishlist: false,
        enableProductReviews: false,
        inventoryDisplayMode: 'always_show',
        priceDisplayMode: 'inclusive_tax'
      }),
      isActive: false,
      isVerified: false,
      isFeatured: false,
      storeRating: 3.8,
      reviewCount: 12,
      followerCount: 45,
      productCount: 25,
      orderCount: 67,
      createdAt: knex.fn.now(),
      updatedAt: knex.fn.now()
    },
    {
      storeId: TEST_STORE_IDS.FEATURED,
      name: 'Featured Test Store',
      slug: 'featured-test-store',
      storeUrl: 'https://featuredteststore.com',
      businessId: TEST_BUSINESS_IDS.MULTI_STORE,
      storeType: 'business_store',
      storeEmail: 'store@featuredteststore.com',
      storePhone: '+1-555-0199',
      theme: 'minimal',
      primaryColor: '#2D5AA0',
      secondaryColor: '#F5A623',
      defaultCurrency: 'EUR',
      supportedCurrencies: ['EUR', 'USD'],
      settings: JSON.stringify({
        allowGuestCheckout: true,
        requireAccountForPurchase: false,
        enableWishlist: true,
        enableProductReviews: true,
        enableStoreLocator: true,
        inventoryDisplayMode: 'hide_when_out',
        priceDisplayMode: 'inclusive_tax'
      }),
      socialLinks: JSON.stringify({
        facebook: 'https://facebook.com/featuredteststore',
        instagram: 'https://instagram.com/featuredteststore',
        linkedin: 'https://linkedin.com/company/featuredteststore'
      }),
      isActive: true,
      isVerified: true,
      isFeatured: true,
      storeRating: 4.8,
      reviewCount: 234,
      followerCount: 5600,
      productCount: 320,
      orderCount: 1200,
      createdAt: knex.fn.now(),
      updatedAt: knex.fn.now()
    },
    {
      storeId: TEST_STORE_IDS.MERCHANT,
      name: 'Merchant Test Store',
      slug: 'merchant-test-store',
      storeUrl: 'https://merchantteststore.com',
      storeType: 'merchant_store',
      storeEmail: 'merchant@merchantteststore.com',
      defaultCurrency: 'GBP',
      settings: JSON.stringify({
        allowGuestCheckout: true,
        requireAccountForPurchase: false,
        enableWishlist: true,
        enableProductReviews: true,
        inventoryDisplayMode: 'show_low_stock',
        priceDisplayMode: 'exclusive_tax'
      }),
      isActive: true,
      isVerified: true,
      isFeatured: false,
      storeRating: 4.1,
      reviewCount: 67,
      followerCount: 890,
      productCount: 89,
      orderCount: 234,
      createdAt: knex.fn.now(),
      updatedAt: knex.fn.now()
    }
  ]);
};
