/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('shipping_method', t => {
    t.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.uuid('carrier_id').references('id').inTable('shipping_carrier');
    t.string('name', 100).notNullable();
    t.string('code', 20).notNullable().unique();
    t.text('description');
    t.boolean('is_active').notNullable().defaultTo(true);
    t.boolean('is_default').notNullable().defaultTo(false);
    t.string('service_code', 50);
    t.enu('domestic_international', ['domestic', 'international', 'both'], { useNative: true, enumName: 'shipping_method_domestic_international_type' }).notNullable().defaultTo('both');
    t.jsonb('estimated_delivery_days');
    t.integer('handling_days').defaultTo(1);
    t.integer('priority').defaultTo(0);
    t.boolean('display_on_frontend').notNullable().defaultTo(true);
    t.boolean('allow_free_shipping').notNullable().defaultTo(true);
    t.decimal('min_weight', 10, 2);
    t.decimal('max_weight', 10, 2);
    t.decimal('min_order_value', 10, 2);
    t.decimal('max_order_value', 10, 2);
    t.jsonb('dimension_restrictions');
    t.string('shipping_class', 50);
    t.jsonb('custom_fields');
    t.jsonb('metadata');
    t.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    t.uuid('created_by');
    t.index('carrier_id');
    t.index('code');
    t.index('is_active');
    t.index('is_default');
    t.index('domestic_international');
    t.index('display_on_frontend');
    t.index('priority');
    t.index('shipping_class');
  }).then(() => {
    return knex.raw('CREATE UNIQUE INDEX idx_shipping_method_default ON shipping_method (is_default) WHERE is_default = true');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable('shipping_method')
    .then(() => knex.schema.raw('DROP TYPE IF EXISTS shipping_method_domestic_international_type'));
};
