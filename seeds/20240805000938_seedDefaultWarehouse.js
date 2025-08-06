/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex('warehouse').insert({
    name: 'Main Warehouse',
    code: 'MAIN',
    description: 'Primary distribution center',
    is_active: true,
    is_default: true,
    is_fulfillment_center: true,
    is_return_center: true,
    address_line_1: '123 Warehouse Ave',
    city: 'Anytown',
    state: 'State',
    postal_code: '12345',
    country: 'US',
    timezone: 'America/New_York'
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex('warehouse').where('code', 'MAIN').delete();
};
