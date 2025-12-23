/**
 * Seed Business Test Data
 * Creates test businesses for integration testing
 */

const tableName = 'business';

// Use fixed UUIDs for test businesses
const TEST_BUSINESS_IDS = {
  MULTI_STORE: '10000000-0000-0000-0000-000000000001',
  SINGLE_STORE: '10000000-0000-0000-0000-000000000002',
  MARKETPLACE: '10000000-0000-0000-0000-000000000003',
};

exports.seed = async function (knex) {
  // Clean up existing test data - stores first due to foreign key constraints
  await knex('store').whereIn('businessId', Object.values(TEST_BUSINESS_IDS)).del();
  await knex(tableName).whereIn('businessId', Object.values(TEST_BUSINESS_IDS)).del();

  // Insert test businesses
  await knex(tableName).insert([
    {
      businessId: TEST_BUSINESS_IDS.MULTI_STORE,
      name: 'Store Test Business',
      slug: 'store-test-business',
      domain: 'storetestbusiness.com',
      businessType: 'multi_store',
      allowMultipleStores: true,
      allowMultipleWarehouses: true,
      enableMarketplace: false,
      defaultCurrency: 'USD',
      defaultLanguage: 'en',
      timezone: 'America/New_York',
      isActive: true,
      createdAt: knex.fn.now(),
      updatedAt: knex.fn.now(),
    },
    {
      businessId: TEST_BUSINESS_IDS.SINGLE_STORE,
      name: 'Single Store Business',
      slug: 'single-store-business',
      domain: 'singlestore.com',
      businessType: 'single_store',
      allowMultipleStores: false,
      allowMultipleWarehouses: false,
      enableMarketplace: false,
      defaultCurrency: 'CAD',
      defaultLanguage: 'en',
      timezone: 'America/Toronto',
      isActive: true,
      createdAt: knex.fn.now(),
      updatedAt: knex.fn.now(),
    },
    {
      businessId: TEST_BUSINESS_IDS.MARKETPLACE,
      name: 'Marketplace Business',
      slug: 'marketplace-business',
      domain: 'marketplacebiz.com',
      businessType: 'marketplace',
      allowMultipleStores: true,
      allowMultipleWarehouses: true,
      enableMarketplace: true,
      defaultCurrency: 'EUR',
      defaultLanguage: 'de',
      timezone: 'Europe/Berlin',
      isActive: true,
      createdAt: knex.fn.now(),
      updatedAt: knex.fn.now(),
    },
  ]);
};
