/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('receiving_record', t => {
    t.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.string('receipt_number', 50).notNullable().unique();
    t.uuid('purchase_order_id').references('id').inTable('purchase_order');
    t.uuid('warehouse_id').notNullable().references('id').inTable('warehouse');
    t.uuid('supplier_id').notNullable().references('id').inTable('supplier');
    t.enu('status', ['pending', 'in_progress', 'completed', 'cancelled', 'disputed'], { useNative: true, enumName: 'receiving_record_status_type' }).notNullable().defaultTo('pending');
    t.timestamp('received_date').notNullable().defaultTo(knex.fn.now());
    t.string('carrier_name', 100);
    t.string('tracking_number', 100);
    t.integer('package_count');
    t.text('notes');
    t.boolean('discrepancies').notNullable().defaultTo(false);
    t.jsonb('attachments');
    t.jsonb('metadata');
    t.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    t.uuid('created_by');
    t.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    t.uuid('updated_by');
    t.timestamp('completed_at');
    t.uuid('completed_by');
    t.index('receipt_number');
    t.index('purchase_order_id');
    t.index('warehouse_id');
    t.index('supplier_id');
    t.index('status');
    t.index('received_date');
    t.index('tracking_number');
    t.index('discrepancies');
    t.index('created_at');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable('receiving_record')
    .then(() => knex.schema.raw('DROP TYPE IF EXISTS receiving_record_status_type'));
};
