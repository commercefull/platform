/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('inventoryTransfer', t => {
    t.uuid('inventoryTransferId').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.string('referenceNumber', 50).unique();
    t.uuid('sourceWarehouseId').notNullable().references('warehouseId').inTable('warehouse');
    t.uuid('sourceBinId').references('warehouseBinId').inTable('warehouseBin');
    t.uuid('destinationWarehouseId').notNullable().references('warehouseId').inTable('warehouse');
    t.uuid('destinationBinId').references('warehouseBinId').inTable('warehouseBin');
    t.enum('status', ['pending', 'inTransit', 'partiallyReceived', 'completed', 'cancelled']).notNullable().defaultTo('pending');
    t.enum('transferType', ['standard', 'return', 'rebalance', 'emergency']).notNullable().defaultTo('standard');
    t.enum('priority', ['low', 'normal', 'high', 'urgent']).notNullable().defaultTo('normal');
    t.timestamp('scheduledDate');
    t.text('notes');
    t.string('shippingCarrier', 100);
    t.string('trackingNumber', 100);
    t.timestamp('expectedDeliveryDate');
    t.timestamp('actualDeliveryDate');
    
    t.index('referenceNumber');
    t.index('sourceWarehouseId');
    t.index('destinationWarehouseId');
    t.index('status');
    t.index('transferType');
    t.index('priority');
    t.index('scheduledDate');
    t.index('createdAt');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable('inventoryTransfer');
};
