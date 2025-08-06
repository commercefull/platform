/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex('packaging_type').insert([
    { name: 'Small Box', code: 'BOX_S', description: 'Small shipping box', is_active: true, is_default: false, weight: 0.2, length: 20, width: 15, height: 10, volume: 3, max_weight: 2, recyclable: true, cost: 0.5, currency: 'USD', valid_carriers: [] },
    { name: 'Medium Box', code: 'BOX_M', description: 'Medium shipping box', is_active: true, is_default: true, weight: 0.3, length: 30, width: 20, height: 15, volume: 9, max_weight: 5, recyclable: true, cost: 1.0, currency: 'USD', valid_carriers: [] },
    { name: 'Large Box', code: 'BOX_L', description: 'Large shipping box', is_active: true, is_default: false, weight: 0.4, length: 40, width: 30, height: 20, volume: 24, max_weight: 10, recyclable: true, cost: 1.5, currency: 'USD', valid_carriers: [] },
    { name: 'Envelope', code: 'ENVELOPE', description: 'Shipping envelope for documents', is_active: true, is_default: false, weight: 0.05, length: 30, width: 22, height: 1, volume: 0.66, max_weight: 0.5, recyclable: true, cost: 0.2, currency: 'USD', valid_carriers: [] },
    { name: 'Poly Bag', code: 'POLY', description: 'Plastic poly bag for soft items', is_active: true, is_default: false, weight: 0.1, length: 35, width: 25, height: 5, volume: 43.75, max_weight: 3, recyclable: false, cost: 0.1, currency: 'USD', valid_carriers: [] }
  ]);
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex('packaging_type').whereIn('code', ['BOX_S', 'BOX_M', 'BOX_L', 'ENVELOPE', 'POLY']).delete();
};
