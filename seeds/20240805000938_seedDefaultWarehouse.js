/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex('warehouse').insert({
    name: 'Main Warehouse',
    code: 'MAIN',
    description: 'Primary distribution center',
    isActive: true,
    isDefault: true,
    isFulfillmentCenter: true,
    isReturnCenter: true,
    addressLine1: '123 Warehouse Ave',
    city: 'Anytown',
    state: 'State',
    postalCode: '12345',
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

exports.seed = async function (knex) {
  await exports.down(knex);
  return exports.up(knex);
};
