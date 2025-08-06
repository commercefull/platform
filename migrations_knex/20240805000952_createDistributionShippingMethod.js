/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('distribution_shipping_method', t => {
    t.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.string('name', 255).notNullable();
    t.string('code', 50).notNullable().unique();
    t.text('description');
    t.string('carrier', 50);
    t.string('service_code', 50);
    t.uuid('shipping_zone_id').references('id').inTable('shipping_zone');
    t.decimal('base_rate', 15, 2).notNullable().defaultTo(0);
    t.jsonb('rate_calculation');
    t.boolean('is_active').notNullable().defaultTo(true);
    t.jsonb('metadata');
    t.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    t.index('code');
    t.index('shipping_zone_id');
    t.index('is_active');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable('distribution_shipping_method');
};
