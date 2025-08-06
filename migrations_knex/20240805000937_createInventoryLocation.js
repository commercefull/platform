/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('inventory_location', t => {
    t.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.uuid('warehouse_id').notNullable().references('id').inTable('warehouse').onDelete('CASCADE');
    t.uuid('bin_id').references('id').inTable('warehouse_bin').onDelete('SET NULL');
    t.uuid('product_id').notNullable();
    t.uuid('variant_id');
    t.string('sku', 100).notNullable();
    t.integer('quantity').notNullable().defaultTo(0);
    t.integer('reserved_quantity').notNullable().defaultTo(0);
    t.integer('available_quantity').notNullable().defaultTo(0);
    t.integer('minimum_stock_level').defaultTo(0);
    t.integer('maximum_stock_level');
    t.string('lot_number', 100);
    t.string('serial_number', 100);
    t.timestamp('expiry_date');
    t.timestamp('received_date');
    t.enu('status', ['available', 'reserved', 'damaged', 'quarantine', 'expired', 'pending'], { useNative: true, enumName: 'inventory_location_status_type' }).notNullable().defaultTo('available');
    t.timestamp('last_count_date');
    t.jsonb('metadata');
    t.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    t.index('warehouse_id');
    t.index('bin_id');
    t.index('product_id');
    t.index('variant_id');
    t.index('sku');
    t.index('quantity');
    t.index('reserved_quantity');
    t.index('available_quantity');
    t.index('status');
    t.index('lot_number');
    t.index('expiry_date');
  }).then(() => {
    return knex.raw('ALTER TABLE inventory_location ADD CONSTRAINT available_quantity_check CHECK (available_quantity = quantity - reserved_quantity)');
  }).then(() => {
    return knex.raw('CREATE UNIQUE INDEX idx_inventory_location_unique ON inventory_location (warehouse_id, bin_id, product_id, variant_id, lot_number) WHERE variant_id IS NOT NULL AND lot_number IS NOT NULL');
  }).then(() => {
    return knex.raw('CREATE UNIQUE INDEX idx_inventory_location_unique_null_variant ON inventory_location (warehouse_id, bin_id, product_id, lot_number) WHERE variant_id IS NULL AND lot_number IS NOT NULL');
  }).then(() => {
    return knex.raw('CREATE UNIQUE INDEX idx_inventory_location_unique_null_lot ON inventory_location (warehouse_id, bin_id, product_id, variant_id) WHERE variant_id IS NOT NULL AND lot_number IS NULL');
  }).then(() => {
    return knex.raw('CREATE UNIQUE INDEX idx_inventory_location_unique_nulls ON inventory_location (warehouse_id, bin_id, product_id) WHERE variant_id IS NULL AND lot_number IS NULL');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable('inventory_location')
    .then(() => knex.schema.raw('DROP TYPE IF EXISTS inventory_location_status_type'));
};
