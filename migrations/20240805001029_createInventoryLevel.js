/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('inventoryLevel', t => {
    t.uuid('inventoryLevelId').primary().defaultTo(knex.raw('uuidv7()'));
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.uuid('productId').notNullable().references('productId').inTable('product').onDelete('CASCADE');
    t.uuid('productVariantId').references('productVariantId').inTable('productVariant').onDelete('CASCADE');
    t.uuid('distributionWarehouseId')
      .notNullable()
      .references('distributionWarehouseId')
      .inTable('distributionWarehouse')
      .onDelete('CASCADE');
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
    t.enum('reorderStatus', ['none', 'pending', 'ordered', 'received']).defaultTo('none');
    t.timestamp('reorderDate');
    t.enum('stockStatus', ['inStock', 'outOfStock', 'lowStock', 'backOrder', 'preOrder']).notNullable().defaultTo('inStock');
    t.string('binLocation', 100);
    t.boolean('lowStockNotificationSent').notNullable().defaultTo(false);
    t.decimal('metricWeight', 10, 3);
    t.boolean('serialNumberTracking').notNullable().defaultTo(false);
    t.boolean('lotNumberTracking').notNullable().defaultTo(false);
    t.boolean('expiryDateTracking').notNullable().defaultTo(false);
    t.timestamp('lastCountedAt');
    t.uuid('updatedBy');
    t.index('productId');
    t.index('productVariantId');
    t.index('distributionWarehouseId');
    t.index('availableQuantity');
    t.index('onHandQuantity');
    t.index('allocatedQuantity');
    t.index('reservedQuantity');
    t.index('stockStatus');
    t.index('minStockLevel');
    t.index('reorderStatus');
    t.index('binLocation');
    t.unique(['productId', 'productVariantId', 'distributionWarehouseId'], { nullsNotDistinct: true });
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable('inventoryLevel');
};
