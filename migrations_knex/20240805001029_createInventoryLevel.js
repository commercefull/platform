/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('inventory_level', t => {
    t.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.uuid('productId').notNullable().references('id').inTable('product').onDelete('CASCADE');
    t.uuid('variantId').references('id').inTable('product_variant').onDelete('CASCADE');
    t.uuid('warehouseId').notNullable().references('id').inTable('warehouse').onDelete('CASCADE');
    t.boolean('isTracked').notNullable().defaultTo(true);
    t.boolean('isBackorderable').notNullable().defaultTo(false);
    t.boolean('isPurchasableOutOfStock').notNullable().defaultTo(false);
    t.integer('availableQuantity').notNullable().defaultTo(0);
    t.integer('onHandQuantity').notNullable().defaultTo(0);
    t.integer('allocatedQuantity').notNullable().defaultTo(0);
    t.integer('reservedQuantity').notNullable().defaultTo(0);
    t.integer('minStockLevel').defaultTo(0);
    t.integer('maxStockLevel');
    t.integer('reorderQuantity');
    t.enu('reorderStatus', ['none', 'pending', 'ordered', 'received'], { useNative: true, enumName: 'inventory_reorder_status' }).defaultTo('none');
    t.timestamp('reorderDate');
    t.enu('stockStatus', ['inStock', 'outOfStock', 'lowStock', 'backorder', 'preorder'], { useNative: true, enumName: 'inventory_stock_status' }).notNullable().defaultTo('inStock');
    t.string('binLocation', 100);
    t.boolean('lowStockNotificationSent').notNullable().defaultTo(false);
    t.decimal('metricWeight', 10, 3);
    t.boolean('serialNumberTracking').notNullable().defaultTo(false);
    t.boolean('lotNumberTracking').notNullable().defaultTo(false);
    t.boolean('expiryDateTracking').notNullable().defaultTo(false);
    t.timestamp('lastCountedAt');
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.uuid('updatedBy');
    t.index('productId');
    t.index('variantId');
    t.index('warehouseId');
    t.index('availableQuantity');
    t.index('onHandQuantity');
    t.index('allocatedQuantity');
    t.index('reservedQuantity');
    t.index('stockStatus');
    t.index('minStockLevel');
    t.index('reorderStatus');
    t.index('binLocation');
    t.unique(['productId', 'variantId', 'warehouseId'], { nullsNotDistinct: true });
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable('inventory_level')
    .then(() => knex.schema.raw('DROP TYPE IF EXISTS inventory_reorder_status'))
    .then(() => knex.schema.raw('DROP TYPE IF EXISTS inventory_stock_status'));
};
