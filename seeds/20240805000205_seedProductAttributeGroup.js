/**
 * Seed product attribute groups
 * @param { import('knex').Knex } knex
 */
exports.seed = async function(knex) {
  // Delete dependent records first to avoid foreign key constraint violations
  await knex('productAttribute').del().catch(() => {});
  await knex('productAttributeGroup').del();
  
  await knex('productAttributeGroup').insert([
    { name: 'General', code: 'general', description: 'General product attributes', position: 1, isComparable: true, isGlobal: true },
    { name: 'Technical', code: 'technical', description: 'Technical specifications', position: 2, isComparable: true, isGlobal: true },
    { name: 'Physical', code: 'physical', description: 'Physical characteristics like size, weight', position: 3, isComparable: true, isGlobal: true },
    { name: 'Visual', code: 'visual', description: 'Visual properties like color', position: 4, isComparable: true, isGlobal: true }
  ]);
};
