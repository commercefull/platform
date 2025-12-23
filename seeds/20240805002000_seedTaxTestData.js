/**
 * Tax Test Data Seed
 * Seeds test data for tax integration tests
 */

// Fixed UUIDs for test data consistency
const TAX_CATEGORY_IDS = {
  STANDARD: '0193a000-0000-7000-8000-000000000001',
  REDUCED: '0193a000-0000-7000-8000-000000000002',
  ZERO: '0193a000-0000-7000-8000-000000000003',
  EXEMPT: '0193a000-0000-7000-8000-000000000004',
};

const TAX_ZONE_IDS = {
  US_DOMESTIC: '0193a001-0000-7000-8000-000000000001',
  US_CALIFORNIA: '0193a001-0000-7000-8000-000000000002',
  EU_STANDARD: '0193a001-0000-7000-8000-000000000003',
  UK: '0193a001-0000-7000-8000-000000000004',
};

const TAX_RATE_IDS = {
  US_STANDARD: '0193a002-0000-7000-8000-000000000001',
  US_CA_STATE: '0193a002-0000-7000-8000-000000000002',
  EU_VAT_STANDARD: '0193a002-0000-7000-8000-000000000003',
  UK_VAT: '0193a002-0000-7000-8000-000000000004',
  ZERO_RATE: '0193a002-0000-7000-8000-000000000005',
};

const TAX_RULE_IDS = {
  ELECTRONICS: '0193a003-0000-7000-8000-000000000001',
  FOOD: '0193a003-0000-7000-8000-000000000002',
};

const TAX_SETTINGS_IDS = {
  DEFAULT: '0193a004-0000-7000-8000-000000000001',
};

// Test merchant ID (should exist from merchant seeds)
const TEST_MERCHANT_ID = '01911000-0000-7000-8000-000000000001';

