/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('inventory_transfer_item', t => {
    t.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.uuid('transfer_id').notNullable().references('id').inTable('inventory_transfer').onDelete('CASCADE');
    t.uuid('product_id').notNullable();
    t.uuid('variant_id');
    t.string('sku', 100).notNullable();
    t.integer('quantity').notNullable();
    t.integer('received_quantity').defaultTo(0);
    t.string('lot_number', 100);
    t.string('serial_number', 100);
    t.timestamp('expiry_date');
    t.enu('status', ['pending', 'in_transit', 'partially_received', 'received', 'cancelled'], { useNative: true, enumName: 'inventory_transfer_item_status_type' }).notNullable().defaultTo('pending');
    t.text('notes');
    t.jsonb('metadata');
    t.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    t.index('transfer_id');
    t.index('product_id');
    t.index('variant_id');
    t.index('sku');
    t.index('status');
    t.index('lot_number');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable('inventory_transfer_item')
    .then(() => knex.schema.raw('DROP TYPE IF EXISTS inventory_transfer_item_status_type'));
};
