/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('shipping_rate', t => {
    t.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.uuid('zone_id').notNullable().references('id').inTable('shipping_zone').onDelete('CASCADE');
    t.uuid('method_id').notNullable().references('id').inTable('shipping_method').onDelete('CASCADE');
    t.string('name', 100);
    t.text('description');
    t.boolean('is_active').notNullable().defaultTo(true);
    t.enu('rate_type', ['flat', 'weight_based', 'price_based', 'item_based', 'dimensional', 'calculated', 'free'], { useNative: true, enumName: 'shipping_rate_type' }).notNullable();
    t.decimal('base_rate', 10, 2).notNullable();
    t.decimal('per_item_rate', 10, 2).defaultTo(0);
    t.decimal('free_threshold', 10, 2);
    t.jsonb('rate_matrix');
    t.decimal('min_rate', 10, 2);
    t.decimal('max_rate', 10, 2);
    t.string('currency', 3).notNullable().defaultTo('USD');
    t.boolean('taxable').notNullable().defaultTo(true);
    t.integer('priority').defaultTo(0);
    t.timestamp('valid_from');
    t.timestamp('valid_to');
    t.jsonb('conditions');
    t.jsonb('metadata');
    t.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    t.uuid('created_by');
    t.index('zone_id');
    t.index('method_id');
    t.index('is_active');
    t.index('rate_type');
    t.index('priority');
    t.index('currency');
    t.index('valid_from');
    t.index('valid_to');
    t.unique(['zone_id', 'method_id']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable('shipping_rate')
    .then(() => knex.schema.raw('DROP TYPE IF EXISTS shipping_rate_type'));
};
