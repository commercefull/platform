/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('inventoryLocation', t => {
    t.uuid('inventoryLocationId').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.uuid('warehouseId').notNullable().references('warehouseId').inTable('warehouse').onDelete('CASCADE');
    t.uuid('warehouseBinId').references('warehouseBinId').inTable('warehouseBin').onDelete('SET NULL');
    t.uuid('productId').notNullable();
    t.uuid('productVariantId');
    t.string('sku', 100).notNullable();
    t.integer('quantity').notNullable().defaultTo(0);
    t.integer('reservedQuantity').notNullable().defaultTo(0);
    t.integer('availableQuantity').notNullable().defaultTo(0);
    t.integer('minimumStockLevel').defaultTo(0);
    t.integer('maximumStockLevel');
    t.string('lotNumber', 100);
    t.string('serialNumber', 100);
    t.timestamp('expiryDate');
    t.timestamp('receivedDate');
    t.enum('status', ['available', 'reserved', 'damaged', 'quarantine', 'expired', 'pending']).notNullable().defaultTo('available');
    t.timestamp('lastCountDate');
    t.index('warehouseId');
    t.index('warehouseBinId');
    t.index('productId');
    t.index('productVariantId');
    t.index('sku');
    t.index('quantity');
    t.index('reservedQuantity');
    t.index('availableQuantity');
    t.index('status');
    t.index('lotNumber');
    t.index('expiryDate');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable('inventoryLocation');
};
