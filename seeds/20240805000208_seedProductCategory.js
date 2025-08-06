/**
 * Seed product categories
 * @param { import('knex').Knex } knex
 */
exports.seed = async function(knex) {
  await knex('productCategory').del();
  await knex('productCategory').insert([
    { name: 'Electronics', slug: 'electronics', description: 'Shop our wide range of electronic products including smartphones, laptops, and accessories.', isActive: true, isFeatured: true, includeInMenu: true, path: null, depth: 0, position: 0, isGlobal: true },
    { name: 'Fashion', slug: 'fashion', description: 'Discover the latest trends in clothing, shoes, and accessories.', isActive: true, isFeatured: true, includeInMenu: true, path: null, depth: 0, position: 1, isGlobal: true },
    { name: 'Home & Garden', slug: 'home-garden', description: 'Everything you need for your home and garden.', isActive: true, isFeatured: false, includeInMenu: true, path: null, depth: 0, position: 2, isGlobal: true },
    { name: 'Sports & Outdoors', slug: 'sports-outdoors', description: 'Gear up for your next adventure with our sports and outdoor products.', isActive: true, isFeatured: false, includeInMenu: true, path: null, depth: 0, position: 3, isGlobal: true }
  ]);
};