exports.seed = async function (knex) {
  // Clean up existing test data in reverse order of dependencies
  await knex('taxRule')
    .whereIn('taxRuleId', Object.values(TAX_RULE_IDS))
    .del()
    .catch(() => {});
  await knex('taxRate')
    .whereIn('taxRateId', Object.values(TAX_RATE_IDS))
    .del()
    .catch(() => {});
  await knex('taxSettings')
    .whereIn('taxSettingsId', Object.values(TAX_SETTINGS_IDS))
    .del()
    .catch(() => {});
  await knex('taxZone')
    .whereIn('taxZoneId', Object.values(TAX_ZONE_IDS))
    .del()
    .catch(() => {});
  await knex('taxCategory')
    .whereIn('taxCategoryId', Object.values(TAX_CATEGORY_IDS))
    .del()
    .catch(() => {});

  // Seed Tax Categories (use test- prefix to avoid conflicts with base seeds)
  await knex('taxCategory').insert([
    {
      taxCategoryId: TAX_CATEGORY_IDS.STANDARD,
      name: 'Test Standard Rate',
      code: 'test-standard',
      description: 'Standard tax rate for most products (test)',
      isDefault: false,
      sortOrder: 101,
      isActive: true,
    },
    {
      taxCategoryId: TAX_CATEGORY_IDS.REDUCED,
      name: 'Test Reduced Rate',
      code: 'test-reduced',
      description: 'Reduced tax rate for specific product categories (test)',
      isDefault: false,
      sortOrder: 102,
      isActive: true,
    },
    {
      taxCategoryId: TAX_CATEGORY_IDS.ZERO,
      name: 'Test Zero Rate',
      code: 'test-zero',
      description: 'Zero tax rate for exempt products (test)',
      isDefault: false,
      sortOrder: 103,
      isActive: true,
    },
    {
      taxCategoryId: TAX_CATEGORY_IDS.EXEMPT,
      name: 'Test Tax Exempt',
      code: 'test-exempt',
      description: 'Fully tax exempt items (test)',
      isDefault: false,
      sortOrder: 104,
      isActive: true,
    },
  ]);

  // Seed Tax Zones (use test- prefix to avoid conflicts)
  await knex('taxZone').insert([
    {
      taxZoneId: TAX_ZONE_IDS.US_DOMESTIC,
      name: 'Test United States',
      code: 'TEST-US',
      description: 'All US states (test)',
      isDefault: false,
      countries: JSON.stringify(['US']),
      isActive: true,
    },
    {
      taxZoneId: TAX_ZONE_IDS.US_CALIFORNIA,
      name: 'Test California',
      code: 'TEST-US-CA',
      description: 'California state (test)',
      isDefault: false,
      countries: JSON.stringify(['US']),
      states: JSON.stringify(['CA']),
      isActive: true,
    },
    {
      taxZoneId: TAX_ZONE_IDS.EU_STANDARD,
      name: 'Test European Union',
      code: 'TEST-EU',
      description: 'EU member states (test)',
      isDefault: false,
      countries: JSON.stringify(['DE', 'FR', 'IT', 'ES', 'NL', 'BE', 'AT', 'PT', 'IE', 'PL']),
      isActive: true,
    },
    {
      taxZoneId: TAX_ZONE_IDS.UK,
      name: 'Test United Kingdom',
      code: 'TEST-GB',
      description: 'United Kingdom (test)',
      isDefault: false,
      countries: JSON.stringify(['GB']),
      isActive: true,
    },
  ]);

  // Seed Tax Rates
  const now = new Date();
  await knex('taxRate').insert([
    {
      taxRateId: TAX_RATE_IDS.US_STANDARD,
      taxCategoryId: TAX_CATEGORY_IDS.STANDARD,
      taxZoneId: TAX_ZONE_IDS.US_DOMESTIC,
      name: 'US Standard Sales Tax',
      rate: 7.25,
      type: 'percentage',
      priority: 1,
      isCompound: false,
      includeInPrice: false,
      isShippingTaxable: true,
      startDate: now,
      isActive: true,
    },
    {
      taxRateId: TAX_RATE_IDS.US_CA_STATE,
      taxCategoryId: TAX_CATEGORY_IDS.STANDARD,
      taxZoneId: TAX_ZONE_IDS.US_CALIFORNIA,
      name: 'California State Tax',
      rate: 9.5,
      type: 'percentage',
      priority: 2,
      isCompound: false,
      includeInPrice: false,
      isShippingTaxable: true,
      startDate: now,
      isActive: true,
    },
    {
      taxRateId: TAX_RATE_IDS.EU_VAT_STANDARD,
      taxCategoryId: TAX_CATEGORY_IDS.STANDARD,
      taxZoneId: TAX_ZONE_IDS.EU_STANDARD,
      name: 'EU VAT Standard',
      rate: 20.0,
      type: 'percentage',
      priority: 1,
      isCompound: false,
      includeInPrice: true,
      isShippingTaxable: true,
      startDate: now,
      isActive: true,
    },
    {
      taxRateId: TAX_RATE_IDS.UK_VAT,
      taxCategoryId: TAX_CATEGORY_IDS.STANDARD,
      taxZoneId: TAX_ZONE_IDS.UK,
      name: 'UK VAT',
      rate: 20.0,
      type: 'percentage',
      priority: 1,
      isCompound: false,
      includeInPrice: true,
      isShippingTaxable: true,
      startDate: now,
      isActive: true,
    },
    {
      taxRateId: TAX_RATE_IDS.ZERO_RATE,
      taxCategoryId: TAX_CATEGORY_IDS.ZERO,
      taxZoneId: TAX_ZONE_IDS.US_DOMESTIC,
      name: 'Zero Rate',
      rate: 0,
      type: 'percentage',
      priority: 1,
      isCompound: false,
      includeInPrice: false,
      isShippingTaxable: false,
      startDate: now,
      isActive: true,
    },
  ]);

  // Seed Tax Rules
  await knex('taxRule').insert([
    {
      taxRuleId: TAX_RULE_IDS.ELECTRONICS,
      taxRateId: TAX_RATE_IDS.US_STANDARD,
      name: 'Electronics Tax Rule',
      description: 'Standard tax for electronics category',
      conditionType: 'category',
      conditionValue: JSON.stringify({ categoryCode: 'electronics' }),
      sortOrder: 1,
      isActive: true,
    },
    {
      taxRuleId: TAX_RULE_IDS.FOOD,
      taxRateId: TAX_RATE_IDS.ZERO_RATE,
      name: 'Food Tax Exemption',
      description: 'Zero tax for food items',
      conditionType: 'category',
      conditionValue: JSON.stringify({ categoryCode: 'food' }),
      sortOrder: 2,
      isActive: true,
    },
  ]);

  // Check if test merchant exists before seeding tax settings
  const merchantExists = await knex('merchant').where('merchantId', TEST_MERCHANT_ID).first();

  if (merchantExists) {
    await knex('taxSettings').insert([
      {
        taxSettingsId: TAX_SETTINGS_IDS.DEFAULT,
        merchantId: TEST_MERCHANT_ID,
        calculationMethod: 'unitBased',
        pricesIncludeTax: false,
        displayPricesWithTax: false,
        taxBasedOn: 'shippingAddress',
        displayTaxTotals: 'itemized',
        applyTaxToShipping: true,
        applyDiscountBeforeTax: true,
        roundTaxAtSubtotal: false,
        taxDecimalPlaces: 2,
        defaultTaxCategory: TAX_CATEGORY_IDS.STANDARD,
        defaultTaxZone: TAX_ZONE_IDS.US_DOMESTIC,
      },
    ]);
    console.log('Tax test data seeded successfully (with settings)');
  } else {
    console.log('Tax test data seeded (without settings - merchant not found)');
  }
};
