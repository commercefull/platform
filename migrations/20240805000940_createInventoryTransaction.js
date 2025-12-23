/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('inventoryTransaction', t => {
    t.uuid('inventoryTransactionId').primary().defaultTo(knex.raw('uuidv7()'));
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now()).index('createdAt');
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.uuid('typeId').notNullable().references('inventoryTransactionTypeId').inTable('inventoryTransactionType').index('typeId');
    t.uuid('distributionWarehouseId')
      .notNullable()
      .references('distributionWarehouseId')
      .inTable('distributionWarehouse')
      .index('distributionWarehouseId');
    t.uuid('distributionWarehouseBinId')
      .references('distributionWarehouseBinId')
      .inTable('distributionWarehouseBin')
      .index('distributionWarehouseBinId');
    t.uuid('productId').notNullable().references('productId').inTable('product').index('productId');
    t.uuid('productVariantId').references('productVariantId').inTable('productVariant').index('productVariantId');
    t.string('sku', 100).notNullable().index('sku');
    t.integer('quantity').notNullable();
    t.integer('previousQuantity');
    t.integer('newQuantity');
    t.string('referenceType', 50).index('referenceType');
    t.uuid('referenceId').index('referenceId');
    t.string('lotNumber', 100).index('lotNumber');
    t.string('serialNumber', 100);
    t.timestamp('expiryDate');
    t.text('notes');
    t.enum('status', ['pending', 'completed', 'cancelled', 'rejected']).notNullable().defaultTo('completed').index('status');
    t.string('reason', 255);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable('inventoryTransaction');
};
