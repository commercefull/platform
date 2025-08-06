/**
 * Seed tax categories
 * @param { import('knex').Knex } knex
 */
exports.seed = async function(knex) {
  await knex('tax_category').del();
  await knex('tax_category').insert([
    { name: 'Standard Rate', code: 'standard', description: 'Standard tax rate for most products', is_default: true, is_active: true },
    { name: 'Reduced Rate', code: 'reduced', description: 'Reduced tax rate for specific product categories', is_default: false, is_active: true },
    { name: 'Zero Rate', code: 'zero', description: 'Zero tax rate for exempt products', is_default: false, is_active: true }
  ]);
};
