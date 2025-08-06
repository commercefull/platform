/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
    const usZone = await knex('shippingZone').where({ name: 'United States' }).first();
    const standardMethod = await knex('shippingMethod').where({ code: 'STANDARD' }).first();
    const expressMethod = await knex('shippingMethod').where({ code: 'EXPRESS' }).first();
    const freeMethod = await knex('shippingMethod').where({ code: 'FREE' }).first();

  if (usZone && standardMethod && expressMethod && freeMethod) {
        return knex('shippingRate').insert([
      {
        zoneId: usZone.id,
        methodId: standardMethod.id,
        isActive: true,
        rateType: 'flat',
        baseRate: 5.99,
        perItemRate: 0.99,
        currency: 'USD'
      },
      {
        zoneId: usZone.id,
        methodId: expressMethod.id,
        isActive: true,
        rateType: 'flat',
        baseRate: 14.99,
        perItemRate: 1.99,
        currency: 'USD'
      },
      {
        zoneId: usZone.id,
        methodId: freeMethod.id,
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

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
    const usZone = await knex('shippingZone').where({ name: 'United States' }).first();
  if (usZone) {
        return knex('shippingRate').where({ zoneId: usZone.id }).delete();
  }
};
