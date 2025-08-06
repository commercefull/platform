/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('membership_status_log', t => {
    t.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.uuid('subscription_id').notNullable().references('id').inTable('membership_subscription').onDelete('CASCADE');
    t.string('previous_status', 20);
    t.string('new_status', 20).notNullable();
    t.text('change_reason');
    t.enu('change_source', ['system', 'admin', 'customer', 'payment', 'api'], { useNative: true, enumName: 'membership_status_log_source' }).notNullable().defaultTo('system');
    t.jsonb('metadata');
    t.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    t.uuid('created_by');
    t.index('subscription_id');
    t.index('previous_status');
    t.index('new_status');
    t.index('change_source');
    t.index('created_at');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable('membership_status_log')
    .then(() => knex.schema.raw('DROP TYPE IF EXISTS membership_status_log_source'));
};
