/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  // Insert business
  await knex('business').insert([
    {
      businessId: '019b3dd7-d9b9-7fc1-9f98-e69fb8eca01e',
      name: 'CommerceFull Platform',
      slug: 'commercefull-platform',
      description: 'Default business for CommerceFull platform operations',
      domain: 'commercefull.com',
      businessType: 'marketplace',
      allowMultipleStores: true,
      allowMultipleWarehouses: true,
      enableMarketplace: true,
      defaultCurrency: 'USD',
      defaultLanguage: 'en',
      timezone: 'UTC',
      isActive: true,
      createdAt: knex.fn.now(),
      updatedAt: knex.fn.now()
    }
  ]);
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  // Delete business
  await knex('business').where('businessId', '019b3dd7-d9b9-7fc1-9f98-e69fb8eca01e').del();
};