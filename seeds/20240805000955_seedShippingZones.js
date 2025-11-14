/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex('shippingZone').insert([
    {
      name: 'Worldwide',
      description: 'Default shipping zone covering all locations',
      isActive: true,
      priority: 0,
      locationType: 'country',
      locations: JSON.stringify(['*'])
    },
    {
      name: 'United States',
      description: 'Shipping within the United States',
      isActive: true,
      priority: 10,
      locationType: 'country',
      locations: JSON.stringify(['US'])
    }
  ]);
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex('shippingZone').whereIn('name', ['Worldwide', 'United States']).delete();
};

exports.seed = async function (knex) {
  await exports.down(knex);
  return exports.up(knex);
};
