/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  const sampleMerchant = await knex('merchant').where({ slug: 'sample-merchant' }).first();

  if (sampleMerchant) {
    await knex('merchantStore').insert({
      merchantId: sampleMerchant.merchantId,
      name: 'Sample Merchant Store',
      slug: 'sample-merchant-store',
      description: 'This is a sample merchant store for demonstration purposes',
      shortDescription: 'Sample store with great products',
      isActive: true,
      isVerified: true,
      storeEmail: 'store@example.com',
      storePhone: '555-123-4567',
    });

    await knex('merchantShippingTemplate').insert({
      merchantId: sampleMerchant.merchantId,
      name: 'Standard Shipping',
      description: 'Standard flat rate shipping with free shipping over $50',
      isDefault: true,
      isActive: true,
      flatRate: 5.99,
      freeShippingThreshold: 50.00,
      processingTime: 2,
      rulesType: 'flat',
    });
  }
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  const sampleMerchant = await knex('merchant').where({ slug: 'sample-merchant' }).first();

  if (sampleMerchant) {
    await knex('merchantStore').where({ merchantId: sampleMerchant.merchantId, slug: 'sample-merchant-store' }).del();
    await knex('merchantShippingTemplate').where({ merchantId: sampleMerchant.merchantId, name: 'Standard Shipping' }).del();
  }
};

exports.seed = async function (knex) {
  await exports.down(knex);
  return exports.up(knex);
};
