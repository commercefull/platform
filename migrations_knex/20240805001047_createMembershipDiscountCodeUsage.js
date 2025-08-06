/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('membership_discount_code_usage', t => {
    t.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.uuid('discount_code_id').notNullable().references('id').inTable('membership_discount_code').onDelete('CASCADE');
    t.uuid('subscription_id').notNullable().references('id').inTable('membership_subscription').onDelete('CASCADE');
    t.uuid('customer_id').notNullable().references('id').inTable('customer').onDelete('CASCADE');
    t.timestamp('used_at').notNullable().defaultTo(knex.fn.now());
    t.decimal('discount_amount', 10, 2).notNullable();
    t.jsonb('metadata');
    t.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    t.index('discount_code_id');
    t.index('subscription_id');
    t.index('customer_id');
    t.index('used_at');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable('membership_discount_code_usage');
};
