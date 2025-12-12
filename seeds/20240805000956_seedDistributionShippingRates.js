/**
 * Seed: Distribution Shipping Rates
 * Seeds the default shipping rates for US zone
 */
exports.up = async function (knex) {
  const usZone = await knex('distributionShippingZone').where({ name: 'United States' }).first();
  const standardMethod = await knex('distributionShippingMethod').where({ code: 'STANDARD' }).first();
  const expressMethod = await knex('distributionShippingMethod').where({ code: 'EXPRESS' }).first();
  const freeMethod = await knex('distributionShippingMethod').where({ code: 'FREE' }).first();

  if (usZone && standardMethod && expressMethod && freeMethod) {
    return knex('distributionShippingRate').insert([
      {
        distributionShippingZoneId: usZone.distributionShippingZoneId,
        distributionShippingMethodId: standardMethod.distributionShippingMethodId,
        isActive: true,
        rateType: 'flat',
        baseRate: 5.99,
        perItemRate: 0.99,
        currency: 'USD'
      },
      {
        distributionShippingZoneId: usZone.distributionShippingZoneId,
        distributionShippingMethodId: expressMethod.distributionShippingMethodId,
        isActive: true,
        rateType: 'flat',
        baseRate: 14.99,
        perItemRate: 1.99,
        currency: 'USD'
      },
      {
        distributionShippingZoneId: usZone.distributionShippingZoneId,
        distributionShippingMethodId: freeMethod.distributionShippingMethodId,
        isActive: true,
        rateType: 'free',
        baseRate: 0,
        perItemRate: 0,
        freeThreshold: 50.00,
        currency: 'USD'
      }
    ]);
  }
};

exports.down = async function (knex) {
  const usZone = await knex('distributionShippingZone').where({ name: 'United States' }).first();
  if (usZone) {
    return knex('distributionShippingRate').where({ distributionShippingZoneId: usZone.distributionShippingZoneId }).delete();
  }
};

exports.seed = async function (knex) {
  await exports.down(knex);
  return exports.up(knex);
};
