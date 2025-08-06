/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex('shipping_zone').insert([
    {
      name: 'Worldwide',
      description: 'Default shipping zone covering all locations',
      is_active: true,
      priority: 0,
      location_type: 'country',
      locations: JSON.stringify(['*'])
    },
    {
      name: 'United States',
      description: 'Shipping within the United States',
      is_active: true,
      priority: 10,
      location_type: 'country',
      locations: JSON.stringify(['US'])
    }
  ]);
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex('shipping_zone').whereIn('name', ['Worldwide', 'United States']).delete();
};
