/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex('shipping_method').insert([
    { name: 'Standard Shipping', code: 'STANDARD', description: 'Standard shipping option (3-5 business days)', is_active: true, is_default: true, domestic_international: 'both', estimated_delivery_days: JSON.stringify({min: 3, max: 5}), priority: 10 },
    { name: 'Express Shipping', code: 'EXPRESS', description: 'Express shipping option (1-2 business days)', is_active: true, is_default: false, domestic_international: 'both', estimated_delivery_days: JSON.stringify({min: 1, max: 2}), priority: 20 },
    { name: 'Free Shipping', code: 'FREE', description: 'Free shipping on qualifying orders', is_active: true, is_default: false, domestic_international: 'domestic', estimated_delivery_days: JSON.stringify({min: 3, max: 7}), priority: 5 },
    { name: 'In-Store Pickup', code: 'PICKUP', description: 'Pickup at store location', is_active: true, is_default: false, domestic_international: 'domestic', estimated_delivery_days: JSON.stringify({min: 0, max: 1}), priority: 30 },
    { name: 'International Standard', code: 'INTL_STD', description: 'International standard shipping (7-14 business days)', is_active: true, is_default: false, domestic_international: 'international', estimated_delivery_days: JSON.stringify({min: 7, max: 14}), priority: 40 },
    { name: 'International Express', code: 'INTL_EXP', description: 'International express shipping (3-5 business days)', is_active: true, is_default: false, domestic_international: 'international', estimated_delivery_days: JSON.stringify({min: 3, max: 5}), priority: 50 }
  ]);
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex('shipping_method').whereIn('code', ['STANDARD', 'EXPRESS', 'FREE', 'PICKUP', 'INTL_STD', 'INTL_EXP']).delete();
};
