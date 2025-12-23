/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  const [supplier] = await knex('supplier')
    .insert([
      {
        name: 'Sample Supplier Inc.',
        code: 'SAMPLE',
        description: 'Default sample supplier for testing',
        isActive: true,
        isApproved: true,
        status: 'active',
        paymentTerms: 'Net 30',
        currency: 'USD',
        categories: ['General', 'Electronics', 'Apparel'],
      },
    ])
    .returning('supplierId');

  return knex('supplierAddress').insert([
    {
      supplierId: supplier.supplierId || supplier,
      name: 'Headquarters',
      addressLine1: '123 Supplier St',
      city: 'Suppliertown',
      state: 'State',
      postalCode: '12345',
      country: 'US',
      addressType: 'headquarters',
      isDefault: true,
      isActive: true,
    },
  ]);
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex('supplier').where({ code: 'SAMPLE' }).delete();
};

exports.seed = async function (knex) {
  await exports.down(knex);
  return exports.up(knex);
};
