/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('membership_payment', t => {
    t.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.uuid('subscription_id').notNullable().references('id').inTable('membership_subscription').onDelete('CASCADE');
    t.uuid('customer_id').notNullable().references('id').inTable('customer').onDelete('CASCADE');
    t.decimal('amount', 10, 2).notNullable();
    t.string('currency', 3).notNullable().defaultTo('USD');
    t.timestamp('payment_date').notNullable().defaultTo(knex.fn.now());
    t.enu('status', ['pending', 'completed', 'failed', 'refunded', 'partially_refunded'], { useNative: true, enumName: 'membership_payment_status' }).notNullable().defaultTo('pending');
    t.enu('payment_type', ['subscription', 'setup_fee', 'manual', 'refund'], { useNative: true, enumName: 'membership_payment_type' }).notNullable();
    t.string('payment_method', 50);
    t.string('transaction_id', 255);
    t.timestamp('billing_period_start');
    t.timestamp('billing_period_end');
    t.jsonb('metadata');
    t.text('notes');
    t.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    t.index('subscription_id');
    t.index('customer_id');
    t.index('payment_date');
    t.index('status');
    t.index('payment_type');
    t.index('transaction_id');
    t.index('billing_period_start');
    t.index('billing_period_end');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable('membership_payment')
    .then(() => knex.schema.raw('DROP TYPE IF EXISTS membership_payment_status'))
    .then(() => knex.schema.raw('DROP TYPE IF EXISTS membership_payment_type'));
};
