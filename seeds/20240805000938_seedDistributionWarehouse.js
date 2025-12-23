/**
 * Seed: Distribution Warehouse
 * Seeds the default warehouse/fulfillment center
 */
exports.up = function (knex) {
  return knex('distributionWarehouse').insert({
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
    timezone: 'America/New_York',
  });
};

exports.down = function (knex) {
  return knex('distributionWarehouse').where('code', 'MAIN').delete();
};

exports.seed = async function (knex) {
  await exports.down(knex);
  return exports.up(knex);
};
