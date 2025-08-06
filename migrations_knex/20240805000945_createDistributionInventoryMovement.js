/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('distribution_inventory_movement', t => {
    t.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.uuid('warehouse_id').notNullable().references('id').inTable('warehouse').onDelete('CASCADE');
    t.uuid('product_id').notNullable();
    t.uuid('variant_id');
    t.uuid('from_location_id').references('id').inTable('inventory_location');
    t.uuid('to_location_id').references('id').inTable('inventory_location');
    t.integer('quantity').notNullable();
    t.string('reason', 50);
    t.string('reference', 255);
    t.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    t.jsonb('metadata');
    t.index('warehouse_id');
    t.index('product_id');
    t.index('variant_id');
    t.index('from_location_id');
    t.index('to_location_id');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable('distribution_inventory_movement');
};
