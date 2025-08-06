/**
 * Seed product tags
 * @param { import('knex').Knex } knex
 */
exports.seed = async function(knex) {
  await knex('productTag').del();
  await knex('productTag').insert([
    { name: 'New Arrival', slug: 'new-arrival', isActive: true, isGlobal: true },
    { name: 'Best Seller', slug: 'best-seller', isActive: true, isGlobal: true },
    { name: 'Sale', slug: 'sale', isActive: true, isGlobal: true },
    { name: 'Limited Edition', slug: 'limited-edition', isActive: true, isGlobal: true },
    { name: 'Eco-Friendly', slug: 'eco-friendly', isActive: true, isGlobal: true }
  ]);
};
