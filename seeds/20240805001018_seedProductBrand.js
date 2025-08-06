/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex('product_brand').insert([
    {
      name: 'Generic',
      slug: 'generic',
      description: 'Generic/unbranded products',
      is_active: true,
      is_featured: false
    },
    {
      name: 'Sample Brand',
      slug: 'sample-brand',
      description: 'Sample brand for testing',
      is_active: true,
      is_featured: true
    }
  ]);
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex('product_brand').whereIn('slug', ['generic', 'sample-brand']).delete();
};
