/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('inventoryTransferItem', t => {
    t.uuid('inventoryTransferItemId').primary().defaultTo(knex.raw('uuidv7()'));
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.uuid('transferId').notNullable().references('inventoryTransferId').inTable('inventoryTransfer').onDelete('CASCADE');
    t.uuid('productId').notNullable();
    t.uuid('productVariantId');
    t.string('sku', 100).notNullable();
    t.integer('quantity').notNullable();
    t.integer('receivedQuantity').defaultTo(0);
    t.string('lotNumber', 100);
    t.string('serialNumber', 100);
    t.timestamp('expiryDate');
    t.enum('status', ['pending', 'inTransit', 'partiallyReceived', 'received', 'cancelled']).notNullable().defaultTo('pending');
    t.text('notes');
    
    t.index('transferId');
    t.index('productId');
    t.index('productVariantId');
    t.index('sku');
    t.index('status');
    t.index('lotNumber');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable('inventoryTransferItem');
};
