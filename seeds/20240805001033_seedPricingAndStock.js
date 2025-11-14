/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
const PRICE_LISTS = [
  {
    name: 'Retail',
    description: 'Standard retail prices',
    isActive: true,
    priority: 100
  },
  {
    name: 'Wholesale',
    description: 'Wholesale customer prices',
    isActive: true,
    priority: 200
  }
];

exports.up = async function (knex) {
  // Upsert default price lists
  for (const priceList of PRICE_LISTS) {
    const existing = await knex('priceList').where({ name: priceList.name }).first('priceListId');
    if (existing) {
      await knex('priceList').where({ priceListId: existing.priceListId }).update(priceList);
    } else {
      await knex('priceList').insert(priceList);
    }
  }

  // Get sample product and main warehouse IDs
  const sampleProduct = await knex('product').where({ sku: 'SAMPLE-001' }).first('productId');
  const mainWarehouse = await knex('warehouse').where({ code: 'MAIN' }).first('warehouseId');

  if (!sampleProduct || !mainWarehouse) {
    throw new Error('Required seed data (product/warehouse) not found');
  }

  // Insert sample inventory level
  const productId = sampleProduct.productId ?? sampleProduct;
  const warehouseId = mainWarehouse.warehouseId ?? mainWarehouse;

  await knex('inventoryLevel').where({ productId, warehouseId }).delete();

  return knex('inventoryLevel').insert({
    productId,
    warehouseId,
    isTracked: true,
    availableQuantity: 100,
    onHandQuantity: 100,
    stockStatus: 'inStock',
    minStockLevel: 10
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  const sampleProduct = await knex('product').where({ sku: 'SAMPLE-001' }).first('productId');
  if (sampleProduct) {
    await knex('inventoryLevel').where({ productId: sampleProduct.productId }).delete();
  }
  await knex('priceList').whereIn('name', PRICE_LISTS.map(pl => pl.name)).delete();
};

exports.seed = async function (knex) {
  await exports.down(knex);
  return exports.up(knex);
};
