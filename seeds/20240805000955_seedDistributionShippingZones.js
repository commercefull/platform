/**
 * Seed: Distribution Shipping Zones
 * Seeds the default shipping zones (Worldwide, United States)
 */
exports.up = function (knex) {
  return knex('distributionShippingZone').insert([
    {
      name: 'Worldwide',
      description: 'Default shipping zone covering all locations',
      isActive: true,
      priority: 0,
      locationType: 'country',
      locations: JSON.stringify(['*']),
    },
    {
      name: 'United States',
      description: 'Shipping within the United States',
      isActive: true,
      priority: 10,
      locationType: 'country',
      locations: JSON.stringify(['US']),
    },
  ]);
};

exports.down = function (knex) {
  return knex('distributionShippingZone').whereIn('name', ['Worldwide', 'United States']).delete();
};

exports.seed = async function (knex) {
  await exports.down(knex);
  return exports.up(knex);
};
