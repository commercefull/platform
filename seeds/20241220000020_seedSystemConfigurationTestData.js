/**
 * Seed SystemConfiguration Test Data
 * Creates test system configurations for integration testing
 */

const tableName = 'systemConfiguration';

// Use fixed UUIDs for test configurations
const TEST_CONFIG_IDS = {
  SINGLE_STORE: '00000000-0000-0000-0000-000000000001',
  MARKETPLACE: '00000000-0000-0000-0000-000000000002',
};

exports.seed = async function (knex) {
  // Clean up existing test data
  await knex(tableName).whereIn('configId', Object.values(TEST_CONFIG_IDS)).del();

  // Insert test system configurations
  await knex(tableName).insert([
    {
      configId: TEST_CONFIG_IDS.SINGLE_STORE,
      systemMode: 'single_store',
      features: JSON.stringify({
        enableMarketplace: false,
        enableMultiStore: false,
        enableMultiWarehouse: false,
        enableProductVariants: true,
        enableInventoryManagement: true,
        enableCoupons: true,
        enableSubscriptions: false,
        enableAnalytics: true,
        enableMultiCurrency: true,
        enableMultiLanguage: true,
        enableGuestCheckout: true,
        enableWishlist: true,
        enableProductReviews: true,
        enableStoreLocator: false,
        enableB2B: false,
      }),
      businessSettings: JSON.stringify({
        defaultBusinessType: 'single_store',
        allowBusinessTypeChanges: false,
        maxStoresPerBusiness: 1,
        maxWarehousesPerBusiness: 1,
        maxMerchantsInMarketplace: 0,
      }),
      platformSettings: JSON.stringify({
        platformName: 'Test Platform',
        platformDomain: 'test.com',
        supportEmail: 'support@test.com',
        defaultCurrency: 'USD',
        defaultLanguage: 'en',
        timezone: 'UTC',
        commissionStructure: {
          defaultCommissionRate: 0,
          commissionType: 'percentage',
        },
      }),
      securitySettings: JSON.stringify({
        enableTwoFactorAuth: false,
        passwordPolicy: {
          minLength: 8,
          requireUppercase: true,
          requireLowercase: true,
          requireNumbers: true,
          requireSpecialChars: false,
        },
        sessionTimeout: 480,
        maxLoginAttempts: 5,
      }),
      notificationSettings: JSON.stringify({
        emailEnabled: true,
        smsEnabled: false,
        pushEnabled: false,
        defaultTemplates: {
          orderConfirmation: true,
          shippingUpdate: true,
          passwordReset: true,
          accountVerification: true,
        },
      }),
      integrationSettings: JSON.stringify({
        paymentGateways: ['stripe'],
        shippingProviders: ['fedex', 'ups', 'usps'],
        analyticsProviders: ['google_analytics'],
        emailProviders: ['sendgrid'],
      }),
      isActive: true,
      createdAt: knex.fn.now(),
      updatedAt: knex.fn.now(),
    },
    {
      configId: TEST_CONFIG_IDS.MARKETPLACE,
      systemMode: 'marketplace',
      features: JSON.stringify({
        enableMarketplace: true,
        enableMultiStore: false,
        enableMultiWarehouse: true,
        enableProductVariants: true,
        enableInventoryManagement: true,
        enableCoupons: true,
        enableSubscriptions: true,
        enableAnalytics: true,
        enableMultiCurrency: true,
        enableMultiLanguage: true,
        enableGuestCheckout: true,
        enableWishlist: true,
        enableProductReviews: true,
        enableStoreLocator: false,
        enableB2B: true,
      }),
      businessSettings: JSON.stringify({
        defaultBusinessType: 'marketplace',
        allowBusinessTypeChanges: true,
        maxStoresPerBusiness: 1,
        maxWarehousesPerBusiness: 5,
        maxMerchantsInMarketplace: 1000,
      }),
      platformSettings: JSON.stringify({
        platformName: 'Marketplace Platform',
        platformDomain: 'marketplace.com',
        supportEmail: 'support@marketplace.com',
        defaultCurrency: 'EUR',
        defaultLanguage: 'en',
        timezone: 'Europe/London',
        commissionStructure: {
          defaultCommissionRate: 15,
          commissionType: 'percentage',
        },
      }),
      securitySettings: JSON.stringify({
        enableTwoFactorAuth: true,
        passwordPolicy: {
          minLength: 12,
          requireUppercase: true,
          requireLowercase: true,
          requireNumbers: true,
          requireSpecialChars: true,
        },
        sessionTimeout: 240,
        maxLoginAttempts: 3,
      }),
      notificationSettings: JSON.stringify({
        emailEnabled: true,
        smsEnabled: true,
        pushEnabled: true,
        defaultTemplates: {
          orderConfirmation: true,
          shippingUpdate: true,
          passwordReset: true,
          accountVerification: true,
        },
      }),
      integrationSettings: JSON.stringify({
        paymentGateways: ['stripe', 'paypal'],
        shippingProviders: ['fedex', 'ups', 'usps', 'dhl'],
        analyticsProviders: ['google_analytics', 'segment'],
        emailProviders: ['sendgrid', 'mailgun'],
      }),
      isActive: true,
      createdAt: knex.fn.now(),
      updatedAt: knex.fn.now(),
    },
  ]);
};
