/**
 * Seed tax categories
 * @param { import('knex').Knex } knex
 */
exports.seed = async function(knex) {
  await knex('taxCategory').del();
  await knex('taxCategory').insert([
    { name: 'Standard Rate', code: 'standard', description: 'Standard tax rate for most products', isDefault: true, isActive: true },
    { name: 'Reduced Rate', code: 'reduced', description: 'Reduced tax rate for specific product categories', isDefault: false, isActive: true },
    { name: 'Zero Rate', code: 'zero', description: 'Zero tax rate for exempt products', isDefault: false, isActive: true }
  ]);
};
