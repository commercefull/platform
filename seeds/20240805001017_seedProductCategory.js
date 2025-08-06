/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex('product_category').insert([
    {
      name: 'All Products',
      slug: 'all-products',
      description: 'Root category for all products',
      is_active: true,
      is_visible: true,
      level: 0,
      path: '/'
    },
    {
      name: 'Electronics',
      slug: 'electronics',
      description: 'Electronic devices and accessories',
      is_active: true,
      is_visible: true,
      level: 1,
      path: '/electronics'
    },
    {
      name: 'Apparel',
      slug: 'apparel',
      description: 'Clothing and accessories',
      is_active: true,
      is_visible: true,
      level: 1,
      path: '/apparel'
    },
    {
      name: 'Home & Garden',
      slug: 'home-garden',
      description: 'Home decoration and garden supplies',
      is_active: true,
      is_visible: true,
      level: 1,
      path: '/home-garden'
    }
  ]);
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex('product_category').whereIn('slug', ['all-products', 'electronics', 'apparel', 'home-garden']).delete();
};
