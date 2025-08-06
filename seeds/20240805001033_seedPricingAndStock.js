/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  // Insert default price lists
  await knex('price_list').insert([
    {
      name: 'Retail',
      code: 'RETAIL',
      description: 'Standard retail prices',
      is_active: true,
      priority: 100,
      price_type: 'fixed',
      currency_code: 'USD'
    },
    {
      name: 'Wholesale',
      code: 'WHOLESALE',
      description: 'Wholesale customer prices',
      is_active: true,
      priority: 200,
      price_type: 'percentage_discount',
      base_on: 'original',
      percentage_value: 0.20, // Example: 20% discount
      currency_code: 'USD'
    }
  ]);

  // Get sample product and main warehouse IDs
  const sampleProduct = await knex('product').where({ sku: 'SAMPLE-001' }).first('id');
  const mainWarehouse = await knex('warehouse').where({ code: 'MAIN' }).first('id');

  if (!sampleProduct || !mainWarehouse) {
    throw new Error('Required seed data (product/warehouse) not found');
  }

  // Insert sample inventory level
  return knex('inventory_level').insert({
    product_id: sampleProduct.id,
    warehouse_id: mainWarehouse.id,
    is_tracked: true,
    available_quantity: 100,
    on_hand_quantity: 100,
    stock_status: 'in_stock',
    min_stock_level: 10
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  const sampleProduct = await knex('product').where({ sku: 'SAMPLE-001' }).first('id');
  if (sampleProduct) {
    await knex('inventory_level').where({ product_id: sampleProduct.id }).delete();
  }
  await knex('price_list').whereIn('code', ['RETAIL', 'WHOLESALE']).delete();
};
