/**
 * Seed Multi-Store Data
 * Creates UK and US stores for the multi-brand fashion merchant.
 *
 * Each store has its own:
 *   - Currency (GBP / USD)
 *   - Tax display mode (inclusive / exclusive)
 *   - Locale (en-GB / en-US)
 *   - Warehouse (for store-specific inventory)
 */

const tableName = 'store';

// Fixed UUIDs for the two stores
const STORE_IDS = {
  UK: '30000000-0000-0000-0000-000000000001',
  US: '30000000-0000-0000-0000-000000000002',
};

// Reference organization ID from organization seed
const ORG_ID = '01911000-0000-7000-8000-000000000001';

exports.seed = async function (knex) {
  // Clean up existing multi-store data
  await knex(tableName).whereIn('storeId', Object.values(STORE_IDS)).del();

  await knex(tableName).insert([
    {
      storeId: STORE_IDS.UK,
      name: 'Commercefull UK',
      slug: 'uk',
      storeUrl: 'https://uk.shop.example.com',
      organizationId: ORG_ID,
      storeType: 'organization_store',
      isHeadquarters: false,
      storeEmail: 'support@uk.shop.example.com',
      storePhone: '+44 20 7946 0000',
      description: 'Premium multi-brand fashion — United Kingdom store',
      address: JSON.stringify({
        street1: '1 Oxford Street',
        city: 'London',
        state: 'London',
        postalCode: 'W1D 1AN',
        country: 'GB',
      }),
      defaultCurrency: 'GBP',
      supportedCurrencies: ['GBP', 'EUR', 'USD'],
      isActive: true,
      isVerified: true,
      isFeatured: true,
      settings: JSON.stringify({
        allowGuestCheckout: true,
        requireAccountForPurchase: false,
        enableWishlist: true,
        enableProductReviews: true,
        enableStoreLocator: false,
        inventoryDisplayMode: 'show_low_stock',
        priceDisplayMode: 'inclusive_tax',
      }),
      metaTitle: 'Commercefull UK — Premium Multi-Brand Fashion',
      metaDescription: 'Shop premium fashion brands across menswear, womenswear, and accessories.',
      socialLinks: JSON.stringify({
        instagram: 'https://instagram.com/commercefull_uk',
        facebook: 'https://facebook.com/commercefull_uk',
        twitter: 'https://twitter.com/commercefull_uk',
      }),
    },
    {
      storeId: STORE_IDS.US,
      name: 'Commercefull US',
      slug: 'us',
      storeUrl: 'https://us.shop.example.com',
      organizationId: ORG_ID,
      storeType: 'organization_store',
      isHeadquarters: false,
      storeEmail: 'support@us.shop.example.com',
      storePhone: '+1-800-555-0100',
      description: 'Premium multi-brand fashion — United States store',
      address: JSON.stringify({
        street1: '350 5th Ave',
        city: 'New York',
        state: 'NY',
        postalCode: '10118',
        country: 'US',
      }),
      defaultCurrency: 'USD',
      supportedCurrencies: ['USD', 'GBP', 'EUR'],
      isActive: true,
      isVerified: true,
      isFeatured: true,
      settings: JSON.stringify({
        allowGuestCheckout: true,
        requireAccountForPurchase: false,
        enableWishlist: true,
        enableProductReviews: true,
        enableStoreLocator: false,
        inventoryDisplayMode: 'show_low_stock',
        priceDisplayMode: 'exclusive_tax',
      }),
      metaTitle: 'Commercefull US — Premium Multi-Brand Fashion',
      metaDescription: 'Shop premium fashion brands across menswear, womenswear, and accessories.',
      socialLinks: JSON.stringify({
        instagram: 'https://instagram.com/commercefull_us',
        facebook: 'https://facebook.com/commercefull_us',
        twitter: 'https://twitter.com/commercefull_us',
      }),
    },
  ]);

  // Also create store-specific warehouses
  const warehouseTable = 'distributionWarehouse';
  const WAREHOUSE_IDS = {
    UK: '30000000-0000-7000-8000-000000000001',
    US: '30000000-0000-7000-8000-000000000002',
  };

  await knex(warehouseTable).whereIn('distributionWarehouseId', Object.values(WAREHOUSE_IDS)).del();

  await knex(warehouseTable).insert([
    {
      distributionWarehouseId: WAREHOUSE_IDS.UK,
      name: 'UK Fulfillment Centre',
      code: 'UK-FC-01',
      description: 'Primary UK distribution warehouse',
      isActive: true,
      isDefault: true,
      isFulfillmentCenter: true,
      isReturnCenter: true,
      storeId: STORE_IDS.UK,
      addressLine1: '1 Oxford Street',
      city: 'London',
      state: 'London',
      postalCode: 'W1D 1AN',
      country: 'GB',
      timezone: 'Europe/London',
    },
    {
      distributionWarehouseId: WAREHOUSE_IDS.US,
      name: 'US Fulfillment Centre',
      code: 'US-FC-01',
      description: 'Primary US distribution warehouse',
      isActive: true,
      isDefault: true,
      isFulfillmentCenter: true,
      isReturnCenter: true,
      storeId: STORE_IDS.US,
      addressLine1: '350 5th Ave',
      city: 'New York',
      state: 'NY',
      postalCode: '10118',
      country: 'US',
      timezone: 'America/New_York',
    },
  ]);
};

exports.STORE_IDS = STORE_IDS;
exports.WAREHOUSE_IDS = {
  UK: '30000000-0000-7000-8000-000000000001',
  US: '30000000-0000-7000-8000-000000000002',
};
