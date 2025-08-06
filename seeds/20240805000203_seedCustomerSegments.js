/**
 * Seed customer segments
 * @param { import('knex').Knex } knex
 */
exports.seed = async function(knex) {
  await knex('customerSegments').del();
  await knex('customerSegments').insert([
    { name: 'New Customers', description: 'Customers who registered in the last 30 days', isActive: true, isAutomatic: true, priority: 10 },
    { name: 'Active Customers', description: 'Customers who ordered in the last 90 days', isActive: true, isAutomatic: true, priority: 20 },
    { name: 'At-Risk Customers', description: 'Previously active customers with no recent orders', isActive: true, isAutomatic: true, priority: 30 },
    { name: 'VIP Customers', description: 'Top spending customers', isActive: true, isAutomatic: true, priority: 40 },
    { name: 'One-Time Buyers', description: 'Customers with exactly one purchase', isActive: true, isAutomatic: true, priority: 50 },
    { name: 'Repeat Customers', description: 'Customers with more than one purchase', isActive: true, isAutomatic: true, priority: 60 }
  ]);
};
