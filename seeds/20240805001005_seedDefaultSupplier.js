/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  const [supplier] = await knex('supplier').insert([
    {
      name: 'Sample Supplier Inc.',
      code: 'SAMPLE',
      description: 'Default sample supplier for testing',
      is_active: true,
      is_approved: true,
      status: 'active',
      payment_terms: 'Net 30',
      currency: 'USD',
      categories: ['General', 'Electronics', 'Apparel']
    }
  ]).returning('id');

  return knex('supplier_address').insert([
    {
      supplier_id: supplier.id,
      name: 'Headquarters',
      address_line1: '123 Supplier St',
      city: 'Suppliertown',
      state: 'State',
      postal_code: '12345',
      country: 'US',
      address_type: 'headquarters',
      is_default: true,
      is_active: true
    }
  ]);
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex('supplier').where({ code: 'SAMPLE' }).delete();
};
