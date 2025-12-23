/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('inventoryTransfer', t => {
    t.uuid('inventoryTransferId').primary().defaultTo(knex.raw('uuidv7()'));
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.string('referenceNumber', 50).unique();
    t.uuid('sourceDistributionWarehouseId').notNullable().references('distributionWarehouseId').inTable('distributionWarehouse');
    t.uuid('sourceDistributionWarehouseBinId').references('distributionWarehouseBinId').inTable('distributionWarehouseBin');
    t.uuid('destinationDistributionWarehouseId').notNullable().references('distributionWarehouseId').inTable('distributionWarehouse');
    t.uuid('destinationDistributionWarehouseBinId').references('distributionWarehouseBinId').inTable('distributionWarehouseBin');
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
    t.index('sourceDistributionWarehouseId');
    t.index('destinationDistributionWarehouseId');
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
