/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('inventory_count_item', t => {
    t.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.uuid('count_id').notNullable().references('id').inTable('inventory_count').onDelete('CASCADE');
    t.uuid('bin_id').references('id').inTable('warehouse_bin');
    t.uuid('product_id').notNullable();
    t.uuid('variant_id');
    t.string('sku', 100).notNullable();
    t.integer('expected_quantity');
    t.integer('counted_quantity');
    t.integer('adjustment_quantity');
    t.string('lot_number', 100);
    t.string('serial_number', 100);
    t.timestamp('expiry_date');
    t.enu('status', ['pending', 'counted', 'verified', 'adjusted', 'skipped'], { useNative: true, enumName: 'inventory_count_item_status_type' }).notNullable().defaultTo('pending');
    t.text('notes');
    t.jsonb('metadata');
    t.timestamp('counted_at');
    t.uuid('counted_by');
    t.timestamp('verified_at');
    t.uuid('verified_by');
    t.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    t.index('count_id');
    t.index('bin_id');
    t.index('product_id');
    t.index('variant_id');
    t.index('sku');
    t.index('status');
    t.index('lot_number');
    t.index('counted_at');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable('inventory_count_item')
    .then(() => knex.schema.raw('DROP TYPE IF EXISTS inventory_count_item_status_type'));
};
