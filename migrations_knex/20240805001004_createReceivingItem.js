/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('receiving_item', t => {
    t.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.uuid('receiving_record_id').notNullable().references('id').inTable('receiving_record').onDelete('CASCADE');
    t.uuid('purchase_order_item_id').references('id').inTable('purchase_order_item');
    t.uuid('product_id').notNullable();
    t.uuid('variant_id');
    t.string('sku', 100).notNullable();
    t.string('name', 255).notNullable();
    t.integer('expected_quantity');
    t.integer('received_quantity').notNullable();
    t.integer('rejected_quantity').notNullable().defaultTo(0);
    t.uuid('bin_id').references('id').inTable('warehouse_bin');
    t.string('lot_number', 100);
    t.specificType('serial_numbers', 'text[]');
    t.timestamp('expiry_date');
    t.enu('status', ['received', 'inspecting', 'accepted', 'rejected', 'partial'], { useNative: true, enumName: 'receiving_item_status_type' }).notNullable().defaultTo('received');
    t.enu('acceptance_status', ['pending', 'accepted', 'rejected', 'partial'], { useNative: true, enumName: 'receiving_item_acceptance_status_type' }).defaultTo('pending');
    t.text('inspection_notes');
    t.string('discrepancy_reason', 255);
    t.jsonb('metadata');
    t.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    t.timestamp('processed_at');
    t.uuid('processed_by');
    t.index('receiving_record_id');
    t.index('purchase_order_item_id');
    t.index('product_id');
    t.index('variant_id');
    t.index('sku');
    t.index('bin_id');
    t.index('lot_number');
    t.index('expiry_date');
    t.index('status');
    t.index('acceptance_status');
    t.index('created_at');
    t.index('serial_numbers', null, 'gin');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable('receiving_item')
    .then(() => knex.schema.raw('DROP TYPE IF EXISTS receiving_item_status_type'))
    .then(() => knex.schema.raw('DROP TYPE IF EXISTS receiving_item_acceptance_status_type'));
};
