/**
 * Seed: Distribution Shipping Methods
 * Seeds the default shipping methods (Standard, Express, Free, Pickup, International)
 */
exports.up = function (knex) {
  return knex('distributionShippingMethod').insert([
    { name: 'Standard Shipping', code: 'STANDARD', description: 'Standard shipping option (3-5 business days)', isActive: true, isDefault: true, domesticInternational: 'both', estimatedDeliveryDays: JSON.stringify({min: 3, max: 5}), priority: 10 },
    { name: 'Express Shipping', code: 'EXPRESS', description: 'Express shipping option (1-2 business days)', isActive: true, isDefault: false, domesticInternational: 'both', estimatedDeliveryDays: JSON.stringify({min: 1, max: 2}), priority: 20 },
    { name: 'Free Shipping', code: 'FREE', description: 'Free shipping on qualifying orders', isActive: true, isDefault: false, domesticInternational: 'domestic', estimatedDeliveryDays: JSON.stringify({min: 3, max: 7}), priority: 5 },
    { name: 'In-Store Pickup', code: 'PICKUP', description: 'Pickup at store location', isActive: true, isDefault: false, domesticInternational: 'domestic', estimatedDeliveryDays: JSON.stringify({min: 0, max: 1}), priority: 30 },
    { name: 'International Standard', code: 'INTL_STD', description: 'International standard shipping (7-14 business days)', isActive: true, isDefault: false, domesticInternational: 'international', estimatedDeliveryDays: JSON.stringify({min: 7, max: 14}), priority: 40 },
    { name: 'International Express', code: 'INTL_EXP', description: 'International express shipping (3-5 business days)', isActive: true, isDefault: false, domesticInternational: 'international', estimatedDeliveryDays: JSON.stringify({min: 3, max: 5}), priority: 50 }
  ]);
};

exports.down = function (knex) {
  return knex('distributionShippingMethod').whereIn('code', ['STANDARD', 'EXPRESS', 'FREE', 'PICKUP', 'INTL_STD', 'INTL_EXP']).delete();
};

exports.seed = async function (knex) {
  await exports.down(knex);
  return exports.up(knex);
};
