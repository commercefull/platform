/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex('shippingPackagingType').insert([
    {
      name: 'Small Box',
      code: 'BOX_S',
      description: 'Small shipping box',
      isActive: true,
      isDefault: false,
      weight: 0.2,
      length: 20,
      width: 15,
      height: 10,
      volume: 3,
      maxWeight: 2,
      recyclable: true,
      costCents: 50,
      currencyCode: 'USD',
      validCarriers: [],
    },
    {
      name: 'Medium Box',
      code: 'BOX_M',
      description: 'Medium shipping box',
      isActive: true,
      isDefault: true,
      weight: 0.3,
      length: 30,
      width: 20,
      height: 15,
      volume: 9,
      maxWeight: 5,
      recyclable: true,
      costCents: 100,
      currencyCode: 'USD',
      validCarriers: [],
    },
    {
      name: 'Large Box',
      code: 'BOX_L',
      description: 'Large shipping box',
      isActive: true,
      isDefault: false,
      weight: 0.4,
      length: 40,
      width: 30,
      height: 20,
      volume: 24,
      maxWeight: 10,
      recyclable: true,
      costCents: 150,
      currencyCode: 'USD',
      validCarriers: [],
    },
    {
      name: 'Envelope',
      code: 'ENVELOPE',
      description: 'Shipping envelope for documents',
      isActive: true,
      isDefault: false,
      weight: 0.05,
      length: 30,
      width: 22,
      height: 1,
      volume: 0.66,
      maxWeight: 0.5,
      recyclable: true,
      costCents: 20,
      currencyCode: 'USD',
      validCarriers: [],
    },
    {
      name: 'Poly Bag',
      code: 'POLY',
      description: 'Plastic poly bag for soft items',
      isActive: true,
      isDefault: false,
      weight: 0.1,
      length: 35,
      width: 25,
      height: 5,
      volume: 43.75,
      maxWeight: 3,
      recyclable: false,
      costCents: 10,
      currencyCode: 'USD',
      validCarriers: [],
    },
  ]);
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex('shippingPackagingType').whereIn('code', ['BOX_S', 'BOX_M', 'BOX_L', 'ENVELOPE', 'POLY']).delete();
};

exports.seed = async function (knex) {
  await exports.down(knex);
  return exports.up(knex);
};
