/**
 * Seed product types for dynamic product attribution
 * @param { import('knex').Knex } knex
 */
exports.seed = async function (knex) {
  // Define product types that support different product configurations
  const productTypes = [
    {
      name: 'Simple Product',
      slug: 'simple',
    },
    {
      name: 'Configurable Product',
      slug: 'configurable',
    },
    {
      name: 'Virtual Product',
      slug: 'virtual',
    },
    {
      name: 'Downloadable Product',
      slug: 'downloadable',
    },
    {
      name: 'Bundle Product',
      slug: 'bundle',
    },
    {
      name: 'Grouped Product',
      slug: 'grouped',
    },
    {
      name: 'Subscription Product',
      slug: 'subscription',
    },
  ];

  for (const productType of productTypes) {
    await knex('productType').insert(productType).onConflict('slug').merge();
  }
};
