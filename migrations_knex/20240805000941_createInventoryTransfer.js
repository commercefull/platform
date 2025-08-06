/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('inventory_transfer', t => {
    t.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.string('referenceNumber', 50).unique();
    t.uuid('sourceWarehouseId').notNullable().references('id').inTable('warehouse');
    t.uuid('sourceBinId').references('id').inTable('warehouse_bin');
    t.uuid('destinationWarehouseId').notNullable().references('id').inTable('warehouse');
    t.uuid('destinationBinId').references('id').inTable('warehouse_bin');
    t.enu('status', ['pending', 'inTransit', 'partiallyReceived', 'completed', 'cancelled'], { useNative: true, enumName: 'inventory_transfer_status_type' }).notNullable().defaultTo('pending');
    t.enu('transferType', ['standard', 'return', 'rebalance', 'emergency'], { useNative: true, enumName: 'inventory_transfer_type' }).notNullable().defaultTo('standard');
    t.enu('priority', ['low', 'normal', 'high', 'urgent'], { useNative: true, enumName: 'inventory_transfer_priority_type' }).notNullable().defaultTo('normal');
    t.timestamp('scheduledDate');
    t.text('notes');
    t.string('shippingCarrier', 100);
    t.string('trackingNumber', 100);
    t.timestamp('expectedDeliveryDate');
    t.timestamp('actualDeliveryDate');
    t.jsonb('metadata');
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.uuid('createdBy');
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.uuid('updatedBy');
    t.timestamp('completedAt');
    t.uuid('completedBy');
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
  return knex.schema.dropTable('inventory_transfer')
    .then(() => knex.schema.raw('DROP TYPE IF EXISTS inventory_transfer_status_type'))
    .then(() => knex.schema.raw('DROP TYPE IF EXISTS inventory_transfer_type'))
    .then(() => knex.schema.raw('DROP TYPE IF EXISTS inventory_transfer_priority_type'));
};
