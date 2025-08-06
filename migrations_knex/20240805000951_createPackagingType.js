/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('packaging_type', t => {
    t.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.string('name', 100).notNullable();
    t.string('code', 20).notNullable().unique();
    t.text('description');
    t.boolean('is_active').notNullable().defaultTo(true);
    t.boolean('is_default').notNullable().defaultTo(false);
    t.decimal('weight', 10, 2).notNullable().defaultTo(0);
    t.decimal('length', 10, 2).notNullable();
    t.decimal('width', 10, 2).notNullable();
    t.decimal('height', 10, 2).notNullable();
    t.decimal('volume', 10, 2).notNullable();
    t.decimal('max_weight', 10, 2);
    t.integer('max_items');
    t.decimal('cost', 10, 2);
    t.string('currency', 3).notNullable().defaultTo('USD');
    t.boolean('recyclable').notNullable().defaultTo(false);
    t.text('image_url');
    t.specificType('valid_carriers', 'text[]');
    t.jsonb('metadata');
    t.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    t.uuid('created_by');
    t.index('code');
    t.index('is_active');
    t.index('is_default');
    t.index('volume');
    t.index('max_weight');
  }).then(() => {
    return knex.raw('CREATE UNIQUE INDEX idx_packaging_type_default ON packaging_type (is_default) WHERE is_default = true');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable('packaging_type');
};
