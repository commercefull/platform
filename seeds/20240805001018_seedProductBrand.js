/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex('productBrand').insert([
    {
      name: 'Generic',
      slug: 'generic',
      description: 'Generic/unbranded products',
      isActive: true,
      isFeatured: false
    },
    {
      name: 'Sample Brand',
      slug: 'sample-brand',
      description: 'Sample brand for testing',
      isActive: true,
      isFeatured: true
    }
  ]);
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex('productBrand').whereIn('slug', ['generic', 'sample-brand']).delete();
};

exports.seed = async function (knex) {
  const brands = [
    {
      name: 'Generic',
      slug: 'generic',
      description: 'Generic/unbranded products',
      isActive: true,
      isFeatured: false
    },
    {
      name: 'Sample Brand',
      slug: 'sample-brand',
      description: 'Sample brand for testing',
      isActive: true,
      isFeatured: true
    }
  ];

  for (const brand of brands) {
    await knex('productBrand')
      .insert(brand)
      .onConflict('slug')
      .merge();
  }
};
