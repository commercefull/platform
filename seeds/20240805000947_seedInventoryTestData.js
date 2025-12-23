/**
 * Seed Inventory Test Data
 *
 * Creates test inventory locations for integration testing.
 *
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.seed = async function (knex) {
  // Get a sample warehouse
  const warehouse = await knex('distributionWarehouse').first();
  if (!warehouse) {
    return;
  }

  // Get a sample product
  const product = await knex('product').first();
  if (!product) {
    return;
  }

  // Delete existing test inventory locations
  await knex('inventoryLocation').where('sku', 'like', 'TEST-INV-%').del();

  // Insert test inventory locations
  await knex('inventoryLocation').insert([
    {
      distributionWarehouseId: warehouse.distributionWarehouseId,
      productId: product.productId,
      sku: 'TEST-INV-001',
      quantity: 100,
      reservedQuantity: 0,
      availableQuantity: 100,
      minimumStockLevel: 10,
      maximumStockLevel: 500,
      status: 'available',
    },
    {
      distributionWarehouseId: warehouse.distributionWarehouseId,
      productId: product.productId,
      sku: 'TEST-INV-002',
      quantity: 5,
      reservedQuantity: 0,
      availableQuantity: 5,
      minimumStockLevel: 10,
      maximumStockLevel: 200,
      status: 'available',
    },
    {
      distributionWarehouseId: warehouse.distributionWarehouseId,
      productId: product.productId,
      sku: 'TEST-INV-003',
      quantity: 0,
      reservedQuantity: 0,
      availableQuantity: 0,
      minimumStockLevel: 5,
      maximumStockLevel: 100,
      status: 'available',
    },
  ]);
};
