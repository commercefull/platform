/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('receivingRecord', t => {
    t.uuid('receivingRecordId').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.string('receiptNumber', 50).notNullable().unique();
    t.uuid('purchaseOrderId').references('purchaseOrderId').inTable('purchaseOrder');
    t.uuid('warehouseId').notNullable().references('warehouseId').inTable('warehouse');
    t.uuid('supplierId').notNullable().references('supplierId').inTable('supplier');
    t.enum('status', ['pending', 'in_progress', 'completed', 'cancelled', 'disputed']).notNullable().defaultTo('pending');
    t.timestamp('receivedDate').notNullable().defaultTo(knex.fn.now());
    t.string('carrierName', 100);
    t.string('trackingNumber', 100);
    t.integer('packageCount');
    t.text('notes');
    t.boolean('discrepancies').notNullable().defaultTo(false);
    t.jsonb('attachments');
    
    t.timestamp('completedAt');
    t.index('receiptNumber');
    t.index('purchaseOrderId');
    t.index('warehouseId');
    t.index('supplierId');
    t.index('status');
    t.index('receivedDate');
    t.index('trackingNumber');
    t.index('discrepancies');
    t.index('createdAt');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable('receiving_record');
};
