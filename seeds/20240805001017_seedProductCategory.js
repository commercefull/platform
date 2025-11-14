/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex('productCategory').insert([
    {
      name: 'All Products',
      slug: 'all-products',
      description: 'Root category for all products',
      isActive: true,
      includeInMenu: true,
      depth: 0,
      path: '/'
    },
    {
      name: 'Electronics',
      slug: 'electronics',
      description: 'Electronic devices and accessories',
      isActive: true,
      includeInMenu: true,
      depth: 1,
      path: '/electronics'
    },
    {
      name: 'Apparel',
      slug: 'apparel',
      description: 'Clothing and accessories',
      isActive: true,
      includeInMenu: true,
      depth: 1,
      path: '/apparel'
    },
    {
      name: 'Home & Garden',
      slug: 'home-garden',
      description: 'Home decoration and garden supplies',
      isActive: true,
      includeInMenu: true,
      depth: 1,
      path: '/home-garden'
    }
  ]);
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex('productCategory').whereIn('slug', ['all-products', 'electronics', 'apparel', 'home-garden']).delete();
};

exports.seed = async function (knex) {
  await exports.down(knex);
  return exports.up(knex);
};
