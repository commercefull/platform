/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('inventory_transaction_type', t => {
    t.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.string('code', 20).notNullable().unique();
    t.string('name', 100).notNullable();
    t.text('description');
    t.boolean('affects_available').notNullable().defaultTo(true);
    t.enu('direction', ['in', 'out', 'transfer', 'adjust'], { useNative: true, enumName: 'inventory_transaction_direction_type' }).notNullable();
    t.boolean('requires_approval').notNullable().defaultTo(false);
    t.boolean('requires_documentation').notNullable().defaultTo(false);
    t.jsonb('metadata');
    t.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    t.index('code');
    t.index('direction');
    t.index('affects_available');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable('inventory_transaction_type')
    .then(() => knex.schema.raw('DROP TYPE IF EXISTS inventory_transaction_direction_type'));
};
