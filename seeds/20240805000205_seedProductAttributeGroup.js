/**
 * Seed product attribute groups
 * @param { import('knex').Knex } knex
 */
exports.seed = async function(knex) {
  await knex('product_attribute_group').del();
  await knex('product_attribute_group').insert([
    { name: 'General', code: 'general', description: 'General product attributes', position: 1, isComparable: true, isGlobal: true },
    { name: 'Technical', code: 'technical', description: 'Technical specifications', position: 2, isComparable: true, isGlobal: true },
    { name: 'Physical', code: 'physical', description: 'Physical characteristics like size, weight', position: 3, isComparable: true, isGlobal: true },
    { name: 'Visual', code: 'visual', description: 'Visual properties like color', position: 4, isComparable: true, isGlobal: true }
  ]);
};
