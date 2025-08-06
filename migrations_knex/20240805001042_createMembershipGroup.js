/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('membership_group', t => {
    t.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.uuid('subscription_id').notNullable().references('id').inTable('membership_subscription').onDelete('CASCADE');
    t.string('name', 100);
    t.uuid('primary_member_id').notNullable().references('id').inTable('customer').onDelete('CASCADE');
    t.integer('max_members').defaultTo(5);
    t.integer('current_members').notNullable().defaultTo(1);
    t.boolean('is_active').notNullable().defaultTo(true);
    t.text('notes');
    t.jsonb('metadata');
    t.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    t.index('subscription_id');
    t.index('primary_member_id');
    t.index('is_active');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable('membership_group');
};
