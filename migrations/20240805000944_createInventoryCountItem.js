/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('inventoryCountItem', t => {
    t.uuid('inventoryCountItemId').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.uuid('inventoryCountId').notNullable().references('inventoryCountId').inTable('inventoryCount').onDelete('CASCADE');
    t.uuid('binId').references('warehouseBinId').inTable('warehouseBin');
    t.uuid('productId').notNullable().references('productId').inTable('product');
    t.uuid('productVariantId').references('productVariantId').inTable('productVariant');
    t.string('sku', 100).notNullable();
    t.integer('expectedQuantity');
    t.integer('countedQuantity');
    t.integer('adjustmentQuantity');
    t.string('lotNumber', 100);
    t.string('serialNumber', 100);
    t.timestamp('expiryDate');
    t.enum('status', ['pending', 'counted', 'verified', 'adjusted', 'skipped']).notNullable().defaultTo('pending');
    t.text('notes');    
    t.timestamp('countedAt');
    t.uuid('countedBy');
    t.timestamp('verifiedAt');
    t.uuid('verifiedBy');

    t.index('inventoryCountId');
    t.index('binId');
    t.index('productId');
    t.index('productVariantId');
    t.index('sku');
    t.index('status');
    t.index('lotNumber');
    t.index('countedAt');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable('inventoryCountItem');
};
