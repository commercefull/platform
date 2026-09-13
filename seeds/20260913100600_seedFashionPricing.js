/**
 * Seed Fashion Pricing
 * Creates price lists for UK (GBP) and US (USD) stores.
 * Adds tier pricing rules for some products (buy 3+ get 10% off).
 */

const ORG_ID = '01911000-0000-7000-8000-000000000001';
const { products } = require('./20260913100400_seedFashionProducts.js');

// Fixed price list IDs
const PRICE_LIST = {
  UK_GBP: '32000000-0000-0000-0000-000000000001',
  US_USD: '32000000-0000-0000-0000-000000000002',
};

exports.seed = async function (knex) {
  const now = knex.fn.now();

  // Clean up existing fashion price lists
  await knex('pricingPriceListScope').whereIn('priceListId', Object.values(PRICE_LIST)).del();
  await knex('pricingPriceList').whereIn('priceListId', Object.values(PRICE_LIST)).del();

  // Clean up tier pricing rules
  await knex('pricingRule').where('name', 'like', 'Fashion Tier%').del();

  // Create UK price list (GBP)
  await knex('pricingPriceList').insert({
    priceListId: PRICE_LIST.UK_GBP,
    name: 'UK Retail — GBP',
    description: 'UK store retail prices in GBP',
    priority: 10,
    isActive: true,
    organizationId: ORG_ID,
    type: 'retail',
    createdAt: now,
    updatedAt: now,
  });

  // Create US price list (USD)
  await knex('pricingPriceList').insert({
    priceListId: PRICE_LIST.US_USD,
    name: 'US Retail — USD',
    description: 'US store retail prices in USD',
    priority: 10,
    isActive: true,
    organizationId: ORG_ID,
    type: 'retail',
    createdAt: now,
    updatedAt: now,
  });

  // Create tier pricing rules (buy 3+ get 10% off)
  // Apply to a few featured products
  const featuredSlugs = ['oxford-cotton-shirt', 'organic-cotton-tshirt', 'classic-white-sneakers'];
  const featuredProducts = await knex('product').whereIn('slug', featuredSlugs).pluck('productId');

  if (featuredProducts.length > 0) {
    await knex('pricingRule').insert({
      name: 'Fashion Tier — Buy 3+ Get 10% Off',
      description: 'Buy 3 or more qualifying items and get 10% off',
      ruleType: 'percentage',
      scope: 'product',
      productIds: featuredProducts,
      minimumQuantity: 3,
      priority: 50,
      isActive: true,
      currencyCode: null, // Applies to all currencies
      metadata: JSON.stringify({ discountPercent: 10 }),
      createdAt: now,
      updatedAt: now,
    });

    // Insert adjustment for the tier rule
    const tierRule = await knex('pricingRule').where({ name: 'Fashion Tier — Buy 3+ Get 10% Off' }).first('pricingRuleId');
    if (tierRule) {
      await knex('pricingRuleAdjustment').insert({
        pricingRuleId: tierRule.pricingRuleId,
        type: 'percentage',
        value: 10,
        createdAt: now,
        updatedAt: now,
      });
    }
  }

  console.log('Seeded fashion pricing — UK (GBP) and US (USD) price lists');
};

exports.PRICE_LIST = PRICE_LIST;
