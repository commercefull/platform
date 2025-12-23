/**
 * Seed pricing test data
 * Creates test products and pricing-related data for integration tests
 * @param { import('knex').Knex } knex
 */

// Fixed UUIDs for test data - these match the test expectations
const TEST_PRODUCT_IDS = [
  '10000000-0000-0000-0000-000000000001',
  '10000000-0000-0000-0000-000000000002',
  '10000000-0000-0000-0000-000000000003'
];

const TEST_PRICE_LIST_ID = '00000000-0000-0000-0000-000000000010';
const TEST_PRICING_RULE_ID = '00000000-0000-0000-0000-000000000020';

exports.seed = async function(knex) {
  // Get brand and category IDs for product creation
  const genericBrand = await knex('productBrand').where({ slug: 'generic' }).first('productBrandId');
  const electronicsCategory = await knex('productCategory').where({ slug: 'electronics' }).first('productCategoryId');

  // Clean up existing test data (in reverse order of dependencies)
  // First clean up any order items referencing these products
  await knex('orderItem').whereIn('productId', TEST_PRODUCT_IDS).delete().catch(() => {});
  await knex('basketItem').whereIn('productId', TEST_PRODUCT_IDS).delete().catch(() => {});
  await knex('customerPrice').whereIn('productId', TEST_PRODUCT_IDS).delete().catch(() => {});
  await knex('tierPrice').whereIn('productId', TEST_PRODUCT_IDS).delete().catch(() => {});
  await knex('productCategoryMap').whereIn('productId', TEST_PRODUCT_IDS).delete().catch(() => {});
  await knex('productVariant').whereIn('productId', TEST_PRODUCT_IDS).delete().catch(() => {});
  await knex('product').whereIn('productId', TEST_PRODUCT_IDS).delete().catch(() => {});
  await knex('priceList').where('priceListId', TEST_PRICE_LIST_ID).delete().catch(() => {});
  await knex('pricingRule').where('pricingRuleId', TEST_PRICING_RULE_ID).delete().catch(() => {});

  // Create test products with fixed UUIDs
  const testProducts = TEST_PRODUCT_IDS.map((productId, index) => ({
    productId,
    sku: `PRICING-TEST-${index + 1}`,
    name: `Test Pricing Product ${index + 1}`,
    slug: `pricing-test-product-${index + 1}`,
    description: `Test product for pricing integration tests (${index + 1})`,
    shortDescription: `Test pricing product ${index + 1}`,
    brandId: genericBrand.productBrandId,
    type: 'simple',
    status: 'active',
    visibility: 'visible',
    price: 99.99 + (index * 10),
    weight: 500,
    weightUnit: 'g',
    isInventoryManaged: true,
    isFeatured: false,
    isNew: false,
    isBestseller: false,
    hasVariants: false
  }));

  await knex('product').insert(testProducts);

  // Link products to category
  const categoryMappings = TEST_PRODUCT_IDS.map((productId, index) => ({
    productId,
    productCategoryId: electronicsCategory.productCategoryId,
    isPrimary: index === 0
  }));

  await knex('productCategoryMap').insert(categoryMappings);

  // Create a test price list
  await knex('priceList').insert({
    priceListId: TEST_PRICE_LIST_ID,
    name: 'Test Price List',
    description: 'Price list for integration tests',
    priority: 1,
    isActive: true
  });

  // Create a test pricing rule with currency_conversion type
  await knex('pricingRule').insert({
    pricingRuleId: TEST_PRICING_RULE_ID,
    name: 'Test Currency Price Rule',
    description: 'Pricing rule for currency conversion tests',
    ruleType: 'percentage',
    scope: 'global',
    priority: 1,
    isActive: true
  });

  
};

exports.up = exports.seed;

exports.down = async function(knex) {
  // Clean up test data
  await knex('customerPrice').whereIn('productId', TEST_PRODUCT_IDS).delete();
  await knex('tierPrice').whereIn('productId', TEST_PRODUCT_IDS).delete();
  await knex('productCategoryMap').whereIn('productId', TEST_PRODUCT_IDS).delete();
  await knex('product').whereIn('productId', TEST_PRODUCT_IDS).delete();
  await knex('priceList').where('priceListId', TEST_PRICE_LIST_ID).delete();
  await knex('pricingRule').where('pricingRuleId', TEST_PRICING_RULE_ID).delete();
};
